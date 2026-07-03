import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";
import { getWeekStart } from "@/lib/schedule";
import { AppHeader } from "@/components/app-header";
import { MyClasses, type Item } from "@/components/my-classes";

export const dynamic = "force-dynamic";

const MILESTONES = [
  { n: 1, label: "First Class", emoji: "🥊" },
  { n: 5, label: "Getting Started", emoji: "🔥" },
  { n: 10, label: "Regular", emoji: "💪" },
  { n: 25, label: "Committed", emoji: "🏆" },
  { n: 50, label: "Fighter", emoji: "🥇" },
  { n: 100, label: "Legend", emoji: "👑" },
];

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id, status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.WAITLIST] } },
    include: { session: { include: { coach: true } } },
    orderBy: { session: { startAt: "asc" } },
  });

  const now = new Date();
  const toItem = (b: (typeof bookings)[number]): Item => ({
    bookingId: b.id,
    classType: b.session.classType,
    coachName: b.session.coach?.name ?? null,
    startISO: b.session.startAt.toISOString(),
    endISO: b.session.endAt.toISOString(),
    waitlisted: b.status === BOOKING_STATUS.WAITLIST,
  });

  const upcoming = bookings.filter((b) => b.session.startAt >= now).map(toItem);
  const pastBooked = bookings.filter((b) => b.session.startAt < now && b.status === BOOKING_STATUS.BOOKED);
  const past = [...pastBooked].reverse().map(toItem);
  const total = pastBooked.length;

  // Week streak — consecutive weeks (ending this week) with >=1 attended class
  const weekKeys = new Set(pastBooked.map((b) => getWeekStart(b.session.startAt).getTime()));
  let streak = 0;
  const cursor = getWeekStart(now);
  while (weekKeys.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 7);
  }

  const next = MILESTONES.find((m) => m.n > total) ?? MILESTONES[MILESTONES.length - 1];
  const pct = Math.min(100, (total / next.n) * 100);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        {/* Welcome */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-oxblood-600/50 bg-gradient-to-r from-oxblood/60 to-ink p-7 sm:p-9">
          <div className="flex items-center gap-5">
            <span className="font-poster flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-3xl text-ink">
              {user.firstName.charAt(0).toUpperCase()}
            </span>
            <div>
              <h1 className="font-poster text-4xl text-bone">Welcome back, {user.firstName}</h1>
              <p className="font-condensed tracking-widest text-gold uppercase">
                {user.membershipType === "YOGA" ? "Yoga" : "Full"} member · Active
              </p>
            </div>
          </div>
          <Link href="/schedule" className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase hover:bg-bone">
            Book a class
          </Link>
        </div>

        {/* Rewards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 text-center">
            <div className="font-poster text-6xl text-gold">{total}</div>
            <div className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">Classes attended</div>
          </div>
          <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 text-center">
            <div className="font-poster text-6xl text-gold">{streak}🔥</div>
            <div className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">Week streak</div>
          </div>
          <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6">
            <div className="font-condensed flex items-center justify-between text-xs tracking-widest text-cream/60 uppercase">
              <span>Next: {next.label}</span>
              <span>{total}/{next.n}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/60">
              <div className="h-full rounded-full bg-gradient-to-r from-bronze to-gold" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-sm text-cream/50">{Math.max(0, next.n - total)} more to unlock {next.emoji}</p>
          </div>
        </div>

        {/* Badges */}
        <div className="mb-8 rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
          <h2 className="font-poster mb-5 text-2xl text-bone">Rewards</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {MILESTONES.map((m) => {
              const earned = total >= m.n;
              return (
                <div key={m.n} className={`flex flex-col items-center rounded-2xl border p-4 text-center ${earned ? "border-gold/50 bg-gold/10" : "border-oxblood-600/40 opacity-45"}`}>
                  <span className={`text-3xl ${earned ? "" : "grayscale"}`}>{m.emoji}</span>
                  <span className="font-condensed mt-2 text-[10px] tracking-widest text-cream/70 uppercase">{m.label}</span>
                  <span className="text-[10px] text-cream/40">{m.n} classes</span>
                </div>
              );
            })}
          </div>
        </div>

        <MyClasses upcoming={upcoming} past={past} />

        {/* Quick links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/personal-training" className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 transition-colors hover:border-gold/50">
            <h3 className="font-poster text-2xl text-bone">Personal Training →</h3>
            <p className="mt-1 text-cream/60">Book 1-on-1 coaching built around your goals.</p>
          </Link>
          <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6">
            <h3 className="font-poster text-2xl text-bone">Membership</h3>
            <p className="mt-1 text-cream/60">Full member · $120/mo · no contract · cancel anytime.</p>
          </div>
        </div>
      </main>
    </>
  );
}
