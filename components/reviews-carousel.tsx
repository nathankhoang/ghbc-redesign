"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Review = { quote: string; name: string; tag: string; stars: number };

function Stars({ n }: { n: number }) {
  return (
    <span className="text-2xl tracking-widest text-gold" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}
      <span className="text-cream/20">{"★".repeat(5 - n)}</span>
    </span>
  );
}

export function ReviewsCarousel({ reviews }: { reviews: Review[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = reviews.length;

  const go = useCallback((dir: number) => setI((v) => (v + dir + n) % n), [n]);

  useEffect(() => {
    if (paused || n <= 1) return;
    const t = setInterval(() => setI((v) => (v + 1) % n), 3000);
    return () => clearInterval(t);
  }, [paused, n]);

  const r = reviews[i];

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/50 to-ink p-8 sm:min-h-[300px] sm:p-14">
        <AnimatePresence mode="wait">
          <motion.figure
            key={i}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center text-center"
          >
            <Stars n={r.stars} />
            <span className="font-condensed mt-1 text-xs tracking-widest text-cream/50 uppercase">
              {r.stars}.0 · Verified Google review
            </span>
            <blockquote className="mt-6 text-xl leading-relaxed text-cream/90 sm:text-2xl">
              &ldquo;{r.quote}&rdquo;
            </blockquote>
            <figcaption className="mt-7">
              <div className="font-poster text-2xl text-bone">{r.name}</div>
              <div className="font-condensed text-xs tracking-widest text-gold uppercase">
                {r.tag}
              </div>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Previous review"
        className="absolute top-1/2 -left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-oxblood-600/60 bg-ink/80 text-lg text-cream/70 backdrop-blur transition-colors hover:text-gold sm:-left-5"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Next review"
        className="absolute top-1/2 -right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-oxblood-600/60 bg-ink/80 text-lg text-cream/70 backdrop-blur transition-colors hover:text-gold sm:-right-5"
      >
        ›
      </button>

      {/* Dots */}
      <div className="mt-6 flex justify-center gap-2">
        {reviews.map((_, d) => (
          <button
            key={d}
            type="button"
            onClick={() => setI(d)}
            aria-label={`Go to review ${d + 1}`}
            className={`h-2 rounded-full transition-all ${
              d === i ? "w-7 bg-gold" : "w-2 bg-cream/25 hover:bg-cream/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
