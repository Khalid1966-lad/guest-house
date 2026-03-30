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
    icon: "/logo.svg",
  },
  openGraph: {
    title: "PMS Guest House - Gestion de Maisons d'Hôtes",
    description: "Solution SaaS complète pour la gestion de maisons d'hôtes",
    type: "website",
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
// force reload Tue Mar 24 15:30:19 UTC 2026
