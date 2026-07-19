"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { inviteCoach, type AdminResult } from "@/app/actions/members-admin";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send invite"}
    </button>
  );
}

function Msg({ state }: { state: AdminResult | undefined }) {
  if (!state) return null;
  if (!state.ok) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.info) return <span className="text-sm text-gold">{state.info}</span>;
  return null;
}

/** Invite a new coach — the only path to a COACH-role login. Emails a claim link. */
export function InviteCoachForm() {
  const [state, action] = useActionState(inviteCoach, undefined);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="name" placeholder="Coach name (e.g. Coach Ali)" required className={field} />
        <input name="email" type="email" placeholder="Login email" required className={field} />
        <input name="specialty" placeholder="Specialty (optional)" className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit />
        <Msg state={state} />
      </div>
      <p className="text-xs text-cream/40">
        Sends a claim-link invite so the coach sets their own password and gets
        their own dashboard.
      </p>
    </form>
  );
}
