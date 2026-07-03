"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SplitWords, Reveal, Magnetic } from "@/components/motion";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  return (
    <section className="relative flex h-[100svh] min-h-[640px] w-full items-end overflow-hidden">
      {/* Oxblood gradient base (always visible — also the video fallback) */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_50%_0%,#67302c_0%,#4f2222_38%,#1a0e0c_100%)]" />

      {/* Real GHBC training footage (poster frame shows instantly; video plays over it) */}
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
        <source src="/videos/padwork.mp4" type="video/mp4" />
      </video>

      {/* Legibility + vignette overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/30" />
      <div className="absolute inset-0 bg-[radial-gradient(100%_80%_at_50%_60%,transparent_40%,rgba(26,14,12,0.85)_100%)]" />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 sm:pb-24">
        <Reveal delay={0.1} className="mb-5">
          <span className="font-condensed text-xs tracking-[0.45em] text-gold uppercase sm:text-sm">
            Golden Hill · San Diego · Est. Boxing Club
          </span>
        </Reveal>

        <h1 className="font-poster poster-shadow text-bone">
          <span className="fluid-hero block">
            <SplitWords text="Step Into" />
          </span>
          <span className="fluid-hero block">
            <SplitWords text="The Ring" delay={0.12} />
          </span>
        </h1>

        <Reveal delay={0.5} className="mt-7 max-w-xl text-lg text-cream/85 sm:text-xl">
          Boxing · Muay Thai · Yoga. Beginners welcome — and your{" "}
          <span className="text-gold">first class is free.</span>
        </Reveal>

        <Reveal delay={0.7} className="mt-9 flex flex-wrap items-center gap-4">
          <Magnetic strength={0.3}>
            <Link
              href="/free-class"
              className="font-condensed inline-block rounded-full bg-gold px-9 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
            >
              Book Your Free Class
            </Link>
          </Magnetic>
          <Link
            href="/join"
            className="font-condensed inline-block rounded-full border border-cream/40 px-9 py-4 text-base font-semibold tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold"
          >
            Join — $99 first month
          </Link>
        </Reveal>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream/50">
        <span className="font-condensed text-[10px] tracking-[0.3em] uppercase">Scroll</span>
      </div>
    </section>
  );
}
