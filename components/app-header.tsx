import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { UserMenu } from "@/components/user-menu";

export async function AppHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-oxblood-600/50 bg-ink/85 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/ghbc-logo-transparent.png" alt="Golden Hill Boxing Club" width={110} height={64} className="h-10 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/schedule" className="font-condensed hidden text-sm tracking-widest text-cream/70 uppercase hover:text-gold sm:block">
            Schedule
          </Link>
          {user && (
            <UserMenu firstName={user.firstName || user.name || "Member"} email={user.email ?? ""} />
          )}
        </div>
      </nav>
    </header>
  );
}
