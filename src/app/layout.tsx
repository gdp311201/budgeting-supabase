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
        style={{ backgroundColor: '#d8b0c0' }}
      >
        {/* PWA Loading Screen — tampil sebelum React hydrate */}
        <div id="pwa-loading" style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#d8b0c0',
          transition: 'opacity 0.3s ease',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem', animation: 'pulseGlow 2s ease-in-out infinite' }}>🐘</div>
          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.05em' }}>
            Budgeting Master Sync
          </p>
          <div style={{
            marginTop: '1rem',
            width: '1.5rem',
            height: '1.5rem',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTopColor: 'rgba(255,255,255,0.8)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulseGlow {
              0%, 100% { transform: scale(1); filter: drop-shadow(0 0 15px rgba(255,255,255,0.5)); }
              50% { transform: scale(1.06); filter: drop-shadow(0 0 25px rgba(255,192,203,0.9)); }
            }
          `
        }} />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Hide loading screen once React hydrates
            window.addEventListener('load', function() {
              setTimeout(function() {
                var el = document.getElementById('pwa-loading');
                if (el) {
                  el.style.opacity = '0';
                  setTimeout(function() { el.style.display = 'none'; }, 300);
                }
              }, 100);
            });
          `
        }} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
