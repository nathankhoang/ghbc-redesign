import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ClaimForm } from "@/components/claim-form";

export const metadata: Metadata = {
  title: "Claim your account — Golden Hill Boxing Club",
  robots: { index: false },
};

// Landing page for the emailed "claim your account" magic link. Members
// migrated from Square (and invited coaches) just set a password — no card
// entry, their billing already lives in Square.
export default async function ClaimPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ghbc-logo-transparent.png" alt="Golden Hill Boxing Club" width={110} height={64} className="h-10 w-auto" />
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-8 backdrop-blur-sm">
          <h1 className="font-poster mb-1 text-4xl text-bone">Claim your account</h1>
          <p className="mb-7 text-cream/60">
            Set a password and you&apos;re in. Your membership and billing carry over
            exactly as they are — no card needed.
          </p>
          {token ? (
            <ClaimForm token={token} />
          ) : (
            <p className="rounded-lg bg-blood/15 px-4 py-3 text-sm text-blood">
              This claim link is missing its token. Open the link from your email, or ask
              the gym to resend it.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
