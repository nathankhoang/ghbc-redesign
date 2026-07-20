import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";
import { COACHES } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Coaches · Golden Hill Boxing Club",
  description:
    "Meet the coaching staff at Golden Hill Boxing Club: boxing, Muay Thai and yoga instructors in San Diego.",
};

export default async function CoachesPage() {
  // Roster + bios come from lib/site.ts (photos are a one-line swap there).
  // If a coach has a login with an uploaded avatar, that photo wins.
  const dbCoaches = await prisma.coach
    .findMany({ include: { user: { select: { image: true } } } })
    .catch(() => []);
  const avatarByName = new Map(
    dbCoaches
      .filter((c) => c.user?.image)
      .map((c) => [c.name.replace(/^Coach\s+/i, "").toLowerCase(), c.user!.image!]),
  );

  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)] px-5 pt-32 pb-24 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <header className="mb-14 text-center">
            <p className="font-condensed mb-3 text-sm tracking-[0.35em] text-gold uppercase">
              The team
            </p>
            <h1 className="font-poster fluid-h2 text-bone">Meet the coaches</h1>
            <p className="mx-auto mt-4 max-w-2xl text-cream/70">
              The team that will push you, teach you, and have your back every
              round. Book a class and train with them.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {COACHES.map((coach, i) => {
              const shortName = coach.name.replace(/^Coach\s+/i, "");
              const photo = coach.image ?? avatarByName.get(shortName.toLowerCase());
              return (
                <Reveal key={coach.name} delay={(i % 3) * 0.06}>
                  <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/45 to-ink transition-colors hover:border-gold/50">
                    <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-oxblood-600/60 to-ink">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={coach.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-bronze/40">
                          <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                            <circle cx="12" cy="8" r="4.2" />
                            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
                          </svg>
                          <span className="font-condensed text-[10px] tracking-widest uppercase">
                            Photo coming soon
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6 text-center sm:p-7">
                      <h2 className="font-poster text-3xl text-bone">{coach.name}</h2>
                      <p className="font-condensed mt-1.5 text-[11px] tracking-widest text-gold uppercase">
                        {coach.specialty}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-cream/70">{coach.bio}</p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
