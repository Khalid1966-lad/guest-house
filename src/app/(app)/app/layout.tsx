"use client"

import { Sidebar, Header } from "@/components/layout/sidebar"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { AppFooter } from "@/components/layout/footer"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
          <Sidebar />
          <div className="lg:pl-64 flex-1 flex flex-col">
            <Header />
            <main className="p-4 lg:p-6 flex-1">
              {children}
            </main>
            <AppFooter />
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  )
}
