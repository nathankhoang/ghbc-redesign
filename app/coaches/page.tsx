import Image from "next/image";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/motion";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Coaches — Golden Hill Boxing Club",
  description:
    "Meet the coaching staff at Golden Hill Boxing Club — boxing, Muay Thai and yoga instructors in San Diego.",
};

export default async function CoachesPage() {
  const coaches = await prisma.coach.findMany({
    where: { userId: { not: null } },
    include: { user: { select: { image: true } } },
    orderBy: { name: "asc" },
  });

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

          {coaches.length === 0 ? (
            <p className="text-center text-cream/50">
              Coach profiles are coming soon.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((c, i) => {
                const initial = c.name
                  .replace(/^Coach\s+/i, "")
                  .charAt(0)
                  .toUpperCase();
                return (
                  <Reveal key={c.id} delay={i * 0.05}>
                    <div className="flex h-full flex-col items-center rounded-3xl border border-oxblood-600/50 bg-gradient-to-br from-oxblood/45 to-ink p-7 text-center transition-colors hover:border-gold/50">
                      {c.user?.image ? (
                        <Image
                          src={c.user.image}
                          alt={c.name}
                          width={128}
                          height={128}
                          className="size-32 rounded-full object-cover ring-2 ring-gold/30"
                        />
                      ) : (
                        <span className="font-poster flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-gold to-bronze text-5xl text-ink">
                          {initial}
                        </span>
                      )}
                      <h2 className="font-poster mt-5 text-3xl text-bone">{c.name}</h2>
                      <p className="mt-3 text-sm leading-relaxed text-cream/70">
                        {c.bio?.trim() ||
                          "Coach at Golden Hill Boxing Club. Come train and get to know them on the mat."}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
