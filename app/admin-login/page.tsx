import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Staff Login · Golden Hill Boxing Club",
  robots: { index: false },
};

// Coach / owner sign-in. Same credentials form as /login — access is decided by
// the account's real role after auth — but framed for staff, reached only via
// the subtle "Admin login" link.
export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(120%_100%_at_50%_0%,#3a1513_0%,#1a0e0c_60%)]">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ghbc-logo-transparent.png" alt="Golden Hill Boxing Club" width={110} height={64} className="h-10 w-auto" />
        </Link>
        <Link href="/login" className="font-condensed text-xs tracking-widest text-cream/50 uppercase hover:text-gold">
          Member login →
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-5 pb-24">
        <div className="w-full max-w-sm rounded-3xl border border-oxblood-600/50 bg-oxblood/30 p-8 backdrop-blur-sm">
          <p className="font-condensed mb-2 text-xs tracking-[0.3em] text-bronze uppercase">
            Staff access
          </p>
          <h1 className="font-poster mb-1 text-4xl text-bone">Coach & owner login</h1>
          <p className="mb-7 text-cream/60">
            Sign in with your coach or owner account to manage classes and members.
          </p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
