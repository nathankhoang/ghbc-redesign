// Centralised domain constants (SQLite has no enums, so allowed values live here).

export const ROLES = { MEMBER: "MEMBER", OWNER: "OWNER" } as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

export const MEMBERSHIP = { FULL: "FULL", YOGA: "YOGA", NONE: "NONE" } as const;
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

// Membership pricing shown on the signup page (matches the live site copy).
export const PRICING = {
  FULL: { introCents: 9900, recurringCents: 12000, label: "Full Membership" },
  YOGA: { introCents: 9900, recurringCents: 9900, label: "Yoga" },
} as const;

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
