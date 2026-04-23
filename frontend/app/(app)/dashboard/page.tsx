"use client"

import { useMemo, useState } from "react"
import { addDays, format } from "date-fns"
import { Button } from "@/components/ui/Button"
import { WeeklyCalendar } from "@/components/schedule/WeeklyCalendar"
import { GenerateScheduleModal } from "@/components/schedule/GenerateScheduleModal"
import { useSchedule } from "@/lib/hooks/useSchedule"
import { getCurrentWeekStart, toISODateString } from "@/lib/utils/date"

interface StatCardProps {
  value: string | number
  label: string
  icon: React.ReactNode
}

function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className="bg-bg-surface rounded-lg border border-border-subtle shadow-xs p-4 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        <p className="text-xs text-text-secondary mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
      <div className="w-8 h-8 rounded-md bg-brand-50 dark:bg-brand-100/10 flex items-center justify-center text-brand-500 dark:text-brand-400 shrink-0">
        {icon}
      </div>
    </div>
  )
}

function LegendDot({
  color,
  label,
}: {
  color: string
  label: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
      <span
        aria-hidden="true"
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  )
}

export default function DashboardPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getCurrentWeekStart
  )
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  const { data: schedule } = useSchedule(toISODateString(currentWeekStart))

  const stats = useMemo(() => {
    const sessions = schedule?.sessions ?? []
    const hoursPlanned =
      sessions.reduce(
        (sum, s) => sum + (s.planned_duration_minutes ?? 0),
        0
      ) / 60
    const deepCount = sessions.filter(
      (s) => s.session_type === "deep_work"
    ).length
    const taskIds = new Set<string>()
    for (const s of sessions) {
      if (s.task_id) taskIds.add(s.task_id)
    }
    return {
      sessionCount: sessions.length,
      hoursPlanned: hoursPlanned.toFixed(1),
      deepCount,
      tasksScheduled: taskIds.size,
    }
  }, [schedule])

  const prevWeek = () => setCurrentWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setCurrentWeekStart((d) => addDays(d, 7))

  const weekEnd = addDays(currentWeekStart, 6)
  const weekRangeLabel = `${format(currentWeekStart, "MMM d")} – ${format(
    weekEnd,
    "MMM d, yyyy"
  )}`
  const weekShortRange = `${format(currentWeekStart, "MMM d")} - ${format(
    weekEnd,
    "MMM d"
  )}`

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">This Week</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {weekRangeLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevWeek}
              aria-label="Previous week"
              className="w-8 h-8 p-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </Button>
            <span className="text-sm font-medium text-text-secondary min-w-[140px] text-center bg-bg-sunken rounded-md px-3 py-1.5">
              {weekShortRange}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextWeek}
              aria-label="Next week"
              className="w-8 h-8 p-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </Button>
          </div>

          <div className="w-px h-6 bg-border-default" />

          <Button
            variant="primary"
            onClick={() => setIsGenerateModalOpen(true)}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v4m0 0V4m0 4h4m-4 0H8m11 5v6a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6"
              />
            </svg>
            Generate Schedule
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          value={stats.sessionCount}
          label="Sessions"
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          }
        />
        <StatCard
          value={stats.hoursPlanned}
          label="Hours Planned"
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          value={stats.deepCount}
          label="Deep Work"
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          }
        />
        <StatCard
          value={stats.tasksScheduled}
          label="Tasks Scheduled"
          icon={
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="bg-bg-surface rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-semibold text-text-primary">
            Week Schedule
          </p>
          <div className="flex flex-wrap gap-4">
            <LegendDot color="var(--session-deep)" label="Deep Work" />
            <LegendDot color="var(--session-mechanical)" label="Mechanical" />
            <LegendDot color="var(--session-buffer)" label="Buffer" />
            <LegendDot color="var(--session-break)" label="Break" />
          </div>
        </div>

        <WeeklyCalendar
          weekStart={currentWeekStart}
          onGenerate={() => setIsGenerateModalOpen(true)}
        />
      </div>

      <GenerateScheduleModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        weekStart={currentWeekStart}
      />
    </div>
  )
}
