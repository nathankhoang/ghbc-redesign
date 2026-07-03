import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { Reveal, SplitWords, Marquee, Magnetic, Parallax } from "@/components/motion";
import { STATS, CLASSES, COACHES, TESTIMONIALS, VALUE_PROPS, GYM, PRICING } from "@/lib/site";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="overflow-hidden">
        <Hero />

        {/* Marquee */}
        <div className="border-y border-oxblood-600/60 bg-oxblood py-5">
          <Marquee speed={30}>
            {["Boxing", "Muay Thai", "Yoga", "Strength", "Open Gym", "Beginners Welcome"].map(
              (t, i) => (
                <span
                  key={i}
                  className="font-poster fluid-h3 flex items-center gap-7 text-cream/90"
                >
                  {t} <span className="text-gold">✦</span>
                </span>
              ),
            )}
          </Marquee>
        </div>

        {/* Intro + stats */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <Reveal className="font-condensed mb-4 text-sm tracking-[0.35em] text-bronze uppercase">
                Welcome to the club
              </Reveal>
              <h2 className="font-poster fluid-h2 text-bone">
                <SplitWords text="More than a gym." />
                <br />
                <SplitWords text="A corner crew." delay={0.1} />
              </h2>
            </div>
            <div className="flex flex-col justify-end">
              <Reveal className="text-xl leading-relaxed text-cream/80">
                Tucked into Golden Hill, we&apos;re a real boxing gym — sweat, heavy bags, and
                coaches who actually know your name. Whether you&apos;re throwing your first jab
                or sharpening for your next fight, this is your corner.
              </Reveal>
              <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
                {STATS.map((s, i) => (
                  <Reveal key={s.label} delay={i * 0.08}>
                    <div className="font-poster text-5xl text-gold sm:text-6xl">{s.value}</div>
                    <div className="font-condensed mt-1 text-xs tracking-widest text-cream/60 uppercase">
                      {s.label}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Value props */}
        <section className="border-y border-oxblood-600/40 bg-oxblood-900/40">
          <div className="mx-auto grid max-w-7xl gap-px sm:grid-cols-3">
            {VALUE_PROPS.map((v, i) => (
              <Reveal
                key={v.title}
                delay={i * 0.1}
                className="bg-ink/30 px-7 py-14 sm:px-9"
              >
                <div className="font-poster mb-4 text-2xl text-gold">0{i + 1}</div>
                <h3 className="font-poster fluid-h3 mb-4 text-bone">{v.title}</h3>
                <p className="text-cream/75">{v.body}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Classes */}
        <section id="classes" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
            <div>
              <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
                Train with us
              </Reveal>
              <h2 className="font-poster fluid-h2 text-bone">
                <SplitWords text="The Classes" />
              </h2>
            </div>
            <Reveal className="max-w-sm text-cream/70">
              Every class welcomes total beginners. Gloves and wraps? We&apos;ll sort you out on
              day one.
            </Reveal>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {CLASSES.map((c, i) => (
              <Reveal key={c.name} delay={(i % 2) * 0.1}>
                <div className="group relative overflow-hidden rounded-2xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/70 to-ink p-8 transition-colors hover:border-gold/60 sm:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-poster text-4xl text-bone sm:text-5xl">{c.name}</h3>
                    <span className="font-condensed shrink-0 rounded-full border border-gold/40 px-3 py-1 text-[11px] tracking-widest text-gold uppercase">
                      {c.tag}
                    </span>
                  </div>
                  <p className="mt-5 text-cream/80">{c.blurb}</p>
                  <p className="font-condensed mt-6 flex items-center gap-2 text-sm tracking-wide text-bronze">
                    <span className="text-gold">▸</span> {c.expect}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Big kinetic banner */}
        <section className="relative overflow-hidden border-y border-oxblood-600/50 bg-oxblood-900/50 py-24 sm:py-32">
          <Parallax amount={80} className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
            <span className="font-poster text-[28vw] whitespace-nowrap text-cream">GOLDEN HILL</span>
          </Parallax>
          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Your first round" />
              <br />
              <SplitWords text="is on us." delay={0.1} />
            </h2>
            <Reveal delay={0.3} className="mt-6 text-xl text-cream/80">
              No pressure, no contract. Come throw hands, see how it feels.
            </Reveal>
            <Reveal delay={0.5} className="mt-9">
              <Magnetic strength={0.3}>
                <Link
                  href="/free-class"
                  className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
                >
                  Claim Your Free Class
                </Link>
              </Magnetic>
            </Reveal>
          </div>
        </section>

        {/* Coaches */}
        <section id="coaches" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
            Your corner
          </Reveal>
          <h2 className="font-poster fluid-h2 mb-14 text-bone">
            <SplitWords text="The Coaches" />
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {COACHES.map((coach, i) => (
              <Reveal key={coach.name} delay={(i % 3) * 0.08}>
                <div className="flex items-center gap-5 rounded-2xl border border-oxblood-600/50 bg-oxblood/40 p-6 transition-colors hover:border-gold/50">
                  <span className="font-poster flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-2xl text-ink">
                    {coach.name.replace("Coach ", "").charAt(0)}
                  </span>
                  <div>
                    <div className="font-poster text-2xl text-bone">{coach.name}</div>
                    <div className="font-condensed text-xs tracking-widest text-gold uppercase">
                      {coach.specialty}
                    </div>
                    <div className="mt-1 text-sm text-cream/60">{coach.note}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="border-y border-oxblood-600/40 bg-oxblood-900/40 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
            <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
              Membership
            </Reveal>
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Intro Offer" />
            </h2>
            <Reveal delay={0.2} className="mt-8">
              <div className="font-poster poster-shadow text-[clamp(5rem,20vw,11rem)] leading-none text-bone">
                ${PRICING.FULL.introCents / 100}
              </div>
              <p className="font-condensed mt-2 text-lg tracking-wide text-cream/70">
                first month · then ${PRICING.FULL.recurringCents / 100}/mo · no contract
              </p>
            </Reveal>
            <Reveal delay={0.35} className="mx-auto mt-10 grid max-w-md gap-3 text-left">
              {["Unlimited access", "All group classes", "Open gym", "Cancel anytime"].map((b) => (
                <div key={b} className="flex items-center gap-3 text-cream/85">
                  <span className="flex size-6 items-center justify-center rounded-full bg-gold/20 text-gold">
                    ✓
                  </span>
                  {b}
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.5} className="mt-11 flex flex-wrap justify-center gap-4">
              <Magnetic strength={0.3}>
                <Link
                  href="/join"
                  className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-colors hover:bg-bone"
                >
                  Join in one tap
                </Link>
              </Magnetic>
              <Link
                href="/free-class"
                className="font-condensed inline-block rounded-full border border-cream/40 px-10 py-4 text-base font-semibold tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold"
              >
                Or try a free class
              </Link>
            </Reveal>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <h2 className="font-poster fluid-h2 mb-14 text-bone">
            <SplitWords text="Word from" />{" "}
            <span className="font-serif text-gold normal-case italic">the crew</span>
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <figure className="flex h-full flex-col rounded-2xl border border-oxblood-600/50 bg-oxblood/40 p-8">
                  <span className="font-serif mb-4 text-5xl leading-none text-gold">“</span>
                  <blockquote className="flex-1 text-lg text-cream/85">{t.quote}</blockquote>
                  <figcaption className="mt-6">
                    <div className="font-condensed tracking-wide text-bone">{t.name}</div>
                    <div className="text-sm text-cream/50">{t.tag}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Location / final CTA */}
        <section className="relative overflow-hidden border-t border-oxblood-600/50 bg-gradient-to-b from-oxblood/60 to-ink py-24 text-center sm:py-32">
          <div className="mx-auto max-w-3xl px-5 sm:px-8">
            <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
              Find us
            </Reveal>
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Come Say Hi" />
            </h2>
            <Reveal delay={0.25} className="mt-6 text-xl text-cream/80">
              {GYM.address}
            </Reveal>
            <Reveal delay={0.35} className="font-condensed mt-2 tracking-wide text-cream/60">
              {GYM.phone} · {GYM.instagram}
            </Reveal>
            <Reveal delay={0.5} className="mt-10">
              <Magnetic strength={0.3}>
                <a
                  href="https://maps.google.com/?q=2302+Broadway+Ave+San+Diego+CA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed inline-block rounded-full border border-gold px-10 py-4 text-base font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
                >
                  Get Directions
                </a>
              </Magnetic>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
