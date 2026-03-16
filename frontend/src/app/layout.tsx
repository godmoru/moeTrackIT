// 'use client';

import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import "../fonts/geist.css";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = {
  variable: "--font-geist-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
};

export const metadata: Metadata = {
  title: "MOETrackIT - Revenue Monitor",
  description: "Developed by GESUSoft Technology Ltd",
  icons: {
    icon: [
      { url: "/benue.png", sizes: "any" },
      { url: "/benue.png", sizes: "32x32", type: "image/png" }
    ],
    shortcut: "/benue.png",
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
