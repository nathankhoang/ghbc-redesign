import { put } from "@vercel/blob";

// Avatar uploads to Vercel Blob.
//
// Returns { url } on success, { error } on a bad file, or {} (no-op) when there
// is no file or Blob isn't configured yet — so signup and profile edits still
// work locally before BLOB_READ_WRITE_TOKEN is set.

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export type AvatarResult = { url?: string; error?: string };

export function blobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadAvatar(
  file: File | null | undefined,
  keyPrefix: string,
): Promise<AvatarResult> {
  if (!file || file.size === 0) return {};
  if (!file.type.startsWith("image/"))
    return { error: "Profile picture must be an image." };
  if (file.size > MAX_BYTES)
    return { error: "Profile picture must be under 5MB." };
  if (!blobConfigured()) return {}; // storage not configured — skip silently

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const blob = await put(`avatars/${keyPrefix}.${ext}`, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return { url: blob.url };
}
