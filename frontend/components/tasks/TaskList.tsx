"use client"

import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { TaskCard } from "./TaskCard"
import { useTasks } from "@/lib/hooks/useTasks"
import type { TaskResponse } from "@/types/task"

interface TaskListProps {
  status?: string
  onEdit: (task: TaskResponse) => void
}

function SkeletonCard() {
  return <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <svg
        className="w-12 h-12 text-gray-300"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
        />
      </svg>
      <p className="font-medium text-gray-500">No tasks yet</p>
      <p className="text-sm text-gray-400">Add your first task to get started</p>
    </div>
  )
}

export function TaskList({ status, onEdit }: TaskListProps) {
  const { data: tasks, isLoading, isError } = useTasks({ status })

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (isError) {
    return <ErrorMessage message="Failed to load tasks" />
  }

  if (!tasks || tasks.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onEdit={() => onEdit(task)} />
      ))}
    </div>
  )
}
