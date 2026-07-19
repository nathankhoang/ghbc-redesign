"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export type ActionState = { ok?: string; error?: string } | undefined;

// Owner broadcasts a note to every member. It surfaces as a one-time popup in
// each member's dashboard until they dismiss it. Coaches can no longer send —
// this is an owner-only tool.
export async function sendAnnouncement(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== ROLES.OWNER) {
    return { error: "Not authorized." };
  }

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Write a message first." };

  // Resolve the sender's coach record for attribution (owners may not have one).
  const coach = await prisma.coach.findUnique({
    where: { userId: session.user.id },
  });
  const authorName =
    coach?.name ?? session.user.firstName ?? "Golden Hill Boxing Club";

  await prisma.announcement.create({
    data: {
      coachId: coach?.id ?? null,
      authorName,
      message,
    },
  });

  revalidatePath("/coach");
  revalidatePath("/profile");
  return { ok: "Sent to all members." };
}

// A member dismisses an announcement so it never pops up for them again.
export async function dismissAnnouncement(announcementId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Please sign in." };

  await prisma.announcementRead.upsert({
    where: {
      announcementId_userId: {
        announcementId,
        userId: session.user.id,
      },
    },
    create: { announcementId, userId: session.user.id },
    update: {},
  });

  revalidatePath("/profile");
  return { ok: true as const };
}

// Announcements this user hasn't dismissed yet, newest first.
export async function getUnreadAnnouncements(userId: string) {
  const announcements = await prisma.announcement.findMany({
    where: { reads: { none: { userId } } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      authorName: true,
      message: true,
      createdAt: true,
    },
  });
  return announcements;
}
