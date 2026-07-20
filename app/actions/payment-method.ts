"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateSubscriptionCard, paymentsEnabled } from "@/lib/square";

export type CardUpdateResult = { ok: boolean; error?: string; info?: string };

/**
 * Member updates their card on file (Square Cards API): tokenised client-side,
 * attached to their Square customer, and set as the subscription's payment
 * source. Critical for expired cards — without this every expiry is a lost
 * member. If their membership was past_due, it recovers to active once the
 * next charge succeeds (webhook), but we optimistically clear the banner when
 * Square accepts the new card.
 */
export async function updateCardOnFile(paymentToken: string): Promise<CardUpdateResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };
  if (!paymentToken) return { ok: false, error: "Missing card details." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { membership: true },
  });
  if (!user) return { ok: false, error: "Account not found." };

  if (!paymentsEnabled) {
    return { ok: true, info: "Payments are in demo mode. No card was stored." };
  }

  const customerId = user.membership?.squareCustomerId ?? user.squareCustomerId;
  if (!customerId) {
    return {
      ok: false,
      error: "No billing profile found. Contact the gym and we'll sort it out.",
    };
  }

  const res = await updateSubscriptionCard({
    customerId,
    subscriptionId: user.membership?.squareSubscriptionId,
    paymentToken,
  });
  if (!res.ok) return { ok: false, error: res.error };

  revalidatePath("/account");
  revalidatePath("/profile");
  return { ok: true, info: "Card updated. Your next renewal will use the new card." };
}
