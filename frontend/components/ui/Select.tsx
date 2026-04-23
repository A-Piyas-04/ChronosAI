"use client"

import { SelectHTMLAttributes, forwardRef } from "react"
import { cn } from "@/lib/utils/cn"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const selectBase =
  "w-full px-3 py-2 text-sm pr-9 " +
  "bg-bg-surface text-text-primary " +
  "border border-border-default rounded-md shadow-xs " +
  "transition-all duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 " +
  "hover:border-border-strong " +
  "appearance-none cursor-pointer " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "dark:bg-bg-elevated dark:focus:ring-brand-500/30 dark:focus:border-brand-400"

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id, children, ...props }, ref) => {
    const selectId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              selectBase,
              error && "border-danger-border focus:ring-danger-text/20",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </div>
        {error && (
          <p className="text-xs text-danger-text mt-1">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"
