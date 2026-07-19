"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SVGProps } from "react";

const TABS = [
  { href: "/admin", label: "Overview", short: "Home", icon: IconGrid },
  { href: "/admin/schedule", label: "Schedule", short: "Schedule", icon: IconCalendar },
  { href: "/admin/members", label: "Members", short: "Members", icon: IconUsers },
  { href: "/admin/subscriptions", label: "Subscriptions", short: "Subs", icon: IconTag },
  { href: "/admin/coaches", label: "Coaches", short: "Coaches", icon: IconWhistle },
  { href: "/admin/payments", label: "Payments", short: "Pay", icon: IconDollar },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    />
  );
}

function IconGrid(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Icon>
  );
}

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  );
}

function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 20c0-3.4 2.8-6.2 6.2-6.2s6.2 2.8 6.2 6.2" />
      <circle cx="17.5" cy="8.5" r="2.4" />
      <path d="M15.6 13.9c2.7.5 4.6 2.9 4.6 6.1" />
    </Icon>
  );
}

function IconTag(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="M11.5 3H4v7.5L14.5 21l7-7L11.5 3Z" />
      <circle cx="8" cy="7" r="1.4" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function IconWhistle(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <path d="m11.5 20.5 8-14a5.5 5.5 0 0 0-2-2.5 5.5 5.5 0 0 0-2.9-1 5.5 5.5 0 0 0-4.4 8.8L4 20.5Z" />
      <circle cx="15.5" cy="5.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

function IconDollar(props: SVGProps<SVGSVGElement>) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 6.5v11M15 9.5c0-1.4-1.4-2.5-3-2.5s-3 1-3 2.3c0 2.8 6 1.2 6 4 0 1.4-1.4 2.5-3 2.5s-3-1-3-2.5" />
    </Icon>
  );
}

/**
 * Owner-area navigation. Renders a horizontal tab bar on desktop/tablet and
 * a fixed bottom tab bar (icons + tiny labels) on mobile so every section is
 * one tap away without a hamburger menu.
 */
export function OwnerNav() {
  const pathname = usePathname();

  return (
    <>
      <nav className="hidden flex-wrap gap-2 md:flex" aria-label="Owner sections">
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`font-condensed rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
                active
                  ? "bg-gold text-ink"
                  : "border border-oxblood-600/60 text-cream/70 hover:border-gold hover:text-gold"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-oxblood-600/60 bg-ink/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Owner sections"
      >
        {TABS.map((t) => {
          const active = isActive(pathname, t.href);
          const TabIcon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                active ? "text-gold" : "text-cream/45"
              }`}
            >
              <TabIcon className="size-5" />
              <span className="font-condensed text-[9px] tracking-wide uppercase">
                {t.short}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
