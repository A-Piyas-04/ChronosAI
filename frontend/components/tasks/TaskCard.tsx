"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/Badge"
import { useDeleteTask } from "@/lib/hooks/useTasks"
import { useToast } from "@/lib/providers/ToastProvider"
import { formatDisplayDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import type { TaskResponse } from "@/types/task"

interface TaskCardProps {
  task: TaskResponse
  onEdit: () => void
}

function PriorityLabel(priority: TaskResponse["priority"]): string {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

function TypeLabel(type: TaskResponse["task_type"]): string {
  if (type === "deep") return "Deep Work"
  if (type === "mechanical") return "Mechanical"
  return ""
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const deleteMutation = useDeleteTask()
  const { showToast } = useToast()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!confirmingDelete) return
    const t = setTimeout(() => setConfirmingDelete(false), 3000)
    return () => clearTimeout(t)
  }, [confirmingDelete])

  const isOverdue =
    !!task.deadline_at &&
    new Date(task.deadline_at) < new Date() &&
    task.status !== "completed"

  const isCompleted = task.status === "completed"

  const handleConfirmDelete = () => {
    deleteMutation.mutate(task.id, {
      onSuccess: () => showToast("Task deleted", "success"),
    })
    setConfirmingDelete(false)
  }

  const typeLabel = TypeLabel(task.task_type)

  return (
    <div
      className={cn(
        "bg-bg-surface rounded-lg border border-border-subtle shadow-xs",
        "hover:shadow-md hover:-translate-y-px hover:border-border-default",
        "transition-all duration-200 group p-4",
        isOverdue && "border-l-4 border-l-danger-border",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-semibold text-text-primary",
              "group-hover:text-brand-600 dark:group-hover:text-brand-400",
              "transition-colors duration-150",
              isCompleted && "line-through"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            <Badge variant={task.priority}>{PriorityLabel(task.priority)}</Badge>
            {typeLabel && (
              <Badge variant={task.task_type}>{typeLabel}</Badge>
            )}
            <Badge variant={task.status}>
              {task.status
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          {confirmingDelete ? (
            <div className="flex gap-1 animate-scale-in">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-2 h-7 rounded-md text-xs font-medium bg-danger-bg text-danger-text border border-danger-border hover:bg-red-100 dark:hover:bg-red-950 transition-all duration-150"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="px-2 h-7 rounded-md text-xs font-medium text-text-secondary hover:bg-bg-sunken transition-all duration-150"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                type="button"
                onClick={onEdit}
                aria-label="Edit task"
                className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-sunken rounded-md transition-all duration-150"
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                aria-label="Delete task"
                className="p-1.5 text-text-tertiary hover:text-danger-text hover:bg-bg-sunken rounded-md transition-all duration-150"
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
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div>
          {task.deadline_at && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-danger-text" : "text-text-secondary"
              )}
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    isOverdue
                      ? "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      : "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  }
                />
              </svg>
              <span>Due {formatDisplayDate(new Date(task.deadline_at))}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-text-tertiary">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{task.estimated_minutes} min</span>
        </div>
      </div>
    </div>
  )
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-bg-surface rounded-lg border border-border-subtle p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-2/3 rounded" />
          <div className="flex gap-1 mt-2">
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-3">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-3 w-16 rounded" />
      </div>
    </div>
  )
}
