import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, GYM_TIMEZONE } from "@/lib/constants";

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ---- time helpers -----------------------------------------------------------
// ALL schedule logic and display is pinned to the gym's timezone
// (America/Los_Angeles), regardless of the server's or viewer's timezone.
// Dates are stored as real UTC instants; the helpers below convert between
// UTC instants and LA wall-clock time (DST-safe via Intl).

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: GYM_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  weekday: "short",
});

type TzParts = { y: number; m: number; d: number; hour: number; minute: number; weekday: number };

/** The LA wall-clock components of a UTC instant. */
export function tzParts(date: Date): TzParts {
  const parts: Record<string, string> = {};
  for (const p of partsFmt.formatToParts(date)) parts[p.type] = p.value;
  const hour = Number(parts.hour) === 24 ? 0 : Number(parts.hour);
  return {
    y: Number(parts.year),
    m: Number(parts.month),
    d: Number(parts.day),
    hour,
    minute: Number(parts.minute),
    weekday: DAY_LABELS.indexOf(parts.weekday),
  };
}

/** The UTC instant of an LA wall time (y/m/d + minutes from midnight). */
export function zonedTimeToUtc(
  y: number,
  m: number,
  d: number,
  minutesFromMidnight: number,
): Date {
  const h = Math.floor(minutesFromMidnight / 60);
  const min = minutesFromMidnight % 60;
  const desired = Date.UTC(y, m - 1, d, h, min);
  let ts = desired;
  // Iterate: measure what LA wall time the guess lands on, correct by the
  // difference. Converges in ≤2 steps incl. DST transitions.
  for (let i = 0; i < 3; i++) {
    const p = tzParts(new Date(ts));
    const wall = Date.UTC(p.y, p.m - 1, p.d, p.hour, p.minute);
    const diff = desired - wall;
    if (diff === 0) break;
    ts += diff;
  }
  return new Date(ts);
}

/** Format minutes-from-midnight as e.g. "7:15 AM". */
export function formatMinutes(min: number): string {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Format a stored instant as e.g. "7:15 AM" in gym time. */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: GYM_TIMEZONE,
  });
}

/** LA midnight of the LA-day containing `date`. */
export function startOfDay(date: Date): Date {
  const p = tzParts(date);
  return zonedTimeToUtc(p.y, p.m, p.d, 0);
}

/** Shift by whole LA calendar days, preserving wall-clock time (DST-safe). */
export function addDays(date: Date, days: number): Date {
  const p = tzParts(date);
  const shifted = new Date(Date.UTC(p.y, p.m - 1, p.d + days));
  return zonedTimeToUtc(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
    p.hour * 60 + p.minute,
  );
}

/** Sunday 00:00 (LA) of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const p = tzParts(date);
  return addDays(zonedTimeToUtc(p.y, p.m, p.d, 0), -p.weekday);
}

/** The seven day-Dates (LA midnight) for a week starting at `weekStart`. */
export function weekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isSameDay(a: Date, b: Date): boolean {
  const pa = tzParts(a);
  const pb = tzParts(b);
  return pa.y === pb.y && pa.m === pb.m && pa.d === pb.d;
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
    const day = addDays(weekStart, t.dayOfWeek); // LA midnight of the slot's day
    const p = tzParts(day);
    const startAt = zonedTimeToUtc(p.y, p.m, p.d, t.startMin);
    const endAt = zonedTimeToUtc(p.y, p.m, p.d, t.endMin);

    // One session per template per LA-day. Owner edits to a single occurrence
    // (edited=true, possibly with a different time) are NEVER overwritten —
    // and never duplicated — by regeneration. subCoachId (covers) survives too.
    const dayEnd = addDays(day, 1);
    const existing = await prisma.classSession.findFirst({
      where: { templateId: t.id, startAt: { gte: day, lt: dayEnd } },
    });

    if (!existing) {
      await prisma.classSession.create({
        data: {
          templateId: t.id,
          classType: t.classType,
          coachId: t.coachId,
          startAt,
          endAt,
          capacity: t.capacity,
        },
      });
    } else if (!existing.edited) {
      await prisma.classSession.update({
        where: { id: existing.id },
        data: {
          classType: t.classType,
          coachId: t.coachId,
          startAt,
          endAt,
          capacity: t.capacity,
        },
      });
    }
  }
}

export type SessionWithMeta = {
  id: string;
  classType: string;
  coachName: string | null; // substitute overlays the scheduled coach
  covered: boolean; // true when a substitute is covering
  startAt: Date;
  endAt: Date;
  capacity: number;
  booked: number;
  openSlots: number;
};

/** Closures (days off) whose date falls within the given week. */
export async function getClosuresForWeek(
  weekStart: Date,
): Promise<{ date: Date; reason: string | null }[]> {
  const weekEnd = addDays(weekStart, 7);
  const closures = await prisma.closure.findMany({
    where: { date: { gte: weekStart, lt: weekEnd } },
  });
  return closures.map((c) => ({ date: c.date, reason: c.reason }));
}

/**
 * Ensure + return all sessions for a week, with coach name and live open-slot
 * counts. Cancelled classes and classes on a closed (day-off) date are omitted.
 * A substitute coach, when set, overlays the scheduled coach. Sorted by start.
 */
export async function getWeekSessions(
  weekStart: Date,
): Promise<SessionWithMeta[]> {
  await ensureSessionsForWeek(weekStart);

  const weekEnd = addDays(weekStart, 7);
  const [sessions, closures] = await Promise.all([
    prisma.classSession.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd }, cancelled: false },
      include: {
        coach: true,
        subCoach: true,
        _count: {
          select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } },
        },
      },
      orderBy: { startAt: "asc" },
    }),
    prisma.closure.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
    }),
  ]);

  const closedDays = new Set(closures.map((c) => startOfDay(c.date).getTime()));

  return sessions
    .filter((s) => !closedDays.has(startOfDay(s.startAt).getTime()))
    .map((s) => ({
      id: s.id,
      classType: s.classType,
      coachName: s.subCoach?.name ?? s.coach?.name ?? null,
      covered: !!s.subCoach,
      startAt: s.startAt,
      endAt: s.endAt,
      capacity: s.capacity,
      booked: s._count.bookings,
      openSlots: Math.max(0, s.capacity - s._count.bookings),
    }));
}

/** Parse a `?week=YYYY-MM-DD` param into an LA week-start (defaults to now). */
export function parseWeekParam(week?: string): Date {
  if (week) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(week.trim());
    if (m) {
      return getWeekStart(zonedTimeToUtc(Number(m[1]), Number(m[2]), Number(m[3]), 12));
    }
  }
  return getWeekStart(new Date());
}

/** Format a week-start Date as `YYYY-MM-DD` (LA calendar) for `?week=`. */
export function weekParam(weekStart: Date): string {
  const p = tzParts(weekStart);
  return `${p.y}-${p.m.toString().padStart(2, "0")}-${p.d.toString().padStart(2, "0")}`;
}
