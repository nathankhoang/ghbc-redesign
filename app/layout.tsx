import type { Metadata } from "next";
import { Anton, Oswald, Inter, DM_Serif_Display } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { SmoothScroll } from "@/components/smooth-scroll";
import { LoadingOverlay } from "@/components/loading-overlay";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ghbc-redesign.vercel.app";
const TITLE = "Golden Hill Boxing Club · We Are Your Corner";
const DESCRIPTION =
  "Boxing, Muay Thai & Yoga in Golden Hill, San Diego. Beginners welcome. $99 first month, then $125/mo. No contract.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Short-form of the hero headline ("We're not just in your corner. We ARE your corner.")
  title: TITLE,
  description: DESCRIPTION,
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "Golden Hill Boxing Club",
    type: "website",
    locale: "en_US",
    images: [{ url: "/gym-exterior.jpg", width: 1260, height: 806, alt: "Golden Hill Boxing Club, 2302 Broadway Ave, San Diego" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/gym-exterior.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${oswald.variable} ${inter.variable} ${dmSerif.variable}`}
    >
      <body suppressHydrationWarning className="grain antialiased">
        <SmoothScroll>{children}</SmoothScroll>
        <LoadingOverlay />
        <Analytics />
      </body>
    </html>
  );
}
