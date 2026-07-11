// Cloudflare Turnstile server-side verification.
//
// If no secret key is configured we let the request through, so signup/login
// keep working locally / before Turnstile is wired up in the Cloudflare
// dashboard. Once TURNSTILE_SECRET_KEY is set, a missing or invalid token is
// rejected.

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const turnstileEnabled = Boolean(SECRET);

export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!SECRET) return true; // not configured yet — don't block signup
  if (!token) return false;

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: SECRET, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
