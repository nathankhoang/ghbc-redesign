"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/site";
import { Magnetic } from "@/components/motion";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "border-b border-oxblood-600/60 bg-ink/85 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Home">
          <Image
            src="/ghbc-logo-transparent.png"
            alt="Golden Hill Boxing Club"
            width={116}
            height={68}
            className="h-11 w-auto"
            priority
          />
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="font-condensed text-sm tracking-widest text-cream/80 uppercase transition-colors hover:text-gold"
            >
              {n.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="font-condensed hidden text-sm tracking-widest text-cream/70 uppercase transition-colors hover:text-gold sm:block"
          >
            Log in
          </Link>
          <Magnetic strength={0.4}>
            <Link
              href="/join"
              className="font-condensed inline-block rounded-full bg-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
            >
              Join
            </Link>
          </Magnetic>
          <button
            type="button"
            className="text-cream md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              {open ? (
                <path strokeLinecap="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" d="M3.5 7h17M3.5 12h17M3.5 17h17" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {open && (
        <div className="flex flex-col gap-1 border-t border-oxblood-600/50 bg-ink/95 px-6 py-4 md:hidden">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="font-condensed py-2 tracking-widest text-cream/85 uppercase"
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="font-condensed py-2 tracking-widest text-cream/85 uppercase"
          >
            Log in
          </Link>
        </div>
      )}
    </header>
  );
}
