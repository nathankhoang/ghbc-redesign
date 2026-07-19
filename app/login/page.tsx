import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ghbc-logo-transparent.png" alt="Golden Hill Boxing Club" width={110} height={64} className="h-10 w-auto" />
        </Link>
        <Link href="/join" className="font-condensed text-xs tracking-widest text-cream/50 uppercase hover:text-gold">
          Join →
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-8 backdrop-blur-sm">
          <h1 className="font-poster mb-1 text-4xl text-bone">Welcome back</h1>
          <p className="mb-7 text-cream/60">Sign in to book classes & manage your membership.</p>
          <LoginForm />
          <p className="mt-6 text-center text-sm text-cream/50">
            New here?{" "}
            <Link href="/join" className="text-gold underline underline-offset-4">
              Join — $99 first month
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
