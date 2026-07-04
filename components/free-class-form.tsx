"use client";

import { useState } from "react";
import { CLASSES } from "@/lib/site";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export function FreeClassForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
        <div className="font-poster mb-2 text-4xl text-gold">You&apos;re set! 🥊</div>
        <p className="text-cream/80">
          We&apos;ll text you to lock in your free class. Just show up — gloves and
          wraps are on us. See you in the gym.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
      className="grid gap-3"
    >
      <input name="name" placeholder="First name" required className={field} />
      <input type="email" name="email" placeholder="Email" required className={field} />
      <input type="tel" name="phone" placeholder="Phone (for class reminders)" className={field} />
      <select name="class" required defaultValue="" className={field}>
        <option value="" disabled>
          Which class? (all beginner-friendly)
        </option>
        {CLASSES.filter((c) => c.name !== "Open Gym").map((c) => (
          <option key={c.name} value={c.name} className="bg-ink">
            {c.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="font-condensed mt-2 w-full rounded-full bg-gold py-4 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
      >
        Claim My Free Class
      </button>
      <p className="mt-1 text-center text-xs text-cream/40">
        No card required. No commitment. Just come train.
      </p>
    </form>
  );
}
