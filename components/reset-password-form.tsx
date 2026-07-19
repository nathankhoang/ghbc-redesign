"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { resetPassword } from "@/app/actions/auth";

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
      {pending ? "Saving…" : "Reset password"}
    </button>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPassword, undefined);

  if (state?.ok) {
    return (
      <div className="grid gap-4 text-center">
        <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6">
          <p className="text-cream/85">{state.ok}</p>
        </div>
        <Link
          href="/login"
          className="font-condensed rounded-full bg-gold py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="token" value={token} />
      <input
        type="password"
        name="password"
        placeholder="New password (min 8)"
        autoComplete="new-password"
        minLength={8}
        required
        className={field}
      />
      {state?.error && <p className="text-sm text-blood">{state.error}</p>}
      <div className="mt-2">
        <Submit />
      </div>
    </form>
  );
}
