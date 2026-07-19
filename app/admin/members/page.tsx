import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, ROLES } from "@/lib/constants";
import { MembersManager, type ManagerMember } from "@/components/admin/members-manager";

export const dynamic = "force-dynamic";

function prettyPlan(plan: string): string {
  return plan
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

export default async function AdminMembersPage() {
  const members = await prisma.user.findMany({
    where: { role: ROLES.MEMBER },
    include: {
      membership: { include: { promoCode: { select: { code: true } } } },
      rewardMilestones: { orderBy: { milestone: "asc" } },
      _count: {
        select: {
          bookings: {
            where: { status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED] } },
          },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const memberProps: ManagerMember[] = members.map((m) => ({
    id: m.id,
    name: `${m.firstName} ${m.lastName}`.trim(),
    email: m.email,
    phone: m.phone,
    plan: prettyPlan(m.membership?.plan ?? m.membershipType),
    status: m.subscriptionStatus,
    classCount: Math.max(0, m._count.bookings + m.classCountAdjust),
    classCountAdjust: m.classCountAdjust,
    hasSquareSubscription: !!m.membership?.squareSubscriptionId,
    milestones: m.rewardMilestones.map((rm) => ({
      milestone: rm.milestone,
      reachedAt: rm.reachedAt.toISOString(),
      redeemedAt: rm.redeemedAt ? rm.redeemedAt.toISOString() : null,
    })),
  }));

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Members</h1>
        <p className="mt-2 text-cream/60">
          {members.length} member{members.length === 1 ? "" : "s"} — search, manage
          billing, and track rewards.
        </p>
      </header>

      <MembersManager members={memberProps} />
    </div>
  );
}
