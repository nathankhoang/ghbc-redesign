"use server";

import { createHash } from "node:crypto";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ClaimState = { error?: string } | undefined;

const hashToken = (raw: string) => createHash("sha256").update(raw).digest("hex");

// "Claim your account": migrated members (and invited coaches) set a password
// via an emailed magic link. NO card re-entry — their payment method already
// lives in Square and billing continues uninterrupted regardless of claim
// status. On completion the account (and membership) flips to active.
export async function claimAccount(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const rawToken = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  if (!rawToken) return { error: "Invalid or missing claim link." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const record = await prisma.claimToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { include: { membership: true } } },
  });
  if (!record || record.expiresAt < new Date()) {
    return { error: "This claim link is invalid or has expired. Ask the gym to resend it." };
  }

  const user = record.user;
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      subscriptionStatus:
        user.subscriptionStatus === "pending_claim" ? "active" : user.subscriptionStatus,
    },
  });
  if (user.membership?.status === "pending_claim") {
    await prisma.membership.update({
      where: { id: user.membership.id },
      data: { status: "active" },
    });
  }
  await prisma.claimToken.deleteMany({ where: { userId: user.id } });

  try {
    await signIn("credentials", {
      email: user.email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account claimed. Please sign in with your new password." };
    }
    throw error; // re-throw redirect
  }
}
