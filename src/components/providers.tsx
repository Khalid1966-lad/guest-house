"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
