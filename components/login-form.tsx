"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed w-full rounded-full bg-gold py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(authenticate, undefined);
  return (
    <form action={action} className="grid gap-3">
      <input type="email" name="email" placeholder="Email" autoComplete="email" required className={field} />
      <input type="password" name="password" placeholder="Password" autoComplete="current-password" required className={field} />
      {state?.error && <p className="text-sm text-blood">{state.error}</p>}
      <div className="mt-2">
        <SubmitButton />
      </div>
    </form>
  );
}
