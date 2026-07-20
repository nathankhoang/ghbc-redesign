import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/hero";
import { ReviewsCarousel } from "@/components/reviews-carousel";
import { StickyCta } from "@/components/sticky-cta";
import { Reveal, SplitWords, Marquee } from "@/components/motion";
import { TrackLink } from "@/components/track-link";
import { STATS, CLASSES, TESTIMONIALS, VALUE_PROPS, GYM, PRICING } from "@/lib/site";

// LocalBusiness structured data — leads with the $99 offer per the funnel rules.
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  name: GYM.name,
  description:
    "Boxing, Muay Thai & Yoga gym in Golden Hill, San Diego. Beginners welcome. $99 first month, then $125/mo. No contract.",
  telephone: "+1-619-316-6881",
  email: GYM.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: "2302 Broadway Ave",
    addressLocality: "San Diego",
    addressRegion: "CA",
    addressCountry: "US",
  },
  sameAs: ["https://www.instagram.com/goldenhillboxingclub/"],
  priceRange: "$$",
  offers: {
    "@type": "Offer",
    name: "Intro offer for the first month",
    price: (PRICING.FULL.introCents / 100).toFixed(2),
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />
      <SiteHeader />
      <main className="overflow-hidden">
        <Hero />

        {/* Marquee */}
        <div className="border-y border-oxblood-600/60 bg-oxblood py-5">
          <Marquee speed={30}>
            {[
              "Boxing",
              "Muay Thai",
              "Yoga",
              "Strength & Conditioning",
              "Open Gym",
              "Beginners Welcome",
            ].map((t, i) => (
              <span
                key={i}
                className="font-poster fluid-h3 flex items-center gap-7 text-cream/90"
              >
                {t} <span className="text-gold">✦</span>
              </span>
            ))}
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
                Tucked into Golden Hill, we&apos;re a real boxing gym. Sweat, heavy bags, and
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
              Every class included for ${PRICING.FULL.introCents / 100} your first month.
            </span>
            <TrackLink
              event="cta_join_99"
              data={{ location: "classes" }}
              href="/join"
              className="font-condensed rounded-full border border-gold px-6 py-2.5 text-sm font-semibold tracking-widest text-gold uppercase transition-colors hover:bg-gold hover:text-ink"
            >
              Join the club →
            </TrackLink>
          </Reveal>
        </section>

        {/* Coaches — compact pointer to the dedicated page */}
        <section
          id="coaches"
          className="border-y border-oxblood-600/40 bg-oxblood-900/40 py-20 sm:py-24"
        >
          <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
            <Reveal className="font-condensed mb-3 text-sm tracking-[0.35em] text-bronze uppercase">
              Your corner
            </Reveal>
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="The Coaches" />
            </h2>
            <Reveal delay={0.2} className="mx-auto mt-6 max-w-xl text-xl text-cream/80">
              Six coaches who&apos;ve done it for real in boxing, Muay Thai and yoga, and meet
              you exactly where you&apos;re at.
            </Reveal>
            <Reveal delay={0.35} className="mt-9">
              <Link
                href="/coaches"
                className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
              >
                Meet Our Coaches
              </Link>
            </Reveal>
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

        {/* Trial — the "last stand" offer. Per the funnel rules this section
            (directly above "Come Say Hi") is the ONLY trial placement on the
            landing page. */}
        <section className="relative overflow-hidden border-y border-oxblood-600/50 bg-oxblood-900/50 py-24 sm:py-32">
          <Marquee reverse speed={42} className="pointer-events-none absolute inset-0 items-center opacity-[0.07]">
            <span className="font-poster text-[15vw] whitespace-nowrap text-cream">
              Golden Hill Boxing Club <span className="px-6 text-gold">✦</span>
            </span>
          </Marquee>
          <div className="relative mx-auto max-w-4xl px-5 text-center sm:px-8">
            <h2 className="font-poster fluid-h2 text-bone">
              <SplitWords text="Still on the fence?" />
              <br />
              <SplitWords text={`Try a class for $${PRICING.TRIAL.introCents / 100}.`} delay={0.1} />
            </h2>
            <Reveal delay={0.3} className="mt-6 text-xl text-cream/80">
              No pressure, no contract. Come see what it feels like to have a corner.
            </Reveal>
            <Reveal delay={0.5} className="mt-9">
              <TrackLink
                event="cta_trial"
                data={{ location: "landing" }}
                href="/join?type=trial"
                className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
              >
                Book Your ${PRICING.TRIAL.introCents / 100} Trial
              </TrackLink>
              <p className="font-condensed mt-4 text-xs tracking-widest text-cream/45 uppercase">
                One class · no contract
              </p>
            </Reveal>
          </div>
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
                <TrackLink
                  event="cta_join_99"
                  data={{ location: "come-say-hi" }}
                  href="/join"
                  className="font-condensed inline-block rounded-full bg-gold px-8 py-3.5 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
                >
                  Join the club
                </TrackLink>
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
