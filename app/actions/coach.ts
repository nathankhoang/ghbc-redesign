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

function revalidateSchedules() {
  revalidatePath("/coach");
  revalidatePath("/schedule");
  revalidatePath("/admin/coaches");
}

// Assign another coach to cover one session. Only the session's scheduled
// coach (or the owner) may do this. Instant — members see the sub right away.
export async function assignSubstitute(
  sessionId: string,
  subCoachId: string,
): Promise<CoachActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const cls = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!cls) return { ok: false, error: "Class not found." };
  if (cls.startAt < new Date())
    return { ok: false, error: "That class has already started." };

  const myCoach = await prisma.coach.findUnique({ where: { userId: user.id } });
  const isOwner = user.role === ROLES.OWNER;
  if (!isOwner && (!myCoach || cls.coachId !== myCoach.id)) {
    return { ok: false, error: "You can only arrange cover for your own classes." };
  }
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

// Cancel a substitution (the scheduled coach is back on).
export async function clearSubstitute(
  sessionId: string,
): Promise<CoachActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const cls = await prisma.classSession.findUnique({ where: { id: sessionId } });
  if (!cls) return { ok: false, error: "Class not found." };

  const myCoach = await prisma.coach.findUnique({ where: { userId: user.id } });
  const isOwner = user.role === ROLES.OWNER;
  // The scheduled coach or the covering coach (or owner) can clear it.
  const mayClear =
    isOwner ||
    (myCoach && (cls.coachId === myCoach.id || cls.subCoachId === myCoach.id));
  if (!mayClear) return { ok: false, error: "Not authorized." };

  await prisma.classSession.update({
    where: { id: sessionId },
    data: { subCoachId: null },
  });
  revalidateSchedules();
  return { ok: true };
}

// Mark / unmark a member as attended for a class the coach teaches or covers.
export async function toggleAttendance(
  bookingId: string,
  attended: boolean,
): Promise<CoachActionResult> {
  const user = await currentUser();
  if (!user) return { ok: false, error: "Not authorized." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { session: true },
  });
  if (!booking) return { ok: false, error: "Booking not found." };

  const myCoach = await prisma.coach.findUnique({ where: { userId: user.id } });
  const isOwner = user.role === ROLES.OWNER;
  const teachesIt =
    myCoach &&
    (booking.session.coachId === myCoach.id ||
      booking.session.subCoachId === myCoach.id);
  if (!isOwner && !teachesIt) return { ok: false, error: "Not your class." };

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
