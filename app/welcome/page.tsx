import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Reveal, SplitWords } from "@/components/motion";
import { TrackOnce } from "@/components/track-once";

export const dynamic = "force-dynamic";

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ joined?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/join");
  const name = session.user.firstName || "fighter";
  const { joined } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)] px-5 py-16 text-center">
      {joined && <TrackOnce event="checkout_completed" data={{ plan: joined }} />}
      <div className="max-w-2xl">
        <Reveal className="font-condensed mb-4 text-sm tracking-[0.4em] text-gold uppercase">
          You&apos;re in the club
        </Reveal>
        <h1 className="font-poster fluid-hero poster-shadow text-bone">
          <SplitWords text={`Welcome,`} />
          <br />
          <SplitWords text={name + "."} delay={0.1} />
        </h1>
        <Reveal delay={0.4} className="mx-auto mt-8 max-w-lg text-xl text-cream/80">
          Your membership is active. Wraps and gloves are on us for your first
          session. Now let&apos;s get you booked.
        </Reveal>
        <Reveal delay={0.6} className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/schedule"
            className="font-condensed inline-block rounded-full bg-gold px-10 py-4 text-base font-semibold tracking-widest text-ink uppercase transition-transform transition-colors hover:scale-[1.03] hover:bg-bone"
          >
            Book Your First Class
          </Link>
          <Link
            href="/profile"
            className="font-condensed inline-block rounded-full border border-cream/40 px-10 py-4 text-base font-semibold tracking-widest text-cream uppercase transition-colors hover:border-gold hover:text-gold"
          >
            Go to Dashboard
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
