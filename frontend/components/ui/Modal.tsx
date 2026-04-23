"use client"

import { useEffect } from "react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        document.body.style.overflow = prevOverflow
      }
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-bg-overlay backdrop-blur-sm animate-fade-in flex items-center justify-center p-4"
      onClick={onClose}
      aria-hidden="false"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-bg-elevated rounded-xl shadow-xl border border-border-subtle animate-scale-in dark:ring-1 dark:ring-brand-400/10 max-h-[90vh] overflow-hidden flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border-subtle shrink-0">
          <h2
            id="modal-title"
            className="text-base font-semibold text-text-primary"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center text-text-tertiary hover:bg-bg-sunken hover:text-text-primary transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            aria-label="Close modal"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
