import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- time helpers -----------------------------------------------------------

/** Format minutes-from-midnight as e.g. "7:15 AM". */
export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Format a stored Date as e.g. "7:15 AM" using local time. */
export function formatTime(d: Date): string {
  return formatMinutes(d.getHours() * 60 + d.getMinutes());
}

/** Sunday 00:00 (local) of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** The seven day-Dates (local midnight) for a week starting at `weekStart`. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ---- session generation -----------------------------------------------------

/**
 * Ensure concrete ClassSession rows exist for every active template in the
 * given week. Sessions are upserted (keyed on templateId + startAt) so viewing
 * a week is idempotent and the schedule is always current relative to today.
 */
export async function ensureSessionsForWeek(weekStart: Date): Promise<void> {
  const templates = await prisma.classTemplate.findMany({
    where: { active: true },
  });

  for (const t of templates) {
    const day = addDays(weekStart, t.dayOfWeek);
    const startAt = new Date(day);
    startAt.setHours(0, t.startMin, 0, 0);
    const endAt = new Date(day);
    endAt.setHours(0, t.endMin, 0, 0);

    await prisma.classSession.upsert({
      where: { templateId_startAt: { templateId: t.id, startAt } },
      create: {
        templateId: t.id,
        classType: t.classType,
        coachId: t.coachId,
        startAt,
        endAt,
        capacity: t.capacity,
      },
      update: {
        classType: t.classType,
        coachId: t.coachId,
        endAt,
        capacity: t.capacity,
      },
    });
  }
}

export type SessionWithMeta = {
  id: string;
  classType: string;
  coachName: string | null;
  startAt: Date;
  endAt: Date;
  capacity: number;
  booked: number;
  openSlots: number;
};

/**
 * Ensure + return all sessions for a week, with coach name and live open-slot
 * counts. Sorted by start time.
 */
export async function getWeekSessions(
  weekStart: Date,
): Promise<SessionWithMeta[]> {
  await ensureSessionsForWeek(weekStart);

  const weekEnd = addDays(weekStart, 7);
  const sessions = await prisma.classSession.findMany({
    where: { startAt: { gte: weekStart, lt: weekEnd } },
    include: {
      coach: true,
      _count: { select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } } },
    },
    orderBy: { startAt: "asc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    classType: s.classType,
    coachName: s.coach?.name ?? null,
    startAt: s.startAt,
    endAt: s.endAt,
    capacity: s.capacity,
    booked: s._count.bookings,
    openSlots: Math.max(0, s.capacity - s._count.bookings),
  }));
}

/** Parse a `?week=YYYY-MM-DD` param into a week-start Date (defaults to now). */
export function parseWeekParam(week?: string): Date {
  if (week) {
    const parsed = new Date(week + "T00:00:00");
    if (!Number.isNaN(parsed.getTime())) return getWeekStart(parsed);
  }
  return getWeekStart(new Date());
}

/** Format a week-start Date as `YYYY-MM-DD` for use in the `?week=` param. */
export function weekParam(weekStart: Date): string {
  const y = weekStart.getFullYear();
  const m = (weekStart.getMonth() + 1).toString().padStart(2, "0");
  const d = weekStart.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}
