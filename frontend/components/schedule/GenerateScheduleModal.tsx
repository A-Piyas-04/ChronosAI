"use client"

import { useEffect, useState } from "react"
import { addDays, format } from "date-fns"
import { isAxiosError } from "axios"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { useGenerateSchedule, useSchedule } from "@/lib/hooks/useSchedule"
import { useToast } from "@/lib/providers/ToastProvider"
import { getWeekStart, toISODateString } from "@/lib/utils/date"

interface GenerateScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  weekStart: Date
}

export function GenerateScheduleModal({
  isOpen,
  onClose,
  weekStart,
}: GenerateScheduleModalProps) {
  const [selectedWeek, setSelectedWeek] = useState<Date>(() =>
    getWeekStart(weekStart)
  )

  useEffect(() => {
    if (isOpen) {
      setSelectedWeek(getWeekStart(weekStart))
    }
  }, [isOpen, weekStart])

  const weekStartStr = toISODateString(selectedWeek)
  const { data: existingSchedule } = useSchedule(weekStartStr)
  const generateSchedule = useGenerateSchedule()
  const { showToast } = useToast()

  const generationType = existingSchedule ? "manual_replan" : "initial"
  const weekEnd = addDays(selectedWeek, 6)

  const handleSubmit = () => {
    generateSchedule.mutate(
      {
        week_start_date: weekStartStr,
        generation_type: generationType,
      },
      {
        onSuccess: () => {
          showToast("Schedule generated!", "success")
          onClose()
        },
      }
    )
  }

  const prevWeek = () => setSelectedWeek((d) => addDays(d, -7))
  const nextWeek = () => setSelectedWeek((d) => addDays(d, 7))

  const apiErrorMessage = generateSchedule.isError
    ? isAxiosError(generateSchedule.error)
      ? (generateSchedule.error.response?.data?.detail ??
        "Failed to generate schedule")
      : "Failed to generate schedule"
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Schedule">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevWeek}
            aria-label="Previous week"
            className="w-9 h-9 p-0"
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

          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">
              Week of {format(selectedWeek, "MMM d, yyyy")}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {format(selectedWeek, "EEE MMM d")} → {format(weekEnd, "EEE MMM d")}
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={nextWeek}
            aria-label="Next week"
            className="w-9 h-9 p-0"
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

        <div className="bg-info-bg border border-info-border rounded-lg p-3 flex gap-2.5 items-start">
          <svg
            className="w-4 h-4 text-info-text mt-0.5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          <p className="text-sm text-info-text">
            {generationType === "manual_replan"
              ? "A schedule already exists for this week. Generating will replace it."
              : "Chronos will schedule your inbox tasks around your calendar commitments."}
          </p>
        </div>

        {apiErrorMessage && <ErrorMessage message={apiErrorMessage} />}

        <div className="flex gap-3 justify-end pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleSubmit}
            loading={generateSchedule.isPending}
          >
            Generate
          </Button>
        </div>
      </div>
    </Modal>
  )
}
