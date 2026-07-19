"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { claimAccount } from "@/app/actions/claim";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-white placeholder:text-cream/35 focus:border-gold focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed w-full rounded-full bg-gold py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Claiming…" : "Claim my account"}
    </button>
  );
}

export function ClaimForm({ token }: { token: string }) {
  const [state, action] = useActionState(claimAccount, undefined);

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password"
        placeholder="Choose a password (8+ characters)"
        autoComplete="new-password"
        minLength={8}
        required
        className={field}
      />
      {state?.error && <p className="text-sm text-blood">{state.error}</p>}
      <div className="mt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
