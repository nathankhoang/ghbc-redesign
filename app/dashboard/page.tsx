import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ROLES } from "@/lib/constants";

// Post-login dispatcher: sends each account to the right home by role.
// authenticate() redirects here so one login form serves everyone.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  switch (session.user.role) {
    case ROLES.OWNER:
      redirect("/admin/coaches");
    case ROLES.COACH:
      redirect("/coach");
    default:
      redirect("/profile");
  }
}
