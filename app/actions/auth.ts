"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP } from "@/lib/constants";
import { createSubscription } from "@/lib/square";

export type FormState = { error?: string } | undefined;

// ---- Login ------------------------------------------------------------------
export async function authenticate(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/profile",
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
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plan") ?? "FULL");
  const paymentToken = String(formData.get("paymentToken") ?? "");

  if (!firstName || !email || !password) {
    return { error: "Please fill in your name, email and password." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const membershipType = plan === "YOGA" ? MEMBERSHIP.YOGA : MEMBERSHIP.FULL;

  // Process payment (stubbed unless Square sandbox is configured).
  const payment = await createSubscription({
    email,
    firstName,
    lastName,
    membershipType,
    paymentToken,
  });
  if (!payment.ok) {
    return { error: payment.error ?? "Payment could not be processed." };
  }

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
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

// ---- Logout -----------------------------------------------------------------
export async function logout() {
  await signOut({ redirectTo: "/" });
}
