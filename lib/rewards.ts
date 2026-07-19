import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";

// Rewards milestones — reaching one unlocks a physical prize, redeemed in
// person by showing a coach the dashboard. Order matters: it's also the
// progression the rewards bar climbs through (100 -> 250 -> 500).
export const MILESTONES = [
  { classes: 100, prize: "T-shirt + handwraps + 30-min private session" },
  { classes: 250, prize: "T-shirt + gloves + 45-min private session" },
  { classes: 500, prize: "T-shirt + hoodie + handwraps + 1 month free" },
] as const;

/**
 * A member's rewards-eligible class count — the "trust system".
 *
 * A booking counts once the class has actually happened: it's ATTENDED (a
 * coach checked them in), or it's still BOOKED but the session's end time has
 * already passed (we trust they showed up rather than requiring every coach
 * to mark every attendee). CANCELLED bookings never count.
 *
 * The owner's manual `classCountAdjust` (can be negative, e.g. corrections or
 * crediting a grandfathered member's history) is added on top, and the final
 * total is clamped at zero.
 */
export async function getClassCount(userId: string): Promise<number> {
  const now = new Date();

  const [countedBookings, user] = await Promise.all([
    prisma.booking.count({
      where: {
        userId,
        OR: [
          { status: BOOKING_STATUS.ATTENDED },
          { status: BOOKING_STATUS.BOOKED, session: { endAt: { lt: now } } },
        ],
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { classCountAdjust: true } }),
  ]);

  const total = countedBookings + (user?.classCountAdjust ?? 0);
  return Math.max(0, total);
}

/**
 * Ensures a RewardMilestone row exists for every milestone the member has
 * reached at `count` classes (upsert is a no-op if already recorded, so
 * `reachedAt`/`celebratedAt`/`redeemedAt` on an existing row are preserved).
 * Returns all of the member's milestone rows, ascending.
 */
export async function syncMilestones(userId: string, count: number) {
  const reached = MILESTONES.filter((m) => m.classes <= count);

  for (const m of reached) {
    await prisma.rewardMilestone.upsert({
      where: { userId_milestone: { userId, milestone: m.classes } },
      create: { userId, milestone: m.classes },
      update: {},
    });
  }

  return prisma.rewardMilestone.findMany({
    where: { userId },
    orderBy: { milestone: "asc" },
  });
}
