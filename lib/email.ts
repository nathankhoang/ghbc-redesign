import { Resend } from "resend";
import { GYM } from "@/lib/constants";

// Transactional email via Resend. No-ops (returns skipped) when RESEND_API_KEY
// isn't set, so auth/booking flows still work locally before it's configured.

const KEY = process.env.RESEND_API_KEY;
// Until a domain is verified in Resend, use the shared onboarding sender.
const FROM =
  process.env.EMAIL_FROM || "Golden Hill Boxing Club <onboarding@resend.dev>";

// Absolute base URL for links inside emails (Resend can't resolve relatives).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://ghbc-redesign.vercel.app";

export const emailEnabled = Boolean(KEY);

type SendResult = { ok: boolean; skipped?: boolean; error?: string };

async function send(
  to: string,
  subject: string,
  html: string,
): Promise<SendResult> {
  if (!KEY) return { ok: false, skipped: true };
  try {
    const resend = new Resend(KEY);
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

// Shared shell — "Golden Era" neo-vintage: warm oxblood-black ground, a bronze
// rule under a gold poster-style wordmark, bone headings on cream body copy.
// (Email clients don't reliably load web fonts, so the display look is faked
// with a heavy, wide-tracked system stack rather than Anton.)
function layout(
  heading: string,
  body: string,
  cta?: { href: string; label: string },
): string {
  return `
  <div style="background:#1a0e0c;padding:40px 0;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:480px;margin:0 auto;background:#4f2222;border:1px solid #67302c;border-radius:14px;overflow:hidden;">
      <div style="padding:24px 28px 20px;border-bottom:2px solid #b8935a;background:#350f0f;">
        <p style="margin:0;color:#d6ab63;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;letter-spacing:0.14em;text-transform:uppercase;line-height:1.05;">
          Golden Hill<br/>Boxing Club
        </p>
      </div>
      <div style="padding:30px 28px;color:#ece3d0;">
        <h2 style="margin:0 0 14px;color:#f6f0e2;font-size:22px;font-weight:normal;">${heading}</h2>
        <div style="font-size:15px;line-height:1.65;color:#ece3d0;">${body}</div>
        ${
          cta
            ? `<div style="margin-top:26px;"><a href="${cta.href}" style="display:inline-block;background:#d6ab63;color:#1a0e0c;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:13px 26px;border-radius:999px;">${cta.label}</a></div>`
            : ""
        }
      </div>
      <div style="padding:16px 28px;border-top:1px solid #67302c;color:#b8935a;font-family:Arial,Helvetica,sans-serif;font-size:12px;">
        ${GYM.address} · ${GYM.phone}
      </div>
    </div>
  </div>`;
}

export async function sendPasswordReset(
  to: string,
  resetUrl: string,
): Promise<SendResult> {
  return send(
    to,
    "Reset your Golden Hill Boxing Club password",
    layout(
      "Reset your password",
      `We received a request to reset your password. This link expires in 1 hour.
       If you didn't ask for this, you can safely ignore this email.`,
      { href: resetUrl, label: "Reset password" },
    ),
  );
}

export async function sendBookingConfirmation(
  to: string,
  firstName: string,
  cls: { classType: string; startAt: Date; endAt: Date },
): Promise<SendResult> {
  const when = cls.startAt.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return send(
    to,
    `You're booked: ${cls.classType}`,
    layout(
      `See you soon, ${firstName}. 🥊`,
      `You're confirmed for <strong style="color:#f6f0e2;">${cls.classType}</strong> on <strong style="color:#f6f0e2;">${when}</strong>.
       Come ready to train — water and hand wraps recommended.`,
      { href: `${SITE_URL}/schedule`, label: "View my classes" },
    ),
  );
}
