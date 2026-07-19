import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, GYM_TIMEZONE } from "@/lib/constants";
import {
  addDays,
  ensureSessionsForWeek,
  formatTime,
  getWeekStart,
  startOfDay,
  tzParts,
} from "@/lib/schedule";
import {
  ScheduleManager,
  type ManagerTemplate,
  type ManagerCoach,
} from "@/components/schedule-manager";
import {
  ClosuresManager,
  type ManagerClosure,
} from "@/components/closures-manager";
import {
  SessionManager,
  type ManagerSession,
  type RosterEntry,
} from "@/components/admin/session-manager";

export const dynamic = "force-dynamic";

function hm(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function whenLabel(start: Date, end: Date) {
  const day = start.toLocaleDateString("en-US", {
    timeZone: GYM_TIMEZONE,
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${formatTime(start)} – ${formatTime(end)}`;
}

export default async function AdminSchedulePage() {
  const today = startOfDay(new Date());
  const weekStart = getWeekStart(new Date());
  const weekEnd = addDays(weekStart, 7);

  // Sessions for the current week are generated on demand from active
  // templates — make sure this week's rows exist before querying them below.
  await ensureSessionsForWeek(weekStart);

  const [templates, closures, coaches, weekSessionsRaw] = await Promise.all([
    prisma.classTemplate.findMany({
      include: { coach: { select: { name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    }),
    prisma.closure.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.coach.findMany({ orderBy: { name: "asc" } }),
    prisma.classSession.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd } },
      include: {
        coach: true,
        subCoach: true,
        bookings: {
          where: {
            status: {
              in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED, BOOKING_STATUS.WAITLIST],
            },
          },
          include: {
            user: { select: { firstName: true, lastName: true, email: true, phone: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const templateProps: ManagerTemplate[] = templates.map((t) => ({
    id: t.id,
    classType: t.classType,
    coachId: t.coachId,
    coachName: t.coach?.name ?? null,
    dayOfWeek: t.dayOfWeek,
    startMin: t.startMin,
    endMin: t.endMin,
    capacity: t.capacity,
    active: t.active,
  }));

  const coachProps: ManagerCoach[] = coaches.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const closureProps: ManagerClosure[] = closures.map((c) => ({
    id: c.id,
    date: c.date.toISOString(),
    reason: c.reason,
  }));

  function rosterOf(
    bookings: (typeof weekSessionsRaw)[number]["bookings"],
    statuses: string[],
  ): RosterEntry[] {
    return bookings
      .filter((b) => statuses.includes(b.status))
      .map((b) => ({
        bookingId: b.id,
        name: `${b.user.firstName} ${b.user.lastName}`.trim(),
        email: b.user.email,
        phone: b.user.phone,
      }));
  }

  const sessionProps: ManagerSession[] = weekSessionsRaw.map((s) => {
    const p = tzParts(s.startAt);
    const pe = tzParts(s.endAt);
    return {
      id: s.id,
      classType: s.classType,
      whenLabel: whenLabel(s.startAt, s.endAt),
      startTimeLocal: hm(p.hour * 60 + p.minute),
      endTimeLocal: hm(pe.hour * 60 + pe.minute),
      coachId: s.coachId,
      coachName: s.subCoach?.name ?? s.coach?.name ?? null,
      subCoachName: s.subCoach?.name ?? null,
      capacity: s.capacity,
      cancelled: s.cancelled,
      booked: rosterOf(s.bookings, [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED]),
      waitlist: rosterOf(s.bookings, [BOOKING_STATUS.WAITLIST]),
    };
  });

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Schedule</h1>
        <p className="mt-2 text-cream/60">
          Your weekly class grid, this week&apos;s classes, and days off.
        </p>
      </header>

      <SessionManager sessions={sessionProps} coaches={coachProps} />

      <div>
        <h2 className="font-poster mb-2 text-2xl text-bone">Weekly series</h2>
        <p className="mb-5 text-sm text-cream/60">
          Edits here (&quot;all future classes&quot;) change the recurring
          template every week is generated from.
        </p>
        <ScheduleManager templates={templateProps} coaches={coachProps} />
      </div>

      <ClosuresManager closures={closureProps} />
    </div>
  );
}
