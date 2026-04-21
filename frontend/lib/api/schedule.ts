import type { ScheduleGenerateRequest, ScheduleResponse } from "@/types/schedule"
import { apiClient } from "./client"

export async function generateSchedule(
  data: ScheduleGenerateRequest
): Promise<ScheduleResponse> {
  const res = await apiClient.post<ScheduleResponse>("/api/v1/schedule/generate", data)
  return res.data
}

export async function getSchedule(weekStartDate: string): Promise<ScheduleResponse> {
  const res = await apiClient.get<ScheduleResponse>("/api/v1/schedule", {
    params: { week_start_date: weekStartDate },
  })
  return res.data
}

export async function getScheduleById(id: string): Promise<ScheduleResponse> {
  const res = await apiClient.get<ScheduleResponse>(`/api/v1/schedule/${id}`)
  return res.data
}
