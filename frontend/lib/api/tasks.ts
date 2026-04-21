import type { TaskCreate, TaskResponse, TaskUpdate } from "@/types/task"
import { apiClient } from "./client"

export async function getTasks(params?: {
  status?: string
  skip?: number
  limit?: number
}): Promise<TaskResponse[]> {
  const res = await apiClient.get<TaskResponse[]>("/api/v1/tasks", { params })
  return res.data
}

export async function getTask(id: string): Promise<TaskResponse> {
  const res = await apiClient.get<TaskResponse>(`/api/v1/tasks/${id}`)
  return res.data
}

export async function createTask(data: TaskCreate): Promise<TaskResponse> {
  const res = await apiClient.post<TaskResponse>("/api/v1/tasks", data)
  return res.data
}

export async function updateTask(id: string, data: TaskUpdate): Promise<TaskResponse> {
  const res = await apiClient.patch<TaskResponse>(`/api/v1/tasks/${id}`, data)
  return res.data
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/v1/tasks/${id}`)
}
