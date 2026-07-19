"use server";

import { createHash, randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP } from "@/lib/constants";
import { createSubscription, createTrialCharge } from "@/lib/square";
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
  const plan = String(formData.get("plan") ?? "FULL");
  const paymentToken = String(formData.get("paymentToken") ?? "");
  const turnstileToken = formData.get("cf-turnstile-response");
  const imageFile = formData.get("image");

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

  // TRIAL and the prepaid blocks are one-time charges; FULL is the $99→$125
  // subscription. All prepay plans grant the FULL membership experience.
  const membershipType = plan === "TRIAL" ? MEMBERSHIP.TRIAL : MEMBERSHIP.FULL;

  // Process payment (stubbed unless Square sandbox is configured).
  const payment =
    membershipType === MEMBERSHIP.TRIAL
      ? await createTrialCharge({ email, firstName, lastName, membershipType, paymentToken })
      : await createSubscription({ email, firstName, lastName, membershipType, paymentToken });
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
    },
  });

  try {
    await signIn("credentials", { email, password, redirectTo: "/welcome" });
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
