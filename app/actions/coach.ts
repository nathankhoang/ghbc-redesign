"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, ROLES } from "@/lib/constants";
import { uploadAvatar } from "@/lib/blob";

export type CoachActionResult = { ok: boolean; error?: string };
export type CoachProfileState = { ok?: string; error?: string } | undefined;

async function currentUser() {
  const session = await auth();
  const role = session?.user?.role;
  if (!session?.user?.id || (role !== ROLES.COACH && role !== ROLES.OWNER)) {
    return null;
  }
  return session.user;
}

// Cover assignment and attendance are owner-only tools now — coaches only
// manage their own profile from their dashboard.
async function currentOwner() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== ROLES.OWNER) return null;
  return session.user;
}

function revalidateSchedules() {
  revalidatePath("/coach");
  revalidatePath("/schedule");
  revalidatePath("/admin/coaches");
}

// Assign another coach to cover one session. Owner-only — the coach
// dashboard no longer exposes this. Instant — members see the sub right away.
export async function assignSubstitute(
  sessionId: string,
  subCoachId: string,
): Promise<CoachActionResult> {
  const user = await currentOwner();
  if (!user) return { ok: false, error: "Not authorized." };

  const cls = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!cls) return { ok: false, error: "Class not found." };
  if (cls.startAt < new Date())
    return { ok: false, error: "That class has already started." };

  if (!subCoachId) return { ok: false, error: "Choose a coach to cover." };
  if (subCoachId === cls.coachId)
    return { ok: false, error: "That coach already teaches this class." };

  await prisma.classSession.update({
    where: { id: sessionId },
    data: { subCoachId },
  });
  revalidateSchedules();
  return { ok: true };
}

// Cancel a substitution (the scheduled coach is back on). Owner-only.
export async function clearSubstitute(
  sessionId: string,
): Promise<CoachActionResult> {
  const user = await currentOwner();
  if (!user) return { ok: false, error: "Not authorized." };

  const cls = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!cls) return { ok: false, error: "Class not found." };

  await prisma.classSession.update({
    where: { id: sessionId },
    data: { subCoachId: null },
  });
  revalidateSchedules();
  return { ok: true };
}

// Mark / unmark a member as attended. Owner-only — coaches no longer manage
// attendance from their dashboard.
export async function toggleAttendance(
  bookingId: string,
  attended: boolean,
): Promise<CoachActionResult> {
  const user = await currentOwner();
  if (!user) return { ok: false, error: "Not authorized." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { session: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: attended ? BOOKING_STATUS.ATTENDED : BOOKING_STATUS.BOOKED },
  });
  revalidatePath("/coach");
  revalidatePath("/profile");
  revalidatePath("/admin/coaches");
  return { ok: true };
}

// Update the signed-in coach's own profile (name, bio, avatar).
export async function updateCoachProfile(
  _prev: CoachProfileState,
  formData: FormData,
): Promise<CoachProfileState> {
  const user = await currentUser();
  if (!user) return { error: "Not authorized." };

  const coach = await prisma.coach.findUnique({ where: { userId: user.id } });
  if (!coach) return { error: "No coach profile linked to this account." };

  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const imageFile = formData.get("image");
  const avatar = await uploadAvatar(
    imageFile instanceof File ? imageFile : null,
    `coach-${coach.id}`,
  );
  if (avatar.error) return { error: avatar.error };

  await prisma.coach.update({
    where: { id: coach.id },
    data: { name, bio: bio || null },
  });
  if (avatar.url) {
    await prisma.user.update({
      where: { id: user.id },
      data: { image: avatar.url },
    });
  }

  revalidatePath("/coach");
  revalidatePath("/coaches");
  revalidateSchedules();
  return { ok: "Profile updated." };
}
