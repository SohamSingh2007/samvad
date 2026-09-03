import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontSerif = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Samvad - Video Meetings for the Deaf & Speech-Impaired",
  description: "Real-time sign language recognition, text-to-speech, and speech-to-text video conferencing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable} antialiased h-full`}>
      <body className="min-h-full flex flex-col font-sans bg-stone-50 text-stone-900">{children}</body>
    </html>
  );
}
