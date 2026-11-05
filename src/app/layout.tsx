import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Budgeting Master Sync — Personal Finance Tracker",
  description:
    "Personal budgeting app with beautiful themes, smart categorization, and detailed cashflow tracking. Built with Next.js + Supabase.",
  keywords: [
    "budgeting",
    "finance",
    "personal finance",
    "expense tracker",
    "budget tracker",
    "Next.js",
    "Supabase",
  ],
  authors: [{ name: "Budgeting Master Sync" }],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Budgeting",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Budgeting Master Sync",
    description: "Personal budgeting app with beautiful themes & smart tracking",
    siteName: "Budgeting Master Sync",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Budgeting Master Sync",
    description: "Personal budgeting app with beautiful themes & smart tracking",
  },
};

export const viewport: Viewport = {
  themeColor: "#ec4899",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
