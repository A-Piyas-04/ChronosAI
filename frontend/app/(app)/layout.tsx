import { Sidebar } from "@/components/ui/Sidebar"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <Sidebar />
      <main className="ml-60 min-h-screen bg-gray-50">{children}</main>
    </div>
  )
}
