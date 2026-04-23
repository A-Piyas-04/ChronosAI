"use client"

import {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  forwardRef,
} from "react"
import { cn } from "@/lib/utils/cn"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  required?: boolean
}

const inputBase =
  "w-full px-3 py-2 text-sm " +
  "bg-bg-surface text-text-primary " +
  "border border-border-default rounded-md shadow-xs " +
  "placeholder:text-text-tertiary " +
  "transition-all duration-150 " +
  "focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 " +
  "hover:border-border-strong " +
  "disabled:opacity-60 disabled:cursor-not-allowed " +
  "dark:bg-bg-elevated dark:focus:ring-brand-500/30 dark:focus:border-brand-400"

const inputError =
  "border-danger-border focus:ring-danger-text/20 focus:border-danger-border " +
  "hover:border-danger-border"

function ErrorIcon() {
  return (
    <svg
      className="w-3 h-3 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
  )
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, required, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary flex items-center gap-1"
          >
            {label}
            {required && <span className="text-danger-text">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={!!error}
            className={cn(inputBase, error && inputError, className)}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-danger-text flex items-center gap-1 mt-1">
            <ErrorIcon />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId =
      id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined)

    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          className={cn(
            inputBase,
            "resize-none min-h-[80px]",
            error && inputError,
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-danger-text flex items-center gap-1 mt-1">
            <ErrorIcon />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"
