"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { TaskFilters } from "@/components/tasks/TaskFilters"
import { TaskList } from "@/components/tasks/TaskList"
import { TaskForm } from "@/components/tasks/TaskForm"
import type { TaskResponse } from "@/types/task"

export default function TasksPage() {
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  )
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null)

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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Task Inbox</h1>
        <Button variant="primary" onClick={handleAddTask}>
          Add Task
        </Button>
      </div>

      <div className="mb-4">
        <TaskFilters value={selectedStatus} onChange={setSelectedStatus} />
      </div>

      <TaskList status={selectedStatus} onEdit={handleEditTask} />

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
