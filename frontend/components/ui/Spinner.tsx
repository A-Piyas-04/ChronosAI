"use client"

import { cn } from "@/lib/utils/cn"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap: Record<"sm" | "md" | "lg", string> = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
}

export function Spinner({ size = "md", className }: SpinnerProps) {
  return (
    <svg
      className={cn("animate-spin", sizeMap[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={3}
        className="text-border-default opacity-30"
      />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        className="text-brand-500 dark:text-brand-400"
      />
    </svg>
  )
}
