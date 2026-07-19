// Centralised domain constants (values are plain strings; allowed values live here).

export const ROLES = { MEMBER: "MEMBER", COACH: "COACH", OWNER: "OWNER" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const MEMBERSHIP = {
  FULL: "FULL",
  YOGA: "YOGA",
  TRIAL: "TRIAL",
  NONE: "NONE",
} as const;
export type Membership = (typeof MEMBERSHIP)[keyof typeof MEMBERSHIP];

export const CLASS_TYPES = {
  BOXING: "Boxing",
  MUAY_THAI: "Muay Thai",
  YOGA: "Yoga",
  OPEN_GYM: "Open Gym",
  BOXING_SPARRING: "Boxing Sparring/Drills",
  MUAY_THAI_SPARRING: "Muay Thai Sparring/Drills",
} as const;
export type ClassType = (typeof CLASS_TYPES)[keyof typeof CLASS_TYPES];

export const BOOKING_STATUS = {
  BOOKED: "BOOKED",
  WAITLIST: "WAITLIST",
  CANCELLED: "CANCELLED",
  ATTENDED: "ATTENDED",
} as const;

// SINGLE SOURCE OF TRUTH for every price shown anywhere on the site.
// Never hardcode a dollar amount in a component — always read from here.
// (Square's Catalog is the source of truth for what actually gets CHARGED;
// these numbers must match the plans created by scripts/setup-square-plans.ts.)
//
// Funnel: the $99 intro month is the hero offer everywhere. The TRIAL is the
// "last stand" fallback — surfaced ONLY in the landing section above
// "Come Say Hi" and the small "testing the waters" line at checkout.
export const PRICING = {
  // One-time single-class pass (no membership, no auto-renewal).
  TRIAL: { introCents: 2500, recurringCents: 0, label: "1 Trial Class" },
  // $99 first month, then $125/mo ongoing — the primary offer.
  FULL: { introCents: 9900, recurringCents: 12500, label: "Full Membership" },
  // Prepaid blocks — one-time charges covering 6/12 months of membership.
  SIX_MONTH: {
    introCents: 60000,
    recurringCents: 0,
    months: 6,
    saveCents: 15000,
    label: "6 Months Prepaid",
  },
  TWELVE_MONTH: {
    introCents: 120000,
    recurringCents: 0,
    months: 12,
    saveCents: 30000,
    label: "12 Months Prepaid",
  },
  // Legacy $120/mo plan for members who joined before the 2026 price change.
  // Mapped to their existing Square subscriptions — NEVER shown to new signups.
  GRANDFATHERED: { introCents: 12000, recurringCents: 12000, label: "Legacy Membership" },
} as const;

export type PlanKey = keyof typeof PRICING;

// Plans a brand-new visitor may buy (order = display order at checkout).
export const PUBLIC_PLANS = ["FULL", "SIX_MONTH", "TWELVE_MONTH"] as const;

// All schedule logic and display is pinned to the gym's timezone,
// regardless of the viewer's device timezone.
export const GYM_TIMEZONE = "America/Los_Angeles";

// Members can cancel a booking up to this long before class start.
export const CANCEL_CUTOFF_MINUTES = 60;

// Gym contact details (from the live marketing site).
export const GYM = {
  name: "Golden Hill Boxing Club",
  address: "2302 Broadway Ave, San Diego, CA",
  phone: "(619)-316-6881",
  phoneHref: "tel:+16193166881",
  email: "goldenhillboxingclub@gmail.com",
  instagram: "@goldenhillboxingclub",
  tagline: "BOXING • MUAY THAI • STRENGTH & CONDITIONING",
} as const;

export const CLASSES_GOAL = 100;

export const DAY_LABELS_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
