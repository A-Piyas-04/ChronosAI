"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Spinner } from "@/components/ui/Spinner"
import { usePreferences, useUpdatePreferences } from "@/lib/hooks/useCalendar"
import { cn } from "@/lib/utils/cn"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const schema = z
  .object({
    work_days: z.array(z.number()).min(1, "Select at least one work day"),
    work_start_time: z.string().min(1, "Required"),
    work_end_time: z.string().min(1, "Required"),
    productive_start_time: z.string().min(1, "Required"),
    productive_end_time: z.string().min(1, "Required"),
    deep_work_session_minutes: z.coerce.number().min(15).max(90),
    short_break_minutes: z.coerce.number().min(5).max(30),
    role_type: z.string().min(1, "Required"),
  })
  .refine((data) => data.work_end_time > data.work_start_time, {
    message: "End time must be after start time",
    path: ["work_end_time"],
  })
  .refine(
    (data) => data.productive_end_time > data.productive_start_time,
    {
      message: "End time must be after start time",
      path: ["productive_end_time"],
    }
  )

type FormValues = z.infer<typeof schema>

interface PreferencesFormProps {
  onComplete: () => void
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-4">
      {children}
    </h3>
  )
}

function NumberStepper({
  value,
  onChange,
  min,
  max,
  step = 5,
}: {
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.max(min, value - step))}
        aria-label="Decrease"
        className="w-8 h-8 p-0"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
        </svg>
      </Button>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (!Number.isNaN(n)) onChange(n)
        }}
        className="w-16 text-center text-sm bg-bg-surface border border-border-default rounded-md py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 dark:bg-bg-elevated"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.min(max, value + step))}
        aria-label="Increase"
        className="w-8 h-8 p-0"
      >
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      </Button>
    </div>
  )
}

export function PreferencesForm({ onComplete }: PreferencesFormProps) {
  const { data: prefs, isLoading } = usePreferences()
  const updatePrefs = useUpdatePreferences()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      work_days: [0, 1, 2, 3, 4],
      work_start_time: "09:00",
      work_end_time: "17:00",
      productive_start_time: "09:00",
      productive_end_time: "12:00",
      deep_work_session_minutes: 45,
      short_break_minutes: 10,
      role_type: "professional",
    },
  })

  useEffect(() => {
    if (prefs) {
      reset({
        work_days: prefs.work_days,
        work_start_time: prefs.work_start_time?.substring(0, 5) ?? "09:00",
        work_end_time: prefs.work_end_time?.substring(0, 5) ?? "17:00",
        productive_start_time:
          prefs.productive_start_time?.substring(0, 5) ?? "09:00",
        productive_end_time:
          prefs.productive_end_time?.substring(0, 5) ?? "12:00",
        deep_work_session_minutes: prefs.deep_work_session_minutes,
        short_break_minutes: prefs.short_break_minutes,
        role_type: prefs.role_type ?? "professional",
      })
    }
  }, [prefs, reset])

  const onSubmit = (values: FormValues) => {
    updatePrefs.mutate(
      {
        work_days: values.work_days,
        work_start_time: values.work_start_time,
        work_end_time: values.work_end_time,
        productive_start_time: values.productive_start_time,
        productive_end_time: values.productive_end_time,
        deep_work_session_minutes: values.deep_work_session_minutes,
        short_break_minutes: values.short_break_minutes,
        role_type: values.role_type,
      },
      { onSuccess: onComplete }
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-xs text-text-tertiary">Step 1 of 3 · About 2 minutes</p>

      <section>
        <SectionHeader>When do you work?</SectionHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary block">
              Work days
            </label>
            <Controller
              name="work_days"
              control={control}
              render={({ field }) => (
                <div className="flex flex-wrap gap-2">
                  {DAY_LABELS.map((label, idx) => {
                    const selected = field.value.includes(idx)
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            field.onChange(
                              field.value.filter((d) => d !== idx)
                            )
                          } else {
                            field.onChange([...field.value, idx].sort())
                          }
                        }}
                        className={cn(
                          "px-3.5 py-1.5 rounded-full text-sm font-medium",
                          "transition-all duration-150 active:scale-95",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface",
                          selected
                            ? cn(
                                "bg-brand-600 text-text-inverse shadow-sm",
                                "dark:bg-brand-500 dark:text-bg-base dark:glow-brand-sm"
                              )
                            : "bg-bg-sunken text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-border-subtle"
                        )}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
            {errors.work_days && (
              <p className="text-xs text-danger-text">
                {errors.work_days.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start"
              type="time"
              error={errors.work_start_time?.message}
              {...register("work_start_time")}
            />
            <Input
              label="End"
              type="time"
              error={errors.work_end_time?.message}
              {...register("work_end_time")}
            />
          </div>
        </div>
      </section>

      <section className="pt-6 border-t border-border-subtle">
        <SectionHeader>When is your brain sharpest?</SectionHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Peak start"
              type="time"
              error={errors.productive_start_time?.message}
              {...register("productive_start_time")}
            />
            <Input
              label="Peak end"
              type="time"
              error={errors.productive_end_time?.message}
              {...register("productive_end_time")}
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Deep work session
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Your focus block length
              </p>
            </div>
            <Controller
              name="deep_work_session_minutes"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={field.onChange}
                  min={15}
                  max={90}
                />
              )}
            />
          </div>

          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Short break
              </p>
              <p className="text-xs text-text-tertiary mt-0.5">
                Between sessions
              </p>
            </div>
            <Controller
              name="short_break_minutes"
              control={control}
              render={({ field }) => (
                <NumberStepper
                  value={field.value}
                  onChange={field.onChange}
                  min={5}
                  max={30}
                />
              )}
            />
          </div>

          <Select label="I am a..." {...register("role_type")}>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="mixed">Mixed</option>
          </Select>
        </div>
      </section>

      {updatePrefs.isError && (
        <ErrorMessage message="Failed to save preferences. Please try again." />
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={updatePrefs.isPending}
      >
        Save &amp; Continue
      </Button>
    </form>
  )
}
