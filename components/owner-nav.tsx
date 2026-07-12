import Link from "next/link";

const TABS = [
  { key: "coaches", href: "/admin/coaches", label: "Coaches" },
  { key: "schedule", href: "/admin/schedule", label: "Schedule" },
] as const;

/** Owner-area sub-navigation. Keeps the two owner tools one tap apart. */
export function OwnerNav({ active }: { active: "coaches" | "schedule" }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`font-condensed rounded-full px-5 py-2 text-xs font-semibold tracking-widest uppercase transition-colors ${
            active === t.key
              ? "bg-gold text-ink"
              : "border border-oxblood-600/60 text-cream/70 hover:border-gold hover:text-gold"
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
