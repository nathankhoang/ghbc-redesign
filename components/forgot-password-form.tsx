"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordReset } from "@/app/actions/auth";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-white placeholder:text-cream/35 focus:border-gold focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed w-full rounded-full bg-gold py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Sending…" : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
        <p className="text-cream/85">{state.ok}</p>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3">
      <input type="email" name="email" placeholder="Email" autoComplete="email" required className={field} />
      {state?.error && <p className="text-sm text-blood">{state.error}</p>}
      <div className="mt-2">
        <Submit />
      </div>
    </form>
  );
}
