import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, MEMBERSHIP } from "@/lib/constants";
import { getWeekStart } from "@/lib/schedule";
import { getClassCount, syncMilestones } from "@/lib/rewards";
import { getUnreadAnnouncements } from "@/app/actions/announcements";
import { AppHeader } from "@/components/app-header";
import { MyClasses, type Item } from "@/components/my-classes";
import { ClassReminderPopup, type NextClass } from "@/components/class-reminder-popup";
import { AnnouncementPopup } from "@/components/announcement-popup";
import { RewardsBar } from "@/components/rewards-bar";
import { MembershipContact } from "@/components/membership-contact";

const MEMBERSHIP_LABEL: Record<string, string> = {
  [MEMBERSHIP.FULL]: "Full member",
  [MEMBERSHIP.YOGA]: "Yoga member",
  [MEMBERSHIP.TRIAL]: "Trial pass",
  [MEMBERSHIP.NONE]: "Guest",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: {
      userId: user.id,
      status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.WAITLIST, BOOKING_STATUS.ATTENDED] },
    },
    include: { session: { include: { coach: true } } },
    orderBy: { session: { startAt: "asc" } },
  });

  const [classCount, announcements] = await Promise.all([
    getClassCount(user.id),
    getUnreadAnnouncements(user.id),
  ]);
  const milestoneRows = await syncMilestones(user.id, classCount);
  const milestones = milestoneRows.map((m) => ({
    milestone: m.milestone,
    celebrated: m.celebratedAt != null,
    redeemed: m.redeemedAt != null,
  }));

  const now = new Date();
  const toItem = (b: (typeof bookings)[number]): Item => ({
    bookingId: b.id,
    classType: b.session.classType,
    coachName: b.session.coach?.name ?? null,
    startISO: b.session.startAt.toISOString(),
    endISO: b.session.endAt.toISOString(),
    waitlisted: b.status === BOOKING_STATUS.WAITLIST,
  });

  const upcoming = bookings
    .filter((b) => b.session.startAt >= now && b.status !== BOOKING_STATUS.ATTENDED)
    .map(toItem);
  // A class counts as attended once a coach marks it ATTENDED, or once a booked
  // class's start time has passed. (Keeps the counter stable when a coach checks
  // people in — and matches the leaderboard's definition.)
  const attended = bookings.filter(
    (b) =>
      b.status === BOOKING_STATUS.ATTENDED ||
      (b.status === BOOKING_STATUS.BOOKED && b.session.startAt < now),
  );
  const past = [...attended].reverse().map(toItem);

  // Week streak — consecutive weeks (ending this week) with >=1 attended class
  const weekKeys = new Set(attended.map((b) => getWeekStart(b.session.startAt).getTime()));
  let streak = 0;
  const cursor = getWeekStart(now);
  while (weekKeys.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  // Next upcoming class → the reminder popup.
  const firstUpcoming = bookings.find((b) => b.session.startAt >= now);
  const nextClass: NextClass = firstUpcoming
    ? {
        classType: firstUpcoming.session.classType,
        whenLabel: firstUpcoming.session.startAt.toLocaleString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }
    : null;

  return (
    <>
      <ClassReminderPopup firstName={user.firstName} nextClass={nextClass} />
      <AnnouncementPopup announcements={announcements} />
      <AppHeader />
      <main className="selectable mx-auto max-w-5xl px-5 py-12 sm:px-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-oxblood-600/50 bg-gradient-to-r from-oxblood/60 to-ink p-7 sm:p-9">
          <div className="flex items-center gap-5">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.firstName}
                width={64}
                height={64}
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="font-poster flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-3xl text-ink">
                {user.firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="font-poster text-4xl text-bone">Welcome back, {user.firstName}</h1>
              <p className="font-condensed tracking-widest text-gold uppercase">
                {MEMBERSHIP_LABEL[user.membershipType] ?? "Member"} · Active
              </p>
            </div>
          </div>
          <Link href="/schedule" className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase hover:bg-bone">
            Book a class
          </Link>
        </div>

        {/* Week streak */}
        <div className="mb-8 flex">
          <div className="w-full rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 text-center sm:w-64">
            <div className="font-poster text-6xl text-gold">{streak}🔥</div>
            <div className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">Week streak</div>
          </div>
        </div>

        {/* Rewards — centerpiece */}
        <RewardsBar classCount={classCount} milestones={milestones} />

        <MyClasses upcoming={upcoming} past={past} />

        {/* Manage membership */}
        <div className="mt-8">
          <MembershipContact />
        </div>

        {/* Quick links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/schedule" className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 transition-colors hover:border-gold/50">
            <h3 className="font-poster text-2xl text-bone">Book a class →</h3>
            <p className="mt-1 text-cream/60">See the week&apos;s schedule and grab your spot.</p>
          </Link>
          <Link href="/account" className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 transition-colors hover:border-gold/50">
            <h3 className="font-poster text-2xl text-bone">Account settings →</h3>
            <p className="mt-1 text-cream/60">Update your photo, email, phone and password.</p>
          </Link>
        </div>
      </main>
    </>
  );
}
