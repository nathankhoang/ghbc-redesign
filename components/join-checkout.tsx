"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/app/actions/auth";
import { PRICING } from "@/lib/site";
import { TurnstileWidget } from "@/components/turnstile-widget";

type Plan = "TRIAL" | "FULL" | "SIX_MONTH" | "TWELVE_MONTH";

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

function CardPayButton({ amount }: { amount: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed w-full rounded-xl bg-gold py-4 text-lg font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Processing…" : `Pay $${amount} · Start training`}
    </button>
  );
}

function AvatarPicker() {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-oxblood-600/60 bg-ink/60 text-cream/40 transition-colors hover:border-gold"
        aria-label="Add a profile picture"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Profile preview" className="size-full object-cover" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        )}
      </button>
      <div className="text-sm">
        <p className="font-condensed tracking-wide text-cream/80 uppercase">
          Profile picture <span className="text-cream/40 normal-case">(optional)</span>
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-gold underline underline-offset-4"
        >
          {preview ? "Change photo" : "Add a photo"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        name="image"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          setPreview(file ? URL.createObjectURL(file) : null);
        }}
      />
    </div>
  );
}

/* Membership plan options shown in the picker (trial is NOT one of them —
   it lives only in the small "testing the waters" line below). */
const PLAN_OPTIONS: {
  key: Exclude<Plan, "TRIAL">;
  title: string;
  price: number;
  sub: string;
  badge?: string;
}[] = [
  {
    key: "FULL",
    title: "First month",
    price: PRICING.FULL.introCents / 100,
    sub: `then $${PRICING.FULL.recurringCents / 100}/mo · no contract`,
    badge: "Most popular",
  },
  {
    key: "SIX_MONTH",
    title: "6 months",
    price: PRICING.SIX_MONTH.introCents / 100,
    sub: "one payment · 6 months of training",
    badge: `Save $${PRICING.SIX_MONTH.saveCents / 100}`,
  },
  {
    key: "TWELVE_MONTH",
    title: "12 months",
    price: PRICING.TWELVE_MONTH.introCents / 100,
    sub: "one payment · a full year",
    badge: `Save $${PRICING.TWELVE_MONTH.saveCents / 100}`,
  },
];

export function JoinCheckout({ initialPlan }: { initialPlan: Plan }) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [state, action] = useActionState(register, undefined);

  const price = PRICING[plan];
  const isTrial = plan === "TRIAL";
  const amount = price.introCents / 100;

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="plan" value={plan} />
      {/* TODO(stage 6): replaced by a real Square Web Payments SDK token. */}
      <input type="hidden" name="paymentToken" value="sandbox-demo-token" />

      {isTrial ? (
        /* Trial checkout — the "last stand" path, reached from the trial section. */
        <div>
          <div className="font-poster poster-shadow text-[clamp(2.75rem,10vw,4.5rem)] leading-none text-bone">
            ${amount}
          </div>
          <p className="font-condensed mt-1 tracking-wide text-cream/60">
            one class · no membership · no auto-renewal
          </p>
          <button
            type="button"
            onClick={() => setPlan("FULL")}
            className="mt-3 text-sm text-gold underline underline-offset-4"
          >
            ← Back to membership options
          </button>
        </div>
      ) : (
        <>
          {/* Plan picker — $99 intro is primary; prepays show their savings. */}
          <div className="grid gap-2.5">
            {PLAN_OPTIONS.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setPlan(o.key)}
                aria-pressed={plan === o.key}
                className={`relative rounded-2xl border p-4 text-left transition-colors ${
                  plan === o.key
                    ? "border-gold bg-gold/10"
                    : "border-oxblood-600/60 bg-ink/40 hover:border-gold/50"
                }`}
              >
                {o.badge && (
                  <span
                    className={`font-condensed absolute -top-2.5 right-4 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-widest uppercase ${
                      o.key === "FULL" ? "bg-gold text-ink" : "bg-bronze text-ink"
                    }`}
                  >
                    {o.badge}
                  </span>
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-condensed text-sm tracking-widest text-cream/80 uppercase">
                    {o.title}
                  </span>
                  <span className="font-poster text-3xl text-bone">${o.price}</span>
                </div>
                <p className="font-condensed mt-1 text-xs tracking-wide text-cream/55">{o.sub}</p>
              </button>
            ))}
          </div>

          {/* The only trial mention at checkout — small, secondary. */}
          <p className="text-center text-xs text-cream/45">
            Just testing the waters?{" "}
            <button
              type="button"
              onClick={() => setPlan("TRIAL")}
              className="text-gold underline underline-offset-4"
            >
              Try one class — ${PRICING.TRIAL.introCents / 100}
            </button>
            .
          </p>
        </>
      )}

      {/* Details */}
      <div className="grid gap-3">
        <input name="firstName" placeholder="First name" autoComplete="given-name" required className={field} />
        <input type="tel" name="phone" placeholder="Phone number" autoComplete="tel" required className={field} />
        <input type="email" name="email" placeholder="Email" autoComplete="email" required className={field} />
        <input type="password" name="password" placeholder="Create a password" autoComplete="new-password" minLength={8} required className={field} />
      </div>

      <AvatarPicker />

      {/* Bot protection — must sit above the pay buttons so its injected token
          guards every checkout path (renders nothing until Turnstile is keyed). */}
      <TurnstileWidget />

      {/* Express checkout — Apple Pay & Google Pay only (no Cash App). */}
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
      </div>

      {/* Card entry — always visible inline (never hidden behind a dropdown). */}
      <div className="grid gap-3">
        <p className="font-condensed text-center text-xs tracking-widest text-cream/50 uppercase">
          Or pay with card
        </p>
        <div className="rounded-xl border border-cream/15 bg-white/95 p-3">
          <input className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400" placeholder="Card number" inputMode="numeric" />
          <div className="mt-2 flex gap-4 border-t border-stone-200 pt-2 text-sm text-stone-800">
            <input className="w-20 bg-transparent outline-none placeholder:text-stone-400" placeholder="MM/YY" />
            <input className="w-16 bg-transparent outline-none placeholder:text-stone-400" placeholder="CVV" />
          </div>
        </div>
        <CardPayButton amount={amount} />
      </div>

      {/* Discount eligibility — informational, never blocks checkout. */}
      <p className="rounded-xl border border-oxblood-600/50 bg-ink/40 px-4 py-3 text-center text-xs leading-relaxed text-cream/55">
        Are you a first responder, active military, teacher, or in the same household as a
        member? After signing up, let one of your coaches know to get a discounted monthly
        price.
      </p>

      {state?.error && (
        <p className="rounded-lg bg-blood/15 px-4 py-3 text-sm text-blood">{state.error}</p>
      )}

      <p className="text-center text-xs leading-relaxed text-cream/40">
        {isTrial
          ? `$${amount} today — a one-time drop-in. No membership starts, cancel nothing. Secured by Square (sandbox).`
          : plan === "FULL"
            ? `$${amount} today, then $${PRICING.FULL.recurringCents / 100}/mo. Cancel anytime · no contract · secured by Square (sandbox).`
            : `$${amount} today — one payment, no auto-renewal. Secured by Square (sandbox).`}
      </p>
    </form>
  );
}
