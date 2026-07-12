import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/schedule";
import {
  ScheduleManager,
  type ManagerTemplate,
  type ManagerCoach,
} from "@/components/schedule-manager";
import {
  ClosuresManager,
  type ManagerClosure,
} from "@/components/closures-manager";
import { OwnerNav } from "@/components/owner-nav";

export const dynamic = "force-dynamic";

export default async function AdminSchedulePage() {
  const today = startOfDay(new Date());

  const [templates, closures, coaches] = await Promise.all([
    prisma.classTemplate.findMany({
      include: { coach: { select: { name: true } } },
      orderBy: [{ dayOfWeek: "asc" }, { startMin: "asc" }],
    }),
    prisma.closure.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.coach.findMany({ orderBy: { name: "asc" } }),
  ]);

  const templateProps: ManagerTemplate[] = templates.map((t) => ({
    id: t.id,
    classType: t.classType,
    coachId: t.coachId,
    coachName: t.coach?.name ?? null,
    dayOfWeek: t.dayOfWeek,
    startMin: t.startMin,
    endMin: t.endMin,
    capacity: t.capacity,
    active: t.active,
  }));

  const coachProps: ManagerCoach[] = coaches.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  const closureProps: ManagerClosure[] = closures.map((c) => ({
    id: c.id,
    date: c.date.toISOString(),
    reason: c.reason,
  }));

  return (
    <div className="grid gap-8">
      <header className="grid gap-4">
        <OwnerNav active="schedule" />
        <div>
          <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
            Owner
          </p>
          <h1 className="font-poster text-4xl text-bone sm:text-5xl">Schedule</h1>
          <p className="mt-2 text-cream/60">
            Your weekly class grid. Add or remove classes on any day, adjust
            times, assign a coach, and close the gym for holidays.
          </p>
        </div>
      </header>

      <ScheduleManager templates={templateProps} coaches={coachProps} />

      <ClosuresManager closures={closureProps} />
    </div>
  );
}
