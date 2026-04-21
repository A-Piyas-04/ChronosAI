import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getConnectedCalendars,
  getPreferences,
  syncCalendar,
  updatePreferences,
} from "@/lib/api/calendar"
import type { UserPreferencesUpdate } from "@/types/calendar"

export function useConnectedCalendars() {
  return useQuery({
    queryKey: ["connected-calendars"],
    queryFn: getConnectedCalendars,
  })
}

export function useSyncCalendar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => syncCalendar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["connected-calendars"] })
    },
  })
}

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: getPreferences,
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UserPreferencesUpdate) => updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["preferences"] })
    },
  })
}
