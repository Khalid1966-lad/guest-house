import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PMS Guest House - Gestion de Maisons d'Hôtes",
    template: "%s | PMS Guest House",
  },
  description: "Solution SaaS complète pour la gestion de maisons d'hôtes. Réservations, facturation, clients, restaurant et statistiques en un seul outil.",
  keywords: ["PMS", "maison d'hôtes", "gestion hôtelière", "réservations", "facturation", "SaaS"],
  authors: [{ name: "PMS Guest House Team" }],
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "PMS Guest House - Gestion de Maisons d'Hôtes",
    description: "Solution SaaS complète pour la gestion de maisons d'hôtes. Réservations, facturation, clients, restaurant et statistiques en un seul outil.",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://pms-guesthouse.vercel.app",
    siteName: "PMS Guest House",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_APP_URL || "https://pms-guesthouse.vercel.app"}/og-image.png`,
        width: 1344,
        height: 768,
        alt: "PMS Guest House - Logiciel de gestion hôtelière",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PMS Guest House - Gestion de Maisons d'Hôtes",
    description: "Solution SaaS complète pour la gestion de maisons d'hôtes.",
    images: [`${process.env.NEXT_PUBLIC_APP_URL || "https://pms-guesthouse.vercel.app"}/og-image.png`],
  },
  other: {
    "application-name": "PMS Guest House",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
