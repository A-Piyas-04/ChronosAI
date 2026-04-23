"use client"

import { cn } from "@/lib/utils/cn"
import type { TaskResponse } from "@/types/task"

interface Filter {
  label: string
  value: string | undefined
  statusKey?: TaskResponse["status"] | "all"
}

const FILTERS: Filter[] = [
  { label: "All", value: undefined, statusKey: "all" },
  { label: "Inbox", value: "inbox", statusKey: "inbox" },
  { label: "Scheduled", value: "scheduled", statusKey: "scheduled" },
  { label: "In Progress", value: "in_progress", statusKey: "in_progress" },
  { label: "Completed", value: "completed", statusKey: "completed" },
]

interface TaskFiltersProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
  counts?: Partial<Record<TaskResponse["status"] | "all", number>>
}

export function TaskFilters({ value, onChange, counts }: TaskFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {FILTERS.map((filter) => {
        const isActive = value === filter.value
        const count =
          filter.statusKey && counts ? counts[filter.statusKey] : undefined

        return (
          <button
            key={filter.label}
            type="button"
            onClick={() => onChange(filter.value)}
            className={cn(
              "flex-shrink-0 px-3.5 py-1.5 text-sm font-medium rounded-full",
              "transition-all duration-150 cursor-pointer border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
              "flex items-center gap-1.5",
              isActive
                ? cn(
                    "bg-brand-600 text-white border-brand-600 shadow-sm",
                    "dark:bg-brand-500/20 dark:text-brand-400 dark:border-brand-400/40 dark:glow-brand-sm"
                  )
                : "bg-bg-surface border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary hover:bg-bg-sunken"
            )}
          >
            <span>{filter.label}</span>
            {typeof count === "number" && (
              <span
                className={cn(
                  "text-[11px] font-medium",
                  isActive
                    ? "text-white/80 dark:text-brand-400/70"
                    : "text-text-tertiary"
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
