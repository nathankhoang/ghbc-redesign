# Golden Hill Boxing Club — site + member platform

Next.js 16 (App Router) · Prisma + Neon Postgres · NextAuth v5 · Square payments · Resend email · Tailwind v4. Deployed on Vercel (ghbc-redesign.vercel.app).

## Local dev

```bash
npm install
cp .env.example .env       # fill in at least DATABASE_URL(_UNPOOLED) + AUTH_SECRET
npm run db:push            # sync the Prisma schema
npm run db:seed            # coaches, weekly schedule, owner + demo accounts
npm run dev
```

## Accounts & roles

Three roles: `MEMBER`, `COACH`, `OWNER`.

- **Owner seed (one-time):** `npm run db:seed` creates the initial owner account
  `owner@goldenhillboxingclub.com` / `ownerpass123` — **change this password
  immediately** (log in → Account → password). The seed is idempotent (upserts).
- **Coaches** are created ONLY from the owner dashboard (Coaches → Invite coach):
  the coach gets an email and sets their own password. The public signup form can
  never create a coach or owner.
- **Members** sign up at `/join` (Square checkout) — or are migrated from Square
  (below).

## Payments — Square is the source of truth for money

Website prices are display-only; Square only charges what exists in its Catalog.

1. Put sandbox credentials in `.env` (`SQUARE_ACCESS_TOKEN`,
   `NEXT_PUBLIC_SQUARE_APP_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`,
   `SQUARE_ENVIRONMENT=sandbox`), set `PAYMENTS_ENABLED=true`.
2. **Create the plans:** `npx tsx scripts/setup-square-plans.ts` — idempotent;
   creates the phased **$99 intro → $125/mo** plan, the $125 standard plan, and
   the $120 grandfathered plan, and writes their IDs to
   `config/square-plans.json`. Commit that file. Re-run with
   `SQUARE_ENVIRONMENT=production` before launch.
3. **Webhooks:** subscribe `https://<site>/api/webhooks/square` to
   `invoice.payment_made`, `invoice.scheduled_charge_failed`,
   `subscription.updated` in the Square developer dashboard and set
   `SQUARE_WEBHOOK_SIGNATURE_KEY`.
4. One-time charges (the $25 trial, $600/6-mo, $1,200/12-mo prepays) go through
   the Payments API using amounts from `lib/constants.ts` `PRICING` — the single
   source of truth for every price shown on the site.

With `PAYMENTS_ENABLED=false` (default) all payment calls are stubbed so the
full signup/booking flow works locally with no credentials.

## Migrating existing members from Square

Existing members are **grandfathered at $120/mo** and already pay through
Square. In the owner dashboard → Subscriptions:

1. **Sync from Square** pulls Customers + active Subscriptions and creates
   matching accounts (`pending_claim`) linked to their existing
   subscription — their billing is never touched.
2. Each synced member gets an emailed **"Claim your account"** link — they only
   set a password (no card re-entry). Resend from Members → the member's card.
3. **CSV fallback** (name,email,phone per line) for anyone missing from Square.

## Email (Resend)

Set `RESEND_API_KEY` (+ `EMAIL_FROM` once a domain is verified). Used for:
password resets, booking confirmations, claim links, coach invites, waitlist
promotions, and the day-after trial follow-up (Vercel cron —
`vercel.json` → `/api/cron/trial-followup`, protect with `CRON_SECRET`).

## Other env

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` — Cloudflare
  Turnstile bot protection on login/signup (skipped until keyed).
- `NEXT_PUBLIC_SITE_URL` — absolute base for emailed links.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob for avatars.

See `.env.example` for the full annotated list. Every var must also be set in
Vercel project settings.

## Still waiting on (from the owner)

- New hero video → drop at `public/videos/hero.mp4` (padwork.mp4 plays as
  fallback until then).
- Confirmed class times (seed data transcribed from the old Classy schedule —
  `prisma/seed.ts`, editable in-app via the owner Schedule manager).
- Coach photos (`public/coaches/*` — one-line swap in `lib/site.ts`) + final bios.
- Official liability waiver language (placeholder lives at `/waiver`).
- Production Square credentials, Turnstile keys, Resend key, and the exact
  promo-code string for the $0 membership (create it in Owner → Subscriptions).
