"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type ToastVariant = "success" | "error" | "info"

interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      showToast: () => {
        /* noop when no provider */
      },
    }
  }
  return ctx
}

function Icon({ variant }: { variant: ToastVariant }) {
  if (variant === "success") {
    return (
      <svg
        className="w-5 h-5 text-success-text shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )
  }
  if (variant === "error") {
    return (
      <svg
        className="w-5 h-5 text-danger-text shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
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
  return (
    <svg
      className="w-5 h-5 text-brand-500 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  )
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem
  onDismiss: (id: number) => void
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div
      role="status"
      className="animate-slide-up bg-bg-elevated border border-border-default rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[260px] max-w-sm"
    >
      <Icon variant={toast.variant} />
      <p className="text-sm text-text-primary flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-text-tertiary hover:text-text-primary transition-colors duration-150"
        aria-label="Dismiss notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, variant }])
    },
    []
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col gap-2 pointer-events-auto">
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}
