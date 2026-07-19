"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  createPromoCode,
  setPromoCodeActive,
  type AdminResult,
} from "@/app/actions/members-admin";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export type ManagerPromoCode = {
  id: string;
  code: string;
  percentOff: number;
  duration: string; // FOREVER | FIRST_MONTH
  active: boolean;
  redemptions: number;
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="font-condensed rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
    >
      {pending ? "Saving…" : "Create code"}
    </button>
  );
}

function Msg({ state }: { state: AdminResult | undefined }) {
  if (!state) return null;
  if (!state.ok) return <span className="text-sm text-blood">{state.error}</span>;
  if (state.info) return <span className="text-sm text-gold">{state.info}</span>;
  return null;
}

function PromoRow({ promo }: { promo: ManagerPromoCode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      await setPromoCodeActive(promo.id, !promo.active);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-oxblood-600/40 bg-ink/30 px-4 py-3">
      <div>
        <p className="flex flex-wrap items-center gap-2 font-semibold text-bone">
          {promo.code}
          {!promo.active && (
            <span className="font-condensed rounded-full bg-blood/20 px-2.5 py-0.5 text-xs tracking-widest text-blood uppercase">
              Inactive
            </span>
          )}
        </p>
        <p className="font-condensed text-sm tracking-wide text-cream/55">
          {promo.percentOff}% off · {promo.duration === "FOREVER" ? "Forever" : "First month only"}
          {" · "}
          {promo.redemptions} redemption{promo.redemptions === 1 ? "" : "s"}
        </p>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="font-condensed rounded-full border border-oxblood-600/60 px-4 py-1.5 text-xs font-semibold tracking-widest text-cream/70 uppercase transition-colors hover:border-gold hover:text-gold disabled:opacity-50"
      >
        {promo.active ? "Deactivate" : "Activate"}
      </button>
    </li>
  );
}

export function PromoCodesManager({ promoCodes }: { promoCodes: ManagerPromoCode[] }) {
  const [state, action] = useActionState(createPromoCode, undefined);

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <h2 className="font-poster mb-2 text-2xl text-bone">Promo codes</h2>
      <p className="mb-5 text-sm text-cream/60">
        Free or discounted membership codes members enter at checkout.
      </p>

      <form
        action={action}
        className="grid gap-3 rounded-2xl border border-oxblood-600/50 bg-ink/40 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              Code
            </span>
            <input
              name="code"
              placeholder="COACH2026"
              required
              className={`${field} uppercase`}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              % off
            </span>
            <input
              type="number"
              name="percentOff"
              min={1}
              max={100}
              defaultValue={100}
              required
              className={field}
            />
          </label>
          <label className="grid gap-1.5">
            <span className="font-condensed text-xs tracking-widest text-cream/50 uppercase">
              Duration
            </span>
            <select name="duration" defaultValue="FOREVER" className={field}>
              <option value="FOREVER">Forever</option>
              <option value="FIRST_MONTH">First month only</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Submit />
          <Msg state={state} />
        </div>
      </form>

      <div className="mt-6">
        <h3 className="font-condensed mb-3 text-sm tracking-widest text-gold uppercase">
          Existing codes ({promoCodes.length})
        </h3>
        {promoCodes.length === 0 ? (
          <p className="text-sm text-cream/40">No promo codes yet.</p>
        ) : (
          <ul className="grid gap-2">
            {promoCodes.map((p) => (
              <PromoRow key={p.id} promo={p} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
