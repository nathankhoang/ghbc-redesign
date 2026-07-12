import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { ReviewsCarousel } from "@/components/reviews-carousel";
import { StickyCta } from "@/components/sticky-cta";
import { Reveal, SplitWords, Marquee } from "@/components/motion";
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
                    <div className="flex items-start gap-0.5">
                      <span className="font-poster text-5xl text-gold sm:text-6xl">{s.value}</span>
                      {s.star && <span className="mt-1 text-2xl text-gold sm:mt-2">★</span>}
                    </div>
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

          <Reveal className="mt-10 flex flex-wrap items-center justify-center gap-4 text-center">
            <span className="font-condensed tracking-wide text-cream/70">
              Not sure where to start? Your first class is just $20.
            </span>
            <Link
              href="/join?type=trial"
              className="font-condensed rounded-full border border-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
            >
              Book your $20 trial →
            </Link>
          </Reveal>
        </section>

        {/* Big kinetic banner */}
        <section className="relative overflow-hidden border-y border-oxblood-600/50 bg-oxblood-900/50 py-24 sm:py-32">
          <Marquee reverse speed={42} className="pointer-events-none absolute inset-0 items-center opacity-[0.07]">
            <span className="font-poster text-[15vw] whitespace-nowrap text-cream">
              Golden Hill Boxing Club <span className="px-6 text-gold">✦</span>
            </span>
          </Marquee>
          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Your first class" />
              <br />
              <SplitWords text="is just $20." delay={0.1} />
            </h2>
            <Reveal delay={0.3} className="mt-6 text-xl text-cream/80">
              No pressure, no contract. Come throw hands, see how it feels.
            </Reveal>
            <Reveal delay={0.5} className="mt-9">
              <Link
                href="/join?type=trial"
                className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
              >
                Book Your $20 Trial
              </Link>
              <p className="font-condensed mt-4 text-xs tracking-widest text-cream/45 uppercase">
                No card required · no contract
              </p>
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
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-3">
            {COACHES.map((coach, i) => (
              <Reveal key={coach.name} delay={(i % 3) * 0.08}>
                <div className="group overflow-hidden rounded-2xl border border-oxblood-600/50 bg-oxblood/30 transition-colors hover:border-gold/50">
                  <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-oxblood-600/60 to-ink">
                    {coach.image ? (
                      <Image src={coach.image} alt={coach.name} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 text-bronze/40">
                        <svg width="52" height="52" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <circle cx="12" cy="8" r="4.2" />
                          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
                        </svg>
                        <span className="font-condensed text-[10px] tracking-widest uppercase">Photo coming soon</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 text-center sm:p-5">
                    <div className="font-poster text-xl text-bone sm:text-2xl">{coach.name}</div>
                    <div className="font-condensed mt-1 text-[11px] tracking-widest text-gold uppercase">
                      {coach.specialty}
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Pricing / Intro Offer — social video left, offer right */}
        <section id="pricing" className="border-y border-oxblood-600/40 bg-oxblood-900/40 py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
            {/* Left — a clip from their social media */}
            <Reveal className="order-2 lg:order-1">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-gold/30 shadow-2xl">
                <video
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  poster="/videos/intro-poster.jpg"
                >
                  <source src="/videos/intro.mp4" type="video/mp4" />
                </video>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-gold/15" />
                <span className="font-condensed absolute bottom-4 left-4 rounded-full bg-ink/75 px-3 py-1 text-[10px] tracking-widest text-gold uppercase backdrop-blur">
                  @goldenhillboxingclub
                </span>
              </div>
            </Reveal>

            {/* Right — the intro offer (unchanged design) */}
            <div className="order-1 text-center lg:order-2">
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
            <Reveal
              delay={0.35}
              className="mx-auto mt-10 grid w-fit grid-cols-1 gap-x-10 gap-y-3.5 text-left sm:grid-cols-2"
            >
              {[
                "Unlimited group classes",
                "Professional coaching",
                "Open gym — bags, ropes & the ring",
                "Boxing · Muay Thai · Yoga",
                "Beginners always welcome",
                "No contract — cancel anytime",
              ].map((b) => (
                <div key={b} className="flex items-center gap-3 text-cream/85">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                    ✓
                  </span>
                  {b}
                </div>
              ))}
            </Reveal>
            <Reveal delay={0.5} className="mt-11 flex flex-wrap justify-center gap-4">
              <Link
                href="/join"
                className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
              >
                Join in one tap
              </Link>
              <Link
                href="/join?type=trial"
                className="font-condensed inline-block rounded-full border border-cream/40 px-10 py-4 text-base font-semibold tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold"
              >
                Or try one class for $20
              </Link>
            </Reveal>
            <Reveal delay={0.6} className="font-condensed mt-5 text-xs tracking-widest text-cream/45 uppercase">
              $20 first class · no contract · cancel anytime
            </Reveal>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
          <div className="mb-12 text-center">
            <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
              5.0 on Google · loved in Golden Hill
            </Reveal>
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Word from" />{" "}
              <span className="font-serif text-gold normal-case italic">the crew</span>
            </h2>
          </div>
          <ReviewsCarousel reviews={TESTIMONIALS} />
        </section>

        {/* Location / final CTA */}
        <section className="relative overflow-hidden border-t border-oxblood-600/50 bg-gradient-to-b from-oxblood/60 to-ink py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16">
            {/* Real storefront photo, themed to match */}
            <Reveal className="order-2 lg:order-1">
              <div className="relative overflow-hidden rounded-3xl border border-gold/30 shadow-2xl">
                <Image
                  src="/gym-exterior.jpg"
                  alt="Golden Hill Boxing Club storefront on Broadway Ave"
                  width={1260}
                  height={806}
                  className="h-full w-full object-cover"
                />
                {/* light warm bottom scrim — keeps it bright & inviting, badge stays legible */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-gold/15" />
                <span className="font-condensed absolute bottom-4 left-4 rounded-full bg-ink/75 px-3 py-1 text-[10px] tracking-widest text-gold uppercase backdrop-blur">
                  2302 Broadway Ave
                </span>
              </div>
            </Reveal>

            <div className="order-1 lg:order-2">
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
              <Reveal delay={0.5} className="mt-9 flex flex-wrap gap-4">
                <a
                  href="https://maps.google.com/?q=2302+Broadway+Ave+San+Diego+CA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-condensed inline-block rounded-full border border-gold px-8 py-3.5 text-base font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
                >
                  Get Directions
                </a>
                <Link
                  href="/join?type=trial"
                  className="font-condensed inline-block rounded-full bg-gold px-8 py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
                >
                  Book your $20 trial
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <StickyCta />
    </>
  );
}
