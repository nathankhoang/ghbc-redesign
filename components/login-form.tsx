"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

type Intent = "MEMBER" | "COACH" | "OWNER";

const ROLE_TABS: { key: Intent; label: string; hint: string }[] = [
  { key: "MEMBER", label: "Member", hint: "Book classes and track your progress." },
  { key: "COACH", label: "Coach", hint: "See your classes and who's signed up." },
  { key: "OWNER", label: "Owner", hint: "Manage the gym, coaches and schedule." },
];

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
  const [intent, setIntent] = useState<Intent>("MEMBER");
  const active = ROLE_TABS.find((r) => r.key === intent)!;

  return (
    <div className="grid gap-5">
      {/* Role chooser — Member / Coach / Owner. All sign in through the same
          form; the app routes each account to the right dashboard afterwards. */}
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink/50 p-1">
        {ROLE_TABS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setIntent(r.key)}
            className={`font-condensed rounded-lg py-2 text-xs tracking-widest uppercase transition-colors ${
              intent === r.key ? "bg-gold text-ink" : "text-cream/55 hover:text-cream"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <p className="-mt-1 text-sm text-cream/55">{active.hint}</p>

      <form action={action} className="grid gap-3">
        {/* Informational only — access is decided by the account's real role. */}
        <input type="hidden" name="intent" value={intent} />
        <input type="email" name="email" placeholder="Email" autoComplete="email" required className={field} />
        <input type="password" name="password" placeholder="Password" autoComplete="current-password" required className={field} />

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
    </div>
  );
}
