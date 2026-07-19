"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Member taps "Got it" on the milestone celebration popup — records that the
// confetti/modal has already been shown so it doesn't re-fire on the next
// visit. The gold glow on the milestone chip is separate and persists until
// the owner marks the milestone redeemed in person.
export async function acknowledgeMilestone(milestone: number) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Please sign in." };

  await prisma.rewardMilestone.updateMany({
    where: { userId: session.user.id, milestone, celebratedAt: null },
    data: { celebratedAt: new Date() },
  });

  revalidatePath("/profile");
  return { ok: true as const };
}
