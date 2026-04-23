"use client"

import { Badge } from "@/components/ui/Badge"
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

function sessionBadgeVariant(type: string): string {
  switch (type) {
    case "deep_work":
      return "deep"
    case "mechanical":
      return "mechanical"
    case "break":
      return "completed"
    default:
      return "default"
  }
}

export function SessionCard({ session }: SessionCardProps) {
  const startTime = formatTime(new Date(session.planned_start_at))
  const endTime = formatTime(new Date(session.planned_end_at))

  return (
    <div className="h-full overflow-visible rounded-[4px] flex flex-col justify-between p-1.5 relative group border-l-2 border-white/30">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold truncate leading-tight">
          {session.title}
        </p>
        <p className="text-[10px] opacity-70">
          {session.planned_duration_minutes} min
        </p>
      </div>

      <div className="absolute bottom-full left-0 mb-2 z-[9999] invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none">
        <div className="bg-bg-elevated border border-border-default shadow-lg rounded-lg p-3 w-52 text-left">
          <p className="text-sm font-semibold text-text-primary mb-1 break-words">
            {session.title}
          </p>
          <div className="mb-2">
            <Badge variant={sessionBadgeVariant(session.session_type)}>
              {formatSessionType(session.session_type)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span className="text-text-tertiary">Start</span>
            <span className="font-mono text-text-primary">{startTime}</span>
            <span className="text-text-tertiary">End</span>
            <span className="font-mono text-text-primary">{endTime}</span>
            <span className="text-text-tertiary">Duration</span>
            <span className="text-text-primary">
              {session.planned_duration_minutes} min
            </span>
            <span className="text-text-tertiary">Status</span>
            <span className="text-text-primary capitalize">
              {session.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
