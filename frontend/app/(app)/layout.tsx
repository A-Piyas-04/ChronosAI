import { Sidebar } from "@/components/ui/Sidebar"
import { Logo } from "@/components/ui/Logo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Sidebar />
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 z-30 bg-bg-surface border-b border-border-subtle flex items-center justify-between px-4">
        <Logo size="sm" />
        <ThemeToggle />
      </header>
      <main className="md:ml-60 min-h-screen bg-bg-base pt-14 md:pt-0 page-enter">
        {children}
      </main>
    </div>
  )
}
