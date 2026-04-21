export type SessionType = "deep_work" | "mechanical" | "buffer" | "break"
export type SessionStatus =
  | "planned"
  | "completed"
  | "missed"
  | "skipped"
  | "partial"
  | "cancelled"

export interface ScheduleSessionResponse {
  id: string
  schedule_id: string
  task_id: string | null
  session_type: SessionType
  title: string
  planned_start_at: string
  planned_end_at: string
  planned_duration_minutes: number
  status: SessionStatus
  source: string
  position_index: number | null
}

export interface ScheduleResponse {
  id: string
  user_id: string
  week_start_date: string
  week_end_date: string
  generation_type: string
  status: string
  generated_at: string
  based_on_task_count: number | null
  based_on_event_count: number | null
  sessions: ScheduleSessionResponse[]
}

export interface ScheduleGenerateRequest {
  week_start_date: string
  generation_type?: string
}
