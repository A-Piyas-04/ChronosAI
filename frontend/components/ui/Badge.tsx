"use client"

interface BadgeProps {
  variant: string
  children: React.ReactNode
}

const colorMap: Record<string, string> = {
  urgent: "bg-red-100 text-red-800",
  high: "bg-orange-100 text-orange-800",
  medium: "bg-yellow-100 text-yellow-800",
  low: "bg-gray-100 text-gray-600",
  deep: "bg-indigo-100 text-indigo-800",
  mechanical: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  scheduled: "bg-purple-100 text-purple-800",
  inbox: "bg-gray-100 text-gray-700",
}

export function Badge({ variant, children }: BadgeProps) {
  const colorClass = colorMap[variant] ?? "bg-gray-100 text-gray-600"
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {children}
    </span>
  )
}
