// Redesign copy & content (reuses gym facts from lib/constants.ts).
import { GYM, PRICING } from "@/lib/constants";

export { GYM, PRICING };

// Per the 2026 feedback pass: no "Pricing" link — the $99 offer lives in the hero.
// "/#classes" (not "#classes") so the link works from every page, not just home.
export const NAV = [
  { label: "Classes", href: "/#classes" },
  { label: "Coaches", href: "/coaches" },
  { label: "Schedule", href: "/schedule" },
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
      "Learn the sweet science: footwork, head movement, combinations and real conditioning. Wraps on, gloves up.",
    expect: "Beginner-friendly. We'll teach you the basics your first day.",
  },
  {
    name: "Muay Thai",
    tag: "All levels",
    blurb:
      "The art of eight limbs. Elbows, knees, kicks and clinch work with coaches who've done it for real.",
    expect: "No experience needed. Start slow, build fast.",
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
      "Your corner of the gym, yours to use. Train on your schedule, at your pace.",
    expect: "Unlimited access with any membership.",
  },
];

// `image` points at a headshot in /public/coaches/ when available — dropping a
// real photo in is a ONE-LINE change (e.g. image: "/coaches/ali.jpg"). Until
// then the card shows a themed "Photo coming soon" placeholder.
// TODO: real photos + final bio copy from the owner.
export const COACHES: { name: string; specialty: string; bio: string; image?: string }[] = [
  {
    name: "Coach Ali",
    specialty: "Boxing",
    bio: "Pure sweet science: footwork, defense and crisp combinations. Ali will sharpen your fundamentals from round one.",
  },
  {
    name: "Coach Colton",
    specialty: "Boxing · Muay Thai",
    bio: "Equal parts boxing IQ and eight-limbs power. Colton's classes build real conditioning without leaving anyone behind.",
  },
  {
    name: "Coach Derek",
    specialty: "Boxing · Muay Thai",
    bio: "Technical, patient, and relentless about the details. Derek meets you at your level and moves you up a notch every class.",
  },
  {
    name: "Coach Jack",
    specialty: "Boxing · Muay Thai",
    bio: "High-energy pads and honest coaching. Train with Jack and you'll leave dripping, and smiling.",
  },
  {
    name: "Coach Kyle",
    specialty: "Boxing · Muay Thai",
    bio: "From first-day beginners to fight-camp veterans, Kyle's corner advice sticks with you long after the bell.",
  },
  {
    name: "Emily",
    specialty: "Yoga",
    bio: "Mobility, breath and recovery. Emily keeps the fighters loose and the rest of us moving better than ever.",
  },
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
    body: "Never trained a day in your life? Perfect. Every class starts with the fundamentals: no experience, no ego, no problem.",
  },
  {
    title: "No Contracts",
    body: "Month to month, cancel anytime. We earn your membership every single session.",
  },
  {
    title: "Real Coaches",
    body: "Trained by people who've actually done it. Real coaching and personal attention in every class.",
  },
];
