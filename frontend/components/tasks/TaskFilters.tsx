"use client"

interface Filter {
  label: string
  value: string | undefined
}

const FILTERS: Filter[] = [
  { label: "All", value: undefined },
  { label: "Inbox", value: "inbox" },
  { label: "Scheduled", value: "scheduled" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
]

interface TaskFiltersProps {
  value: string | undefined
  onChange: (value: string | undefined) => void
}

export function TaskFilters({ value, onChange }: TaskFiltersProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex gap-2 flex-nowrap">
        {FILTERS.map((filter) => {
          const isActive = value === filter.value
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => onChange(filter.value)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {filter.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
