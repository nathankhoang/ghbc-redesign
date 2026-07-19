import Image from "next/image";

export type RosterMember = {
  bookingId: string;
  firstName: string;
  email: string;
  phone: string | null;
  image: string | null;
};

export type CoachSession = {
  id: string;
  classType: string;
  startISO: string;
  endISO: string;
  capacity: number;
  scheduledCoachName: string | null;
  subCoachName: string | null;
  iAmScheduled: boolean;
  iAmSub: boolean;
  roster: RosterMember[];
  waitlistCount: number;
};

function whenLabel(startISO: string, endISO: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const day = start.toLocaleDateString("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const time = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });
  return `${day} · ${time(start)} – ${time(end)}`;
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name}
        width={32}
        height={32}
        className="size-8 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="font-condensed flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-xs font-semibold text-ink">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// Subtle, always-visible mailto/tel affordances — small glyphs, not buttons.
function ContactIcons({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string | null;
}) {
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1 text-cream/35">
      <a
        href={`mailto:${email}`}
        title={email}
        aria-label={`Email ${name}`}
        className="rounded-full p-1.5 transition-colors hover:bg-ink/60 hover:text-gold"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 6 8 7 8-7" />
        </svg>
      </a>
      {phone && (
        <a
          href={`tel:${phone}`}
          title={phone}
          aria-label={`Call ${name}`}
          className="rounded-full p-1.5 transition-colors hover:bg-ink/60 hover:text-gold"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C11.6 21 3 12.4 3 2c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z" />
          </svg>
        </a>
      )}
    </div>
  );
}

function SessionCard({ s }: { s: CoachSession }) {
  return (
    <div className="rounded-3xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/40 to-ink p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-poster text-2xl text-bone">
            {s.classType}
            {s.iAmSub && !s.iAmScheduled && (
              <span className="font-condensed ml-2 rounded-full bg-gold/15 px-2 py-0.5 align-middle text-xs tracking-widest text-gold uppercase">
                Covering
              </span>
            )}
          </p>
          <p className="font-condensed text-sm tracking-wide text-cream/55">
            {whenLabel(s.startISO, s.endISO)}
          </p>
          {s.iAmScheduled && s.subCoachName && (
            <p className="mt-1 text-xs text-gold/80">
              Covered by {s.subCoachName} this week
            </p>
          )}
        </div>
        <span
          className="font-condensed rounded-full bg-ink/60 px-3 py-1 text-sm tracking-widest text-cream/80 uppercase"
          aria-label={`${s.roster.length} of ${s.capacity} spots booked${
            s.waitlistCount > 0 ? `, ${s.waitlistCount} on the waitlist` : ""
          }`}
        >
          {s.roster.length}/{s.capacity}
          {s.waitlistCount > 0 && ` · ${s.waitlistCount} waiting`}
        </span>
      </div>

      {/* Roster */}
      {s.roster.length === 0 ? (
        <p className="mt-3 text-sm text-cream/40">No one signed up yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-oxblood-600/40">
          {s.roster.map((m) => (
            <li key={m.bookingId} className="flex items-center gap-3 py-2.5">
              <Avatar name={m.firstName} image={m.image} />
              <p className="min-w-0 flex-1 truncate font-medium text-bone">
                {m.firstName}
              </p>
              <ContactIcons name={m.firstName} email={m.email} phone={m.phone} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CoachDashboard({
  sessions,
  weekLabel,
}: {
  sessions: CoachSession[];
  weekLabel: string;
}) {
  if (sessions.length === 0) {
    return (
      <section className="rounded-3xl border border-oxblood-600/50 bg-oxblood/20 p-8 text-center">
        <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
          {weekLabel}
        </p>
        <p className="mt-2 text-cream/55">
          You have no classes scheduled this week.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="font-poster text-3xl text-bone">Your classes</h2>
        <p className="font-condensed text-sm tracking-widest text-cream/55 uppercase">
          {weekLabel}
        </p>
      </div>
      {sessions.map((s) => (
        <SessionCard key={s.id} s={s} />
      ))}
    </section>
  );
}
