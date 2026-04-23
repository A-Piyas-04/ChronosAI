"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import { TaskList } from "@/components/tasks/TaskList"
import { TaskForm } from "@/components/tasks/TaskForm"
import { useTasks } from "@/lib/hooks/useTasks"
import type { TaskResponse } from "@/types/task"

export default function TasksPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null)

  const { data: allTasks } = useTasks()

  const counts = useMemo(() => {
    const c: Partial<Record<TaskResponse["status"] | "all", number>> = {
      all: allTasks?.length ?? 0,
    }
    if (allTasks) {
      for (const t of allTasks) {
        c[t.status] = (c[t.status] ?? 0) + 1
      }
    }
    return c
  }, [allTasks])

  const scheduledCount =
    (counts.scheduled ?? 0) + (counts.in_progress ?? 0)
  const totalCount = allTasks?.length ?? 0

  const handleAddTask = () => {
    setEditingTask(null)
    setIsFormOpen(true)
  }

  const handleEditTask = (task: TaskResponse) => {
    setEditingTask(task)
    setIsFormOpen(true)
  }

  const handleCloseModal = () => {
    setIsFormOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-start gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Task Inbox</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {totalCount} {totalCount === 1 ? "task" : "tasks"}
            {" · "}
            {scheduledCount} scheduled
          </p>
        </div>
        <Button variant="primary" onClick={handleAddTask}>
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

      <div className="mb-4">
        <TaskFilters
          value={selectedStatus}
          onChange={setSelectedStatus}
          counts={counts}
        />
      </div>

      <TaskList
        status={selectedStatus}
        onEdit={handleEditTask}
        onAddTask={handleAddTask}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={handleCloseModal}
        title={editingTask ? "Edit Task" : "Add Task"}
      >
        <TaskForm task={editingTask ?? undefined} onClose={handleCloseModal} />
      </Modal>
    </div>
  )
}
