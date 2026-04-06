"use client"

import { Sidebar, Header } from "@/components/layout/sidebar"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { APP_VERSION } from "@/lib/version"

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
            <footer className="py-3 px-4 lg:px-6 text-center text-xs text-gray-400 border-t bg-white dark:bg-gray-900 dark:border-gray-800">
              <span className="font-mono">{APP_VERSION}</span>
              <span className="mx-2">•</span>
              <span>PMS Guest House</span>
            </footer>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  )
}
