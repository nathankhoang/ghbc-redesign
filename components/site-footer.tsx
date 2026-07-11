import Image from "next/image";
import Link from "next/link";
import { GYM, NAV } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-oxblood-600/50 bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-sm">
            <Image
              src="/ghbc-logo-transparent.png"
              alt="Golden Hill Boxing Club"
              width={150}
              height={88}
              className="h-16 w-auto"
            />
            <p className="mt-5 text-cream/60">{GYM.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <h4 className="font-condensed mb-4 text-xs tracking-widest text-bronze uppercase">
                Explore
              </h4>
              <ul className="space-y-2">
                {NAV.map((n) => (
                  <li key={n.href}>
                    <Link href={n.href} className="text-cream/70 hover:text-gold">
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-condensed mb-4 text-xs tracking-widest text-bronze uppercase">
                Get started
              </h4>
              <ul className="space-y-2">
                <li><Link href="/join?type=trial" className="text-cream/70 hover:text-gold">Try a class · $20</Link></li>
                <li><Link href="/join" className="text-cream/70 hover:text-gold">Join now</Link></li>
                <li><Link href="/coaches" className="text-cream/70 hover:text-gold">Meet the coaches</Link></li>
                <li><Link href="/login" className="text-cream/70 hover:text-gold">Member login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-condensed mb-4 text-xs tracking-widest text-bronze uppercase">
                Visit
              </h4>
              <ul className="space-y-2 text-cream/70">
                <li>{GYM.address}</li>
                <li><a href={GYM.phoneHref} className="hover:text-gold">{GYM.phone}</a></li>
                <li>
                  <a
                    href="https://www.instagram.com/goldenhillboxingclub/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold"
                  >
                    {GYM.instagram}
                  </a>
                </li>
                <li><a href={`mailto:${GYM.email}`} className="hover:text-gold">{GYM.email}</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-oxblood-600/40 pt-6 text-sm text-cream/40 sm:flex-row">
          <p>© {new Date().getFullYear()} Golden Hill Boxing Club. All rights reserved.</p>
          <p className="font-condensed tracking-widest uppercase">Boxing · Muay Thai · Yoga</p>
        </div>
      </div>
    </footer>
  );
}
