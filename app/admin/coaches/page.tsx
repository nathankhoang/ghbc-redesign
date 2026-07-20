import { prisma } from "@/lib/prisma";
import { addDays, ensureSessionsForWeek, formatTime, getWeekStart } from "@/lib/schedule";
import { GYM_TIMEZONE } from "@/lib/constants";
import { InviteCoachForm } from "@/components/admin/invite-coach-form";
import { CoachRoster, type ManagerCoachRow } from "@/components/admin/coach-roster";
import {
  AssignCoverManager,
  type CoverSession,
  type CoverCoachOpt,
} from "@/components/admin/assign-cover-manager";

export const dynamic = "force-dynamic";

function whenLabel(start: Date, end: Date) {
  const day = start.toLocaleDateString("en-US", {
    timeZone: GYM_TIMEZONE,
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
        startAt: { gte: now, lt: addDays(thisWeek, 14) },
        cancelled: false,
      },
      include: { coach: true, subCoach: true },
      orderBy: { startAt: "asc" },
    }),
  ]);

  const coachRows: ManagerCoachRow[] = coaches.map((c) => ({
    id: c.id,
    name: c.name,
    specialty: c.specialty,
    active: c.active,
    email: c.user?.email ?? null,
  }));

  const coachOpts: CoverCoachOpt[] = coaches
    .filter((c) => c.active)
    .map((c) => ({ id: c.id, name: c.name }));

  const coverSessions: CoverSession[] = sessions.map((s) => ({
    id: s.id,
    classType: s.classType,
    whenLabel: whenLabel(s.startAt, s.endAt),
    coachId: s.coachId,
    coachName: s.coach?.name ?? null,
    subCoachId: s.subCoachId,
    subCoachName: s.subCoach?.name ?? null,
  }));

  const activeSubs = sessions.filter((s) => s.subCoachId);

  return (
    <div className="grid gap-8">
      <header>
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          Owner
        </p>
        <h1 className="font-poster text-4xl text-bone sm:text-5xl">Coaches</h1>
        <p className="mt-2 text-cream/60">
          Roster, invites, and covering classes when a coach is out.
        </p>
      </header>

      {/* Roster / logins */}
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <h2 className="font-poster mb-5 text-2xl text-bone">
          Coaches ({coaches.length})
        </h2>
        <CoachRoster coaches={coachRows} />
        <div className="mt-6 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-5">
          <h3 className="font-condensed mb-3 text-sm tracking-widest text-gold uppercase">
            Invite a coach
          </h3>
          <InviteCoachForm />
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
                  {whenLabel(s.startAt, s.endAt)},{" "}
                  <span className="text-gold">{s.subCoach?.name}</span> covering
                  for {s.coach?.name ?? "an open slot"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Assign cover */}
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <h2 className="font-poster mb-2 text-2xl text-bone">Assign cover</h2>
        <p className="mb-5 text-sm text-cream/60">
          Next 14 days. Pick a coach to cover a class. Members see the sub
          right away.
        </p>
        <AssignCoverManager sessions={coverSessions} coaches={coachOpts} />
      </section>
    </div>
  );
}
