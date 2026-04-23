"use client"

import { cn } from "@/lib/utils/cn"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showText?: boolean
}

const iconSize: Record<"sm" | "md" | "lg", string> = {
  sm: "w-6 h-6",
  md: "w-7 h-7",
  lg: "w-9 h-9",
}

const textSize: Record<"sm" | "md" | "lg", string> = {
  sm: "text-base",
  md: "text-lg",
  lg: "text-2xl",
}

export function Logo({ size = "md", className, showText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        className={cn(
          iconSize[size],
          "text-brand-600 dark:text-brand-500 dark:drop-shadow-[0_0_8px_rgba(0,229,229,0.5)]"
        )}
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="13"
          stroke="currentColor"
          strokeWidth="2.2"
          fill="none"
        />
        <path
          d="M16 8v8l5 3"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="16" cy="16" r="1.6" fill="currentColor" />
      </svg>
      {showText && (
        <span
          className={cn(
            textSize[size],
            "font-bold tracking-tight",
            "text-text-primary dark:text-brand-500 dark:text-glow"
          )}
        >
          Chronos
        </span>
      )}
    </div>
  )
}
