"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignSubstitute, clearSubstitute } from "@/app/actions/coach";

const field =
  "rounded-xl border border-oxblood-600/60 bg-ink/60 px-3 py-2 text-sm text-cream focus:border-gold focus:outline-none";

export type CoverCoachOpt = { id: string; name: string };
export type CoverSession = {
  id: string;
  classType: string;
  whenLabel: string;
  coachId: string | null;
  coachName: string | null;
  subCoachId: string | null;
  subCoachName: string | null;
};

function CoverRow({
  session,
  coaches,
}: {
  session: CoverSession;
  coaches: CoverCoachOpt[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pick, setPick] = useState("");

  const options = coaches.filter((c) => c.id !== session.coachId);

  function assign() {
    if (!pick) {
      setError("Choose a coach first.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await assignSubstitute(session.id, pick);
      if (!res.ok) setError(res.error ?? "Couldn't assign that cover.");
      else {
        setPick("");
        router.refresh();
      }
    });
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const res = await clearSubstitute(session.id);
      if (!res.ok) setError(res.error ?? "Couldn't clear that cover.");
      else router.refresh();
    });
  }

  return (
    <li className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4">
      <div className="min-w-0">
        <p className="font-semibold text-bone">{session.classType}</p>
        <p className="font-condensed text-sm tracking-wide text-cream/55">
          {session.whenLabel} · {session.coachName ?? "Unstaffed"}
          {session.subCoachName && (
            <span className="text-gold"> — covered by {session.subCoachName}</span>
          )}
        </p>
      </div>

      {error && <p className="mt-2 text-sm text-blood">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={pick}
          onChange={(e) => setPick(e.target.value)}
          className={field}
        >
          <option value="">Choose a coach…</option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={assign}
          disabled={pending}
          className="font-condensed rounded-full bg-gold px-4 py-2 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-50"
        >
          Assign cover
        </button>
        {session.subCoachId && (
          <button
            type="button"
            onClick={clear}
            disabled={pending}
            className="font-condensed rounded-full border border-blood/60 px-4 py-2 text-xs font-semibold tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone disabled:opacity-50"
          >
            Clear cover
          </button>
        )}
      </div>
    </li>
  );
}

export function AssignCoverManager({
  sessions,
  coaches,
}: {
  sessions: CoverSession[];
  coaches: CoverCoachOpt[];
}) {
  if (sessions.length === 0) {
    return <p className="text-sm text-cream/40">No upcoming classes in the next 14 days.</p>;
  }
  return (
    <ul className="grid gap-3">
      {sessions.map((s) => (
        <CoverRow key={s.id} session={s} coaches={coaches} />
      ))}
    </ul>
  );
}
