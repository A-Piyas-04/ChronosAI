"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Spinner } from "@/components/ui/Spinner"
import { useConnectedCalendars, useSyncCalendar } from "@/lib/hooks/useCalendar"
import { getGoogleAuthUrl } from "@/lib/api/auth"
import { formatDisplayDate } from "@/lib/utils/date"

interface CalendarConnectProps {
  onComplete: () => void
}

function GoogleCalendarIcon() {
  return (
    <svg
      className="w-16 h-16 text-gray-300"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
      />
    </svg>
  )
}

export function CalendarConnect({ onComplete }: CalendarConnectProps) {
  const { data: calendars, isLoading } = useConnectedCalendars()
  const syncMutation = useSyncCalendar()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectLoading, setConnectLoading] = useState(false)

  const handleConnect = async () => {
    setConnectLoading(true)
    setConnectError(null)
    try {
      const data = await getGoogleAuthUrl()
      window.location.href = data.authorization_url
    } catch {
      setConnectError("Failed to connect to Google. Please try again.")
      setConnectLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const hasCalendars = calendars && calendars.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-800">
          Connect Google Calendar
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Chronos reads your calendar to avoid scheduling conflicts with your
          existing commitments.
        </p>
      </div>

      {connectError && <ErrorMessage message={connectError} />}

      {!hasCalendars ? (
        <div className="flex flex-col items-center gap-4 py-6">
          <GoogleCalendarIcon />
          <Button
            variant="primary"
            onClick={handleConnect}
            loading={connectLoading}
          >
            Connect Google Calendar
          </Button>
          <button
            type="button"
            onClick={onComplete}
            className="text-sm text-gray-500 underline hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {calendars.map((calendar) => {
            const isThisSyncing =
              syncMutation.isPending &&
              syncMutation.variables === calendar.id

            return (
              <div
                key={calendar.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 text-green-500 shrink-0"
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
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {calendar.calendar_name ?? calendar.calendar_id}
                    </p>
                    <p className="text-xs text-gray-500">
                      {calendar.last_synced_at
                        ? `Last synced: ${formatDisplayDate(new Date(calendar.last_synced_at))}`
                        : "Never synced"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => syncMutation.mutate(calendar.id)}
                  loading={isThisSyncing}
                >
                  Sync Now
                </Button>
              </div>
            )
          })}

          <Button
            variant="primary"
            className="w-full"
            onClick={onComplete}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  )
}
