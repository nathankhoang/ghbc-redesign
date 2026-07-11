"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import styles from "./loading-overlay.module.css";

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

  const overlayRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const folioRef = useRef<HTMLSpanElement>(null);
  const kickerRef = useRef<HTMLDivElement>(null);
  const ledgerRef = useRef<HTMLDivElement>(null);
  const stampRef = useRef<HTMLImageElement>(null);

  useGSAP(
    () => {
      if (typeof window === "undefined") return;

      // First-load-only: skip on repeat loads within the session.
      if (sessionStorage.getItem("ghbc:intro")) {
        setVisible(false);
        return;
      }
      sessionStorage.setItem("ghbc:intro", "1");

      // Lock the page under the sheet (freezing window scroll neutralizes Lenis root).
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

      // Progress writer: ink the headline in (0→100%) and update the folio number.
      const write = (v: number) => {
        const n = Math.max(0, Math.min(100, Math.round(v)));
        if (folioRef.current) folioRef.current.textContent = String(n);
        headlineRef.current?.style.setProperty("--fill", `${v}%`);
      };

      const reduce = prefersReducedMotion();

      const runReveal = () => {
        gsap
          .timeline({
            delay: 0.16,
            onComplete: () => {
              unlockScroll();
              startHeroVideo();
              setVisible(false);
            },
          })
          // The printed sheet is pulled up and off, revealing the site beneath.
          .to(sheetRef.current, {
            yPercent: -12,
            opacity: 0.85,
            duration: 0.9,
            ease: "power4.inOut",
          })
          .to(
            overlayRef.current,
            { yPercent: -102, skewY: -1.4, duration: 0.9, ease: "power4.inOut" },
            "<",
          );
      };

      if (reduce) {
        write(100);
        waitUntil(() => ready, 3000).then(() =>
          gsap.to(overlayRef.current, {
            opacity: 0,
            duration: 0.25,
            onComplete: () => {
              unlockScroll();
              startHeroVideo();
              setVisible(false);
            },
          }),
        );
        return () => unlockScroll();
      }

      // Entrance: the sheet elements set, headline rises into place.
      gsap.from(headlineRef.current, {
        yPercent: 8,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
      gsap.from(
        [kickerRef.current, ledgerRef.current, stampRef.current, folioRef.current],
        { opacity: 0, duration: 0.9, ease: "power2.out", stagger: 0.09 },
      );

      // Progress: ink in to 90%, hold for real readiness, then finish to 100%.
      const proxy = { v: 0 };
      const t1 = gsap.to(proxy, {
        v: 90,
        duration: 3.7,
        ease: "power2.out",
        onUpdate: () => write(proxy.v),
        onComplete: async () => {
          await waitUntil(() => ready, 4000);
          gsap.to(proxy, {
            v: 100,
            duration: 0.6,
            ease: "power3.out",
            onUpdate: () => write(proxy.v),
            onComplete: runReveal,
          });
        },
      });

      return () => {
        unlockScroll();
        t1.kill();
      };
    },
    { scope: overlayRef },
  );

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="status"
      aria-label="Loading Golden Hill Boxing Club"
    >
      <div className={styles.halftone} aria-hidden="true" />
      <div className={styles.grain} aria-hidden="true" />
      <div className={styles.vignette} aria-hidden="true" />

      <div ref={sheetRef} className={styles.sheet}>
        <div ref={kickerRef} className={styles.kicker}>
          <div className={styles.kickerLine}>Golden Hill Athletic Club · San Diego</div>
          <div className={styles.kickerRule} />
          <div className={styles.kickerSub}>The sweet science — Est. MMXXV</div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={stampRef}
          className={styles.stamp}
          src="/ghbc-logo-transparent.png"
          alt=""
          aria-hidden="true"
        />

        <div ref={headlineRef} className={styles.headline}>
          <span className={styles.line}>
            <span className={styles.lineOutline}>Golden Hill</span>
            <span className={styles.lineFill} aria-hidden="true">
              Golden Hill
            </span>
          </span>
          <span className={styles.line}>
            <span className={styles.lineOutline}>Boxing Club</span>
            <span className={styles.lineFill} aria-hidden="true">
              Boxing Club
            </span>
          </span>
        </div>

        <div className={styles.folio} aria-hidden="true">
          <span ref={folioRef}>0</span>
        </div>

        <div ref={ledgerRef} className={styles.ledger}>
          <span>Boxing</span>
          <span className={styles.dagger}>✦</span>
          <span>Muay Thai</span>
          <span className={styles.dagger}>✦</span>
          <span>Yoga</span>
          <span className={styles.dagger}>✦</span>
          <span>$20 First Class</span>
        </div>
      </div>
    </div>
  );
}
