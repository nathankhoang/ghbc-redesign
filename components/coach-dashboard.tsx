"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  assignSubstitute,
  clearSubstitute,
  toggleAttendance,
} from "@/app/actions/coach";

export type RosterMember = {
  bookingId: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  attended: boolean;
};

export type CoachSession = {
  id: string;
  classType: string;
  startISO: string;
  endISO: string;
  capacity: number;
  scheduledCoachName: string | null;
  subCoachName: string | null;
  iAmScheduled: boolean;
  iAmSub: boolean;
  roster: RosterMember[];
};

function whenLabel(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const day = start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="font-condensed flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-xs font-semibold text-ink">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

function SubControls({
  s,
  otherCoaches,
  busy,
  run,
}: {
  s: CoachSession;
  otherCoaches: { id: string; name: string }[];
  busy: boolean;
  run: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [pick, setPick] = useState("");

  if (s.subCoachName) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2 text-sm">
        <span className="text-gold">
          {s.iAmSub && !s.iAmScheduled
            ? `You're covering for ${s.scheduledCoachName ?? "another coach"}`
            : `Covered by ${s.subCoachName}`}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => clearSubstitute(s.id))}
          className="font-condensed ml-auto rounded-full border border-gold/60 px-3 py-1 text-xs tracking-widest text-gold uppercase hover:bg-gold hover:text-ink disabled:opacity-50"
        >
          Cancel cover
        </button>
      </div>
    );
  }

  if (!s.iAmScheduled) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-oxblood-600/50 bg-ink/40 px-3 py-2 text-sm">
      <span className="text-cream/70">Need time off? Assign cover:</span>
      <select
        value={pick}
        onChange={(e) => setPick(e.target.value)}
        className="rounded-lg border border-oxblood-600/60 bg-ink/60 px-2 py-1 text-sm text-cream focus:border-gold focus:outline-none"
      >
        <option value="" className="bg-ink">Choose a coach…</option>
        {otherCoaches.map((c) => (
          <option key={c.id} value={c.id} className="bg-ink">
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={busy || !pick}
        onClick={() => run(() => assignSubstitute(s.id, pick))}
        className="font-condensed rounded-full bg-gold px-4 py-1 text-xs font-semibold tracking-widest text-ink uppercase hover:bg-bone disabled:opacity-50"
      >
        Assign cover
      </button>
    </div>
  );
}

function SessionCard({
  s,
  otherCoaches,
}: {
  s: CoachSession;
  otherCoaches: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error ?? "Something went wrong.");
    });
  }

  return (
    <div className="rounded-3xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/40 to-ink p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-poster text-2xl text-bone">
            {s.classType}
            {s.iAmSub && !s.iAmScheduled && (
              <span className="font-condensed ml-2 rounded-full bg-gold/15 px-2 py-0.5 align-middle text-xs tracking-widest text-gold uppercase">
                Covering
              </span>
            )}
          </p>
          <p className="font-condensed text-sm tracking-wide text-cream/55">
            {whenLabel(s.startISO, s.endISO)}
          </p>
        </div>
        <span className="font-condensed rounded-full bg-ink/60 px-3 py-1 text-sm tracking-widest text-cream/80 uppercase">
          {s.roster.length} / {s.capacity} booked
        </span>
      </div>

      <SubControls s={s} otherCoaches={otherCoaches} busy={pending} run={run} />

      {error && <p className="mt-2 text-sm text-blood">{error}</p>}

      {/* Roster */}
      {s.roster.length === 0 ? (
        <p className="mt-3 text-sm text-cream/40">No one signed up yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-oxblood-600/40">
          {s.roster.map((m) => (
            <li key={m.bookingId} className="flex flex-wrap items-center gap-3 py-2.5">
              <Avatar name={m.name} image={m.image} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-bone">{m.name}</p>
                <p className="truncate text-xs text-cream/45">
                  {m.email}
                  {m.phone && ` · ${m.phone}`}
                </p>
              </div>
              <button
                type="button"
                disabled={pending}
                onClick={() => run(() => toggleAttendance(m.bookingId, !m.attended))}
                className={`font-condensed rounded-full border px-3 py-1 text-xs tracking-widest uppercase transition-colors disabled:opacity-50 ${
                  m.attended
                    ? "border-gold bg-gold text-ink"
                    : "border-oxblood-600/60 text-cream/70 hover:border-gold hover:text-gold"
                }`}
              >
                {m.attended ? "Attended ✓" : "Mark attended"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CoachDashboard({
  sessions,
  otherCoaches,
}: {
  sessions: CoachSession[];
  otherCoaches: { id: string; name: string }[];
}) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-8 text-center">
        <p className="text-cream/55">
          You have no upcoming classes in the next two weeks.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <h2 className="font-poster text-3xl text-bone">Your upcoming classes</h2>
      {sessions.map((s) => (
        <SessionCard key={s.id} s={s} otherCoaches={otherCoaches} />
      ))}
    </section>
  );
}
