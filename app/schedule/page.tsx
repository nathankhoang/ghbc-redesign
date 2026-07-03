import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";
import { addDays, getWeekSessions, isSameDay, parseWeekParam, weekDays, weekParam } from "@/lib/schedule";
import { AppHeader } from "@/components/app-header";
import { ScheduleBooking, type Day } from "@/components/schedule-booking";

export const dynamic = "force-dynamic";

const FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const { week } = await searchParams;
  const weekStart = parseWeekParam(week);
  const sessions = await getWeekSessions(weekStart);

  const mine = await prisma.booking.findMany({
    where: {
      userId,
      status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.WAITLIST] },
      sessionId: { in: sessions.map((s) => s.id) },
    },
    select: { sessionId: true, status: true },
  });
  const booked = new Set(mine.filter((b) => b.status === BOOKING_STATUS.BOOKED).map((b) => b.sessionId));
  const waitlisted = new Set(mine.filter((b) => b.status === BOOKING_STATUS.WAITLIST).map((b) => b.sessionId));

  const now = new Date();
  const days: Day[] = weekDays(weekStart).map((day, i) => ({
    label: SHORT[i],
    full: `${FULL[i]}, ${MON[day.getMonth()]} ${day.getDate()}`,
    isToday: isSameDay(day, now),
    classes: sessions
      .filter((s) => isSameDay(s.startAt, day))
      .map((s) => ({
        id: s.id,
        classType: s.classType,
        coachName: s.coachName,
        startISO: s.startAt.toISOString(),
        endISO: s.endAt.toISOString(),
        openSlots: s.openSlots,
        bookedByMe: booked.has(s.id),
        waitlistedByMe: waitlisted.has(s.id),
        started: s.startAt < now,
      })),
  }));

  const weekEnd = addDays(weekStart, 6);
  const rangeLabel = `${MON[weekStart.getMonth()]} ${weekStart.getDate()} – ${MON[weekEnd.getMonth()]} ${weekEnd.getDate()}`;

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <p className="font-condensed mb-2 text-sm tracking-[0.35em] text-gold uppercase">Book a class</p>
        <h1 className="font-poster fluid-h2 mb-10 text-bone">The Schedule</h1>

        <ScheduleBooking days={days} prevWeek={weekParam(addDays(weekStart, -7))} nextWeek={weekParam(addDays(weekStart, 7))} rangeLabel={rangeLabel} />

        {/* Personal training */}
        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-3xl border border-gold/30 bg-gradient-to-br from-oxblood/50 to-ink p-8 sm:flex-row sm:items-center">
          <div>
            <h3 className="font-poster text-3xl text-bone">Want 1-on-1 coaching?</h3>
            <p className="mt-2 max-w-md text-cream/70">Book a private personal training session and get a program built around your goals.</p>
          </div>
          <Link href="/personal-training" className="font-condensed shrink-0 rounded-full border border-gold px-8 py-3 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink">
            Book Personal Training
          </Link>
        </div>
      </main>
    </>
  );
}
