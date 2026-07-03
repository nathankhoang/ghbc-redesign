"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";

/* ---------------- Reveal — fade + rise on scroll ---------------- */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 44,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set(ref.current, { opacity: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          delay,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            toggleActions: once
              ? "play none none none"
              : "play none none reverse",
          },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
}

/* ---------------- SplitWords — masked, staggered kinetic headline ---------------- */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.08,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const words = text.split(" ");
  useGSAP(
    () => {
      const targets = ref.current?.querySelectorAll(".sw-inner");
      if (!targets) return;
      if (prefersReducedMotion()) {
        gsap.set(targets, { yPercent: 0 });
        return;
      }
      gsap.fromTo(
        targets,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: 1.05,
          ease: "power4.out",
          stagger,
          delay,
          scrollTrigger: { trigger: ref.current, start: "top 90%" },
        },
      );
    },
    { scope: ref },
  );
  return (
    <span ref={ref} className={className}>
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.08em" }}
        >
          <span className={`sw-inner inline-block ${wordClassName ?? ""}`}>
            {w}
          </span>
          {i < words.length - 1 && " "}
        </span>
      ))}
    </span>
  );
}

/* ---------------- Marquee — infinite ticker ---------------- */
export function Marquee({
  children,
  speed = 26,
  reverse = false,
  className,
}: {
  children: ReactNode;
  speed?: number;
  reverse?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex overflow-hidden ${className ?? ""}`}>
      <div
        className="flex shrink-0 items-center gap-8 whitespace-nowrap"
        style={{
          animation: `ghbc-marquee ${speed}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        {children}
      </div>
      <style>{`@keyframes ghbc-marquee { from { transform: translateX(0);} to { transform: translateX(-50%);} }`}</style>
    </div>
  );
}

/* ---------------- Magnetic — element leans toward cursor ---------------- */
export function Magnetic({
  children,
  className,
  strength = 0.35,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      const move = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const leave = () => {
        xTo(0);
        yTo(0);
      };
      el.addEventListener("mousemove", move);
      el.addEventListener("mouseleave", leave);
      return () => {
        el.removeEventListener("mousemove", move);
        el.removeEventListener("mouseleave", leave);
      };
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={`inline-block ${className ?? ""}`}>
      {children}
    </div>
  );
}

/* ---------------- Parallax — scrub-linked vertical drift ---------------- */
export function Parallax({
  children,
  className,
  amount = 100,
}: {
  children: ReactNode;
  className?: string;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { y: -amount / 2 },
        {
          y: amount / 2,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
