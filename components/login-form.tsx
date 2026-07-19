"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { isValidEmail } from "@/lib/validation";

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
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}

export function LoginForm() {
  const [state, action] = useActionState(authenticate, undefined);
  const [emailErr, setEmailErr] = useState<string | null>(null);

  return (
    <form action={action} className="grid gap-3">
      <div>
        <input
          type="email"
          name="email"
          placeholder="Email"
          autoComplete="email"
          required
          className={field}
          onBlur={(e) => {
            const v = e.target.value.trim();
            setEmailErr(v && !isValidEmail(v) ? "Enter a valid email address." : null);
          }}
        />
        {emailErr && <p className="mt-1.5 text-sm text-blood">{emailErr}</p>}
      </div>
      <input
        type="password"
        name="password"
        placeholder="Password"
        autoComplete="current-password"
        required
        className={field}
      />

      <TurnstileWidget />

      {state?.error && <p className="text-sm text-blood">{state.error}</p>}

      <div className="mt-2">
        <SubmitButton />
      </div>

      <Link
        href="/forgot-password"
        className="font-condensed text-center text-xs tracking-widest text-cream/45 uppercase hover:text-gold"
      >
        Forgot your password?
      </Link>
    </form>
  );
}
