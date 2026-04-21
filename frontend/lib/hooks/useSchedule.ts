import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { generateSchedule, getSchedule } from "@/lib/api/schedule"
import type { ScheduleGenerateRequest } from "@/types/schedule"

export function useSchedule(weekStartDate: string) {
  return useQuery({
    queryKey: ["schedule", weekStartDate],
    queryFn: () => getSchedule(weekStartDate),
    retry: false,
    enabled: !!weekStartDate,
  })
}

export function useGenerateSchedule() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ScheduleGenerateRequest) => generateSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule"] })
    },
  })
}
