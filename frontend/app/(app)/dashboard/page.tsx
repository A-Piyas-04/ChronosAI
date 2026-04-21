"use client"

import { useState } from "react"
import { addDays } from "date-fns"
import { Button } from "@/components/ui/Button"
import { WeeklyCalendar } from "@/components/schedule/WeeklyCalendar"
import { GenerateScheduleModal } from "@/components/schedule/GenerateScheduleModal"
import { getCurrentWeekStart, formatDisplayDate } from "@/lib/utils/date"

export default function DashboardPage() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(
    getCurrentWeekStart
  )
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)

  const prevWeek = () => setCurrentWeekStart((d) => addDays(d, -7))
  const nextWeek = () => setCurrentWeekStart((d) => addDays(d, 7))

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={prevWeek}>
            &#8592; Prev
          </Button>
          <span className="text-lg font-medium text-gray-800 mx-4 text-center sm:text-left">
            Week of {formatDisplayDate(currentWeekStart)}
          </span>
          <Button variant="ghost" size="sm" onClick={nextWeek}>
            Next &#8594;
          </Button>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsGenerateModalOpen(true)}
        >
          Generate Schedule
        </Button>
      </div>

      <WeeklyCalendar weekStart={currentWeekStart} />

      <GenerateScheduleModal
        isOpen={isGenerateModalOpen}
        onClose={() => setIsGenerateModalOpen(false)}
        weekStart={currentWeekStart}
      />
    </div>
  )
}
