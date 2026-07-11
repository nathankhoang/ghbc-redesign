"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createCoachAccount, type AdminState } from "@/app/actions/admin";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-7 py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

function Msg({ state }: { state: AdminState }) {
  if (!state) return null;
  if (state.error) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.ok) return <span className="text-sm text-gold">{state.ok}</span>;
  return null;
}

export function CreateCoachAccountForm() {
  const [state, action] = useActionState(createCoachAccount, undefined);
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <input name="name" placeholder="Coach name (e.g. Coach Ali)" required className={field} />
        <input name="email" type="email" placeholder="Login email (optional)" className={field} />
        <input name="password" type="password" placeholder="Password (min 8)" className={field} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Submit label="Add coach" />
        <Msg state={state} />
      </div>
      <p className="text-xs text-cream/40">
        Add an email + password to give the coach their own dashboard login.
        Leave blank for a display-only coach.
      </p>
    </form>
  );
}
