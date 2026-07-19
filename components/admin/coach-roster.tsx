"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCoachActive } from "@/app/actions/members-admin";

export type ManagerCoachRow = {
  id: string;
  name: string;
  specialty: string | null;
  active: boolean;
  email: string | null;
};

function CoachRow({ coach }: { coach: ManagerCoachRow }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const res = await setCoachActive(coach.id, !coach.active);
      if (!res.ok) setError(res.error ?? "Couldn't update that coach.");
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
            {coach.name}
            {!coach.active && (
              <span className="font-condensed rounded-full bg-blood/20 px-2.5 py-0.5 text-xs tracking-widest text-blood uppercase">
                Inactive
              </span>
            )}
            {coach.email ? (
              <span className="font-condensed rounded-full bg-gold/15 px-2.5 py-0.5 text-xs tracking-widest text-gold uppercase">
                Has login
              </span>
            ) : (
              <span className="font-condensed rounded-full bg-cream/10 px-2.5 py-0.5 text-xs tracking-widest text-cream/50 uppercase">
                Display only
              </span>
            )}
          </p>
          <p className="font-condensed text-sm tracking-wide text-cream/55">
            {coach.specialty ?? "No specialty set"}
            {coach.email && ` · ${coach.email}`}
          </p>
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          className={`font-condensed rounded-full border px-4 py-1.5 text-xs font-semibold tracking-widest uppercase transition-colors disabled:opacity-50 ${
            coach.active
              ? "border-blood/60 text-blood hover:bg-blood hover:text-bone"
              : "border-gold text-gold hover:bg-gold hover:text-ink"
          }`}
        >
          {coach.active ? "Deactivate" : "Reactivate"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-blood">{error}</p>}
    </li>
  );
}

export function CoachRoster({ coaches }: { coaches: ManagerCoachRow[] }) {
  if (coaches.length === 0) {
    return <p className="text-sm text-cream/40">No coaches yet.</p>;
  }
  return (
    <ul className="grid gap-3">
      {coaches.map((c) => (
        <CoachRow key={c.id} coach={c} />
      ))}
    </ul>
  );
}
