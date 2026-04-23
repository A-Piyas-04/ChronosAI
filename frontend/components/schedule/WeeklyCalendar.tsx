"use client"

import { useRef, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { useTheme } from "next-themes"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/Button"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { SessionCard } from "./SessionCard"
import { useSchedule } from "@/lib/hooks/useSchedule"
import { toISODateString } from "@/lib/utils/date"
import type { ScheduleSessionResponse } from "@/types/schedule"

interface WeeklyCalendarProps {
  weekStart: Date
  onGenerate?: () => void
}

function getSessionColor(sessionType: string, isDark: boolean): string {
  if (isDark) {
    const dark: Record<string, string> = {
      deep_work: "#818CF8",
      mechanical: "#38BDF8",
      buffer: "#FBBF24",
      break: "#4ADE80",
    }
    return dark[sessionType] ?? "#64748B"
  }
  const light: Record<string, string> = {
    deep_work: "#6340F0",
    mechanical: "#0284C7",
    buffer: "#D97706",
    break: "#16A34A",
  }
  return light[sessionType] ?? "#6B7280"
}

function CalendarSkeleton() {
  return (
    <div className="h-[600px] skeleton rounded-lg" aria-label="Loading schedule" />
  )
}

function EmptyCalendar({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-100/10 flex items-center justify-center mb-4 relative">
        <svg
          className="w-10 h-10 text-brand-500 dark:text-brand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
          />
        </svg>
        <svg
          className="absolute -right-1 -top-1 w-6 h-6 text-brand-500 dark:text-brand-400"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M13 2L3 14h7v8l10-12h-7V2z" />
        </svg>
      </div>
      <p className="text-base font-semibold text-text-primary">
        No schedule yet
      </p>
      <p className="text-sm text-text-secondary mt-1 max-w-sm">
        Generate your first schedule to see sessions here.
      </p>
      {onGenerate && (
        <Button variant="primary" className="mt-5" onClick={onGenerate}>
          Generate Schedule
        </Button>
      )}
    </div>
  )
}

export function WeeklyCalendar({ weekStart, onGenerate }: WeeklyCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const weekStartStr = toISODateString(weekStart)
  const { data: schedule, isLoading, isError, error } = useSchedule(weekStartStr)
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(weekStart)
  }, [weekStart])

  const is404 =
    isError && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return <CalendarSkeleton />
  }

  if (isError && !is404) {
    return <ErrorMessage message="Failed to load schedule" />
  }

  const hasNoSessions = is404 || !schedule?.sessions.length

  if (hasNoSessions) {
    return <EmptyCalendar onGenerate={onGenerate} />
  }

  const events =
    schedule?.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      start: session.planned_start_at,
      end: session.planned_end_at,
      backgroundColor: getSessionColor(session.session_type, isDark),
      borderColor: getSessionColor(session.session_type, isDark),
      textColor: "#ffffff",
      extendedProps: { session },
    })) ?? []

  return (
    <div className="p-2">
      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={false}
        initialDate={weekStart}
        allDaySlot={false}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        height="auto"
        firstDay={1}
        nowIndicator={true}
        weekends={false}
        events={events}
        eventContent={(arg) => (
          <SessionCard
            session={arg.event.extendedProps.session as ScheduleSessionResponse}
          />
        )}
      />
    </div>
  )
}
