export type TaskPriority = "low" | "medium" | "high" | "urgent"
export type TaskType = "deep" | "mechanical" | "unspecified"
export type TaskStatus =
  | "inbox"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "deferred"
  | "cancelled"
export type PreferredTimeOfDay = "morning" | "afternoon" | "evening"

export interface TaskResponse {
  id: string
  user_id: string
  title: string
  description: string | null
  estimated_minutes: number
  deadline_at: string | null
  priority: TaskPriority
  task_type: TaskType
  classification_source: string
  status: TaskStatus
  is_flexible: boolean
  preferred_time_of_day: PreferredTimeOfDay | null
  earliest_start_at: string | null
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  estimated_minutes: number
  deadline_at?: string
  priority?: TaskPriority
  task_type?: TaskType
  preferred_time_of_day?: PreferredTimeOfDay
  earliest_start_at?: string
  is_flexible?: boolean
}

export interface TaskUpdate extends Partial<TaskCreate> {
  status?: TaskStatus
}
