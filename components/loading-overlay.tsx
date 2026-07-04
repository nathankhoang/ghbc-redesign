"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import styles from "./loading-overlay.module.css";

const BELL_SRC = "/audio/bell.mp3";
const MILESTONES = [25, 50, 75];

// Art-deco fight-clock tick marks (pure geometry — safe at module scope).
// Coordinates are rounded to a fixed precision so the server-rendered string and the
// client-computed number serialize identically (avoids a hydration mismatch).
const r3 = (n: number) => Math.round(n * 1000) / 1000;
const TICKS = Array.from({ length: 60 }, (_, i) => {
  const a = (i * 6 * Math.PI) / 180;
  const major = i % 5 === 0;
  const rOuter = 97;
  const rInner = rOuter - (major ? 9 : 5);
  return {
    i,
    major,
    x1: r3(100 + rOuter * Math.cos(a)),
    y1: r3(100 + rOuter * Math.sin(a)),
    x2: r3(100 + rInner * Math.cos(a)),
    y2: r3(100 + rInner * Math.sin(a)),
  };
});

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });

const waitUntil = (cond: () => boolean, timeout: number) =>
  new Promise<void>((resolve) => {
    const start = performance.now();
    const tick = () => {
      if (cond() || performance.now() - start > timeout) resolve();
      else requestAnimationFrame(tick);
    };
    tick();
  });

export function LoadingOverlay() {
  const [visible, setVisible] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const counterWrapRef = useRef<HTMLDivElement>(null);
  const crestRef = useRef<HTMLImageElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLButtonElement>(null);
  const ripplesRef = useRef<(HTMLDivElement | null)[]>([]);

  const bellRef = useRef<HTMLAudioElement | null>(null);
  const firedRef = useRef<Set<number>>(new Set());
  // Bridges the reveal logic (defined inside the GSAP effect) out to the tap-fallback button.
  const promptHandlerRef = useRef<() => void>(() => {});

  const ringBell = async () => {
    const bell = bellRef.current;
    if (!bell) return false;
    try {
      bell.currentTime = 0;
      bell.muted = false;
      bell.volume = 0.9;
      await bell.play();
      return true;
    } catch {
      return false;
    }
  };

  useGSAP(
    () => {
      if (typeof window === "undefined") return;

      // First-load-only: skip on repeat loads within the session.
      if (sessionStorage.getItem("ghbc:intro")) {
        setVisible(false);
        return;
      }
      sessionStorage.setItem("ghbc:intro", "1");

      // Lock the page under the overlay (freezing window scroll neutralizes Lenis root).
      const html = document.documentElement;
      const prevOverflow = html.style.overflow;
      html.style.overflow = "hidden";
      let unlocked = false;
      const unlockScroll = () => {
        if (unlocked) return;
        unlocked = true;
        html.style.overflow = prevOverflow;
        window.scrollTo(0, 0);
      };
      const startHeroVideo = () => {
        document.querySelector<HTMLVideoElement>("video")?.play().catch(() => {});
      };

      // Preload + prime the bell on the first qualifying user gesture.
      const bell = new Audio(BELL_SRC);
      bell.preload = "auto";
      bell.load();
      bellRef.current = bell;
      const gestures = ["pointerdown", "keydown", "touchstart"] as const;
      const removePrime = () =>
        gestures.forEach((t) => window.removeEventListener(t, prime, true));
      function prime() {
        bell.muted = true;
        bell
          .play()
          .then(() => {
            bell.pause();
            bell.currentTime = 0;
            bell.muted = false;
          })
          .catch(() => {});
        removePrime();
      }
      gestures.forEach((t) =>
        window.addEventListener(t, prime, { capture: true, once: true }),
      );

      // Track real readiness (fonts + hero assets), capped so it never stalls.
      let ready = false;
      Promise.all([
        document.fonts?.ready ?? Promise.resolve(),
        preloadImage("/ghbc-logo-transparent.png"),
        preloadImage("/videos/padwork-poster.jpg"),
      ])
        .then(() => {
          ready = true;
        })
        .catch(() => {
          ready = true;
        });

      // ---- progress writer ----
      const write = (v: number) => {
        const n = Math.max(0, Math.min(100, Math.round(v)));
        if (counterRef.current)
          counterRef.current.textContent = String(n).padStart(2, "0");
        if (arcRef.current)
          arcRef.current.style.strokeDashoffset = String(100 - v);
        if (crestRef.current) {
          crestRef.current.style.opacity = String(0.28 + (v / 100) * 0.62);
          crestRef.current.style.filter = `brightness(${0.7 + (v / 100) * 0.6}) sepia(${0.15 - (v / 100) * 0.15})`;
        }
        for (const m of MILESTONES) {
          if (v >= m && !firedRef.current.has(m)) {
            firedRef.current.add(m);
            fireImpact(MILESTONES.indexOf(m));
          }
        }
      };

      const fireImpact = (idx: number) => {
        const ripple = ripplesRef.current[idx];
        if (ripple)
          gsap.fromTo(
            ripple,
            { scale: 0.25, opacity: 0.55 },
            { scale: 1.5, opacity: 0, duration: 1.1, ease: "power2.out" },
          );
        if (counterWrapRef.current)
          gsap.fromTo(
            counterWrapRef.current,
            { x: -4 },
            { x: 0, duration: 0.55, ease: "elastic.out(1, 0.35)" },
          );
      };

      const reduce = prefersReducedMotion();

      // ---- reveal (climax) ----
      const runReveal = () => {
        setShowPrompt(false);
        gsap
          .timeline({
            onComplete: () => {
              unlockScroll();
              startHeroVideo();
              setVisible(false);
            },
          })
          .to(flashRef.current, { opacity: 1, duration: 0.14, ease: "power2.in" })
          .to(
            stageRef.current,
            { y: -40, opacity: 0, duration: 0.6, ease: "power3.in" },
            "<0.02",
          )
          .to(
            rootRef.current,
            { opacity: 0, scale: 1.06, duration: 0.7, ease: "power3.inOut" },
            "<0.05",
          )
          .to(flashRef.current, { opacity: 0, duration: 0.5, ease: "power2.out" }, "<0.1");
      };

      const finish = async () => {
        const rang = await ringBell();
        if (!rang) {
          // Cold autoplay was blocked — invite the guaranteed gesture.
          setShowPrompt(true);
          requestAnimationFrame(() => {
            if (promptRef.current)
              gsap.to(promptRef.current, { opacity: 1, duration: 0.4 });
          });
          return;
        }
        runReveal();
      };

      // Expose the prompt handler to the button via a ref-stable closure.
      promptHandlerRef.current = () => {
        ringBell();
        runReveal();
      };

      if (reduce) {
        // No motion: settle the dial, wait for readiness, then a quiet reveal.
        write(100);
        waitUntil(() => ready, 3000).then(() =>
          gsap.to(rootRef.current, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
              unlockScroll();
              startHeroVideo();
              setVisible(false);
            },
          }),
        );
        return () => {
          removePrime();
          unlockScroll();
        };
      }

      // ---- progress timeline ----
      const proxy = { v: 0 };
      const t1 = gsap.to(proxy, {
        v: 90,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => write(proxy.v),
        onComplete: async () => {
          await waitUntil(() => ready, 4000);
          gsap.to(proxy, {
            v: 100,
            duration: 0.6,
            ease: "power3.out",
            onUpdate: () => write(proxy.v),
            onComplete: finish,
          });
        },
      });

      return () => {
        removePrime();
        unlockScroll();
        t1.kill();
      };
    },
    { scope: rootRef },
  );

  if (!visible) return null;

  return (
    <div
      ref={rootRef}
      className={styles.overlay}
      role="status"
      aria-label="Loading Golden Hill Boxing Club"
    >
      <div className={styles.spotlight} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => {
            ripplesRef.current[i] = el;
          }}
          className={styles.ripple}
          aria-hidden="true"
        />
      ))}
      <div className={styles.grain} aria-hidden="true" />

      <div ref={stageRef} className={styles.stage}>
        <span className={styles.eyebrow}>Golden Hill · San Diego</span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={crestRef}
          className={styles.crest}
          src="/ghbc-logo-transparent.png"
          alt=""
          aria-hidden="true"
        />

        <div className={styles.dial}>
          <svg className={styles.ring} viewBox="0 0 200 200" aria-hidden="true">
            <defs>
              <linearGradient id="ghbcArc" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#d6ab63" />
                <stop offset="100%" stopColor="#b8935a" />
              </linearGradient>
            </defs>
            <circle className={styles.ringTrack} cx="100" cy="100" r="90" pathLength={100} />
            {TICKS.map((t) => (
              <line
                key={t.i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                className={t.major ? styles.tickMajor : styles.tickMinor}
              />
            ))}
            <circle
              ref={arcRef}
              className={styles.ringArc}
              cx="100"
              cy="100"
              r="90"
              pathLength={100}
              strokeDasharray={100}
              strokeDashoffset={100}
            />
          </svg>

          <div ref={counterWrapRef} className={styles.counterWrap}>
            <div className={styles.counter}>
              <span ref={counterRef}>00</span>
              <span className={styles.percent}>%</span>
            </div>
            <span className={styles.round}>Round 1</span>
          </div>
        </div>

        <div className={styles.disciplines}>
          <span>Boxing</span>
          <span className={styles.star}>✦</span>
          <span>Muay Thai</span>
          <span className={styles.star}>✦</span>
          <span>Yoga</span>
        </div>
      </div>

      <div ref={flashRef} className={styles.flash} aria-hidden="true" />

      {showPrompt && (
        <button
          ref={promptRef}
          className={styles.prompt}
          type="button"
          onClick={() => promptHandlerRef.current()}
        >
          Ring the Bell — Enter
        </button>
      )}
    </div>
  );
}
