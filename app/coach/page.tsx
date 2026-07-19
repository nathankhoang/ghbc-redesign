import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";
import { addDays, ensureSessionsForWeek, getWeekStart } from "@/lib/schedule";
import { CoachDashboard, type CoachSession } from "@/components/coach-dashboard";
import { CoachProfileForm } from "@/components/coach-profile-form";

export const dynamic = "force-dynamic";

export default async function CoachPage() {
  const session = await auth();
  const userId = session!.user.id; // layout guarantees a coach/owner session

  const coach = await prisma.coach.findUnique({ where: { userId } });

  if (!coach) {
    return (
      <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-8 text-center">
        <h1 className="font-poster text-3xl text-bone">No coach profile linked</h1>
        <p className="mt-2 text-cream/60">
          This account isn&apos;t linked to a coach yet. If you&apos;re the owner,
          manage coaches from the{" "}
          <Link href="/admin/coaches" className="text-gold underline underline-offset-4">
            admin dashboard
          </Link>
          .
        </p>
      </div>
    );
  }

  const now = new Date();
  const thisWeek = getWeekStart(now);
  const nextWeek = addDays(thisWeek, 7);
  await ensureSessionsForWeek(thisWeek);

  // This week's sessions I teach or am covering — nothing outside the current week.
  const sessions = await prisma.classSession.findMany({
    where: {
      startAt: { gte: thisWeek, lt: nextWeek },
      cancelled: false,
      OR: [{ coachId: coach.id }, { subCoachId: coach.id }],
    },
    include: {
      coach: true,
      subCoach: true,
      bookings: {
        where: {
          status: {
            in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED, BOOKING_STATUS.WAITLIST],
          },
        },
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { startAt: "asc" },
  });

  const data: CoachSession[] = sessions.map((s) => ({
    id: s.id,
    classType: s.classType,
    startISO: s.startAt.toISOString(),
    endISO: s.endAt.toISOString(),
    capacity: s.capacity,
    scheduledCoachName: s.coach?.name ?? null,
    subCoachName: s.subCoach?.name ?? null,
    iAmScheduled: s.coachId === coach.id,
    iAmSub: s.subCoachId === coach.id,
    roster: s.bookings
      .filter((b) => b.status !== BOOKING_STATUS.WAITLIST)
      .map((b) => ({
        bookingId: b.id,
        firstName: b.user.firstName,
        email: b.user.email,
        phone: b.user.phone ?? null,
        image: b.user.image ?? null,
      })),
    waitlistCount: s.bookings.filter((b) => b.status === BOOKING_STATUS.WAITLIST).length,
  }));

  const totalClasses = data.length;
  const totalBooked = data.reduce((n, s) => n + s.roster.length, 0);

  const weekEnd = addDays(thisWeek, 6);
  const weekLabel = `This week · ${thisWeek.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="grid gap-8">
      {/* Welcome */}
      <section className="rounded-3xl border border-oxblood-600/50 bg-gradient-to-r from-oxblood/60 to-ink p-7 sm:p-9">
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Coach dashboard
        </p>
        <h1 className="font-poster mt-1 text-4xl text-bone sm:text-5xl">
          Welcome, {coach.name}
        </h1>
        <div className="mt-6 flex flex-wrap gap-8">
          <Stat label="Classes this week" value={totalClasses} />
          <Stat label="Members booked" value={totalBooked} />
        </div>
      </section>

      <CoachDashboard sessions={data} weekLabel={weekLabel} />

      <CoachProfileForm name={coach.name} bio={coach.bio ?? ""} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-poster text-5xl text-gold">{value}</p>
      <p className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">
        {label}
      </p>
    </div>
  );
}
