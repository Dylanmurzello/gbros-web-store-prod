import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gbros - Premium Awards & Custom Trophies | Carson, CA",
  description: "Custom trophies, plaques, and medals for sports awards and corporate recognition. Professional engraving services. Based in Carson, California.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server Component - can access env vars directly
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  return (
    <html lang="en" className="h-full bg-white">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/images/logos/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/images/logos/logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-white`}
      >
        {/* ARCHITECTURE FIX: 2025-09-30 - Wrapped in ErrorBoundary via ClientLayout 🛡️ */}
        <ClientLayout googleClientId={googleClientId}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
