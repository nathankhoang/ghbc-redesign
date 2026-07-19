"use client";

import { useRef, useState } from "react";
import { SplitWords, Reveal } from "@/components/motion";
import { TrackLink } from "@/components/track-link";
import { PRICING } from "@/lib/site";

/*
 * Hero headline — the "corner" concept (client's pick is variant 1, implemented).
 * Alternate typographic treatments, ready to swap in:
 *
 * 1. (LIVE) "We're not just in your corner." / "We ARE your corner."
 *    — stacked, with "ARE" set in gold for emphasis.
 * 2. "Not just in your corner." / "We ARE your corner."
 *    — tighter first line, same gold ARE.
 * 3. "We Are Your Corner"
 *    — single-line short form (used in the <title> tag).
 * 4. "In your corner?" / "We ARE your corner."
 *    — question/answer rhythm, gold ARE.
 */

const OFFER_BENEFITS = [
  "Unlimited group classes",
  "Professional coaching",
  "Open gym — bags, ropes & the ring",
  "Boxing · Muay Thai · Yoga",
  "Beginners always welcome",
  "No contract — cancel anytime",
];

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  return (
    <section className="relative flex min-h-[100svh] w-full items-end overflow-hidden pt-28 lg:pt-0">
      {/* Oxblood gradient base (always visible — also the video fallback) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#67302c_0%,#4f2222_38%,#1a0e0c_100%)]" />

      {/* Background training footage.
          TODO: drop in new video asset at /public/videos/hero.mp4 — until it
          exists the old padwork.mp4 source below it plays as the fallback. */}
      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ${
          ready ? "opacity-60" : "opacity-45"
        }`}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/videos/padwork-poster.jpg"
        onCanPlay={() => setReady(true)}
        onPlaying={() => setReady(true)}
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
        <source src="/videos/padwork.mp4" type="video/mp4" />
      </video>

      {/* Legibility + vignette overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_60%,transparent_40%,rgba(26,14,12,0.85)_100%)]" />

      {/* Content — headline left, $99 offer card right (stacked on mobile) */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-end gap-10 px-5 pb-14 sm:px-8 sm:pb-20 lg:grid-cols-[1.15fr_minmax(340px,420px)] lg:gap-14">
        <div>
          <Reveal delay={0.1} className="mb-5">
            <span className="font-condensed text-xs tracking-[0.45em] text-gold uppercase sm:text-sm">
              Golden Hill · San Diego · Est. 2025
            </span>
          </Reveal>

          <h1 className="font-poster poster-shadow text-bone">
            <span className="block text-[clamp(2.5rem,7.5vw,6.5rem)]">
              <SplitWords text="We're not just" />
            </span>
            <span className="block text-[clamp(2.5rem,7.5vw,6.5rem)]">
              <SplitWords text="in your corner." delay={0.12} />
            </span>
            <span className="mt-3 block text-[clamp(2.9rem,8.5vw,7.5rem)]">
              <SplitWords text="We" delay={0.28} />{" "}
              <SplitWords text="ARE" delay={0.36} wordClassName="text-gold" />{" "}
              <SplitWords text="your corner." delay={0.44} />
            </span>
          </h1>
        </div>

        {/* Intro-offer card — the primary funnel. No trial mention here. */}
        <Reveal delay={0.5} y={30}>
          <div className="rounded-3xl border border-gold/30 bg-ink/70 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            <p className="font-condensed text-xs tracking-[0.3em] text-bronze uppercase">
              Intro offer
            </p>
            <div className="mt-3 flex items-end gap-2">
              <span className="font-poster poster-shadow text-6xl leading-none text-bone sm:text-7xl">
                ${PRICING.FULL.introCents / 100}
              </span>
              <span className="font-condensed pb-1 text-sm tracking-wide text-cream/70">
                first month
              </span>
            </div>
            <p className="font-condensed mt-2 text-sm tracking-wide text-cream/70">
              then ${PRICING.FULL.recurringCents / 100}/mo · no contract
            </p>

            <ul className="mt-5 grid gap-2.5">
              {OFFER_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-cream/85">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[11px] text-gold">
                    ✓
                  </span>
                  {b}
                </li>
              ))}
            </ul>

            <TrackLink
              event="cta_join_99"
              data={{ location: "hero" }}
              href="/join"
              className="font-condensed mt-6 block rounded-full bg-gold py-4 text-center text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.02] hover:bg-bone"
            >
              Join — ${PRICING.FULL.introCents / 100} first month
            </TrackLink>
          </div>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 text-cream/50 lg:block">
        <span className="font-condensed text-[10px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  );
}
