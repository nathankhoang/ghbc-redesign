"use client";

import { useEffect, useState, useTransition } from "react";
import { acknowledgeMilestone } from "@/app/actions/rewards";

export type MilestoneStatus = {
  milestone: number;
  celebrated: boolean;
  redeemed: boolean;
};

// Mirrors lib/rewards.ts's MILESTONES. Kept as a local, dependency-free copy
// (rather than imported) so this "use client" component never pulls the
// server-only prisma import chain into the browser bundle.
const MILESTONES = [
  { classes: 100, prize: "T-shirt + handwraps + 30-min private session" },
  { classes: 250, prize: "T-shirt + gloves + 45-min private session" },
  { classes: 500, prize: "T-shirt + hoodie + handwraps + 1 month free" },
] as const;

const MAX_MILESTONE = MILESTONES[MILESTONES.length - 1].classes;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

export function RewardsBar({
  classCount,
  milestones,
}: {
  classCount: number;
  milestones: MilestoneStatus[];
}) {
  const reducedMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  // Milestones acknowledged locally (optimistic) — lets a member click through
  // several celebrations back-to-back without waiting on a server refetch.
  const [locallyAcked, setLocallyAcked] = useState<Set<number>>(new Set());

  const reachedByMilestone = new Map(milestones.map((m) => [m.milestone, m]));

  const pending = milestones
    .filter((m) => !m.celebrated && !locallyAcked.has(m.milestone))
    .map((m) => m.milestone)
    .sort((a, b) => a - b);
  const current = pending[0];
  const celebrating = current != null ? MILESTONES.find((m) => m.classes === current) : null;

  // Fire confetti + lock scroll while a celebration is showing.
  useEffect(() => {
    if (!celebrating) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!reducedMotion) {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 140,
          spread: 90,
          startVelocity: 45,
          origin: { y: 0.6 },
          colors: ["#d6ab63", "#f5e6c8", "#7a1f1f"],
        });
      });
    }

    return () => {
      document.body.style.overflow = original;
    };
  }, [celebrating, reducedMotion]);

  function acknowledge(milestone: number) {
    setLocallyAcked((prev) => new Set(prev).add(milestone));
    startTransition(async () => {
      await acknowledgeMilestone(milestone);
    });
  }

  const nextMilestone = MILESTONES.find((m) => m.classes > classCount) ?? MILESTONES[MILESTONES.length - 1];
  const maxedOut = classCount >= MAX_MILESTONE;
  const barTarget = nextMilestone.classes;
  const progressPct = Math.min(100, (classCount / barTarget) * 100);
  const ticks = Array.from({ length: barTarget / 25 }, (_, i) => (i + 1) * 25);

  return (
    <div className="mb-8 rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 sm:p-8">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="font-poster text-2xl text-bone sm:text-3xl">Rewards</h2>
        <span className="font-poster text-4xl text-gold">{classCount}</span>
      </div>
      <p className="font-condensed mb-8 text-xs tracking-widest text-cream/50 uppercase">
        {maxedOut
          ? "All milestones unlocked — legend status 👑"
          : `${Math.max(0, barTarget - classCount)} more to unlock ${barTarget} classes`}
      </p>

      {/* Progress bar toward the next milestone, scaled 0 → next target */}
      <div className="relative mx-2 mb-10 h-2.5 rounded-full bg-ink/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-bronze to-gold transition-[width] duration-700 ease-out"
          style={{ width: `${progressPct}%` }}
        />
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-ink/70"
            style={{ left: `${Math.min(100, (t / barTarget) * 100)}%` }}
            aria-hidden="true"
          />
        ))}
        <span
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl leading-none"
          style={{ left: `${progressPct}%` }}
          aria-hidden="true"
        >
          🔥
        </span>
      </div>

      {/* Milestone chips */}
      <div className="grid gap-3 sm:grid-cols-3">
        {MILESTONES.map((m) => {
          const status = reachedByMilestone.get(m.classes);
          const reached = Boolean(status);
          const redeemed = Boolean(status?.redeemed);
          const isNext = !maxedOut && m.classes === nextMilestone.classes;
          const glow = reached && !redeemed;

          return (
            <div
              key={m.classes}
              className={[
                "rounded-2xl border p-4 text-center transition-colors",
                redeemed
                  ? "border-bronze/40 bg-oxblood/20"
                  : glow
                    ? `border-gold bg-gold/10 shadow-[0_0_24px_rgba(214,171,99,0.5)] ${reducedMotion ? "" : "animate-pulse"}`
                    : isNext
                      ? "border-gold/50 bg-gold/5"
                      : "border-oxblood-600/40 opacity-60",
              ].join(" ")}
            >
              <div className="font-poster text-2xl text-gold">{m.classes}</div>
              <p className="font-condensed mt-0.5 text-[10px] tracking-widest text-cream/60 uppercase">classes</p>
              <p className="mt-2 text-xs text-cream/75">{m.prize}</p>
              {redeemed ? (
                <p className="font-condensed mt-3 text-[10px] tracking-widest text-bronze uppercase">✓ Redeemed</p>
              ) : reached ? (
                <p className="font-condensed mt-3 text-[10px] tracking-widest text-gold uppercase">Ready to redeem</p>
              ) : (
                <p className="font-condensed mt-3 text-[10px] tracking-widest text-cream/40 uppercase">
                  {m.classes - classCount} to go
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Celebration popup — confetti already fired in the effect above */}
      {celebrating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-gold/60 bg-gradient-to-br from-oxblood/70 to-ink p-7 text-center shadow-2xl">
            <div className="font-poster mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-3xl text-ink">
              🏆
            </div>
            <h2 className="font-poster text-3xl text-bone">You hit {celebrating.classes} classes!</h2>
            <p className="mt-3 text-cream/80">{celebrating.prize}</p>
            <p className="font-condensed mt-4 text-xs tracking-widest text-gold uppercase">
              Show your coach your dashboard to redeem your prize!
            </p>
            <button
              type="button"
              onClick={() => acknowledge(celebrating.classes)}
              disabled={isPending}
              className="font-condensed mt-7 w-full rounded-full bg-gold py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
            >
              {isPending ? "…" : "Got it"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
