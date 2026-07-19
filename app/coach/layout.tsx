import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES } from "@/lib/constants";
import { AppHeader } from "@/components/app-header";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  if (session.user.role !== ROLES.COACH && session.user.role !== ROLES.OWNER)
    redirect("/profile");

  return (
    <>
      <AppHeader />
      <main className="selectable mx-auto w-full max-w-5xl px-5 py-12 sm:px-8">
        {children}
      </main>
    </>
  );
}
