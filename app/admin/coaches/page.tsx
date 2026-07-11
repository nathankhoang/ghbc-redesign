import { prisma } from "@/lib/prisma";
import { BOOKING_STATUS } from "@/lib/constants";
import {
  addDays,
  ensureSessionsForWeek,
  formatTime,
  getWeekStart,
} from "@/lib/schedule";
import { CreateCoachAccountForm } from "@/components/create-coach-form";

export const dynamic = "force-dynamic";

function whenLabel(start: Date, end: Date) {
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  return `${day} · ${formatTime(start)} – ${formatTime(end)}`;
}

export default async function AdminCoachesPage() {
  const now = new Date();
  const thisWeek = getWeekStart(now);
  await Promise.all([
    ensureSessionsForWeek(thisWeek),
    ensureSessionsForWeek(addDays(thisWeek, 7)),
  ]);

  const [coaches, sessions] = await Promise.all([
    prisma.coach.findMany({
      orderBy: { name: "asc" },
      include: { user: { select: { email: true } } },
    }),
    prisma.classSession.findMany({
      where: {
        endAt: { gte: now },
        startAt: { lt: addDays(thisWeek, 14) },
      },
      include: {
        coach: true,
        subCoach: true,
        bookings: {
          where: {
            status: { in: [BOOKING_STATUS.BOOKED, BOOKING_STATUS.ATTENDED] },
          },
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const activeSubs = sessions.filter((s) => s.subCoachId);

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Coaches</h1>
        <p className="mt-2 text-cream/60">
          Each coach&apos;s upcoming classes, who&apos;s signed up, and any covers
          in place.
        </p>
      </header>

      {/* Roster / logins */}
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <h2 className="font-poster mb-5 text-2xl text-bone">
          Coaches ({coaches.length})
        </h2>
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="font-condensed tracking-widest text-cream/50 uppercase">
              <tr className="border-b border-oxblood-600/50">
                <th className="py-2 pr-4 font-medium">Coach</th>
                <th className="py-2 pr-4 font-medium">Login</th>
                <th className="py-2 font-medium">Upcoming classes</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((c) => {
                const count = sessions.filter((s) => s.coachId === c.id).length;
                return (
                  <tr key={c.id} className="border-b border-oxblood-600/30">
                    <td className="py-2.5 pr-4 font-medium text-bone">{c.name}</td>
                    <td className="py-2.5 pr-4 text-cream/60">
                      {c.user?.email ?? (
                        <span className="text-cream/35">display-only</span>
                      )}
                    </td>
                    <td className="py-2.5 text-cream/80">{count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="rounded-2xl border border-oxblood-600/50 bg-ink/40 p-5">
          <h3 className="font-condensed mb-3 text-sm tracking-widest text-gold uppercase">
            Add a coach
          </h3>
          <CreateCoachAccountForm />
        </div>
      </section>

      {/* Active substitutions */}
      {activeSubs.length > 0 && (
        <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
          <h2 className="font-poster mb-5 text-2xl text-bone">
            Active covers ({activeSubs.length})
          </h2>
          <ul className="grid gap-2 text-sm">
            {activeSubs.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2">
                <span className="font-condensed rounded-full bg-gold/15 px-2.5 py-0.5 text-xs tracking-widest text-gold uppercase">
                  Cover
                </span>
                <span className="font-medium text-bone">{s.classType}</span>
                <span className="text-cream/60">
                  {whenLabel(s.startAt, s.endAt)} —{" "}
                  <span className="text-gold">{s.subCoach?.name}</span> covering
                  for {s.coach?.name ?? "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Per-coach upcoming classes + rosters */}
      <div className="grid gap-6">
        {coaches.map((c) => {
          const mine = sessions.filter((s) => s.coachId === c.id);
          if (mine.length === 0) return null;
          return (
            <section
              key={c.id}
              className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8"
            >
              <h2 className="font-poster mb-5 text-2xl text-bone">{c.name}</h2>
              <div className="grid gap-4">
                {mine.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-bone">
                          {s.classType}
                          {s.subCoach && (
                            <span className="ml-2 font-normal text-gold">
                              (covered by {s.subCoach.name})
                            </span>
                          )}
                        </p>
                        <p className="font-condensed text-sm tracking-wide text-cream/55">
                          {whenLabel(s.startAt, s.endAt)}
                        </p>
                      </div>
                      <span
                        className={`font-condensed rounded-full px-3 py-1 text-xs tracking-widest uppercase ${
                          s.bookings.length >= s.capacity
                            ? "bg-blood/20 text-blood"
                            : "bg-gold/15 text-gold"
                        }`}
                      >
                        {s.bookings.length} / {s.capacity} booked
                      </span>
                    </div>
                    {s.bookings.length === 0 ? (
                      <p className="text-sm text-cream/40">No one signed up yet.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {s.bookings.map((b) => (
                          <li
                            key={b.id}
                            className="flex items-center gap-2 rounded-full bg-ink/60 py-1 pr-3 pl-1 text-sm text-cream/85"
                          >
                            <span className="font-condensed flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-[10px] font-semibold text-ink">
                              {b.user.firstName.charAt(0).toUpperCase()}
                            </span>
                            {b.user.firstName} {b.user.lastName}
                            {b.status === BOOKING_STATUS.ATTENDED && (
                              <span className="text-gold">✓</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
