import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, MEMBERSHIP } from "@/lib/constants";
import { sendTrialFollowUp } from "@/lib/email";

// Daily cron (vercel.json): the morning after a trial member's class, send one
// "How was your first class?" email with the $99 first-month CTA. Runs are
// idempotent — trialFollowUpAt marks who's already been emailed.
export async function GET(req: Request) {
  // Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const candidates = await prisma.user.findMany({
    where: {
      membershipType: MEMBERSHIP.TRIAL,
      trialFollowUpAt: null,
      bookings: {
        some: {
          status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED] },
          session: { endAt: { lt: dayAgo, gt: weekAgo } },
        },
      },
    },
    select: { id: true, email: true, firstName: true },
  });

  let sent = 0;
  for (const u of candidates) {
    const res = await sendTrialFollowUp(u.email, u.firstName);
    if (res.ok || res.skipped) {
      await prisma.user.update({
        where: { id: u.id },
        data: { trialFollowUpAt: now },
      });
      if (res.ok) sent++;
    }
  }

  return NextResponse.json({ ok: true, candidates: candidates.length, sent });
}
