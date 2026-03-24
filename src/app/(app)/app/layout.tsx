import { Sidebar, Header } from "@/components/layout/sidebar"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <Sidebar />
          <div className="lg:pl-64">
            <Header />
            <main className="p-4 lg:p-6">
              {children}
            </main>
          </div>
        </div>
      </ThemeProvider>
    </SessionProvider>
  )
}
