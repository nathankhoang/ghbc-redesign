import Image from "next/image";
import Link from "next/link";
import { JoinCheckout } from "@/components/join-checkout";
import { PRICING } from "@/lib/site";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; plan?: string }>;
}) {
  const { type, plan } = await searchParams;
  const initialPlan =
    type === "trial" || plan === "TRIAL"
      ? "TRIAL"
      : type === "yoga" || plan === "YOGA"
        ? "YOGA"
        : "FULL";

  return (
    <main className="min-h-screen bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)]">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ghbc-logo-transparent.png" alt="Golden Hill Boxing Club" width={110} height={64} className="h-10 w-auto" />
        </Link>
        <Link href="/" className="font-condensed text-xs tracking-widest text-cream/50 uppercase hover:text-gold">
          ← Back
        </Link>
      </div>

      <div className="mx-auto grid max-w-5xl gap-10 px-5 pt-6 pb-20 sm:px-8 lg:grid-cols-2 lg:gap-16">
        {/* Left — the pitch (trial framing differs from membership) */}
        <div className="lg:pt-10">
          <p className="font-condensed mb-3 text-sm tracking-[0.35em] text-gold uppercase">
            {initialPlan === "TRIAL" ? "First class" : "Join the club"}
          </p>
          <h1 className="font-poster fluid-h2 text-bone">
            {initialPlan === "TRIAL" ? (
              <>
                One class.
                <br />
                Twenty bucks.
              </>
            ) : (
              <>
                Two minutes.
                <br />
                Then you&apos;re in.
              </>
            )}
          </h1>
          <div className="mt-8">
            <div className="font-poster poster-shadow text-[clamp(4rem,14vw,8rem)] leading-none text-bone">
              ${(initialPlan === "TRIAL" ? PRICING.TRIAL : PRICING.FULL).introCents / 100}
            </div>
            <p className="font-condensed mt-1 tracking-wide text-cream/60">
              {initialPlan === "TRIAL"
                ? "single drop-in · no membership · no auto-renewal"
                : `first month · then $${PRICING.FULL.recurringCents / 100}/mo · no contract`}
            </p>
          </div>
          <ul className="mt-8 grid gap-3">
            {(initialPlan === "TRIAL"
              ? ["One full class — boxing, Muay Thai or yoga", "All gear provided, just show up", "Coached from your very first round", "No membership, no commitment"]
              : ["Unlimited access to every class", "Open gym — bags, ropes, the ring", "Beginners always welcome", "Cancel anytime, no contract"]
            ).map((b) => (
              <li key={b} className="flex items-center gap-3 text-cream/85">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">✓</span>
                {b}
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-cream/45">
            {initialPlan === "TRIAL" ? (
              <>
                Ready to go all in? Switch to{" "}
                <Link href="/join" className="text-gold underline underline-offset-4">
                  full membership
                </Link>
                .
              </>
            ) : (
              <>
                Just testing the waters?{" "}
                <Link href="/join?type=trial" className="text-gold underline underline-offset-4">
                  Try one class for $20
                </Link>
                .
              </>
            )}
          </p>
        </div>

        {/* Right — the seamless checkout */}
        <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-6 backdrop-blur-sm sm:p-8 lg:sticky lg:top-8 lg:self-start">
          <h2 className="font-poster mb-6 text-3xl text-bone">Checkout</h2>
          <JoinCheckout initialPlan={initialPlan} />
        </div>
      </div>
    </main>
  );
}
