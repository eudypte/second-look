import type { Metadata } from "next";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
