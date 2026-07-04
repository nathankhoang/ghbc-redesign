"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function StickyCta() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-oxblood-600/60 bg-ink/90 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
            <p className="font-condensed hidden text-sm tracking-wide text-cream/85 sm:block">
              <span className="text-gold">$99</span> first month · no contract · cancel anytime
            </p>
            <p className="font-condensed text-xs tracking-wide text-cream/85 sm:hidden">
              <span className="text-gold">$99</span> first month
            </p>
            <div className="flex items-center gap-2">
              <Link
                href="/free-class"
                className="font-condensed rounded-full border border-cream/40 px-4 py-2 text-xs tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold sm:px-5 sm:text-sm"
              >
                Free class
              </Link>
              <Link
                href="/join"
                className="font-condensed rounded-full bg-gold px-5 py-2 text-xs font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone sm:px-6 sm:text-sm"
              >
                Join
              </Link>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss"
                className="ml-1 flex size-7 items-center justify-center rounded-full text-cream/40 transition-colors hover:text-cream"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
