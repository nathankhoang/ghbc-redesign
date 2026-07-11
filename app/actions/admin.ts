"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MEMBERSHIP, ROLES } from "@/lib/constants";

async function requireOwner() {
  const session = await auth();
  if (session?.user?.role !== ROLES.OWNER) throw new Error("Unauthorized");
}

export type AdminState = { ok?: string; error?: string } | undefined;

// Create a coach with an optional login account. With an email + password the
// coach gets a COACH-role User (and their own dashboard); without one it's a
// display-only coach.
export async function createCoachAccount(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  if (!name) return { error: "Coach name is required." };

  if (!email) {
    await prisma.coach.create({ data: { name } });
    revalidatePath("/admin/coaches");
    revalidatePath("/coaches");
    return { ok: `Added coach ${name} (no login).` };
  }

  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "A user with that email already exists." };

  const [firstName, ...rest] = name.split(" ");
  const user = await prisma.user.create({
    data: {
      firstName: firstName || name,
      lastName: rest.join(" "),
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: ROLES.COACH,
      membershipType: MEMBERSHIP.NONE,
    },
  });
  await prisma.coach.create({ data: { name, userId: user.id } });
  revalidatePath("/admin/coaches");
  revalidatePath("/coaches");
  return { ok: `Created coach ${name} with a login (${email}).` };
}
