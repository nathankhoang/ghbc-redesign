"use client";

import { useEffect, useState, useTransition } from "react";
import { dismissAnnouncement } from "@/app/actions/announcements";

export type Announcement = {
  id: string;
  authorName: string;
  message: string;
  createdAt: string | Date;
};

function formatWhen(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

// One-at-a-time popups for announcements a member hasn't dismissed yet. Feels
// like a personal note from a coach; "Got it" records the read and advances.
export function AnnouncementPopup({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const [index, setIndex] = useState(0);
  const [isPending, startTransition] = useTransition();

  const current = announcements[index];

  // Lock background scroll while a note is showing.
  useEffect(() => {
    if (!current) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [current]);

  if (!current) return null;

  function acknowledge() {
    const id = current!.id;
    startTransition(async () => {
      await dismissAnnouncement(id);
      setIndex((i) => i + 1);
    });
  }

  const when = formatWhen(current.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-gradient-to-br from-oxblood/70 to-ink p-7 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-2xl">
            📣
          </div>
          <div className="min-w-0">
            <p className="font-condensed text-[11px] tracking-[0.25em] text-gold uppercase">
              From {current.authorName}
            </p>
            {when && <p className="text-xs text-cream/45">{when}</p>}
          </div>
        </div>

        <p className="mt-5 whitespace-pre-line text-cream/85">{current.message}</p>

        <div className="mt-7 grid gap-2">
          <button
            type="button"
            onClick={acknowledge}
            disabled={isPending}
            className="font-condensed rounded-full bg-gold py-3 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone disabled:opacity-60"
          >
            {isPending ? "…" : "Got it"}
          </button>
          {announcements.length > 1 && (
            <p className="font-condensed text-center text-[10px] tracking-widest text-cream/40 uppercase">
              {index + 1} of {announcements.length}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
