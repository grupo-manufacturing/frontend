import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ChatDock from "./components/chat/ChatDock";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Groupo - One-Stop AI Manufacturing Platform",
  description: "Your complete AI-powered manufacturing solution connecting buyers, manufacturers, and designers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        {/* Global chat dock for portals */}
        {/* @ts-expect-error Server Component imports Client Component */}
        <ChatDock />
      </body>
    </html>
  );
}
