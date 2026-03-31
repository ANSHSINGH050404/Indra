import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BookmarksProvider } from "@/context/BookmarksContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "sonner";
import ActivityTicker from "@/components/ActivityTicker";
import { Analytics } from "@vercel/analytics/next"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "INDRA",
  description: "Advanced Prediction Markets",
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
        <AuthProvider>
          <BookmarksProvider>
            <ActivityTicker />
            <Navbar />
            {children}
            <Analytics />
            <Toaster richColors position="top-right" theme="dark" />
          </BookmarksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
