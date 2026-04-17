"use client"

import { Sidebar, Header } from "@/components/layout/sidebar"
import { AppFooter } from "@/components/layout/footer"
import { SubscriptionBanner } from "@/components/subscription/subscription-banner"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { useSidebarStore } from "@/stores/sidebar-store"
import { cn } from "@/lib/utils"

function AppContent({ children }: { children: React.ReactNode }) {
  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <Sidebar />
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        collapsed ? "lg:pl-[68px]" : "lg:pl-64"
      )}>
        <Header />
        <SubscriptionBanner />
        <main className="p-4 lg:p-6 flex-1">
          {children}
        </main>
        <AppFooter />
      </div>
    </div>
  )
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider refetchOnWindowFocus={true} refetchInterval={5 * 60 * 1000}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AppContent>{children}</AppContent>
      </ThemeProvider>
    </SessionProvider>
  )
}
