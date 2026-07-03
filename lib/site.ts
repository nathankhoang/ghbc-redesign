// Redesign copy & content (reuses gym facts from lib/constants.ts).
import { GYM, PRICING } from "@/lib/constants";

export { GYM, PRICING };

export const NAV = [
  { label: "Classes", href: "#classes" },
  { label: "Coaches", href: "#coaches" },
  { label: "Schedule", href: "/schedule" },
  { label: "Pricing", href: "#pricing" },
];

export const STATS = [
  { value: "6", label: "Expert coaches" },
  { value: "30+", label: "Classes / week" },
  { value: "3", label: "Disciplines" },
  { value: "0", label: "Contracts" },
];

export const CLASSES = [
  {
    name: "Boxing",
    tag: "All levels",
    blurb:
      "Learn the sweet science — footwork, head movement, combinations and real conditioning. Wraps on, gloves up.",
    expect: "Beginner-friendly. We'll teach you the basics your first day.",
  },
  {
    name: "Muay Thai",
    tag: "All levels",
    blurb:
      "The art of eight limbs. Elbows, knees, kicks and clinch work with coaches who've done it for real.",
    expect: "No experience needed — start slow, build fast.",
  },
  {
    name: "Yoga",
    tag: "Recovery",
    blurb:
      "Mobility, breath and recovery to keep you loose and fighting fit. The perfect counter to the heavy bag.",
    expect: "Great for rest days and total beginners.",
  },
  {
    name: "Open Gym",
    tag: "Members",
    blurb:
      "Bags, ropes and the ring — yours to use. Train on your schedule, at your pace.",
    expect: "Unlimited access with any membership.",
  },
];

export const COACHES = [
  { name: "Coach Ali", specialty: "Boxing", note: "Fundamentals & fight IQ." },
  { name: "Coach Colton", specialty: "Boxing · Muay Thai", note: "Technical striking." },
  { name: "Coach Derek", specialty: "Boxing · Muay Thai", note: "Power & conditioning." },
  { name: "Coach Jack", specialty: "Boxing · Muay Thai", note: "Sparring & drills." },
  { name: "Emily", specialty: "Yoga", note: "Mobility & recovery." },
];

export const TESTIMONIALS = [
  {
    quote:
      "Walked in never having thrown a punch. The coaches met me where I was — now I train five days a week.",
    name: "Marcus T.",
    tag: "Member, 8 months",
  },
  {
    quote:
      "Best gym in San Diego. Real coaching, real people, zero ego. The vibe is unmatched.",
    name: "Dana R.",
    tag: "Member, 1 year",
  },
  {
    quote:
      "First class was free and I was hooked. No contract meant no excuses. Wish I'd started sooner.",
    name: "Leo M.",
    tag: "Member, 4 months",
  },
];

export const VALUE_PROPS = [
  {
    title: "Beginners Welcome",
    body: "Never trained a day in your life? Perfect. Every class starts with the fundamentals — no experience, no ego, no problem.",
  },
  {
    title: "No Contracts",
    body: "Month to month, cancel anytime. We earn your membership every single session.",
  },
  {
    title: "Real Coaches",
    body: "Trained by people who've actually done it. Personal attention in every group class, plus 1:1 personal training.",
  },
];
