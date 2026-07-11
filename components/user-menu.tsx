"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { logout } from "@/app/actions/auth";

export function UserMenu({ firstName, email }: { firstName: string; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5"
      >
        <span className="font-poster flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-lg text-ink">
          {(firstName || "?").charAt(0).toUpperCase()}
        </span>
        <span className="font-condensed hidden tracking-wide text-cream uppercase sm:block">
          {firstName}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-3 w-56 overflow-hidden rounded-2xl border border-oxblood-600/60 bg-ink/95 py-2 backdrop-blur-md">
          <div className="px-4 py-2">
            <p className="font-condensed tracking-wide text-cream">{firstName}</p>
            <p className="truncate text-sm text-cream/50">{email}</p>
          </div>
          <div className="my-1 h-px bg-oxblood-600/50" />
          <Link href="/profile" onClick={() => setOpen(false)} className="block px-4 py-2 text-cream/80 hover:bg-oxblood/40 hover:text-gold">
            My dashboard
          </Link>
          <Link href="/schedule" onClick={() => setOpen(false)} className="block px-4 py-2 text-cream/80 hover:bg-oxblood/40 hover:text-gold">
            Book a class
          </Link>
          <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-cream/80 hover:bg-oxblood/40 hover:text-gold">
            Account settings
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full px-4 py-2 text-left text-blood hover:bg-oxblood/40">
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
