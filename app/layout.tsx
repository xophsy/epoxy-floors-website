import type { Metadata } from "next";
import { Geist, Space_Grotesk, Bodoni_Moda } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["600"],
});

export const metadata: Metadata = {
  title: {
    default: "Golden Epoxy | Premium Epoxy Flooring in Tampa Bay",
    template: "%s | Golden Epoxy",
  },
  description:
    "Golden Epoxy installs premium residential, commercial, and industrial epoxy floors across Tampa Bay. Free quotes, lifetime residential warranty, and metallic and flake finishes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${spaceGrotesk.variable} ${bodoniModa.variable} antialiased`}>{children}</body>
    </html>
  );
}
