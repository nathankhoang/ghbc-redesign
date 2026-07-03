"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";
import { PRICING } from "@/lib/site";

type Plan = "FULL" | "YOGA";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

function ExpressButton({
  label,
  sub,
  className,
  icon,
}: {
  label: string;
  sub: string;
  className: string;
  icon: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 font-semibold transition-transform hover:-translate-y-0.5 disabled:opacity-60 ${className}`}
    >
      {icon}
      <span>{pending ? "Processing…" : label}</span>
      <span className="opacity-60">· {sub}</span>
    </button>
  );
}

function CardPayButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed w-full rounded-xl bg-gold py-4 text-lg font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Processing…" : `Pay $${PRICING.FULL.introCents / 100} · Start training`}
    </button>
  );
}

export function JoinCheckout({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [showCard, setShowCard] = useState(false);
  const [state, action] = useActionState(register, undefined);
  const price = plan === "YOGA" ? PRICING.YOGA : PRICING.FULL;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="paymentToken" value="sandbox-demo-token" />

      {/* Plan toggle */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink/50 p-1">
        {(["FULL", "YOGA"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlan(p)}
            className={`font-condensed rounded-lg py-2.5 text-sm tracking-widest uppercase transition-colors ${
              plan === p ? "bg-gold text-ink" : "text-cream/60 hover:text-cream"
            }`}
          >
            {p === "FULL" ? "Full Membership" : "Yoga"}
          </button>
        ))}
      </div>

      {/* Minimal details — 3 fields */}
      <div className="grid gap-3">
        <input name="firstName" placeholder="First name" autoComplete="given-name" required className={field} />
        <input type="email" name="email" placeholder="Email" autoComplete="email" required className={field} />
        <input type="password" name="password" placeholder="Create a password" autoComplete="new-password" minLength={8} required className={field} />
      </div>

      {/* Express checkout — one tap */}
      <div className="grid gap-2.5">
        <ExpressButton
          label="Apple Pay"
          sub="1 tap"
          className="bg-white text-black"
          icon={<span className="text-lg"></span>}
        />
        <ExpressButton
          label="Google Pay"
          sub="1 tap"
          className="border border-cream/20 bg-[#111] text-white"
          icon={<span className="font-bold text-lg">G</span>}
        />
        <ExpressButton
          label="Cash App Pay"
          sub="1 tap"
          className="bg-[#00D632] text-black"
          icon={<span className="font-bold">$</span>}
        />
      </div>

      {/* Card fallback */}
      <div>
        <button
          type="button"
          onClick={() => setShowCard((v) => !v)}
          className="font-condensed w-full text-center text-xs tracking-widest text-cream/50 uppercase hover:text-gold"
        >
          {showCard ? "▲ Hide card" : "▾ Or pay with card"}
        </button>
        {showCard && (
          <div className="mt-3 grid gap-3">
            <div className="rounded-xl border border-cream/15 bg-white/95 p-3">
              <input className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400" placeholder="Card number" inputMode="numeric" />
              <div className="mt-2 flex gap-4 border-t border-stone-200 pt-2 text-sm text-stone-800">
                <input className="w-20 bg-transparent outline-none placeholder:text-stone-400" placeholder="MM/YY" />
                <input className="w-16 bg-transparent outline-none placeholder:text-stone-400" placeholder="CVV" />
              </div>
            </div>
            <CardPayButton />
          </div>
        )}
      </div>

      {state?.error && (
        <p className="rounded-lg bg-blood/15 px-4 py-3 text-sm text-blood">{state.error}</p>
      )}

      <p className="text-center text-xs leading-relaxed text-cream/40">
        ${price.introCents / 100} today, then ${price.recurringCents / 100}/mo.
        Cancel anytime · no contract · secured by Square (sandbox).
      </p>
    </form>
  );
}
