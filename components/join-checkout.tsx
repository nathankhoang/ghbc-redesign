"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { track } from "@vercel/analytics";
import { register } from "@/app/actions/auth";
import { checkPromoCode } from "@/app/actions/promo";
import { PRICING } from "@/lib/site";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { formatUSPhone, isValidEmail, isValidUSPhone } from "@/lib/validation";

type Plan = "TRIAL" | "FULL" | "SIX_MONTH" | "TWELVE_MONTH";

// Input text is white on the dark ground (client feedback: no dark-on-dark).
const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-white placeholder:text-cream/35 focus:border-gold focus:outline-none";

/* ---------------- Square Web Payments SDK ----------------
   Tokenises card / Apple Pay / Google Pay client-side — raw card data never
   touches our servers. When NEXT_PUBLIC_SQUARE_APP_ID isn't configured the
   checkout falls back to demo mode (server payments are stubbed too). */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SqPayments = any;

const SQ_APP_ID = process.env.NEXT_PUBLIC_SQUARE_APP_ID ?? "";
const SQ_LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ?? "";
const SQ_ENABLED = Boolean(SQ_APP_ID && SQ_LOCATION_ID);
const SQ_SRC = SQ_APP_ID.startsWith("sandbox-")
  ? "https://sandbox.web.squarecdn.com/v1/square.js"
  : "https://web.squarecdn.com/v1/square.js";

function loadSquareSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Square) return resolve();
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SQ_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Square SDK failed to load")));
      return;
    }
    const s = document.createElement("script");
    s.src = SQ_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Square SDK failed to load"));
    document.head.appendChild(s);
  });
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
  const [state, formAction] = useActionState(register, undefined);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [payErr, setPayErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Promo code
  const [promo, setPromo] = useState("");
  const [promoState, setPromoState] = useState<
    { status: "idle" } | { status: "ok"; percentOff: number } | { status: "bad"; error: string }
  >({ status: "idle" });
  const freePromo = promoState.status === "ok" && promoState.percentOff >= 100;

  // Square SDK state
  const paymentsRef = useRef<SqPayments>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cardRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applePayRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const googlePayRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [walletSupport, setWalletSupport] = useState({ apple: false, google: false });

  const price = PRICING[plan];
  const isTrial = plan === "TRIAL";
  const amount = price.introCents / 100;
  const chargeToday = freePromo ? 0 : amount;

  // Initialise Square payments + card element once.
  useEffect(() => {
    if (!SQ_ENABLED) return;
    let cancelled = false;
    (async () => {
      try {
        await loadSquareSdk();
        if (cancelled) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payments = (window as any).Square.payments(SQ_APP_ID, SQ_LOCATION_ID);
        paymentsRef.current = payments;
        const card = await payments.card();
        await card.attach("#sq-card-container");
        cardRef.current = card;
        setSdkReady(true);
      } catch (e) {
        console.error("Square SDK init failed:", e);
        setPayErr("Payment form failed to load. Refresh and try again.");
      }
    })();
    return () => {
      cancelled = true;
      cardRef.current?.destroy?.();
    };
  }, []);

  // (Re)build wallet buttons whenever the amount changes.
  useEffect(() => {
    if (!sdkReady || freePromo) return;
    let cancelled = false;
    (async () => {
      const payments = paymentsRef.current;
      const req = payments.paymentRequest({
        countryCode: "US",
        currencyCode: "USD",
        total: { amount: chargeToday.toFixed(2), label: "Golden Hill Boxing Club" },
      });
      try {
        const applePay = await payments.applePay(req);
        if (!cancelled) {
          applePayRef.current = applePay;
          setWalletSupport((w) => ({ ...w, apple: true }));
        }
      } catch {
        setWalletSupport((w) => ({ ...w, apple: false }));
      }
      try {
        const googlePay = await payments.googlePay(req);
        if (!cancelled) {
          const el = document.getElementById("sq-google-pay");
          if (el) {
            el.innerHTML = "";
            await googlePay.attach("#sq-google-pay", { buttonType: "long" });
          }
          googlePayRef.current = googlePay;
          setWalletSupport((w) => ({ ...w, google: true }));
        }
      } catch {
        setWalletSupport((w) => ({ ...w, google: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sdkReady, chargeToday, freePromo]);

  function validateContactFields(): boolean {
    const form = formRef.current;
    if (!form) return false;
    if (!form.reportValidity()) return false;
    const emailVal = (form.elements.namedItem("email") as HTMLInputElement)?.value ?? "";
    if (!isValidEmail(emailVal)) {
      setEmailErr("Enter a valid email address.");
      return false;
    }
    if (!isValidUSPhone(phone)) {
      setPhoneErr("Enter a valid US phone number, like (XXX) XXX-XXXX.");
      return false;
    }
    return true;
  }

  /** Tokenise with the given method and submit the signup server action. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function payWith(method: any | null) {
    if (submitting) return;
    setPayErr(null);
    if (!validateContactFields()) return;
    const form = formRef.current!;
    setSubmitting(true);
    track("checkout_started", { plan });
    try {
      const fd = new FormData(form);
      fd.set("plan", plan);
      fd.set("promoCode", promo.trim());
      if (freePromo) {
        fd.set("paymentToken", "");
      } else if (SQ_ENABLED) {
        if (!method) throw new Error("Payment form not ready yet.");
        const result = await method.tokenize();
        if (result.status !== "OK" || !result.token) {
          throw new Error(
            result.errors?.[0]?.message ?? "Card details look incomplete. Double-check them.",
          );
        }
        fd.set("paymentToken", result.token);
      } else {
        fd.set("paymentToken", "sandbox-demo-token"); // demo mode (payments stubbed)
      }
      startTransition(() => formAction(fd));
    } catch (e) {
      setPayErr(e instanceof Error ? e.message : "Payment failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function applyPromo() {
    const res = await checkPromoCode(promo);
    setPromoState(
      res.valid
        ? { status: "ok", percentOff: res.percentOff }
        : { status: "bad", error: res.error },
    );
  }

  return (
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-6">
      <input type="hidden" name="plan" value={plan} />

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
              Try one class for ${PRICING.TRIAL.introCents / 100}
            </button>
            .
          </p>
        </>
      )}

      {/* Details — all four fields required; email + US phone validated inline. */}
      <div className="grid gap-3">
        <input name="firstName" placeholder="First name" autoComplete="given-name" required className={field} />
        <div>
          <input
            type="tel"
            name="phone"
            placeholder="Phone number"
            autoComplete="tel"
            required
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(formatUSPhone(e.target.value));
              if (phoneErr) setPhoneErr(null);
            }}
            onBlur={() =>
              setPhoneErr(
                phone && !isValidUSPhone(phone)
                  ? "Enter a valid US phone number, like (XXX) XXX-XXXX."
                  : null,
              )
            }
            className={field}
          />
          {phoneErr && <p className="mt-1.5 text-sm text-blood">{phoneErr}</p>}
        </div>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            autoComplete="email"
            required
            onBlur={(e) => {
              const v = e.target.value.trim();
              setEmailErr(v && !isValidEmail(v) ? "Enter a valid email address." : null);
            }}
            onChange={() => emailErr && setEmailErr(null)}
            className={field}
          />
          {emailErr && <p className="mt-1.5 text-sm text-blood">{emailErr}</p>}
        </div>
        <input type="password" name="password" placeholder="Create a password" autoComplete="new-password" minLength={8} required className={field} />
      </div>

      <AvatarPicker />

      {/* Promo code */}
      <div>
        <div className="flex gap-2">
          <input
            name="promoCode"
            placeholder="Promo code (optional)"
            value={promo}
            onChange={(e) => {
              setPromo(e.target.value.toUpperCase());
              setPromoState({ status: "idle" });
            }}
            className={field}
          />
          <button
            type="button"
            onClick={applyPromo}
            disabled={!promo.trim()}
            className="font-condensed shrink-0 rounded-xl border border-gold/50 px-4 text-xs tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink disabled:opacity-40"
          >
            Apply
          </button>
        </div>
        {promoState.status === "ok" && (
          <p className="mt-1.5 text-sm text-gold">
            {promoState.percentOff >= 100
              ? "Code applied. Your membership is free. 🥊"
              : `Code applied. ${promoState.percentOff}% off.`}
          </p>
        )}
        {promoState.status === "bad" && (
          <p className="mt-1.5 text-sm text-blood">{promoState.error}</p>
        )}
      </div>

      {/* Liability waiver — required for BOTH membership and trial signups. */}
      <label className="flex items-start gap-3 text-sm text-cream/75">
        <input
          type="checkbox"
          name="waiver"
          required
          className="mt-1 size-4 shrink-0 accent-[#d6ab63]"
        />
        <span>
          I have read and agree to the{" "}
          <Link href="/waiver" target="_blank" className="text-gold underline underline-offset-4">
            liability waiver &amp; terms
          </Link>
          .
        </span>
      </label>

      {/* Bot protection — must sit above the pay buttons so its injected token
          guards every checkout path (renders nothing until Turnstile is keyed). */}
      <TurnstileWidget />

      {freePromo ? (
        <button
          type="button"
          onClick={() => payWith(null)}
          disabled={submitting}
          className="font-condensed w-full rounded-xl bg-gold py-4 text-lg font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Join free · Start training"}
        </button>
      ) : (
        <>
          {/* Express checkout — Apple Pay & Google Pay only (no Cash App). */}
          <div className="grid gap-2.5">
            {(!SQ_ENABLED || walletSupport.apple) && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => payWith(applePayRef.current)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-white py-3.5 font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <span className="text-lg"></span>
                <span>{submitting ? "Processing…" : "Apple Pay"}</span>
              </button>
            )}
            {SQ_ENABLED && (
              <div
                id="sq-google-pay"
                onClick={() => !submitting && payWith(googlePayRef.current)}
                className={walletSupport.google ? "" : "hidden"}
              />
            )}
            {!SQ_ENABLED && (
              <button
                type="button"
                disabled={submitting}
                onClick={() => payWith(googlePayRef.current)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-cream/20 bg-[#111] py-3.5 font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                <span className="font-bold text-lg">G</span>
                <span>{submitting ? "Processing…" : "Google Pay"}</span>
              </button>
            )}
          </div>

          {/* Card entry — always visible inline (never hidden behind a dropdown). */}
          <div className="grid gap-3">
            <p className="font-condensed text-center text-xs tracking-widest text-cream/50 uppercase">
              Or pay with card
            </p>
            {SQ_ENABLED ? (
              <div id="sq-card-container" className="rounded-xl bg-white/95 p-2" />
            ) : (
              <div className="rounded-xl border border-cream/15 bg-white/95 p-3">
                <input className="w-full bg-transparent text-sm text-stone-800 outline-none placeholder:text-stone-400" placeholder="Card number" inputMode="numeric" />
                <div className="mt-2 flex gap-4 border-t border-stone-200 pt-2 text-sm text-stone-800">
                  <input className="w-20 bg-transparent outline-none placeholder:text-stone-400" placeholder="MM/YY" />
                  <input className="w-16 bg-transparent outline-none placeholder:text-stone-400" placeholder="CVV" />
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={submitting || (SQ_ENABLED && !sdkReady)}
              onClick={() => payWith(cardRef.current)}
              className="font-condensed w-full rounded-xl bg-gold py-4 text-lg font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
            >
              {submitting ? "Processing…" : `Pay $${chargeToday} · Start training`}
            </button>
          </div>
        </>
      )}

      {/* Discount eligibility — informational, never blocks checkout. */}
      <p className="rounded-xl border border-oxblood-600/50 bg-ink/40 px-4 py-3 text-center text-xs leading-relaxed text-cream/55">
        Are you a first responder, active military, teacher, or in the same household as a
        member? After signing up, let one of your coaches know to get a discounted monthly
        price.
      </p>

      {(payErr || state?.error) && (
        <p className="rounded-lg bg-blood/15 px-4 py-3 text-sm text-blood">
          {payErr ?? state?.error}
        </p>
      )}

      <p className="text-center text-xs leading-relaxed text-cream/40">
        {freePromo
          ? "No charge today. Your promo code covers your membership."
          : isTrial
            ? `$${amount} today, a one-time drop-in. No membership starts, cancel nothing. Secured by Square.`
            : plan === "FULL"
              ? `$${amount} today, then $${PRICING.FULL.recurringCents / 100}/mo. Cancel anytime · no contract · secured by Square.`
              : `$${amount} today, one payment, no auto-renewal. Secured by Square.`}
      </p>
    </form>
  );
}
