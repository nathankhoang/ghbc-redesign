import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS, ROLES } from "@/lib/constants";
import { addDays, getWeekSessions, getWeekStart } from "@/lib/schedule";
import { BroadcastForm } from "@/components/broadcast-form";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/admin/schedule", label: "Schedule", blurb: "Weekly grid, this week's classes, days off" },
  { href: "/admin/members", label: "Members", blurb: "Search, billing, rewards" },
  { href: "/admin/subscriptions", label: "Subscriptions", blurb: "Promo codes, Square migration" },
  { href: "/admin/coaches", label: "Coaches", blurb: "Roster, invites, assign covers" },
  { href: "/admin/payments", label: "Payments", blurb: "Recent Square activity" },
] as const;

export default async function AdminOverviewPage() {
  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = addDays(weekStart, 7);

  const [activeMembers, pendingClaim, pastDue, weekSessions, bookingsThisWeek] =
    await Promise.all([
      prisma.user.count({
        where: { role: ROLES.MEMBER, subscriptionStatus: "active" },
      }),
      prisma.user.count({
        where: { role: ROLES.MEMBER, subscriptionStatus: "pending_claim" },
      }),
      prisma.user.count({
        where: { role: ROLES.MEMBER, subscriptionStatus: "past_due" },
      }),
      getWeekSessions(weekStart),
      prisma.booking.count({
        where: {
          status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED] },
          session: { startAt: { gte: weekStart, lt: weekEnd }, cancelled: false },
        },
      }),
    ]);

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Overview</h1>
        <p className="mt-2 text-cream/60">The gym, at a glance.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Active members" value={activeMembers} />
        <Stat label="Past due" value={pastDue} warn={pastDue > 0} />
        <Stat label="Pending claim" value={pendingClaim} />
        <Stat label="Classes this week" value={weekSessions.length} />
        <Stat label="Bookings this week" value={bookingsThisWeek} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-2xl border border-oxblood-600/50 bg-oxblood/20 p-5 transition-colors hover:border-gold/50 hover:bg-oxblood/30"
          >
            <p className="font-poster text-xl text-bone">{l.label}</p>
            <p className="mt-1 text-sm text-cream/55">{l.blurb}</p>
          </Link>
        ))}
      </section>

      <BroadcastForm />
    </div>
  );
}

function Stat({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-oxblood-600/50 bg-oxblood/20 p-4">
      <p className={`font-poster text-3xl sm:text-4xl ${warn ? "text-blood" : "text-gold"}`}>
        {value}
      </p>
      <p className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">
        {label}
      </p>
    </div>
  );
}
