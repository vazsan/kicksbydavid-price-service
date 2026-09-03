import type { Metadata, Viewport } from "next";
import { Anton, Fraunces, Inter } from "next/font/google";
import "./globals.css";

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic", "normal"],
  weight: ["300", "400", "500"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Air Jordan IV · Retro — The Icon, Reissued",
  description:
    "A museum-grade reissue of the Air Jordan 4 Retro. Visible mesh, molded wings, the signature Jumpman — reintroduced as a limited artifact for those who collect the culture, not just the shoe.",
  keywords: [
    "Air Jordan 4",
    "Jordan Retro",
    "Air Jordan 4 Retro",
    "limited sneaker drop",
    "Jumpman",
  ],
  openGraph: {
    title: "Air Jordan IV · Retro — The Icon, Reissued",
    description:
      "A museum-grade reissue of the Air Jordan 4 Retro. Limited artifact, engineered for legacy.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0908",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${anton.variable} ${fraunces.variable} ${inter.variable}`}
    >
      <body className="font-sans">
        <div className="film-grain bg-grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
