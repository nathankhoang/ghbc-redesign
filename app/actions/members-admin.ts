"use server";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP, ROLES } from "@/lib/constants";
import {
  cancelSquareSubscription,
  pauseSquareSubscription,
  resumeSquareSubscription,
  listSubscriptions,
  getCustomers,
  planIds,
  paymentsEnabled,
} from "@/lib/square";
import { sendClaimLink, sendCoachInvite } from "@/lib/email";

export type AdminResult = { ok: boolean; error?: string; info?: string };

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

async function requireOwner(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== ROLES.OWNER) return null;
  return { id: session.user.id };
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://ghbc-redesign.vercel.app";
}

function revalidateAdmin() {
  revalidatePath("/admin/members");
  revalidatePath("/admin/subscriptions");
  revalidatePath("/admin");
}

// ---------------------------------------------------------------------------
// Membership control — Square is called FIRST; the DB only changes after the
// Square call succeeds, so billing state and site state can't drift apart.
// ---------------------------------------------------------------------------

type MembershipAction = "pause" | "resume" | "cancel";

const SQUARE_OPS: Record<
  MembershipAction,
  (subscriptionId: string) => Promise<{ ok: boolean; error?: string }>
> = {
  pause: pauseSquareSubscription,
  resume: resumeSquareSubscription,
  cancel: cancelSquareSubscription,
};

const RESULT_STATUS: Record<MembershipAction, string> = {
  pause: "paused",
  resume: "active",
  cancel: "cancelled",
};

async function changeMembership(
  userId: string,
  action: MembershipAction,
): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { membership: true },
  });
  if (!user) return { ok: false, error: "Member not found." };

  // Recurring Square subscription → billing must actually stop/resume in
  // Square before we flip anything locally.
  const subId = user.membership?.squareSubscriptionId;
  if (subId) {
    const res = await SQUARE_OPS[action](subId);
    if (!res.ok) {
      return {
        ok: false,
        error: `Square ${action} failed — nothing was changed. ${res.error ?? ""}`.trim(),
      };
    }
  }

  const status = RESULT_STATUS[action];
  await prisma.user.update({ where: { id: userId }, data: { subscriptionStatus: status } });
  if (user.membership) {
    await prisma.membership.update({
      where: { id: user.membership.id },
      data: { status },
    });
  }
  revalidateAdmin();
  return { ok: true };
}

export async function pauseMembership(userId: string): Promise<AdminResult> {
  return changeMembership(userId, "pause");
}
export async function resumeMembership(userId: string): Promise<AdminResult> {
  return changeMembership(userId, "resume");
}
export async function cancelMembership(userId: string): Promise<AdminResult> {
  return changeMembership(userId, "cancel");
}

// ---------------------------------------------------------------------------
// Rewards adjustments
// ---------------------------------------------------------------------------

/** Set the member's manual class-count adjustment (added to their real count). */
export async function setClassCountAdjustment(
  userId: string,
  adjustment: number,
): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  if (!Number.isInteger(adjustment) || Math.abs(adjustment) > 10000) {
    return { ok: false, error: "Enter a whole number." };
  }
  await prisma.user.update({
    where: { id: userId },
    data: { classCountAdjust: adjustment },
  });
  revalidateAdmin();
  revalidatePath("/profile");
  return { ok: true };
}

/** Mark a reached reward milestone as redeemed (prize handed over). */
export async function redeemMilestone(
  userId: string,
  milestone: number,
): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  await prisma.rewardMilestone.updateMany({
    where: { userId, milestone, redeemedAt: null },
    data: { redeemedAt: new Date() },
  });
  revalidateAdmin();
  revalidatePath("/profile");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Migration — "Sync from Square" + claim links + CSV fallback
// ---------------------------------------------------------------------------

async function issueClaimToken(userId: string, purpose = "CLAIM"): Promise<string> {
  const raw = randomBytes(32).toString("hex");
  await prisma.claimToken.deleteMany({ where: { userId, purpose } });
  await prisma.claimToken.create({
    data: {
      userId,
      tokenHash: hashToken(raw),
      purpose,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    },
  });
  return `${siteUrl()}/claim?token=${raw}`;
}

/**
 * Pull existing Customers + active Subscriptions from Square and create
 * matching users + memberships (status pending_claim) linked to the
 * grandfathered $120 plan. Never touches their Square subscriptions — just
 * links them. Safe to re-run: already-linked subscriptions are skipped.
 */
export async function syncFromSquare(): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  if (!paymentsEnabled) {
    return { ok: false, error: "Square isn't configured yet (PAYMENTS_ENABLED=false)." };
  }

  const subs = await listSubscriptions();
  const activeSubs = subs.filter((s) => s.status === "ACTIVE" || s.status === "PAUSED");
  if (activeSubs.length === 0) {
    return { ok: true, info: "No active subscriptions found in Square." };
  }

  const linked = await prisma.membership.findMany({
    where: { squareSubscriptionId: { in: activeSubs.map((s) => s.id) } },
    select: { squareSubscriptionId: true },
  });
  const linkedIds = new Set(linked.map((m) => m.squareSubscriptionId));
  const fresh = activeSubs.filter((s) => !linkedIds.has(s.id));
  if (fresh.length === 0) {
    return { ok: true, info: "All Square subscriptions are already linked." };
  }

  const customers = await getCustomers(fresh.map((s) => s.customerId));

  // Which plan were they on? Anything that isn't one of our new plans maps to
  // the grandfathered $120 plan.
  let grandfatheredVariation = "";
  try {
    grandfatheredVariation = planIds("GRANDFATHERED").variationId;
  } catch {
    /* plan ids not set up yet — every import maps to GRANDFATHERED anyway */
  }

  let created = 0;
  let skippedNoEmail = 0;
  for (const sub of fresh) {
    const customer = customers.get(sub.customerId);
    if (!customer?.email) {
      skippedNoEmail++;
      continue;
    }
    const email = customer.email.toLowerCase();

    // Attach to an existing account with that email, else create pending_claim.
    let user = await prisma.user.findUnique({ where: { email }, include: { membership: true } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          firstName: customer.firstName ?? "Member",
          lastName: customer.lastName ?? "",
          email,
          phone: customer.phone ?? null,
          // Unclaimed accounts get an unusable random password; the claim link
          // (below) is the only way in.
          passwordHash: await bcrypt.hash(randomUUID() + randomBytes(16).toString("hex"), 10),
          membershipType: MEMBERSHIP.FULL,
          subscriptionStatus: "pending_claim",
          squareCustomerId: sub.customerId,
        },
        include: { membership: true },
      });
    }
    if (!user.membership) {
      await prisma.membership.create({
        data: {
          userId: user.id,
          plan:
            sub.planVariationId && sub.planVariationId !== grandfatheredVariation
              ? "GRANDFATHERED"
              : "GRANDFATHERED",
          status: "pending_claim",
          squareCustomerId: sub.customerId,
          squareSubscriptionId: sub.id,
        },
      });
    } else if (!user.membership.squareSubscriptionId) {
      await prisma.membership.update({
        where: { id: user.membership.id },
        data: { squareCustomerId: sub.customerId, squareSubscriptionId: sub.id },
      });
    }

    const url = await issueClaimToken(user.id);
    await sendClaimLink(email, user.firstName, url);
    created++;
  }

  revalidateAdmin();
  return {
    ok: true,
    info: `Linked ${created} member${created === 1 ? "" : "s"} from Square (claim links emailed).${
      skippedNoEmail ? ` ${skippedNoEmail} skipped — no email on the Square customer.` : ""
    }`,
  };
}

/** Re-send the claim link to a pending_claim member. */
export async function resendClaimLink(userId: string): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, error: "Member not found." };
  const url = await issueClaimToken(user.id);
  const sent = await sendClaimLink(user.email, user.firstName, url);
  if (!sent.ok && !sent.skipped) return { ok: false, error: sent.error };
  return { ok: true, info: `Claim link sent to ${user.email}.` };
}

/**
 * CSV fallback import (name,email,phone per line) for members missing from
 * the Square data. Creates pending_claim accounts + emails claim links.
 */
export async function importMembersCsv(csv: string): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  let created = 0;
  let skipped = 0;
  for (const line of csv.split(/\r?\n/)) {
    const [name, email, phone] = line.split(",").map((s) => s?.trim());
    if (!email || !email.includes("@")) {
      if (line.trim()) skipped++;
      continue;
    }
    const lower = email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: lower } });
    if (exists) {
      skipped++;
      continue;
    }
    const user = await prisma.user.create({
      data: {
        firstName: name?.split(" ")[0] || "Member",
        lastName: name?.split(" ").slice(1).join(" ") ?? "",
        email: lower,
        phone: phone || null,
        passwordHash: await bcrypt.hash(randomUUID() + randomBytes(16).toString("hex"), 10),
        membershipType: MEMBERSHIP.FULL,
        subscriptionStatus: "pending_claim",
        membership: { create: { plan: "GRANDFATHERED", status: "pending_claim" } },
      },
    });
    const url = await issueClaimToken(user.id);
    await sendClaimLink(lower, user.firstName, url);
    created++;
  }
  revalidateAdmin();
  return { ok: true, info: `Imported ${created}, skipped ${skipped}.` };
}

// ---------------------------------------------------------------------------
// Promo codes
// ---------------------------------------------------------------------------

export async function createPromoCode(
  _prev: AdminResult | undefined,
  formData: FormData,
): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const percentOff = Number(formData.get("percentOff") ?? 100);
  const duration = formData.get("duration") === "FIRST_MONTH" ? "FIRST_MONTH" : "FOREVER";
  if (!/^[A-Z0-9-]{3,32}$/.test(code)) {
    return { ok: false, error: "Codes are 3–32 letters/numbers/dashes." };
  }
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    return { ok: false, error: "Discount must be 1–100%." };
  }
  const exists = await prisma.promoCode.findUnique({ where: { code } });
  if (exists) return { ok: false, error: "That code already exists." };
  await prisma.promoCode.create({ data: { code, percentOff, duration } });
  revalidateAdmin();
  return { ok: true, info: `Code ${code} created.` };
}

export async function setPromoCodeActive(id: string, active: boolean): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  await prisma.promoCode.update({ where: { id }, data: { active } });
  revalidateAdmin();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Coach accounts — invite + deactivate. The public signup form can only ever
// create MEMBER accounts; this owner action is the sole path to role=COACH.
// ---------------------------------------------------------------------------

export async function inviteCoach(
  _prev: AdminResult | undefined,
  formData: FormData,
): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const specialty = String(formData.get("specialty") ?? "").trim() || null;
  if (!name || !email.includes("@")) {
    return { ok: false, error: "Name and a valid email are required." };
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { ok: false, error: "An account with that email already exists." };

  const user = await prisma.user.create({
    data: {
      firstName: name.replace(/^Coach\s+/i, "").split(" ")[0],
      lastName: "",
      email,
      passwordHash: await bcrypt.hash(randomUUID() + randomBytes(16).toString("hex"), 10),
      role: ROLES.COACH,
      membershipType: MEMBERSHIP.NONE,
    },
  });
  await prisma.coach.create({ data: { name, specialty, userId: user.id } });

  const url = await issueClaimToken(user.id, "COACH_INVITE");
  const sent = await sendCoachInvite(email, name, url);
  revalidatePath("/admin/coaches");
  if (!sent.ok && !sent.skipped) {
    return { ok: true, info: `Coach created, but the invite email failed (${sent.error}). Use "Resend invite".` };
  }
  return { ok: true, info: `Invite sent to ${email}.` };
}

export async function setCoachActive(coachId: string, active: boolean): Promise<AdminResult> {
  if (!(await requireOwner())) return { ok: false, error: "Not authorized." };
  await prisma.coach.update({ where: { id: coachId }, data: { active } });
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  return { ok: true };
}
