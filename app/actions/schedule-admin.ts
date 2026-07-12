"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, CLASS_TYPES, ROLES } from "@/lib/constants";
import { startOfDay } from "@/lib/schedule";

export type ScheduleState = { ok?: string; error?: string } | undefined;

async function requireOwner() {
  const session = await auth();
  if (session?.user?.role !== ROLES.OWNER) throw new Error("Unauthorized");
}

function revalidateSchedule() {
  revalidatePath("/admin/schedule");
  revalidatePath("/schedule");
}

const CLASS_TYPE_VALUES = Object.values(CLASS_TYPES) as string[];

/**
 * Read a "HH:MM" time string (from an <input type="time">) as minutes from
 * midnight. Falls back to separate hour/minute fields when the string is empty.
 * Returns null when nothing valid was provided.
 */
function readMinutes(
  formData: FormData,
  timeKey: string,
  hourKey: string,
  minKey: string,
): number | null {
  const raw = String(formData.get(timeKey) ?? "").trim();
  if (raw) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(raw);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  const hour = formData.get(hourKey);
  if (hour != null && String(hour) !== "") {
    const h = Number(hour);
    const min = Number(formData.get(minKey) ?? 0);
    if (Number.isNaN(h) || Number.isNaN(min) || h > 23 || min > 59) return null;
    return h * 60 + min;
  }
  return null;
}

// Shared validation/normalisation for create + update. Returns either the
// clean fields or an error message.
function readTemplateFields(formData: FormData):
  | { error: string }
  | {
      classType: string;
      coachId: string | null;
      dayOfWeek: number;
      startMin: number;
      endMin: number;
      capacity: number;
    } {
  const classType = String(formData.get("classType") ?? "").trim();
  if (!CLASS_TYPE_VALUES.includes(classType))
    return { error: "Choose a valid class type." };

  const coachRaw = String(formData.get("coachId") ?? "").trim();
  const coachId = coachRaw === "" ? null : coachRaw;

  const dayOfWeek = Number(formData.get("dayOfWeek"));
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6)
    return { error: "Choose a valid day." };

  const startMin = readMinutes(formData, "startTime", "startHour", "startMin");
  const endMin = readMinutes(formData, "endTime", "endHour", "endMin");
  if (startMin == null) return { error: "Enter a valid start time." };
  if (endMin == null) return { error: "Enter a valid end time." };
  if (endMin <= startMin)
    return { error: "End time must be after the start time." };

  const capacity = Number(formData.get("capacity"));
  if (!Number.isInteger(capacity) || capacity < 1)
    return { error: "Capacity must be at least 1." };

  return { classType, coachId, dayOfWeek, startMin, endMin, capacity };
}

// Add a new recurring weekly class slot. The visible schedule is generated from
// these on demand, so a new template appears as soon as a week is viewed.
export async function createTemplate(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireOwner();
  const fields = readTemplateFields(formData);
  if ("error" in fields) return { error: fields.error };

  await prisma.classTemplate.create({ data: { ...fields, active: true } });
  revalidateSchedule();
  return { ok: "Class added to the weekly schedule." };
}

// Edit an existing weekly slot (type / coach / day / time / capacity / active).
export async function updateTemplate(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing class." };

  const fields = readTemplateFields(formData);
  if ("error" in fields) return { error: fields.error };
  const active = formData.get("active") != null;

  await prisma.classTemplate.update({
    where: { id },
    data: { ...fields, active },
  });
  revalidateSchedule();
  return { ok: "Class updated." };
}

// Delete a recurring slot. Future sessions with no live bookings are deleted;
// future sessions that already have bookings are cancelled (kept for the record
// and hidden from members) rather than dropped. Past sessions are left intact.
export async function deleteTemplate(formData: FormData): Promise<void> {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const today = startOfDay(new Date());
  const futureSessions = await prisma.classSession.findMany({
    where: { templateId: id, startAt: { gte: today } },
    include: {
      _count: {
        select: {
          bookings: { where: { status: { not: BOOKING_STATUS.CANCELLED } } },
        },
      },
    },
  });

  for (const s of futureSessions) {
    if (s._count.bookings > 0) {
      await prisma.classSession.update({
        where: { id: s.id },
        data: { cancelled: true },
      });
    } else {
      await prisma.classSession.delete({ where: { id: s.id } });
    }
  }

  // Remaining sessions (past, or cancelled-with-bookings) keep their data; the
  // optional templateId relation is nulled by the database on delete.
  await prisma.classTemplate.delete({ where: { id } });
  revalidateSchedule();
}

// Quick pause / resume of a weekly slot without opening the editor. A paused
// template stops generating new sessions.
export async function setTemplateActive(
  id: string,
  active: boolean,
): Promise<void> {
  await requireOwner();
  await prisma.classTemplate.update({ where: { id }, data: { active } });
  revalidateSchedule();
}

// Add / update a gym-wide day off. Stored at local midnight of the given date;
// closed days hide their classes from the public schedule.
export async function addClosure(
  _prev: ScheduleState,
  formData: FormData,
): Promise<ScheduleState> {
  await requireOwner();
  const raw = String(formData.get("date") ?? "").trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return { error: "Choose a date." };
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  date.setHours(0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return { error: "Choose a valid date." };

  const reason = String(formData.get("reason") ?? "").trim() || null;

  await prisma.closure.upsert({
    where: { date },
    create: { date, reason },
    update: { reason },
  });
  revalidateSchedule();
  return { ok: "Day off saved." };
}

export async function removeClosure(id: string): Promise<void> {
  await requireOwner();
  await prisma.closure.delete({ where: { id } });
  revalidateSchedule();
}

// One-off cancel of a specific dated class (e.g. a coach is out this Tuesday).
export async function cancelSession(sessionId: string): Promise<void> {
  await requireOwner();
  await prisma.classSession.update({
    where: { id: sessionId },
    data: { cancelled: true },
  });
  revalidateSchedule();
}

export async function restoreSession(sessionId: string): Promise<void> {
  await requireOwner();
  await prisma.classSession.update({
    where: { id: sessionId },
    data: { cancelled: false },
  });
  revalidateSchedule();
}
