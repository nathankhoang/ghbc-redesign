import "server-only";
import { randomUUID } from "node:crypto";
import { SquareClient, SquareEnvironment } from "square";
import { PRICING, type PlanKey } from "@/lib/constants";
import plansConfig from "@/config/square-plans.json";

// ---------------------------------------------------------------------------
// Square integration.
//
// ARCHITECTURE: Square is the source of truth for MONEY. All subscription
// plans live in Square's Catalog (created by scripts/setup-square-plans.ts,
// which writes their IDs to config/square-plans.json). Checkout code
// references those stored plan IDs — never raw prices. The site never touches
// card data; the Web Payments SDK tokenises client-side and we only handle
// tokens. The website DB is the source of truth for MEMBERS; webhooks keep
// membership status in sync (app/api/webhooks/square/route.ts).
//
// STUB MODE: when PAYMENTS_ENABLED !== "true", all money operations succeed
// as no-ops so the full signup/booking flow works in local dev and preview
// deployments without credentials.
// ---------------------------------------------------------------------------

export const paymentsEnabled = process.env.PAYMENTS_ENABLED === "true";

const ENV: "sandbox" | "production" =
  process.env.SQUARE_ENVIRONMENT === "production" ? "production" : "sandbox";

let _client: SquareClient | null = null;
export function squareClient(): SquareClient {
  if (!_client) {
    _client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN ?? "",
      environment:
        ENV === "production" ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
  }
  return _client;
}

export function squareLocationId(): string {
  return process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
}

// Subscription-plan variation IDs for the current environment.
export type SquarePlanIds = { planId: string; variationId: string };
export function planIds(key: "FULL" | "STANDARD" | "GRANDFATHERED"): SquarePlanIds {
  const cfg = (plansConfig as Record<string, unknown>)[ENV] as
    | Record<string, SquarePlanIds>
    | undefined;
  const ids = cfg?.[key];
  if (!ids?.variationId) {
    throw new Error(
      `Square plan "${key}" has no ${ENV} variation id — run scripts/setup-square-plans.ts first.`,
    );
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Signup-time operations
// ---------------------------------------------------------------------------

export type PaymentInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  membershipType: string;
  /** Card/wallet token from the Web Payments SDK ("cnon:…"). */
  paymentToken: string;
  /** Which plan is being purchased. */
  plan?: PlanKey;
};

export type PaymentResult = {
  ok: boolean;
  customerId?: string;
  subscriptionId?: string;
  error?: string;
};

async function createCustomer(input: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<string> {
  const res = await squareClient().customers.create({
    idempotencyKey: randomUUID(),
    emailAddress: input.email,
    givenName: input.firstName,
    familyName: input.lastName || undefined,
    phoneNumber: input.phone || undefined,
  });
  const id = res.customer?.id;
  if (!id) throw new Error("Square did not return a customer id.");
  return id;
}

async function createCardOnFile(customerId: string, sourceId: string): Promise<string> {
  const res = await squareClient().cards.create({
    idempotencyKey: randomUUID(),
    sourceId,
    card: { customerId },
  });
  const id = res.card?.id;
  if (!id) throw new Error("Square did not return a card id.");
  return id;
}

function squareErrorMessage(e: unknown): string {
  const err = e as { errors?: { detail?: string; code?: string }[]; message?: string };
  return (
    err?.errors?.[0]?.detail ??
    err?.errors?.[0]?.code ??
    err?.message ??
    "Payment could not be processed."
  );
}

/**
 * Start the $99→$125 phased membership subscription (or grandfathered plan).
 * Square handles the $99 first cycle and the automatic rollover to $125/mo —
 * we just subscribe the customer to the stored plan-variation id.
 */
export async function createSubscription(input: PaymentInput): Promise<PaymentResult> {
  if (!paymentsEnabled) {
    return { ok: true, customerId: `stub_${Date.now()}` };
  }
  if (!input.paymentToken) return { ok: false, error: "Missing payment details." };

  try {
    const customerId = await createCustomer(input);
    const cardId = await createCardOnFile(customerId, input.paymentToken);
    const res = await squareClient().subscriptions.create({
      idempotencyKey: randomUUID(),
      locationId: squareLocationId(),
      planVariationId: planIds("FULL").variationId,
      customerId,
      cardId,
    });
    return { ok: true, customerId, subscriptionId: res.subscription?.id };
  } catch (e) {
    console.error("[square] createSubscription failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

/** One-time charge: $25 trial class or a $600/$1,200 prepaid block. */
export async function createOneTimeCharge(input: PaymentInput): Promise<PaymentResult> {
  if (!paymentsEnabled) {
    return { ok: true, customerId: `stub_${Date.now()}` };
  }
  if (!input.paymentToken) return { ok: false, error: "Missing payment details." };

  const plan: PlanKey = input.plan ?? "TRIAL";
  const amountCents = PRICING[plan].introCents;

  try {
    const customerId = await createCustomer(input);
    const res = await squareClient().payments.create({
      idempotencyKey: randomUUID(),
      sourceId: input.paymentToken,
      customerId,
      locationId: squareLocationId(),
      amountMoney: { amount: BigInt(amountCents), currency: "USD" },
      note: `GHBC ${PRICING[plan].label}`,
    });
    if (res.payment?.status === "FAILED") {
      return { ok: false, error: "Your card was declined." };
    }
    return { ok: true, customerId };
  } catch (e) {
    console.error("[square] createOneTimeCharge failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

/** Back-compat alias used by the register action for trials. */
export async function createTrialCharge(input: PaymentInput): Promise<PaymentResult> {
  return createOneTimeCharge({ ...input, plan: "TRIAL" });
}

export function introChargeCents(membershipType: string): number {
  if (membershipType === "TRIAL") return PRICING.TRIAL.introCents;
  return PRICING.FULL.introCents;
}

// ---------------------------------------------------------------------------
// Owner operations — pause / resume / cancel MUST hit Square so billing
// actually stops; callers only update the DB after these succeed.
// ---------------------------------------------------------------------------

export type SquareOpResult = { ok: boolean; error?: string };

export async function pauseSquareSubscription(subscriptionId: string): Promise<SquareOpResult> {
  if (!paymentsEnabled) return { ok: true };
  try {
    await squareClient().subscriptions.pause({ subscriptionId });
    return { ok: true };
  } catch (e) {
    console.error("[square] pause failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

export async function resumeSquareSubscription(subscriptionId: string): Promise<SquareOpResult> {
  if (!paymentsEnabled) return { ok: true };
  try {
    await squareClient().subscriptions.resume({ subscriptionId });
    return { ok: true };
  } catch (e) {
    console.error("[square] resume failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

export async function cancelSquareSubscription(subscriptionId: string): Promise<SquareOpResult> {
  if (!paymentsEnabled) return { ok: true };
  try {
    await squareClient().subscriptions.cancel({ subscriptionId });
    return { ok: true };
  } catch (e) {
    console.error("[square] cancel failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

/** Update the card on file for a member's subscription (expired cards etc.). */
export async function updateSubscriptionCard(input: {
  customerId: string;
  subscriptionId?: string | null;
  paymentToken: string;
}): Promise<SquareOpResult> {
  if (!paymentsEnabled) return { ok: true };
  try {
    const cardId = await createCardOnFile(input.customerId, input.paymentToken);
    if (input.subscriptionId) {
      await squareClient().subscriptions.update({
        subscriptionId: input.subscriptionId,
        subscription: { cardId },
      });
    }
    return { ok: true };
  } catch (e) {
    console.error("[square] updateSubscriptionCard failed:", e);
    return { ok: false, error: squareErrorMessage(e) };
  }
}

// ---------------------------------------------------------------------------
// Read-side for the owner dashboard + "Sync from Square" migration
// ---------------------------------------------------------------------------

export type SquarePaymentSummary = {
  id: string;
  amountCents: number;
  status: string;
  createdAt: string;
  note?: string;
};

export async function listRecentPayments(limit = 20): Promise<SquarePaymentSummary[]> {
  if (!paymentsEnabled) return [];
  try {
    const page = await squareClient().payments.list({ sortOrder: "DESC", limit });
    const out: SquarePaymentSummary[] = [];
    for await (const p of page) {
      out.push({
        id: p.id ?? "",
        amountCents: Number(p.amountMoney?.amount ?? 0),
        status: p.status ?? "UNKNOWN",
        createdAt: p.createdAt ?? "",
        note: p.note ?? undefined,
      });
      if (out.length >= limit) break;
    }
    return out;
  } catch (e) {
    console.error("[square] listRecentPayments failed:", e);
    return [];
  }
}

export type SquareSubscriptionSummary = {
  id: string;
  customerId: string;
  status: string;
  planVariationId: string;
  startDate?: string;
};

export async function listSubscriptions(): Promise<SquareSubscriptionSummary[]> {
  if (!paymentsEnabled) return [];
  try {
    const res = await squareClient().subscriptions.search({
      query: { filter: { locationIds: [squareLocationId()] } },
    });
    return (res.subscriptions ?? []).map((s) => ({
      id: s.id ?? "",
      customerId: s.customerId ?? "",
      status: s.status ?? "UNKNOWN",
      planVariationId: s.planVariationId ?? "",
      startDate: s.startDate ?? undefined,
    }));
  } catch (e) {
    console.error("[square] listSubscriptions failed:", e);
    return [];
  }
}

export type SquareCustomerSummary = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export async function getCustomers(ids: string[]): Promise<Map<string, SquareCustomerSummary>> {
  const map = new Map<string, SquareCustomerSummary>();
  if (!paymentsEnabled || ids.length === 0) return map;
  try {
    const res = await squareClient().customers.bulkRetrieveCustomers({
      customerIds: ids,
    });
    for (const [id, r] of Object.entries(res.responses ?? {})) {
      const c = r.customer;
      if (c) {
        map.set(id, {
          id,
          email: c.emailAddress ?? undefined,
          firstName: c.givenName ?? undefined,
          lastName: c.familyName ?? undefined,
          phone: c.phoneNumber ?? undefined,
        });
      }
    }
  } catch (e) {
    console.error("[square] getCustomers failed:", e);
  }
  return map;
}
