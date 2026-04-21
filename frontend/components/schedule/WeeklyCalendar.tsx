"use client"

import { useRef, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import timeGridPlugin from "@fullcalendar/timegrid"
import dayGridPlugin from "@fullcalendar/daygrid"
import interactionPlugin from "@fullcalendar/interaction"
import { isAxiosError } from "axios"
import { Spinner } from "@/components/ui/Spinner"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { SessionCard } from "./SessionCard"
import { useSchedule } from "@/lib/hooks/useSchedule"
import { toISODateString } from "@/lib/utils/date"
import type { ScheduleSessionResponse } from "@/types/schedule"

interface WeeklyCalendarProps {
  weekStart: Date
}

function getSessionColor(sessionType: string): string {
  const colors: Record<string, string> = {
    deep_work: "#4f46e5",
    mechanical: "#0891b2",
    buffer: "#d97706",
    break: "#16a34a",
  }
  return colors[sessionType] ?? "#6b7280"
}

export function WeeklyCalendar({ weekStart }: WeeklyCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null)
  const weekStartStr = toISODateString(weekStart)
  const { data: schedule, isLoading, isError, error } = useSchedule(weekStartStr)

  useEffect(() => {
    calendarRef.current?.getApi().gotoDate(weekStart)
  }, [weekStart])

  const is404 =
    isError && isAxiosError(error) && error.response?.status === 404

  if (isLoading) {
    return (
      <div className="h-[600px] bg-gray-50 rounded-lg flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError && !is404) {
    return <ErrorMessage message="Failed to load schedule" />
  }

  const events =
    schedule?.sessions.map((session) => ({
      id: session.id,
      title: session.title,
      start: session.planned_start_at,
      end: session.planned_end_at,
      backgroundColor: getSessionColor(session.session_type),
      borderColor: getSessionColor(session.session_type),
      textColor: "#ffffff",
      extendedProps: { session },
    })) ?? []

  const hasNoSessions = is404 || !schedule?.sessions.length

  return (
    <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden">
      {hasNoSessions && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center bg-white/80 rounded-lg px-6 py-4">
            <p className="text-gray-400 text-sm font-medium">
              No schedule for this week.
            </p>
            <p className="text-gray-400 text-sm">
              Click Generate Schedule to get started.
            </p>
          </div>
        </div>
      )}

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
