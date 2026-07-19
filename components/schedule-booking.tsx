"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bookClass, joinWaitlist } from "@/app/actions/booking";

export type Cls = {
  id: string;
  classType: string;
  coachName: string | null;
  startISO: string;
  endISO: string;
  openSlots: number;
  bookedByMe: boolean;
  waitlistedByMe: boolean;
  started: boolean;
};

export type Day = { label: string; full: string; isToday: boolean; classes: Cls[] };

function time(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
}

export function ScheduleBooking({
  days,
  authed = true,
  prevWeek,
  nextWeek,
  rangeLabel,
}: {
  days: Day[];
  authed?: boolean;
  prevWeek: string;
  nextWeek: string;
  rangeLabel: string;
}) {
  const router = useRouter();
  const [sel, setSel] = useState<Cls | null>(null);
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const isWait = sel?.openSlots === 0;

  function confirm() {
    if (!sel) return;
    setErr(null);
    start(async () => {
      const res = sel.openSlots === 0 ? await joinWaitlist(sel.id) : await bookClass(sel.id);
      if (res.ok) {
        setSel(null);
        router.refresh();
      } else setErr(res.error ?? "Something went wrong.");
    });
  }

  return (
    <>
      {!authed && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/30 bg-gold/5 px-5 py-4">
          <p className="text-cream/80">
            You&apos;re viewing the schedule as a guest — log in or join to book a class.
          </p>
          <div className="flex shrink-0 gap-3">
            <Link href="/login" className="font-condensed rounded-full border border-cream/30 px-5 py-2 text-xs font-semibold tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold">
              Log in
            </Link>
            <Link href="/join" className="font-condensed rounded-full bg-gold px-5 py-2 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone">
              Join
            </Link>
          </div>
        </div>
      )}

      {/* Week nav */}
      <div className="mb-8 flex items-center justify-between rounded-2xl border border-oxblood-600/50 bg-oxblood/30 px-4 py-3">
        <Link href={`/schedule?week=${prevWeek}`} className="flex size-10 items-center justify-center rounded-full text-cream/70 transition-colors hover:bg-oxblood hover:text-gold" aria-label="Previous week">‹</Link>
        <span className="font-condensed tracking-widest text-cream uppercase">{rangeLabel}</span>
        <Link href={`/schedule?week=${nextWeek}`} className="flex size-10 items-center justify-center rounded-full text-cream/70 transition-colors hover:bg-oxblood hover:text-gold" aria-label="Next week">›</Link>
      </div>

      <div className="space-y-10">
        {days.map((d, i) =>
          d.classes.length === 0 ? null : (
            <div key={i}>
              <h3 className={`font-poster mb-4 text-2xl ${d.isToday ? "text-gold" : "text-bone"}`}>
                {d.full}
                {d.isToday && <span className="font-condensed ml-3 align-middle text-xs tracking-widest text-gold uppercase">Today</span>}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {d.classes.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/50 to-ink p-5 transition-colors hover:border-gold/50"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-poster text-2xl text-bone">{c.classType}</h4>
                        {!c.started && (
                          <span className="font-condensed shrink-0 rounded-full border border-gold/30 px-2 py-0.5 text-[10px] tracking-widest text-gold uppercase">
                            {c.openSlots} left
                          </span>
                        )}
                      </div>
                      {c.coachName && <p className="mt-1 text-sm text-cream/60">with {c.coachName}</p>}
                      <p className="font-condensed mt-2 tracking-wide text-cream/80">
                        {time(c.startISO)} – {time(c.endISO)}
                      </p>
                    </div>
                    <div className="mt-4">
                      {c.bookedByMe ? (
                        <span className="font-condensed block rounded-full bg-gold/20 py-2 text-center text-sm tracking-widest text-gold uppercase">Booked ✓</span>
                      ) : c.waitlistedByMe ? (
                        <span className="font-condensed block rounded-full bg-bronze/20 py-2 text-center text-sm tracking-widest text-bronze uppercase">On waitlist</span>
                      ) : c.started ? (
                        <span className="font-condensed block rounded-full bg-ink/60 py-2 text-center text-sm tracking-widest text-cream/30 uppercase">Ended</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setErr(null); setSel(c); }}
                          className={`font-condensed block w-full rounded-full py-2 text-center text-sm tracking-widest uppercase transition-colors ${
                            c.openSlots === 0
                              ? "border border-bronze/50 text-bronze hover:bg-bronze/10"
                              : "bg-gold text-ink hover:bg-bone"
                          }`}
                        >
                          {c.openSlots === 0 ? "Join waitlist" : "Book class"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      {/* Class details / confirm modal. Logged-out visitors can open it to see
          class details, but the book action prompts them to sign in. */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm" onClick={() => !pending && setSel(null)}>
          <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/60 bg-oxblood/40 p-7" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-poster text-3xl text-bone">
              {!authed ? "Class details" : isWait ? "Join waitlist" : "Confirm booking"}
            </h3>
            <p className="mt-3 text-cream/85">
              {sel.classType}
              {sel.coachName && ` with ${sel.coachName}`}
            </p>
            <p className="text-cream/55">{time(sel.startISO)} – {time(sel.endISO)}</p>
            {isWait && <p className="mt-3 text-sm text-bronze">This class is full — we&apos;ll auto-book you if a spot opens.</p>}
            {!authed && (
              <p className="mt-3 text-sm text-cream/60">
                Sign in or join the club to book this class.
              </p>
            )}
            {err && <p className="mt-3 text-sm text-blood">{err}</p>}
            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setSel(null)} disabled={pending} className="font-condensed flex-1 rounded-full border border-cream/30 py-3 text-sm tracking-widest text-cream uppercase disabled:opacity-50">Close</button>
              {!authed ? (
                <Link
                  href="/login"
                  className="font-condensed flex-1 rounded-full bg-gold py-3 text-center text-sm font-semibold tracking-widest text-ink uppercase hover:bg-bone"
                >
                  Log in to book
                </Link>
              ) : (
                <button type="button" onClick={confirm} disabled={pending} className="font-condensed flex-1 rounded-full bg-gold py-3 text-sm font-semibold tracking-widest text-ink uppercase hover:bg-bone disabled:opacity-60">
                  {pending ? "…" : isWait ? "Join" : "Confirm"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
