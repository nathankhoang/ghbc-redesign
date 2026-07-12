import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/app-header";
import { AvatarForm, EmailForm, PhoneForm, PasswordForm } from "@/components/account-forms";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <header className="mb-8">
          <p className="font-condensed text-sm tracking-[0.3em] text-gold uppercase">
            Account
          </p>
          <h1 className="font-poster text-4xl text-bone sm:text-5xl">Your settings</h1>
          <p className="mt-2 text-cream/60">
            Update your photo, email, phone and password.{" "}
            <Link href="/profile" className="text-gold underline underline-offset-4">
              Back to dashboard
            </Link>
          </p>
        </header>

        <div className="grid gap-6">
          <AvatarForm firstName={user.firstName} image={user.image} />
          <EmailForm email={user.email} />
          <PhoneForm phone={user.phone} />
          <PasswordForm />
        </div>
      </main>
    </>
  );
}
