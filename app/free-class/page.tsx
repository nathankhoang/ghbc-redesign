import Image from "next/image";
import Link from "next/link";
import { FreeClassForm } from "@/components/free-class-form";

export default function FreeClassPage() {
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
        <div className="lg:pt-10">
          <p className="font-condensed mb-3 text-sm tracking-[0.35em] text-gold uppercase">
            First class free
          </p>
          <h1 className="font-poster fluid-h2 text-bone">
            Come throw
            <br />
            some hands.
          </h1>
          <p className="mt-6 max-w-md text-xl text-cream/80">
            Never trained before? Perfect. Your first class is completely free —
            no card, no pressure. We&apos;ll teach you the basics and you&apos;ll leave
            drenched and grinning.
          </p>
          <ul className="mt-8 grid gap-3">
            {["Gloves & wraps provided", "Total beginners welcome", "Real coaching from minute one", "Zero commitment"].map((b) => (
              <li key={b} className="flex items-center gap-3 text-cream/85">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">✓</span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-6 backdrop-blur-sm sm:p-8 lg:sticky lg:top-8 lg:self-start">
          <h2 className="font-poster mb-6 text-3xl text-bone">Book your spot</h2>
          <FreeClassForm />
        </div>
      </div>
    </main>
  );
}
