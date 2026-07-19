import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES } from "@/lib/constants";
import { AppHeader } from "@/components/app-header";
import { OwnerNav } from "@/components/owner-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== ROLES.OWNER) redirect("/profile");

  return (
    <>
      <AppHeader />
      <div className="border-b border-oxblood-600/50 bg-ink/40">
        <div className="mx-auto w-full max-w-6xl px-5 py-4 sm:px-8">
          <OwnerNav />
        </div>
      </div>
      {/* Extra bottom padding on mobile keeps content clear of the fixed bottom tab bar. */}
      <main className="selectable mx-auto w-full max-w-6xl px-5 pt-8 pb-28 sm:px-8 md:pb-16">
        {children}
      </main>
    </>
  );
}
