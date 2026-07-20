"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Friendly, encouraging nudge shown once per login session on the member
// dashboard — a warm reminder to book a class (never pushy). Dismissal is
// remembered for the browser session, so it reappears on the next login.
const SEEN_KEY = "ghbc-class-reminder-seen";

export type NextClass = { classType: string; whenLabel: string } | null;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function ClassReminderPopup({
  firstName,
  nextClass,
}: {
  firstName: string;
  nextClass: NextClass;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem(SEEN_KEY)) setOpen(true);
  }, []);

  function dismiss() {
    sessionStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  }

  if (!open) return null;

  const hasClass = Boolean(nextClass);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-gradient-to-br from-oxblood/70 to-ink p-7 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="font-poster mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-3xl text-ink">
          🥊
        </div>
        <h2 className="font-poster text-3xl text-bone">
          {greeting()}, {firstName}
        </h2>

        {hasClass ? (
          <p className="mt-3 text-cream/75">
            You&apos;re all set for{" "}
            <span className="font-semibold text-gold">{nextClass!.classType}</span> on{" "}
            {nextClass!.whenLabel}. We can&apos;t wait to see you there. Keep up the
            great work. 💪
          </p>
        ) : (
          <p className="mt-3 text-cream/75">
            Your next class is waiting for you. Booking your spot takes just a few
            seconds. Pick a time that works and come train with us. 💪
          </p>
        )}

        <div className="mt-7 grid gap-2">
          <Link
            href="/schedule"
            onClick={dismiss}
            className="font-condensed rounded-full bg-gold py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
          >
            {hasClass ? "Book another class" : "Book a class"}
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="font-condensed text-xs tracking-widest text-cream/45 uppercase hover:text-cream"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
