"use client"

import { ButtonHTMLAttributes, forwardRef } from "react"
import { Spinner } from "./Spinner"
import { cn } from "@/lib/utils/cn"

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md " +
  "transition-all duration-200 ease-in-out " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface " +
  "active:scale-[0.97] " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none " +
  "select-none"

const sizeClasses: Record<"sm" | "md" | "lg", string> = {
  sm: "px-3 py-1.5 text-xs h-8",
  md: "px-4 py-2 text-sm h-9",
  lg: "px-5 py-2.5 text-sm h-10",
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 hover:shadow-md " +
    "dark:bg-brand-500 dark:text-bg-base dark:hover:bg-brand-400 " +
    "dark:hover:glow-brand-sm",
  secondary:
    "bg-bg-surface text-text-primary border border-border-default shadow-xs " +
    "hover:bg-bg-sunken hover:border-border-strong hover:shadow-sm",
  danger:
    "bg-danger-bg text-danger-text border border-danger-border " +
    "hover:bg-red-100 dark:hover:bg-red-950",
  ghost:
    "bg-transparent text-text-secondary " +
    "hover:bg-bg-sunken hover:text-text-primary",
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    children,
    className,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(base, sizeClasses[size], variantClasses[variant], className)}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
})
