import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Second Look",
  description: "A second look at suspicious text messages.",
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
