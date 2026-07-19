import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GYM } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Liability Waiver & Terms — Golden Hill Boxing Club",
  description: "Liability waiver and terms of participation for Golden Hill Boxing Club.",
};

// TODO: PLACEHOLDER waiver text. No waiver exists in the current site's public
// code (goldenhillboxingclub.com hands signup to the third-party Classy
// platform) — the owner must supply the real waiver language, likely from
// inside Classy's checkout flow or the gym's paper waiver form. Swap the
// sections below for the official copy before launch. Signup already enforces
// the agreement checkbox either way.
export default function WaiverPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 pb-24 sm:px-8">
        <p className="font-condensed mb-3 text-sm tracking-[0.35em] text-gold uppercase">
          The fine print
        </p>
        <h1 className="font-poster fluid-h2 text-bone">
          Liability Waiver &amp; Terms
        </h1>
        <p className="font-condensed mt-3 text-xs tracking-widest text-cream/40 uppercase">
          Placeholder — official language pending
        </p>

        <div className="selectable mt-10 space-y-8 leading-relaxed text-cream/80">
          <section>
            <h2 className="font-poster mb-3 text-2xl text-bone">1. Assumption of Risk</h2>
            <p>
              I understand that participation in boxing, Muay Thai, yoga, strength &amp;
              conditioning, open gym and related activities at {GYM.name} involves inherent
              risks, including but not limited to physical injury. I voluntarily assume all
              risks associated with my participation.
            </p>
          </section>
          <section>
            <h2 className="font-poster mb-3 text-2xl text-bone">2. Release of Liability</h2>
            <p>
              In consideration of being permitted to participate, I release and hold harmless{" "}
              {GYM.name}, its owners, coaches, staff and agents from any and all claims arising
              out of my participation, to the fullest extent permitted by law.
            </p>
          </section>
          <section>
            <h2 className="font-poster mb-3 text-2xl text-bone">3. Medical Fitness</h2>
            <p>
              I confirm that I am physically fit to participate and have no medical condition
              that would prevent safe participation. I agree to inform a coach of any injury
              or condition before class.
            </p>
          </section>
          <section>
            <h2 className="font-poster mb-3 text-2xl text-bone">4. Membership Terms</h2>
            <p>
              Memberships are month-to-month with no contract unless otherwise stated. Prepaid
              memberships cover their stated period. To pause or cancel, contact the gym at{" "}
              {GYM.phone} or {GYM.email}.
            </p>
          </section>
          <section>
            <h2 className="font-poster mb-3 text-2xl text-bone">5. Media</h2>
            <p>
              Classes may occasionally be photographed or filmed for the club&apos;s social
              media. Tell a coach if you&apos;d prefer not to appear.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
