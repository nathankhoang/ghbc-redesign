"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { cancelBooking } from "@/app/actions/booking";

export type Item = {
  bookingId: string;
  classType: string;
  coachName: string | null;
  startISO: string;
  endISO: string;
  waitlisted?: boolean;
};

function when(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const day = s.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t(s)} – ${t(new Date(endISO))}`;
}

function Row({ item, cancellable }: { item: Item; cancellable: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-2xl border border-oxblood-600/50 bg-oxblood/25 px-5 py-4">
      <div>
        <p className="font-poster text-xl text-bone">
          {item.classType}
          {item.waitlisted && <span className="font-condensed ml-2 align-middle text-[10px] tracking-widest text-bronze uppercase">Waitlist</span>}
        </p>
        <p className="text-sm text-cream/60">
          {item.coachName ? `${item.coachName} · ` : ""}{when(item.startISO, item.endISO)}
        </p>
      </div>
      {cancellable && (
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => { await cancelBooking(item.bookingId); })}
          className="font-condensed rounded-full border border-cream/25 px-4 py-1.5 text-xs tracking-widest text-cream/70 uppercase transition-colors hover:border-blood hover:text-blood disabled:opacity-50"
        >
          {pending ? "…" : "Cancel"}
        </button>
      )}
    </div>
  );
}

export function MyClasses({ upcoming, past }: { upcoming: Item[]; past: Item[] }) {
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const list = tab === "upcoming" ? upcoming : past;

  return (
    <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-6 sm:p-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-poster text-3xl text-bone">My Classes</h2>
        <div className="flex gap-1 rounded-full bg-ink/50 p-1">
          {(["upcoming", "past"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`font-condensed rounded-full px-4 py-1.5 text-xs tracking-widest capitalize transition-colors ${
                tab === t ? "bg-gold text-ink" : "text-cream/60"
              }`}
            >
              {t} ({t === "upcoming" ? upcoming.length : past.length})
            </button>
          ))}
        </div>
      </div>

      {list.length ? (
        <div className="grid gap-3">
          {list.map((i) => <Row key={i.bookingId} item={i} cancellable={tab === "upcoming"} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <p className="text-cream/60">{tab === "upcoming" ? "No upcoming classes yet." : "No past classes yet."}</p>
          {tab === "upcoming" && (
            <Link href="/schedule" className="font-condensed rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase hover:bg-bone">
              Book a class
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
