import type {
  CalendarSyncResponse,
  ConnectedCalendarResponse,
  UserPreferencesResponse,
  UserPreferencesUpdate,
} from "@/types/calendar"
import { apiClient } from "./client"

export async function getConnectedCalendars(): Promise<ConnectedCalendarResponse[]> {
  const res = await apiClient.get<ConnectedCalendarResponse[]>("/api/v1/calendar/connected")
  return res.data
}

export async function syncCalendar(id: string): Promise<CalendarSyncResponse> {
  const res = await apiClient.post<CalendarSyncResponse>(`/api/v1/calendar/sync/${id}`)
  return res.data
}

export async function getPreferences(): Promise<UserPreferencesResponse> {
  const res = await apiClient.get<UserPreferencesResponse>("/api/v1/users/me/preferences")
  return res.data
}

export async function updatePreferences(
  data: UserPreferencesUpdate
): Promise<UserPreferencesResponse> {
  const res = await apiClient.patch<UserPreferencesResponse>(
    "/api/v1/users/me/preferences",
    data
  )
  return res.data
}
