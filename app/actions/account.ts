"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadAvatar, blobConfigured } from "@/lib/blob";

export type ActionState = { ok?: string; error?: string } | undefined;

// Update the signed-in member's avatar (Vercel Blob). No-ops gracefully when
// Blob isn't configured — the picker still previews, it just won't persist.
export async function changeAvatar(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in." };

  const imageFile = formData.get("image");
  if (!(imageFile instanceof File) || imageFile.size === 0)
    return { error: "Choose a photo first." };

  const avatar = await uploadAvatar(imageFile, `user-${session.user.id}`);
  if (avatar.error) return { error: avatar.error };
  if (!avatar.url) {
    return blobConfigured()
      ? { error: "Upload failed. Please try again." }
      : { error: "Photo uploads aren't enabled yet." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { image: avatar.url },
  });
  revalidatePath("/account");
  revalidatePath("/profile");
  return { ok: "Profile picture updated." };
}

export async function changePassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in." };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  if (next.length < 8)
    return { error: "New password must be at least 8 characters." };

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return { error: "Account not found." };

  const ok = await bcrypt.compare(current, user.passwordHash);
  if (!ok) return { error: "Current password is incorrect." };

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(next, 10) },
  });
  return { ok: "Password updated." };
}

export async function changeEmail(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in." };

  const email = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  if (!email.includes("@")) return { error: "Enter a valid email." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id)
    return { error: "That email is already in use." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { email },
  });
  revalidatePath("/account");
  revalidatePath("/profile");
  return { ok: "Email updated." };
}

export async function changePhone(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in." };

  const phone = String(formData.get("phone") ?? "").trim();
  if (phone.replace(/\D/g, "").length < 10)
    return { error: "Enter a valid phone number." };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone },
  });
  revalidatePath("/account");
  revalidatePath("/profile");
  return { ok: "Phone number updated." };
}
