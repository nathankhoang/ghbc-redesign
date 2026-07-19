/**
 * One-time (but safely re-runnable) Square Catalog setup.
 *
 * Creates the club's subscription plans via the Catalog API and writes their
 * plan/variation IDs to config/square-plans.json (keyed by environment).
 * Checkout code references those stored IDs — never raw prices. Square only
 * charges what exists in its Catalog, so this script is what makes the
 * website's advertised prices real.
 *
 * Plans created here (subscriptions):
 *   FULL          — ONE phased plan: $99 for exactly 1 monthly cycle, then
 *                   $125/mo ongoing. Square handles the rollover with zero code.
 *   STANDARD      — $125/mo flat (no intro).
 *   GRANDFATHERED — $120/mo legacy plan for pre-2026 members. Never shown to
 *                   new signups; existing Square subscriptions map onto it.
 *
 * One-time purchases (trial $25, 6-month $600, 12-month $1,200) go through the
 * Payments API directly and need no catalog entry — amounts come from
 * lib/constants.ts PRICING.
 *
 * Usage:
 *   npx tsx scripts/setup-square-plans.ts            # uses .env (sandbox first!)
 *   SQUARE_ENVIRONMENT=production npx tsx scripts/setup-square-plans.ts
 *
 * Idempotent: existing plans are matched by name and reused (check-before-create).
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { SquareClient, SquareEnvironment, type Square } from "square";
import { PRICING } from "../lib/constants";

// ---- tiny .env loader (no dotenv dependency; real env vars win) ------------
const envPath = resolve(__dirname, "..", ".env");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*(?:#.*)?$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].trim();
  }
}

const ENV: "sandbox" | "production" =
  process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";
const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) {
  console.error("SQUARE_ACCESS_TOKEN is not set — aborting.");
  process.exit(1);
}

const client = new SquareClient({
  token,
  environment: ENV === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

const usd = (cents: number): Square.Money => ({ amount: BigInt(cents), currency: "USD" });

type PlanSpec = {
  key: "FULL" | "STANDARD" | "GRANDFATHERED";
  planName: string;
  variationName: string;
  phases: Square.SubscriptionPhase[];
};

const SPECS: PlanSpec[] = [
  {
    key: "FULL",
    planName: "GHBC Membership",
    variationName: `$${PRICING.FULL.introCents / 100} intro month, then $${PRICING.FULL.recurringCents / 100}/mo`,
    phases: [
      {
        cadence: "MONTHLY",
        periods: 1, // exactly one billing cycle at the intro price
        ordinal: BigInt(0),
        pricing: { type: "STATIC", priceMoney: usd(PRICING.FULL.introCents) },
      },
      {
        cadence: "MONTHLY", // no `periods` = ongoing
        ordinal: BigInt(1),
        pricing: { type: "STATIC", priceMoney: usd(PRICING.FULL.recurringCents) },
      },
    ],
  },
  {
    key: "STANDARD",
    planName: "GHBC Membership — Standard",
    variationName: `$${PRICING.FULL.recurringCents / 100}/mo`,
    phases: [
      {
        cadence: "MONTHLY",
        ordinal: BigInt(0),
        pricing: { type: "STATIC", priceMoney: usd(PRICING.FULL.recurringCents) },
      },
    ],
  },
  {
    key: "GRANDFATHERED",
    planName: "GHBC Membership — Grandfathered",
    variationName: `$${PRICING.GRANDFATHERED.recurringCents / 100}/mo (legacy)`,
    phases: [
      {
        cadence: "MONTHLY",
        ordinal: BigInt(0),
        pricing: { type: "STATIC", priceMoney: usd(PRICING.GRANDFATHERED.recurringCents) },
      },
    ],
  },
];

async function listExistingPlans(): Promise<Square.CatalogObject[]> {
  const out: Square.CatalogObject[] = [];
  const page = await client.catalog.list({ types: "SUBSCRIPTION_PLAN" });
  for await (const obj of page) out.push(obj);
  return out;
}

async function ensurePlan(
  spec: PlanSpec,
  existing: Square.CatalogObject[],
): Promise<{ planId: string; variationId: string }> {
  // Match by plan name (check-before-create → safe to re-run).
  const found = existing.find(
    (o) => o.type === "SUBSCRIPTION_PLAN" && o.subscriptionPlanData?.name === spec.planName,
  );

  if (found && found.type === "SUBSCRIPTION_PLAN") {
    const variations = found.subscriptionPlanData?.subscriptionPlanVariations ?? [];
    const variation = variations.find(
      (v) =>
        v.type === "SUBSCRIPTION_PLAN_VARIATION" &&
        v.subscriptionPlanVariationData?.name === spec.variationName,
    );
    if (variation?.id) {
      console.log(`✓ ${spec.key}: already exists (${found.id})`);
      return { planId: found.id, variationId: variation.id };
    }
    // Plan exists but our variation doesn't — add it.
    const res = await client.catalog.object.upsert({
      idempotencyKey: randomUUID(),
      object: {
        type: "SUBSCRIPTION_PLAN_VARIATION",
        id: "#variation",
        subscriptionPlanVariationData: {
          name: spec.variationName,
          subscriptionPlanId: found.id,
          phases: spec.phases,
        },
      },
    });
    const vid = res.catalogObject?.id;
    if (!vid) throw new Error(`Failed to create variation for ${spec.key}`);
    console.log(`✓ ${spec.key}: added variation ${vid} to existing plan ${found.id}`);
    return { planId: found.id, variationId: vid };
  }

  // Create plan + variation together.
  const res = await client.catalog.batchUpsert({
    idempotencyKey: randomUUID(),
    batches: [
      {
        objects: [
          {
            type: "SUBSCRIPTION_PLAN",
            id: "#plan",
            subscriptionPlanData: { name: spec.planName },
          },
          {
            type: "SUBSCRIPTION_PLAN_VARIATION",
            id: "#variation",
            subscriptionPlanVariationData: {
              name: spec.variationName,
              subscriptionPlanId: "#plan",
              phases: spec.phases,
            },
          },
        ],
      },
    ],
  });

  const mappings = res.idMappings ?? [];
  const planId = mappings.find((m) => m.clientObjectId === "#plan")?.objectId;
  const variationId = mappings.find((m) => m.clientObjectId === "#variation")?.objectId;
  if (!planId || !variationId) throw new Error(`Failed to create plan ${spec.key}`);
  console.log(`✓ ${spec.key}: created plan ${planId}, variation ${variationId}`);
  return { planId, variationId };
}

async function main() {
  console.log(`Setting up Square subscription plans (${ENV})…`);
  const existing = await listExistingPlans();

  const configPath = resolve(__dirname, "..", "config", "square-plans.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));

  for (const spec of SPECS) {
    const ids = await ensurePlan(spec, existing);
    config[ENV][spec.key] = ids;
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  console.log(`\nWrote plan IDs to config/square-plans.json (${ENV}).`);
  console.log(
    "One-time prices (no catalog entry needed): " +
      `trial $${PRICING.TRIAL.introCents / 100}, ` +
      `6-month $${PRICING.SIX_MONTH.introCents / 100}, ` +
      `12-month $${PRICING.TWELVE_MONTH.introCents / 100}.`,
  );
}

main().catch((e) => {
  console.error("Setup failed:", e);
  process.exit(1);
});
