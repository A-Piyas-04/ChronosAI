import type { Metadata } from "next"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import { ThemeProvider } from "@/lib/providers/ThemeProvider"
import { ToastProvider } from "@/lib/providers/ToastProvider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Chronos AI",
  description: "AI-powered time scheduling",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <ToastProvider>
            <QueryProvider>{children}</QueryProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
