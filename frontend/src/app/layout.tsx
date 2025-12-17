// 'use client';

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "MOETrackIT - Revenue Monitor",
//   description: "Developed by GESUSoft Technology Ltd",
//   icons: {
//     icon: "/benue.png",
//   },
// };

export const metadata: Metadata = {
  title: "MOETrackIT - Revenue Monitor",
  description: "Developed by GESUSoft Technology Ltd",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/benue.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/benue.png", sizes: "180x180", type: "image/png" }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ErrorBoundary>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
