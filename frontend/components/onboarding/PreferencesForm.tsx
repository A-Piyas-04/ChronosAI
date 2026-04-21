"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { Spinner } from "@/components/ui/Spinner"
import { usePreferences, useUpdatePreferences } from "@/lib/hooks/useCalendar"
import { cn } from "@/lib/utils/cn"

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const schema = z
  .object({
    work_days: z
      .array(z.number())
      .min(1, "Select at least one work day"),
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
  .refine((data) => data.productive_end_time > data.productive_start_time, {
    message: "End time must be after start time",
    path: ["productive_end_time"],
  })

type FormValues = z.infer<typeof schema>

interface PreferencesFormProps {
  onComplete: () => void
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
      <div>
        <h2 className="text-lg font-medium text-gray-800 mb-1">
          Work Preferences
        </h2>
        <p className="text-sm text-gray-500">
          Tell Chronos when you work so it can schedule your tasks effectively.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Work Days</label>
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
                        field.onChange(field.value.filter((d) => d !== idx))
                      } else {
                        field.onChange([...field.value, idx].sort())
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      selected
                        ? "bg-indigo-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
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
          <span className="text-xs text-red-600">{errors.work_days.message}</span>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Work Hours</label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Start Time"
            type="time"
            error={errors.work_start_time?.message}
            {...register("work_start_time")}
          />
          <Input
            label="End Time"
            type="time"
            error={errors.work_end_time?.message}
            {...register("work_end_time")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Peak Productive Hours
        </label>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Peak Start"
            type="time"
            error={errors.productive_start_time?.message}
            {...register("productive_start_time")}
          />
          <Input
            label="Peak End"
            type="time"
            error={errors.productive_end_time?.message}
            {...register("productive_end_time")}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Deep Work Session (minutes)"
          type="number"
          min={15}
          max={90}
          step={5}
          error={errors.deep_work_session_minutes?.message}
          {...register("deep_work_session_minutes")}
        />
        <Input
          label="Short Break (minutes)"
          type="number"
          min={5}
          max={30}
          step={5}
          error={errors.short_break_minutes?.message}
          {...register("short_break_minutes")}
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="role_type"
          className="text-sm font-medium text-gray-700"
        >
          I am a...
        </label>
        <select
          id="role_type"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          {...register("role_type")}
        >
          <option value="student">Student</option>
          <option value="professional">Professional</option>
          <option value="mixed">Mixed</option>
        </select>
        {errors.role_type && (
          <span className="text-xs text-red-600">{errors.role_type.message}</span>
        )}
      </div>

      {updatePrefs.isError && (
        <ErrorMessage message="Failed to save preferences. Please try again." />
      )}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={updatePrefs.isPending}
      >
        Save &amp; Continue
      </Button>
    </form>
  )
}
