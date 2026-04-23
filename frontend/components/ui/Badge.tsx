"use client"

import { cn } from "@/lib/utils/cn"

interface BadgeProps {
  variant: string
  children: React.ReactNode
  className?: string
}

const base =
  "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full " +
  "border transition-colors duration-150"

const colorMap: Record<string, string> = {
  urgent: "bg-danger-bg text-danger-text border-danger-border",
  high: "bg-warning-bg text-warning-text border-warning-border",
  medium:
    "bg-brand-50 text-brand-600 border-brand-200 " +
    "dark:bg-brand-100/10 dark:text-brand-400 dark:border-brand-200/20",
  low: "bg-bg-sunken text-text-secondary border-border-subtle",
  deep:
    "bg-brand-50 text-brand-700 border-brand-200 " +
    "dark:bg-brand-100/10 dark:text-brand-400 dark:border-brand-200/20",
  mechanical: "bg-info-bg text-info-text border-info-border",
  unspecified: "bg-bg-sunken text-text-secondary border-border-subtle",
  completed: "bg-success-bg text-success-text border-success-border",
  scheduled:
    "bg-brand-50 text-brand-600 border-brand-100 " +
    "dark:bg-brand-100/10 dark:text-brand-400 dark:border-brand-200/20",
  in_progress: "bg-info-bg text-info-text border-info-border",
  inbox: "bg-bg-sunken text-text-tertiary border-border-subtle",
  deferred: "bg-bg-sunken text-text-secondary border-border-subtle",
  cancelled: "bg-bg-sunken text-text-tertiary border-border-subtle",
  default: "bg-bg-sunken text-text-secondary border-border-subtle",
}

export function Badge({ variant, children, className }: BadgeProps) {
  const colorClass = colorMap[variant] ?? colorMap.default
  return <span className={cn(base, colorClass, className)}>{children}</span>
}
