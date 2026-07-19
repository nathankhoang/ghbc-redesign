"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP, type PlanKey } from "@/lib/constants";
import { createSubscription, createOneTimeCharge } from "@/lib/square";
import { verifyTurnstile } from "@/lib/turnstile";
import { formatUSPhone, isValidEmail, isValidUSPhone } from "@/lib/validation";
import { uploadAvatar } from "@/lib/blob";
import { sendPasswordReset } from "@/lib/email";

export type FormState = { error?: string } | undefined;
export type ResetState = { ok?: string; error?: string } | undefined;

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

// ---- Login ------------------------------------------------------------------
export async function authenticate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  // Bot protection on login too (skipped until Turnstile is configured).
  const token = formData.get("cf-turnstile-response");
  const human = await verifyTurnstile(typeof token === "string" ? token : null);
  if (!human) {
    return { error: "Please complete the security check and try again." };
  }

  try {
    // /dashboard routes each account to the right home by role.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error; // re-throw redirect
  }
}

// ---- Signup + payment -------------------------------------------------------
export async function register(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim() || "Member";
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const planRaw = String(formData.get("plan") ?? "FULL");
  const paymentToken = String(formData.get("paymentToken") ?? "");
  const promoInput = String(formData.get("promoCode") ?? "").trim();
  const waiverAccepted = formData.get("waiver") === "on";
  const turnstileToken = formData.get("cf-turnstile-response");
  const imageFile = formData.get("image");

  const plan: PlanKey = (
    ["TRIAL", "FULL", "SIX_MONTH", "TWELVE_MONTH"] as const
  ).includes(planRaw as never)
    ? (planRaw as PlanKey)
    : "FULL";

  if (!firstName || !email || !phone || !password) {
    return { error: "Please fill in your name, phone, email and password." };
  }
  if (!isValidEmail(email)) {
    return { error: "Please enter a valid email address." };
  }
  if (!isValidUSPhone(phone)) {
    return { error: "Please enter a valid US phone number — (XXX) XXX-XXXX." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  // Liability waiver is required for BOTH membership and trial signups.
  if (!waiverAccepted) {
    return { error: "Please read and agree to the liability waiver to continue." };
  }

  // Bot protection — Cloudflare Turnstile (skipped until configured).
  const human = await verifyTurnstile(
    typeof turnstileToken === "string" ? turnstileToken : null,
  );
  if (!human) {
    return { error: "Please complete the security check and try again." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  // Promo code — a valid active code can grant a discounted (usually $0)
  // membership. 100%-off codes skip payment entirely but still create the
  // account + an active membership.
  let promo: { id: string; percentOff: number; duration: string } | null = null;
  if (promoInput) {
    const code = await prisma.promoCode.findUnique({
      where: { code: promoInput.toUpperCase() },
    });
    if (!code || !code.active) {
      return { error: "That promo code isn't valid." };
    }
    promo = { id: code.id, percentOff: code.percentOff, duration: code.duration };
  }
  const freeViaPromo = promo !== null && promo.percentOff >= 100;

  // TRIAL and the prepaid blocks are one-time charges; FULL is the phased
  // $99→$125 subscription (Square rolls the price over automatically).
  const membershipType = plan === "TRIAL" ? MEMBERSHIP.TRIAL : MEMBERSHIP.FULL;

  // Charge BEFORE creating the account — a declined card must never leave a
  // half-created user behind.
  const payment = freeViaPromo
    ? { ok: true as const, customerId: null, subscriptionId: null }
    : plan === "FULL"
      ? await createSubscription({ email, firstName, lastName, phone, membershipType, paymentToken, plan })
      : await createOneTimeCharge({ email, firstName, lastName, phone, membershipType, paymentToken, plan });
  if (!payment.ok) {
    return { error: payment.error ?? "Payment could not be processed." };
  }

  // Optional profile picture → Vercel Blob (no-op if not configured).
  const avatar = await uploadAvatar(
    imageFile instanceof File ? imageFile : null,
    `signup-${email}`,
  );
  if (avatar.error) {
    return { error: avatar.error };
  }

  // Prepaid blocks give a fixed coverage window.
  const months = plan === "SIX_MONTH" ? 6 : plan === "TWELVE_MONTH" ? 12 : 0;
  const prepaidUntil = months
    ? new Date(new Date().setMonth(new Date().getMonth() + months))
    : null;

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone: formatUSPhone(phone),
      image: avatar.url ?? null,
      passwordHash: await bcrypt.hash(password, 10),
      membershipType,
      squareCustomerId: payment.customerId ?? null,
      subscriptionStatus: "active",
      waiverAcceptedAt: new Date(),
      // Trial buyers get exactly ONE class credit, consumed on booking.
      trialClassCredits: plan === "TRIAL" ? 1 : 0,
      membership: {
        create: {
          plan: freeViaPromo ? "PROMO" : plan,
          status: "active",
          squareCustomerId: payment.customerId ?? null,
          squareSubscriptionId: payment.subscriptionId ?? null,
          prepaidUntil,
          promoCodeId: promo?.id ?? null,
        },
      },
    },
  });

  try {
    await signIn("credentials", {
      email,
      password,
      // Trial buyers go straight to the schedule to book their one class.
      redirectTo: plan === "TRIAL" ? "/schedule" : "/welcome",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error; // re-throw redirect
  }
}

// ---- Password reset ---------------------------------------------------------
const GENERIC_RESET_MSG =
  "If an account exists for that email, a reset link is on its way.";

export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  if (!email.includes("@")) return { error: "Enter a valid email." };

  const user = await prisma.user.findUnique({ where: { email } });
  // Always return the same message so we don't reveal which emails exist.
  if (!user) return { ok: GENERIC_RESET_MSG };

  const raw = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  // One active token per user.
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(raw), expiresAt },
  });

  const h = await headers();
  const host = h.get("host") ?? "ghbc-redesign.vercel.app";
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const resetUrl = `${proto}://${host}/reset-password?token=${raw}`;

  await sendPasswordReset(email, resetUrl);
  return { ok: GENERIC_RESET_MSG };
}

export async function resetPassword(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const rawToken = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!rawToken) return { error: "Invalid or missing reset link." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
  });
  if (!record || record.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  // Invalidate all of this user's reset tokens.
  await prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } });

  return { ok: "Your password has been reset. You can now sign in." };
}

// ---- Logout -----------------------------------------------------------------
export async function logout() {
  await signOut({ redirectTo: "/" });
}
