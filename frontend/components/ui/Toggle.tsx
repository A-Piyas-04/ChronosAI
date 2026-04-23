"use client"

import { forwardRef, InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils/cn"

interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?: string
  description?: string
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ label, description, checked, className, id, ...props }, ref) => {
    const toggleId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <label
        htmlFor={toggleId}
        className={cn(
          "flex items-center gap-3 cursor-pointer select-none",
          className
        )}
      >
        <span className="relative inline-block">
          <input
            id={toggleId}
            ref={ref}
            type="checkbox"
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "block w-9 h-5 rounded-full transition-colors duration-200",
              "bg-border-strong peer-checked:bg-brand-500",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg-surface",
              "dark:peer-checked:bg-brand-400"
            )}
          />
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm",
              "transition-transform duration-200 ease-spring",
              "peer-checked:translate-x-4"
            )}
          />
        </span>
        {label && (
          <span className="flex-1">
            <span className="text-sm text-text-primary block">{label}</span>
            {description && (
              <span className="text-xs text-text-tertiary block mt-0.5">
                {description}
              </span>
            )}
          </span>
        )}
      </label>
    )
  }
)

Toggle.displayName = "Toggle"
