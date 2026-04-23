"use client"

import { cn } from "@/lib/utils/cn"

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  labels?: string[]
}

export function StepIndicator({
  currentStep,
  totalSteps,
  labels,
}: StepIndicatorProps) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div className="flex items-start justify-center w-full max-w-md mx-auto mb-8">
      {steps.map((step, idx) => {
        const isCompleted = step < currentStep
        const isCurrent = step === currentStep
        const label = labels?.[idx]

        return (
          <div
            key={step}
            className={cn(
              "flex flex-col items-center relative",
              idx < steps.length - 1 ? "flex-1" : "flex-none"
            )}
          >
            <div className="flex items-center w-full">
              <div className="relative flex items-center justify-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors duration-200",
                    isCompleted && "bg-brand-500 border-brand-500",
                    isCurrent &&
                      "bg-bg-surface border-brand-500 dark:border-brand-400",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-bg-sunken border-border-default"
                  )}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4 text-white dark:text-bg-base"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-brand-500 dark:bg-brand-400" />
                  ) : (
                    <span className="text-xs font-medium text-text-tertiary">
                      {step}
                    </span>
                  )}
                </div>
                {isCurrent && (
                  <span className="absolute inset-0 rounded-full animate-ping bg-brand-500/30 dark:bg-brand-400/30 pointer-events-none" />
                )}
              </div>

              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 transition-all duration-500",
                    isCompleted ? "bg-brand-500" : "bg-border-default"
                  )}
                />
              )}
            </div>

            {label && (
              <span
                className={cn(
                  "text-xs mt-2 hidden sm:block whitespace-nowrap",
                  isCompleted || isCurrent
                    ? "text-text-primary font-medium"
                    : "text-text-tertiary"
                )}
              >
                {label}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
