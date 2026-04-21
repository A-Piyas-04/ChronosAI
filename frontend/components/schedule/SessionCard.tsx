"use client"

import { formatTime } from "@/lib/utils/date"
import type { ScheduleSessionResponse } from "@/types/schedule"

interface SessionCardProps {
  session: ScheduleSessionResponse
}

function formatSessionType(type: string): string {
  return type
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function SessionCard({ session }: SessionCardProps) {
  const startTime = formatTime(new Date(session.planned_start_at))
  const endTime = formatTime(new Date(session.planned_end_at))

  return (
    <div className="relative group w-full h-full">
      <div className="overflow-hidden w-full h-full p-1">
        <p className="text-xs font-medium truncate leading-tight">
          {session.title}
        </p>
        <p className="text-xs opacity-80">{session.planned_duration_minutes} min</p>
      </div>

      <div className="absolute bottom-full left-0 mb-1 z-50 invisible group-hover:visible pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-md p-2 w-48 shadow-lg">
          <p className="font-medium mb-1">{session.title}</p>
          <p className="opacity-80 mb-1">{formatSessionType(session.session_type)}</p>
          <p className="opacity-70">
            Planned: {startTime} &ndash; {endTime}
          </p>
          <p className="opacity-70">Duration: {session.planned_duration_minutes} min</p>
          <p className="opacity-70">Status: {session.status}</p>
        </div>
      </div>
    </div>
  )
}
