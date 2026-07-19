"use client";

import { useState } from "react";
import { GYM } from "@/lib/constants";

// No self-serve cancel/pause — clicking through opens a "talk to a human"
// panel instead. Keeps billing changes personal and prevents accidental churn.
export function MembershipContact() {
  const [open, setOpen] = useState(false);

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/25 p-6 sm:p-8">
      <h2 className="font-poster text-2xl text-bone">Manage membership</h2>
      <p className="mt-2 text-cream/60">
        Need to pause or cancel? We handle that personally, one on one — reach out and
        we&apos;ll sort you out.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-condensed mt-5 w-full rounded-full border border-oxblood-500 py-3 text-sm font-semibold tracking-widest text-bone uppercase transition-colors hover:border-gold hover:text-gold sm:w-auto sm:px-7"
      >
        Cancel or pause membership
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-gradient-to-br from-oxblood/70 to-ink p-7 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-poster text-2xl text-bone">Want to pause or cancel?</h3>
            <p className="mt-3 text-cream/75">Talk to us — we&apos;ll sort you out.</p>

            <div className="mt-7 grid gap-3">
              <a
                href={GYM.phoneHref}
                className="font-condensed rounded-2xl bg-gold px-5 py-4 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
              >
                Call {GYM.phone}
              </a>
              <a
                href={`mailto:${GYM.email}`}
                className="font-condensed rounded-2xl border border-oxblood-500 px-5 py-4 text-sm font-semibold tracking-widest break-all text-bone uppercase transition-colors hover:border-gold hover:text-gold"
              >
                Email {GYM.email}
              </a>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-condensed mt-6 text-xs tracking-widest text-cream/45 uppercase hover:text-cream"
            >
              Never mind
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
