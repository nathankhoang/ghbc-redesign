import Image from "next/image";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
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
        <Link href="/login" className="font-condensed text-xs tracking-widest text-cream/50 uppercase hover:text-gold">
          Sign in →
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-8 backdrop-blur-sm">
          <h1 className="font-poster mb-1 text-4xl text-bone">Reset password</h1>
          <p className="mb-7 text-cream/60">Choose a new password for your account.</p>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="rounded-lg bg-blood/15 px-4 py-3 text-sm text-blood">
              This reset link is missing its token. Request a new link from{" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                forgot password
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
