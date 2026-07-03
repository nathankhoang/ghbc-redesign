"use client";

import { useState } from "react";
import { COACHES } from "@/lib/site";

const field =
  "w-full rounded-xl border border-oxblood-600/60 bg-ink/60 px-4 py-3.5 text-cream placeholder:text-cream/35 focus:border-gold focus:outline-none";

export function PTForm() {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
        <div className="font-poster mb-2 text-4xl text-gold">Request sent 🥊</div>
        <p className="text-cream/80">A coach will reach out to schedule your first 1-on-1 session and map out your program.</p>
      </div>
    );
  return (
    <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="grid gap-3">
      <input name="name" placeholder="First name" required className={field} />
      <input type="email" name="email" placeholder="Email" required className={field} />
      <select name="coach" defaultValue="" className={field}>
        <option value="">Preferred coach (optional)</option>
        {COACHES.map((c) => (
          <option key={c.name} value={c.name} className="bg-ink">{c.name} — {c.specialty}</option>
        ))}
      </select>
      <textarea name="goals" placeholder="Your goals (fitness, fight prep, weight, confidence…)" rows={3} className={field} />
      <button type="submit" className="font-condensed mt-2 w-full rounded-full bg-gold py-4 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone">
        Request a Session
      </button>
    </form>
  );
}
