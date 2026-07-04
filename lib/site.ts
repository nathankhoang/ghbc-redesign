// Redesign copy & content (reuses gym facts from lib/constants.ts).
import { GYM, PRICING } from "@/lib/constants";

export { GYM, PRICING };

export const NAV = [
  { label: "Classes", href: "#classes" },
  { label: "Coaches", href: "#coaches" },
  { label: "Schedule", href: "/schedule" },
  { label: "Pricing", href: "#pricing" },
];

export const STATS: { value: string; label: string; star?: boolean }[] = [
  { value: "6", label: "Expert coaches" },
  { value: "30+", label: "Classes / week" },
  { value: "5.0", label: "Google rating", star: true },
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

// `image` points at a headshot in /public/coaches/ when available; empty = themed
// filler placeholder that's sized for a real photo to drop in later.
export const COACHES: { name: string; specialty: string; image?: string }[] = [
  { name: "Coach Ali", specialty: "Boxing" },
  { name: "Coach Colton", specialty: "Boxing · Muay Thai" },
  { name: "Coach Derek", specialty: "Boxing · Muay Thai" },
  { name: "Coach Jack", specialty: "Boxing · Muay Thai" },
  { name: "Coach Kyle", specialty: "Boxing · Muay Thai" },
  { name: "Emily", specialty: "Yoga" },
];

// Real 5★ reviews from the gym's Google listing (5.0 · 12 reviews).
export const TESTIMONIALS: { quote: string; name: string; tag: string; stars: number }[] = [
  {
    quote:
      "More than just a great workout! The boxing and Muay Thai classes have a great balance of technical work and conditioning. All of the coaches are super knowledgeable and welcoming, and meet you wherever you're at.",
    name: "Randi Lyn",
    tag: "Google review",
    stars: 5,
  },
  {
    quote:
      "Awesome gym!! Knowledgeable, helpful coaches and friendly clientele. Great for all skill levels. Extremely affordable. The space looks small at first glance, but once you take a class you see it totally works. I love this place!",
    name: "Steven Clemensen",
    tag: "Google review",
    stars: 5,
  },
  {
    quote:
      "Great gym for both beginners and experienced individuals. The coaches are very knowledgeable and encouraging. Truly an awesome place.",
    name: "Carlo Bencomo-Jasso",
    tag: "Google review",
    stars: 5,
  },
  {
    quote:
      "New local gem. The coaches are great and the classes aren't so big that you feel like just a number.",
    name: "ryan lawless",
    tag: "Google review",
    stars: 5,
  },
  {
    quote:
      "Great gym, great coaches — a great place for both beginners and experienced individuals.",
    name: "Robin Nguyễn",
    tag: "Google review",
    stars: 5,
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
