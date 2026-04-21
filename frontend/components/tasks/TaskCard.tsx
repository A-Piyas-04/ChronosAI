"use client"

import { Badge } from "@/components/ui/Badge"
import { useDeleteTask } from "@/lib/hooks/useTasks"
import { formatDisplayDate } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import type { TaskResponse } from "@/types/task"

interface TaskCardProps {
  task: TaskResponse
  onEdit: () => void
}

export function TaskCard({ task, onEdit }: TaskCardProps) {
  const deleteMutation = useDeleteTask()

  const isOverdue =
    !!task.deadline_at &&
    new Date(task.deadline_at) < new Date() &&
    task.status !== "completed"

  const isCompleted = task.status === "completed"

  const handleDelete = () => {
    if (window.confirm("Delete this task?")) {
      deleteMutation.mutate(task.id)
    }
  }

  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow",
        isOverdue && "border-l-4 border-l-red-500",
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "text-sm font-medium text-gray-900 truncate",
              isCompleted && "line-through"
            )}
          >
            {task.title}
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            <Badge variant={task.priority}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge variant={task.task_type}>
              {task.task_type === "deep"
                ? "Deep Work"
                : task.task_type.charAt(0).toUpperCase() + task.task_type.slice(1)}
            </Badge>
            <Badge variant={task.status}>
              {task.status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </Badge>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded"
            aria-label="Edit task"
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
            onClick={handleDelete}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
            aria-label="Delete task"
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
      </div>

      <div className="flex justify-between items-center mt-2">
        <div>
          {task.deadline_at && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-red-600" : "text-gray-500"
              )}
            >
              <svg
                className="w-3 h-3"
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
              <span>Due {formatDisplayDate(new Date(task.deadline_at))}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <svg
            className="w-3 h-3"
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
