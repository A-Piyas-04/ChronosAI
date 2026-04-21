import { endOfWeek, format, startOfWeek } from "date-fns"

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 })
}

export function getWeekEnd(date: Date): Date {
  return endOfWeek(date, { weekStartsOn: 1 })
}

export function formatDisplayDate(date: Date): string {
  return format(date, "EEE, MMM d")
}

export function formatTime(date: Date): string {
  return format(date, "hh:mm a")
}

export function toISODateString(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function getCurrentWeekStart(): Date {
  return getWeekStart(new Date())
}
