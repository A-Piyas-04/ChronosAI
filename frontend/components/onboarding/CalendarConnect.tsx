"use client"

import { useState } from "react"
import { Button } from "@/components/ui/Button"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Spinner } from "@/components/ui/Spinner"
import { useConnectedCalendars, useSyncCalendar } from "@/lib/hooks/useCalendar"
import { useToast } from "@/lib/providers/ToastProvider"
import { getGoogleAuthUrl } from "@/lib/api/auth"
import { formatDisplayDate } from "@/lib/utils/date"

interface CalendarConnectProps {
  onComplete: () => void
}

function LargeCalendarIcon() {
  return (
    <svg
      className="w-16 h-16 text-brand-500 dark:text-brand-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  )
}

function GoogleCalendarIconSmall() {
  return (
    <svg
      className="w-5 h-5 text-success-text shrink-0"
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
  )
}

function GoogleLogo() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function CalendarConnect({ onComplete }: CalendarConnectProps) {
  const { data: calendars, isLoading } = useConnectedCalendars()
  const syncMutation = useSyncCalendar()
  const { showToast } = useToast()
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

  const handleSync = (id: string) => {
    syncMutation.mutate(id, {
      onSuccess: () => showToast("Calendar synced", "success"),
    })
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
    <div className="space-y-5">
      {connectError && <ErrorMessage message={connectError} />}

      {!hasCalendars ? (
        <>
          <div className="flex flex-col items-center gap-3 bg-bg-sunken rounded-xl p-8">
            <LargeCalendarIcon />
            <p className="text-text-secondary text-sm mt-1">
              No calendars connected
            </p>
          </div>

          <Button
            variant="secondary"
            size="lg"
            className="w-full hover:-translate-y-px"
            onClick={handleConnect}
            loading={connectLoading}
            type="button"
          >
            <GoogleLogo />
            Connect Google Calendar
          </Button>

          <button
            type="button"
            onClick={onComplete}
            className="w-full flex items-center justify-center gap-1 text-sm text-text-tertiary hover:text-text-secondary transition-colors duration-150"
          >
            Skip for now
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </>
      ) : (
        <>
          <div className="bg-success-bg border border-success-border rounded-lg p-3 flex items-center gap-2">
            <GoogleCalendarIconSmall />
            <p className="text-sm text-success-text">
              Calendar connected successfully
            </p>
          </div>

          <div className="space-y-2">
            {calendars.map((calendar) => {
              const isThisSyncing =
                syncMutation.isPending &&
                syncMutation.variables === calendar.id

              return (
                <div
                  key={calendar.id}
                  className="flex items-center justify-between p-4 bg-bg-sunken rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GoogleCalendarIconSmall />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {calendar.calendar_name ?? calendar.calendar_id}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {calendar.last_synced_at
                          ? `Last synced ${formatDisplayDate(new Date(calendar.last_synced_at))}`
                          : "Never synced"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSync(calendar.id)}
                    loading={isThisSyncing}
                  >
                    Sync
                  </Button>
                </div>
              )
            })}
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={onComplete}
          >
            Continue
          </Button>
        </>
      )}
    </div>
  )
}
