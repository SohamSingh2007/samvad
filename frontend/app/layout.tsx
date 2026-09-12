import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastContainer } from "@/samvadComponents/toastMessage";

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
    <html lang="en" className={`${fontSans.variable} ${fontSerif.variable} antialiased h-full`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ToastContainer position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
