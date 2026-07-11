import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CLASS_TYPES, MEMBERSHIP, ROLES } from "../lib/constants";

const prisma = new PrismaClient();

const { BOXING, MUAY_THAI, YOGA, OPEN_GYM, BOXING_SPARRING, MUAY_THAI_SPARRING } =
  CLASS_TYPES;

// h,m -> minutes from midnight
const t = (h: number, m = 0) => h * 60 + m;

// Coach display names are stored exactly as the live site shows them (rendered
// as "with {name}"), so boxing coaches read "Coach Ali" and yoga reads "Emily".
type Slot = {
  day: number; // 0=Sun .. 6=Sat
  type: string;
  coach: string | null;
  start: number;
  end: number;
  cap: number;
};

// Exact weekly schedule copied from goldenhillboxingclub.classy.sh.
const SLOTS: Slot[] = [
  // Sunday
  { day: 0, type: BOXING, coach: "Coach Ali", start: t(9), end: t(10), cap: 10 },
  { day: 0, type: OPEN_GYM, coach: null, start: t(10), end: t(12), cap: 12 },
  // Monday
  { day: 1, type: BOXING, coach: "Coach Ali", start: t(7, 30), end: t(8, 30), cap: 10 },
  { day: 1, type: OPEN_GYM, coach: null, start: t(12), end: t(14, 30), cap: 12 },
  { day: 1, type: OPEN_GYM, coach: null, start: t(14, 30), end: t(17), cap: 12 },
  { day: 1, type: BOXING, coach: "Coach Derek", start: t(17), end: t(18), cap: 10 },
  { day: 1, type: MUAY_THAI, coach: "Coach Derek", start: t(18, 15), end: t(19, 15), cap: 10 },
  // Tuesday
  { day: 2, type: YOGA, coach: "Emily", start: t(7, 15), end: t(8), cap: 8 },
  { day: 2, type: OPEN_GYM, coach: null, start: t(12), end: t(14, 30), cap: 12 },
  { day: 2, type: OPEN_GYM, coach: null, start: t(14, 30), end: t(17), cap: 12 },
  { day: 2, type: MUAY_THAI, coach: "Coach Colton", start: t(17), end: t(18), cap: 10 },
  { day: 2, type: BOXING, coach: "Coach Ali", start: t(18, 15), end: t(19, 15), cap: 10 },
  // Wednesday
  { day: 3, type: BOXING, coach: "Coach Colton", start: t(7, 30), end: t(8, 30), cap: 10 },
  { day: 3, type: YOGA, coach: "Emily", start: t(12), end: t(12, 45), cap: 8 },
  { day: 3, type: OPEN_GYM, coach: null, start: t(13), end: t(17), cap: 12 },
  { day: 3, type: BOXING, coach: "Coach Colton", start: t(17), end: t(18), cap: 10 },
  { day: 3, type: MUAY_THAI, coach: "Coach Colton", start: t(18, 15), end: t(19, 15), cap: 10 },
  { day: 3, type: MUAY_THAI_SPARRING, coach: "Coach Colton", start: t(19, 30), end: t(20, 30), cap: 8 },
  // Thursday
  { day: 4, type: YOGA, coach: "Emily", start: t(7, 15), end: t(8), cap: 8 },
  { day: 4, type: OPEN_GYM, coach: null, start: t(12), end: t(14, 30), cap: 12 },
  { day: 4, type: OPEN_GYM, coach: null, start: t(14, 30), end: t(17), cap: 12 },
  { day: 4, type: MUAY_THAI, coach: "Coach Colton", start: t(17), end: t(18), cap: 10 },
  { day: 4, type: BOXING, coach: "Coach Ali", start: t(18, 15), end: t(19, 15), cap: 10 },
  { day: 4, type: BOXING_SPARRING, coach: "Coach", start: t(19, 15), end: t(20, 15), cap: 8 },
  // Friday
  { day: 5, type: BOXING, coach: "Coach Colton", start: t(7, 30), end: t(8, 30), cap: 10 },
  { day: 5, type: OPEN_GYM, coach: null, start: t(12), end: t(14, 30), cap: 12 },
  { day: 5, type: OPEN_GYM, coach: null, start: t(14, 30), end: t(17), cap: 12 },
  { day: 5, type: BOXING, coach: "Coach Jack", start: t(17), end: t(18), cap: 10 },
  { day: 5, type: MUAY_THAI, coach: "Coach Jack", start: t(18, 15), end: t(19, 15), cap: 10 },
  // Saturday
  { day: 6, type: BOXING, coach: "Coach Colton", start: t(9), end: t(10), cap: 10 },
  { day: 6, type: OPEN_GYM, coach: null, start: t(10), end: t(12), cap: 12 },
  { day: 6, type: YOGA, coach: "Emily", start: t(12), end: t(12, 45), cap: 8 },
];

// Named coaches get a COACH-role login (so they get their own dashboard). The
// generic "Coach" placeholder stays display-only. Email = first name; shared
// default password `coachpass123` (change before handing accounts to real
// coaches — consider a forced reset on first login).
type CoachSeed = { name: string; login: boolean; bio?: string };
const COACH_SEEDS: CoachSeed[] = [
  { name: "Coach Ali", login: true, bio: "Head boxing coach. Sharp fundamentals, relentless conditioning — Ali will have you moving like a fighter from day one." },
  { name: "Coach Colton", login: true, bio: "Boxing and Muay Thai. Technical, patient, and tough when it counts. Runs our sparring and drills." },
  { name: "Coach Derek", login: true, bio: "Boxing and Muay Thai coach who meets you where you're at and pushes from there." },
  { name: "Coach Jack", login: true, bio: "Boxing and Muay Thai. Big on footwork, timing, and the little details that win rounds." },
  { name: "Emily", login: true, bio: "Yoga and recovery. Mobility, breath, and the counter to the heavy bag — good for every training day." },
  { name: "Coach", login: false },
];

// "Coach Ali" -> "ali@goldenhillboxingclub.com"
function coachEmail(name: string): string {
  const first = name.replace(/^Coach\s+/i, "").split(" ")[0].toLowerCase();
  return `${first}@goldenhillboxingclub.com`;
}

async function main() {
  // Clear class data so the seed is fully authoritative (removes stale sessions
  // generated from previous templates). Order respects foreign keys.
  await prisma.booking.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.classTemplate.deleteMany();
  await prisma.coach.deleteMany();

  // Coaches — named ones get a linked COACH login account + bio.
  const coaches: Record<string, string> = {};
  for (const seed of COACH_SEEDS) {
    let userId: string | undefined;
    if (seed.login) {
      const email = coachEmail(seed.name);
      const user = await prisma.user.upsert({
        where: { email },
        update: { role: ROLES.COACH },
        create: {
          firstName: seed.name.replace(/^Coach\s+/i, "").split(" ")[0],
          lastName: "",
          email,
          passwordHash: await bcrypt.hash("coachpass123", 10),
          role: ROLES.COACH,
          membershipType: MEMBERSHIP.NONE,
        },
      });
      userId = user.id;
    }
    const c = await prisma.coach.create({
      data: { name: seed.name, bio: seed.bio ?? null, userId: userId ?? null },
    });
    coaches[seed.name] = c.id;
  }

  // Class templates — reset to keep the seed authoritative
  await prisma.classTemplate.deleteMany();
  for (const s of SLOTS) {
    await prisma.classTemplate.create({
      data: {
        classType: s.type,
        coachId: s.coach ? coaches[s.coach] : null,
        dayOfWeek: s.day,
        startMin: s.start,
        endMin: s.end,
        capacity: s.cap,
      },
    });
  }

  // Owner account
  await prisma.user.upsert({
    where: { email: "owner@goldenhillboxingclub.com" },
    update: { role: ROLES.OWNER },
    create: {
      firstName: "Gym",
      lastName: "Owner",
      email: "owner@goldenhillboxingclub.com",
      passwordHash: await bcrypt.hash("ownerpass123", 10),
      role: ROLES.OWNER,
      membershipType: MEMBERSHIP.NONE,
    },
  });

  // Demo member account
  await prisma.user.upsert({
    where: { email: "member@example.com" },
    update: {},
    create: {
      firstName: "Nathan",
      lastName: "Hoang",
      email: "member@example.com",
      passwordHash: await bcrypt.hash("memberpass123", 10),
      role: ROLES.MEMBER,
      membershipType: MEMBERSHIP.FULL,
    },
  });

  console.log(
    `Seeded ${COACH_SEEDS.length} coaches (${COACH_SEEDS.filter((c) => c.login).length} with logins), ${SLOTS.length} class templates, owner + demo member.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
