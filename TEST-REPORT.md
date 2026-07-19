# Feedback-pass test report — 2026-07-19

Verification methods: production build (`npm run build` — clean, 25 routes), `tsc --noEmit` (clean), codebase grep sweeps, and a live browser pass (Chrome, dev server) over the public funnel, auth, and the new owner dashboard. Items requiring real Square/Turnstile/Resend credentials are marked **BLOCKED** — they're implemented but can only be exercised once keys exist (see "Still waiting on" in README).

## Final checklist

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | grep: zero `$20`/`$120` as prices | **PASS** | Only remaining `$120` references describe the grandfathered legacy plan (constants/comments), never shown to new signups |
| 2 | Hero: no trial, $99 card right, corner headline, Est. 2025 | **PASS** | Verified in browser; alternates left in `components/hero.tsx` comment |
| 3 | Trial in exactly 2 places | **PASS** | Landing section directly above "Come Say Hi" + small "testing the waters" checkout line; footer/ticker/meta/classes-section mentions all removed |
| 4 | No Pricing nav link | **PASS** | Header + footer render from the same NAV array |
| 5 | Non-selectable text, inputs still typeable | **PASS** | Global `user-select:none`; inputs/textareas/tel/mailto + `.selectable` dashboards opt back in |
| 6 | Marquee "Strength & Conditioning" | **PASS** | Verified in browser |
| 7 | Landing coaches = button → /coaches | **PASS** | /coaches renders Ali (Boxing), Colton/Derek/Jack/Kyle (Boxing · Muay Thai), Emily (Yoga) with bios + photo-swap placeholders |
| 8 | Schedule: guest view-only, member bookable, Open Gym bookable | **PASS** | Guest gets class-details modal → "Log in to book"; Open Gym now books like any class |
| 9 | Auth form: white text, 4 required fields, email/US-phone validation, admin link, no role tabs | **PASS** | Live (XXX) XXX-XXXX formatting, inline errors, server re-validation; grey Admin login → /admin-login (noindex) |
| 10 | Turnstile blocks tokenless submissions | **BLOCKED** | Wired on login + signup with server-side verify; enforcement activates when `TURNSTILE_SECRET_KEY` is set (documented in .env.example) |
| 11 | Checkout: no Cash App; Apple/Google Pay; inline card; $99 primary; $600/$1200 with savings; $25 line; promo field; discount message | **PASS** | Verified in browser (demo mode); real tokenization activates with Square keys |
| 12 | Promo $0 code → active membership, no charge | **PASS (code-verified)** | `register` skips payment on 100%-off codes, creates active membership linked to the code; owner creates/deactivates codes in /admin/subscriptions |
| 13 | Member dashboard: no leaderboard; rewards bar (25-class ticks, 🔥 marker); gold glow + confetti + redeem popup at 100/250; contact-to-cancel | **PASS (code-verified)** | Unredeemed glow persists; confetti + pulse respect `prefers-reduced-motion`; cancel/pause opens tel/mailto panel with (619) 316-6881 / goldenhillboxingclub@gmail.com |
| 14 | Owner dashboard: multi-page, occurrence-vs-series edits, filters, Square-first pause/cancel/resume, contact popup, no per-coach view, assign cover, Square data | **PASS** | Overview + Members verified in browser; Google-Calendar-style "this class only" (edited flag survives regeneration) vs "all future classes" (template) |
| 15 | Coach dashboard: week + N/10 + waitlist count + subtle contact only; no cover/broadcast/editing — enforced server-side | **PASS (code-verified)** | `assignSubstitute`/`clearSubstitute`/`toggleAttendance`/`sendAnnouncement` all require OWNER role — direct action calls fail |
| 16 | Stage 6B: plans script (incl. phased $99→$125), plan IDs not raw prices, webhooks, sync-from-Square, claim link without card, $120 never in new-signup UI | **PASS (code) / BLOCKED (sandbox run)** | Script runs and is idempotent (verified it authenticates + fails cleanly on placeholder token); needs real sandbox credentials to create plans and confirm the $99→$125 rollover |
| 17 | Stage 9B: waiver gate, 1 trial credit → $99 pitch, coach invite only path, card-on-file update, 10/10 → Join Waitlist with auto-promote email+notification, DB-level double-book, 1h cutoff, past-due/paused blocks, manual class-count adjust, meta/OG/JSON-LD, analytics events | **PASS (code-verified)** | Waiver checkbox required both paths + `waiverAcceptedAt`; trial credit consumed on booking / refunded on cancel; `@@unique([userId, sessionId])`; `CANCEL_CUTOFF_MINUTES=60` constant; LocalBusiness JSON-LD leads with $99; events: cta_join_99, cta_trial, checkout_started, checkout_completed |
| 18 | Timezone pinned to America/Los_Angeles | **PASS** | DST-safe generation + all displays pinned |
| 19 | 390px mobile | **PARTIAL** | All new UI built mobile-first (bottom-tab admin nav, card layouts, stacked hero); Chrome's minimum outer window (~500px) prevented a true 390px browser pass — recommend a quick device-emulation check before launch |
| 20 | Build passes | **PASS** | `npm run build` clean; deploy preview pending push (not pushed without your OK) |

## Bugs found & fixed during verification
- `.env` contained fake placeholder Square app/location IDs → the Web Payments SDK tried to initialize and errored on /join. Blanked them so unconfigured environments render demo mode cleanly.

## What still needs real-world testing once credentials land
1. Run `npx tsx scripts/setup-square-plans.ts` against sandbox → verify plans in Square dashboard, then a full sandbox checkout per plan (Square test cards), declined-card path, and the $99→$125 phase rollover.
2. Square webhook events (payment made/failed, subscription updated) flipping membership status.
3. Sync-from-Square against the real customer list; claim links via Resend.
4. Turnstile blocking with keys set.
