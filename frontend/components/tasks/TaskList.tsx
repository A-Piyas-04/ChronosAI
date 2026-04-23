"use client"

import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Button } from "@/components/ui/Button"
import { TaskCard, TaskCardSkeleton } from "./TaskCard"
import { useTasks } from "@/lib/hooks/useTasks"
import type { TaskResponse } from "@/types/task"

interface TaskListProps {
  status?: string
  onEdit: (task: TaskResponse) => void
  onAddTask: () => void
}

function EmptyState({ onAddTask }: { onAddTask: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-100/10 flex items-center justify-center mb-4">
        <svg
          className="w-10 h-10 text-brand-500 dark:text-brand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 12h6l2 3h4l2-3h4M3 12v6a2 2 0 002 2h14a2 2 0 002-2v-6M3 12l3-7h12l3 7"
          />
        </svg>
      </div>
      <p className="text-base font-semibold text-text-primary">
        Your inbox is clear
      </p>
      <p className="text-sm text-text-secondary mt-1 max-w-sm">
        Add tasks to let Chronos schedule your week.
      </p>
      <Button variant="primary" className="mt-5" onClick={onAddTask}>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Task
      </Button>
    </div>
  )
}

export function TaskList({ status, onEdit, onAddTask }: TaskListProps) {
  const { data: tasks, isLoading, isError } = useTasks({ status })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <TaskCardSkeleton />
        <TaskCardSkeleton />
        <TaskCardSkeleton />
      </div>
    )
  }

  if (isError) {
    return <ErrorMessage message="Failed to load tasks" />
  }

  if (!tasks || tasks.length === 0) {
    return <EmptyState onAddTask={onAddTask} />
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <div
          key={task.id}
          className="animate-slide-up opacity-0 [animation-fill-mode:forwards]"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <TaskCard task={task} onEdit={() => onEdit(task)} />
        </div>
      ))}
    </div>
  )
}
