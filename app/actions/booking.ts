"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, MEMBERSHIP } from "@/lib/constants";
import { sendBookingConfirmation } from "@/lib/email";

export type BookingResult = { ok: boolean; error?: string };

// A $20 trial covers a single class. Once a trial member has an active booking
// for any other session, they must become a member to book more.
const TRIAL_UPGRADE_MSG =
  "Your $20 trial covers one class. Become a member to book more — we'd love to have you!";

function revalidate() {
  revalidatePath("/schedule");
  revalidatePath("/profile");
}

export async function bookClass(sessionId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };
  const userId = session.user.id;

  const cls = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } } },
    },
  });
  if (!cls) return { ok: false, error: "Class not found." };
  if (cls.startAt < new Date())
    return { ok: false, error: "That class has already started." };
  if (cls._count.bookings >= cls.capacity)
    return { ok: false, error: "This class is full." };

  const existing = await prisma.booking.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
  });
  if (existing && existing.status === BOOKING_STATUS.BOOKED)
    return { ok: false, error: "You're already booked for this class." };

  // Enforce the single-class trial.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipType: true, email: true, firstName: true },
  });
  if (user?.membershipType === MEMBERSHIP.TRIAL) {
    const otherActive = await prisma.booking.count({
      where: {
        userId,
        sessionId: { not: sessionId },
        status: {
          in: [
            BOOKING_STATUS.BOOKED,
            BOOKING_STATUS.WAITLIST,
            BOOKING_STATUS.ATTENDED,
          ],
        },
      },
    });
    if (otherActive >= 1) return { ok: false, error: TRIAL_UPGRADE_MSG };
  }

  await prisma.booking.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId, status: BOOKING_STATUS.BOOKED },
    update: { status: BOOKING_STATUS.BOOKED },
  });

  // Confirmation email (no-op if Resend isn't configured; never blocks booking).
  if (user?.email) {
    void sendBookingConfirmation(user.email, user.firstName, {
      classType: cls.classType,
      startAt: cls.startAt,
      endAt: cls.endAt,
    });
  }

  revalidate();
  return { ok: true };
}

export async function joinWaitlist(sessionId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };
  const userId = session.user.id;

  const cls = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } } },
    },
  });
  if (!cls) return { ok: false, error: "Class not found." };
  if (cls.startAt < new Date())
    return { ok: false, error: "That class has already started." };
  // If a spot is actually open, book instead of waitlisting.
  if (cls._count.bookings < cls.capacity) return bookClass(sessionId);

  const existing = await prisma.booking.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
  });
  if (existing && existing.status === BOOKING_STATUS.WAITLIST)
    return { ok: false, error: "You're already on the waitlist." };
  if (existing && existing.status === BOOKING_STATUS.BOOKED)
    return { ok: false, error: "You're already booked for this class." };

  await prisma.booking.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId, status: BOOKING_STATUS.WAITLIST },
    update: { status: BOOKING_STATUS.WAITLIST },
  });

  revalidate();
  return { ok: true };
}

export async function cancelBooking(bookingId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== session.user.id)
    return { ok: false, error: "Booking not found." };

  const wasBooked = booking.status === BOOKING_STATUS.BOOKED;

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.CANCELLED },
  });

  // Freeing a booked spot promotes the longest-waiting person off the waitlist.
  if (wasBooked) {
    const next = await prisma.booking.findFirst({
      where: { sessionId: booking.sessionId, status: BOOKING_STATUS.WAITLIST },
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await prisma.booking.update({
        where: { id: next.id },
        data: { status: BOOKING_STATUS.BOOKED },
      });
    }
  }

  revalidate();
  return { ok: true };
}
