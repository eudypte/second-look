import type { Metadata, Viewport } from "next";
import { Overpass } from "next/font/google";
import "./globals.css";

const overpass = Overpass({
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
  variable: "--font-overpass",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Second Look | Check a worrying text message",
  description:
    "Paste a suspicious text message and get a calm, plain-English second look at the warning signs.",
  openGraph: {
    title: "Second Look",
    description:
      "A calm, plain-English second look at suspicious text messages.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c2226",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={overpass.variable}>
      <body>{children}</body>
    </html>
  );
}
