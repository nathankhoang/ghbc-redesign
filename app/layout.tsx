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
  title: "Golden Hill Boxing Club — Step Into the Ring",
  description:
    "Boxing, Muay Thai & Yoga in Golden Hill, San Diego. Beginners welcome. First class free — first month $99, no contract.",
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
