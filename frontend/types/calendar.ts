export interface ConnectedCalendarResponse {
  id: string
  provider: string
  calendar_id: string
  calendar_name: string | null
  is_primary: boolean
  sync_enabled: boolean
  last_synced_at: string | null
}

export interface CalendarSyncResponse {
  calendar_id: string
  events_synced: number
  last_synced_at: string
}

export interface UserPreferencesResponse {
  id: string
  user_id: string
  work_days: number[]
  work_start_time: string | null
  work_end_time: string | null
  productive_start_time: string | null
  productive_end_time: string | null
  deep_work_session_minutes: number
  short_break_minutes: number
  max_deep_work_sessions_per_day: number | null
  default_task_session_minutes: number
  allow_weekend_scheduling: boolean
  role_type: string | null
  created_at: string
  updated_at: string
}

export interface UserPreferencesUpdate {
  work_days?: number[]
  work_start_time?: string
  work_end_time?: string
  productive_start_time?: string
  productive_end_time?: string
  deep_work_session_minutes?: number
  short_break_minutes?: number
  max_deep_work_sessions_per_day?: number
  default_task_session_minutes?: number
  allow_weekend_scheduling?: boolean
  role_type?: string
}
