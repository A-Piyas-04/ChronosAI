import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { QueryProvider } from "@/lib/providers/QueryProvider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

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
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
