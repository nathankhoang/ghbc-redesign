"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addClosure,
  removeClosure,
  type ScheduleState,
} from "@/app/actions/schedule-admin";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export type ManagerClosure = {
  id: string;
  date: string; // ISO date string
  reason: string | null;
};

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Msg({ state }: { state: ScheduleState }) {
  if (!state) return null;
  if (state.error)
    return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

function formatClosureDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ClosuresManager({ closures }: { closures: ManagerClosure[] }) {
  const [state, action] = useActionState(addClosure, undefined);

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster text-2xl text-bone">Days off &amp; holidays</h2>
      <p className="mt-2 mb-5 text-sm text-cream/60">
        Close the gym for a day. Every class on that date is hidden from the
        member schedule.
      </p>

      <form
        action={action}
        className="rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              Date
            </span>
            <input type="date" name="date" required className={field} />
          </label>
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              Reason (optional)
            </span>
            <input
              type="text"
              name="reason"
              placeholder="e.g. Thanksgiving, maintenance"
              className={field}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Submit label="Add day off" />
          <Msg state={state} />
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-condensed mb-3 text-sm tracking-widest text-gold uppercase">
          Upcoming days off ({closures.length})
        </h3>
        {closures.length === 0 ? (
          <p className="text-sm text-cream/40">No days off scheduled.</p>
        ) : (
          <ul className="grid gap-2">
            {closures.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxblood-600/40 bg-ink/30 px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-bone">
                    {formatClosureDate(c.date)}
                  </p>
                  {c.reason && (
                    <p className="font-condensed text-sm tracking-wide text-cream/55">
                      {c.reason}
                    </p>
                  )}
                </div>
                <form action={removeClosure.bind(null, c.id)}>
                  <button
                    type="submit"
                    className="font-condensed rounded-full border border-blood/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
