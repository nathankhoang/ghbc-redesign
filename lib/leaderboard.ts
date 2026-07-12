import { prisma } from "@/lib/prisma";
import { ROLES, BOOKING_STATUS } from "@/lib/constants";

export type LeaderRow = {
  rank: number;
  name: string;
  count: number;
  isMe: boolean;
};

// "Classes attended" — reconciled definition shared with the profile page:
// a booking counts if it is ATTENDED, or it is BOOKED and its session already
// started (attended-or-past-booked).
function attendedCount(
  bookings: { status: string; session: { startAt: Date } }[],
  now: Date,
): number {
  let n = 0;
  for (const b of bookings) {
    if (
      b.status === BOOKING_STATUS.ATTENDED ||
      (b.status === BOOKING_STATUS.BOOKED && b.session.startAt < now)
    ) {
      n++;
    }
  }
  return n;
}

/**
 * Build the members leaderboard.
 *
 * `top` — up to the top 10 members by attended-or-past-booked count, ranked
 * descending, excluding anyone with 0 classes (we never pad the board).
 * `me` — the current user's own row (their rank among all members + count),
 * even when they fall outside the top 10. Used for a warm, non-shaming nudge.
 */
export async function getLeaderboard(
  currentUserId: string,
): Promise<{ top: LeaderRow[]; me: LeaderRow | null }> {
  const members = await prisma.user.findMany({
    where: { role: ROLES.MEMBER },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      bookings: {
        select: { status: true, session: { select: { startAt: true } } },
      },
    },
  });

  const now = new Date();

  // Score every member, keep only those with at least one class.
  const scored = members
    .map((m) => ({
      id: m.id,
      // Last initial only, for privacy: "Alex R."
      name: `${m.firstName} ${m.lastName.charAt(0)}.`.trim(),
      count: attendedCount(m.bookings, now),
    }))
    .filter((m) => m.count > 0)
    // Highest count first; ties broken alphabetically for a stable order.
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Ranks are dense over the scored (non-zero) members. Someone with 0 classes
  // has no rank — we deliberately never surface a big, discouraging number.
  const top: LeaderRow[] = scored.slice(0, 10).map((m, i) => ({
    rank: i + 1,
    name: m.name,
    count: m.count,
    isMe: m.id === currentUserId,
  }));

  const myIndex = scored.findIndex((m) => m.id === currentUserId);
  const me: LeaderRow | null =
    myIndex === -1
      ? null
      : {
          rank: myIndex + 1,
          name: scored[myIndex].name,
          count: scored[myIndex].count,
          isMe: true,
        };

  return { top, me };
}
