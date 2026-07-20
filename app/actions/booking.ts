"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, CANCEL_CUTOFF_MINUTES, MEMBERSHIP } from "@/lib/constants";
import { sendBookingConfirmation, sendWaitlistPromotion } from "@/lib/email";

export type BookingResult = { ok: boolean; error?: string };

// A trial covers exactly ONE class, tracked as a class credit that's consumed
// on booking (and refunded if the booking is cancelled before class).
const TRIAL_UPGRADE_MSG =
  "Your trial covers one class. Become a member to book more. We'd love to have you!";

const PAST_DUE_MSG =
  "There's a problem with your payment. Update your card in Settings to keep booking.";
const PAUSED_MSG = "Your membership is paused. Contact the gym to start booking again.";
const CANCELLED_MSG = "Your membership isn't active. Rejoin to book classes.";

function revalidate() {
  revalidatePath("/schedule");
  revalidatePath("/profile");
}

type GateUser = {
  id: string;
  email: string;
  firstName: string;
  membershipType: string;
  subscriptionStatus: string;
  trialClassCredits: number;
};

// Booking gates shared by book + waitlist. Members regain booking
// automatically when their status returns to active (webhook-driven).
function bookingGateError(user: GateUser): string | null {
  switch (user.subscriptionStatus) {
    case "past_due":
      return PAST_DUE_MSG;
    case "paused":
      return PAUSED_MSG;
    case "cancelled":
      return CANCELLED_MSG;
    case "pending_claim":
      return "Claim your account first. Check your email for the claim link.";
    default:
      return null;
  }
}

async function getGateUser(userId: string): Promise<GateUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      membershipType: true,
      subscriptionStatus: true,
      trialClassCredits: true,
    },
  });
}

export async function bookClass(sessionId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };
  const userId = session.user.id;

  const user = await getGateUser(userId);
  if (!user) return { ok: false, error: "Account not found." };
  const gate = bookingGateError(user);
  if (gate) return { ok: false, error: gate };

  const cls = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } } },
    },
  });
  if (!cls || cls.cancelled) return { ok: false, error: "Class not found." };
  if (cls.startAt < new Date())
    return { ok: false, error: "That class has already started." };
  if (cls._count.bookings >= cls.capacity)
    return { ok: false, error: "This class is full. You can join the waitlist." };

  // No double-booking (also enforced by the DB's unique constraint).
  const existing = await prisma.booking.findUnique({
    where: { userId_sessionId: { userId, sessionId } },
  });
  if (existing && existing.status === BOOKING_STATUS.BOOKED)
    return { ok: false, error: "You're already booked for this class." };
  if (existing && existing.status === BOOKING_STATUS.WAITLIST)
    return { ok: false, error: "You're already on the waitlist for this class." };

  // Trial members spend their single class credit.
  if (user.membershipType === MEMBERSHIP.TRIAL) {
    if (user.trialClassCredits < 1) return { ok: false, error: TRIAL_UPGRADE_MSG };
    await prisma.user.update({
      where: { id: userId },
      data: { trialClassCredits: { decrement: 1 } },
    });
  }

  await prisma.booking.upsert({
    where: { userId_sessionId: { userId, sessionId } },
    create: { userId, sessionId, status: BOOKING_STATUS.BOOKED },
    update: { status: BOOKING_STATUS.BOOKED },
  });

  // Confirmation email (no-op if Resend isn't configured; never blocks booking).
  void sendBookingConfirmation(user.email, user.firstName, {
    classType: cls.classType,
    startAt: cls.startAt,
    endAt: cls.endAt,
  });

  revalidate();
  return { ok: true };
}

export async function joinWaitlist(sessionId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };
  const userId = session.user.id;

  const user = await getGateUser(userId);
  if (!user) return { ok: false, error: "Account not found." };
  const gate = bookingGateError(user);
  if (gate) return { ok: false, error: gate };
  // Waitlist entries don't consume a trial credit (only a promoted booking
  // does) — but a trial member with no credit can't queue either.
  if (user.membershipType === MEMBERSHIP.TRIAL && user.trialClassCredits < 1) {
    return { ok: false, error: TRIAL_UPGRADE_MSG };
  }

  const cls = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      _count: { select: { bookings: { where: { status: BOOKING_STATUS.BOOKED } } } },
    },
  });
  if (!cls || cls.cancelled) return { ok: false, error: "Class not found." };
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
    update: { status: BOOKING_STATUS.WAITLIST, createdAt: new Date() },
  });

  revalidate();
  return { ok: true };
}

/**
 * Promote the longest-waiting waitlisted member into a freed spot, notifying
 * them by email AND an in-dashboard notification. Exported for reuse by the
 * owner's manual class management.
 */
export async function promoteFromWaitlist(sessionId: string): Promise<void> {
  const next = await prisma.booking.findFirst({
    where: { sessionId, status: BOOKING_STATUS.WAITLIST },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { id: true, email: true, firstName: true } },
      session: { select: { classType: true, startAt: true } },
    },
  });
  if (!next) return;

  await prisma.booking.update({
    where: { id: next.id },
    data: { status: BOOKING_STATUS.BOOKED },
  });

  const when = next.session.startAt.toLocaleString("en-US", {
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
  });
  await prisma.notification.create({
    data: {
      userId: next.user.id,
      title: "A spot opened up. You're in!",
      body: `You've been moved off the waitlist and confirmed for ${next.session.classType} on ${when}.`,
    },
  });
  void sendWaitlistPromotion(next.user.email, next.user.firstName, {
    classType: next.session.classType,
    startAt: next.session.startAt,
  });
}

export async function cancelBooking(bookingId: string): Promise<BookingResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Please sign in." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { session: { select: { startAt: true } } },
  });
  if (!booking || booking.userId !== session.user.id)
    return { ok: false, error: "Booking not found." };

  const wasBooked = booking.status === BOOKING_STATUS.BOOKED;

  // Cancellation cutoff applies to confirmed bookings only — leaving a
  // waitlist is allowed anytime.
  if (wasBooked) {
    const cutoff = new Date(booking.session.startAt.getTime() - CANCEL_CUTOFF_MINUTES * 60_000);
    if (new Date() > cutoff) {
      return {
        ok: false,
        error: `Bookings can be cancelled up to ${CANCEL_CUTOFF_MINUTES} minutes before class. This one is inside the window. Call the gym if something came up.`,
      };
    }
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BOOKING_STATUS.CANCELLED },
  });

  // A cancelled trial booking returns the single class credit.
  const user = await getGateUser(booking.userId);
  if (user?.membershipType === MEMBERSHIP.TRIAL && booking.session.startAt > new Date()) {
    await prisma.user.update({
      where: { id: booking.userId },
      data: { trialClassCredits: { increment: 1 } },
    });
  }

  // Freeing a booked spot auto-promotes the first person on the waitlist.
  if (wasBooked) {
    await promoteFromWaitlist(booking.sessionId);
  }

  revalidate();
  return { ok: true };
}

/** Explicit leave-waitlist (same as cancelling a WAITLIST booking). */
export async function leaveWaitlist(bookingId: string): Promise<BookingResult> {
  return cancelBooking(bookingId);
}
