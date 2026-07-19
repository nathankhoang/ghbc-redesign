"use server";

import { prisma } from "@/lib/prisma";

export type PromoCheck =
  | { valid: true; percentOff: number; duration: string }
  | { valid: false; error: string };

// Pre-flight promo validation for checkout UX (register re-validates server-side
// before creating anything, so this is purely informational).
export async function checkPromoCode(code: string): Promise<PromoCheck> {
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return { valid: false, error: "Enter a promo code." };
  const promo = await prisma.promoCode.findUnique({ where: { code: trimmed } });
  if (!promo || !promo.active) {
    return { valid: false, error: "That promo code isn't valid." };
  }
  return { valid: true, percentOff: promo.percentOff, duration: promo.duration };
}
