"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  cancelSession,
  restoreSession,
  updateSession,
  type ScheduleState,
} from "@/app/actions/schedule-admin";
import { ownerPromoteWaitlist, ownerRemoveBooking } from "@/app/actions/members-admin";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export type SessionCoachOpt = { id: string; name: string };
export type RosterEntry = {
  bookingId: string;
  name: string;
  email: string;
  phone: string | null;
};
export type ManagerSession = {
  id: string;
  classType: string;
  whenLabel: string;
  /** "HH:MM" in gym-local (LA) time — prefill for the "this class only" edit form. */
  startTimeLocal: string;
  endTimeLocal: string;
  coachId: string | null;
  coachName: string | null; // effective display name (substitute overlays the scheduled coach)
  subCoachName: string | null;
  capacity: number;
  cancelled: boolean;
  booked: RosterEntry[];
  waitlist: RosterEntry[];
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
  if (state.error) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

function EditSessionForm({
  session,
  coaches,
  onDone,
}: {
  session: ManagerSession;
  coaches: SessionCoachOpt[];
  onDone: () => void;
}) {
  const [state, action] = useActionState(updateSession, undefined);
  return (
    <form
      action={action}
      className="mt-3 grid gap-3 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4"
    >
      <input type="hidden" name="id" value={session.id} />
      <p className="font-condensed text-xs tracking-widest text-gold uppercase">
        This class only — the recurring series is untouched
      </p>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Start
          </span>
          <input
            type="time"
            name="startTime"
            required
            defaultValue={session.startTimeLocal}
            className={field}
          />
        </label>
        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            End
          </span>
          <input
            type="time"
            name="endTime"
            required
            defaultValue={session.endTimeLocal}
            className={field}
          />
        </label>
        <label className="grid gap-1.5 sm:col-span-1">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Coach
          </span>
          <select name="coachId" defaultValue={session.coachId ?? ""} className={field}>
            <option value="">No coach</option>
            {coaches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
            Capacity
          </span>
          <input
            type="number"
            name="capacity"
            min={1}
            required
            defaultValue={session.capacity}
            className={field}
          />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit label="Save (this class only)" />
        <button
          type="button"
          onClick={onDone}
          className="font-condensed rounded-full border border-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
        >
          Cancel
        </button>
        <Msg state={state} />
      </div>
    </form>
  );
}

function RosterExpander({ session }: { session: ManagerSession }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<RosterEntry | null>(null);

  function promote() {
    setError(null);
    setBusyId("promote");
    startTransition(async () => {
      const res = await ownerPromoteWaitlist(session.id);
      if (!res.ok) setError(res.error ?? "Couldn't promote from the waitlist.");
      else router.refresh();
      setBusyId(null);
    });
  }

  function remove(entry: RosterEntry) {
    setError(null);
    setBusyId(entry.bookingId);
    startTransition(async () => {
      const res = await ownerRemoveBooking(entry.bookingId);
      if (!res.ok) setError(res.error ?? "Couldn't remove that booking.");
      else router.refresh();
      setBusyId(null);
      setRemoveTarget(null);
    });
  }

  if (session.booked.length === 0 && session.waitlist.length === 0) {
    return <p className="mt-3 text-sm text-cream/40">No one signed up yet.</p>;
  }

  return (
    <div className="mt-3 grid gap-4">
      {error && <p className="text-sm text-blood">{error}</p>}

      {session.booked.length > 0 && (
        <div>
          <p className="font-condensed mb-2 text-xs tracking-widest text-cream/50 uppercase">
            Booked ({session.booked.length})
          </p>
          <ul className="divide-y divide-oxblood-600/40">
            {session.booked.map((m) => (
              <li key={m.bookingId} className="flex items-center gap-3 py-2.5">
                <p className="min-w-0 flex-1 truncate text-bone">{m.name}</p>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(m)}
                  disabled={pending && busyId === m.bookingId}
                  className="font-condensed rounded-full border border-blood/50 px-3 py-1 text-xs tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {session.waitlist.length > 0 && (
        <div>
          <p className="font-condensed mb-2 text-xs tracking-widest text-bronze uppercase">
            Waitlist ({session.waitlist.length})
          </p>
          <ul className="divide-y divide-oxblood-600/40">
            {session.waitlist.map((m, i) => (
              <li key={m.bookingId} className="flex items-center gap-3 py-2.5">
                <p className="min-w-0 flex-1 truncate text-bone">
                  {m.name}
                  {i === 0 && (
                    <span className="font-condensed ml-2 text-[10px] tracking-widest text-bronze uppercase">
                      Next in line
                    </span>
                  )}
                </p>
                {i === 0 && (
                  <button
                    type="button"
                    onClick={promote}
                    disabled={pending && busyId === "promote"}
                    className="font-condensed rounded-full bg-gold px-3 py-1 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-50"
                  >
                    Promote
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRemoveTarget(m)}
                  disabled={pending && busyId === m.bookingId}
                  className="font-condensed rounded-full border border-blood/50 px-3 py-1 text-xs tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove from class"
        message={`Remove ${removeTarget?.name ?? "this member"} from ${session.classType}? They'll be notified their spot opened up.`}
        confirmLabel="Remove"
        danger
        pending={pending}
        error={error}
        onConfirm={() => removeTarget && remove(removeTarget)}
        onCancel={() => setRemoveTarget(null)}
      />
    </div>
  );
}

function SessionCard({
  session,
  coaches,
}: {
  session: ManagerSession;
  coaches: SessionCoachOpt[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function doCancel() {
    setError(null);
    startTransition(async () => {
      try {
        await cancelSession(session.id);
        setConfirmCancel(false);
        router.refresh();
      } catch {
        setError("Couldn't cancel that class.");
      }
    });
  }

  function doRestore() {
    setError(null);
    startTransition(async () => {
      try {
        await restoreSession(session.id);
        router.refresh();
      } catch {
        setError("Couldn't restore that class.");
      }
    });
  }

  const waiting = session.waitlist.length;

  return (
    <li className="rounded-2xl border border-oxblood-600/40 bg-ink/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
            {session.classType}
            {session.cancelled && (
              <span className="font-condensed rounded-full bg-blood/20 px-2.5 py-0.5 text-xs tracking-widest text-blood uppercase">
                Cancelled
              </span>
            )}
          </p>
          <p className="font-condensed text-sm tracking-wide text-cream/55">
            {session.whenLabel} · {session.coachName ?? "Unstaffed"}
            {session.subCoachName && (
              <span className="text-gold"> (covered by {session.subCoachName})</span>
            )}
          </p>
        </div>
        <span
          className={`font-condensed shrink-0 rounded-full px-3 py-1 text-xs tracking-widest uppercase ${
            session.booked.length >= session.capacity
              ? "bg-blood/20 text-blood"
              : "bg-gold/15 text-gold"
          }`}
        >
          {session.booked.length}/{session.capacity}
          {waiting > 0 && ` · ${waiting} waiting`}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-blood">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setRosterOpen((v) => !v)}
          className="font-condensed rounded-full border border-oxblood-600/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/70 uppercase transition-colors hover:border-gold hover:text-gold"
        >
          {rosterOpen ? "Hide roster" : "Roster"}
        </button>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="font-condensed rounded-full border border-gold px-4 py-1.5 text-xs font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
        >
          {editing ? "Close" : "Edit this class only"}
        </button>
        {session.cancelled ? (
          <button
            type="button"
            onClick={doRestore}
            disabled={pending}
            className="font-condensed rounded-full border border-oxblood-600/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/70 uppercase transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="font-condensed rounded-full border border-blood/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-blood uppercase transition-colors hover:bg-blood hover:text-bone"
          >
            Cancel this class
          </button>
        )}
      </div>

      {editing && (
        <EditSessionForm
          session={session}
          coaches={coaches}
          onDone={() => setEditing(false)}
        />
      )}
      {rosterOpen && <RosterExpander session={session} />}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel this class"
        message={`Cancel ${session.classType} on ${session.whenLabel}? Booked members are hidden from it; this only affects this one occurrence.`}
        confirmLabel="Cancel class"
        danger
        pending={pending}
        error={error}
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </li>
  );
}

export function SessionManager({
  sessions,
  coaches,
}: {
  sessions: ManagerSession[];
  coaches: SessionCoachOpt[];
}) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
        <h2 className="font-poster mb-2 text-2xl text-bone">This week</h2>
        <p className="text-sm text-cream/40">No classes this week.</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster mb-2 text-2xl text-bone">This week</h2>
      <p className="mb-5 text-sm text-cream/60">
        Edit or cancel a single class without touching the recurring series, and
        manage who&apos;s booked or waitlisted.
      </p>
      <ul className="grid gap-3">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} coaches={coaches} />
        ))}
      </ul>
    </section>
  );
}
