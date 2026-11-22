import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { connection } from "next/server";
import { ALLOW_INDEXING } from "@/lib/config";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Roots n Style Salon & Spa | Brampton, Ontario", template: "%s | Roots n Style" },
  description:
    "Hair, skin, brows and makeup in Brampton. Pick a service and a time online, and Roots n Style will confirm it by text or email.",
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
  applicationName: "Roots n Style",
};

export const viewport: Viewport = {
  themeColor: "#fbe9e0",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Waiting for the request makes every page dynamic, so proxy.ts can hand Next a fresh CSP nonce.
  await connection();
  return (
    <html lang="en-CA" className={`${display.variable} ${body.variable}`}>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
