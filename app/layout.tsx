import type { Metadata } from "next";
import { Anton, Oswald, Inter, DM_Serif_Display } from "next/font/google";
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

export const metadata: Metadata = {
  // Short-form of the hero headline ("We're not just in your corner. We ARE your corner.")
  title: "Golden Hill Boxing Club — We Are Your Corner",
  description:
    "Boxing, Muay Thai & Yoga in Golden Hill, San Diego. Beginners welcome. $99 first month, then $125/mo — no contract.",
  icons: { icon: "/favicon.ico" },
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
      </body>
    </html>
  );
}
