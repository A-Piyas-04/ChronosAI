"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { useGenerateSchedule } from "@/lib/hooks/useSchedule"
import { useSchedule } from "@/lib/hooks/useSchedule"
import { toISODateString } from "@/lib/utils/date"

interface GenerateScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  weekStart: Date
}

const schema = z.object({
  week_start_date: z
    .string()
    .min(1, "Required")
    .refine((val) => !isNaN(new Date(val + "T00:00:00").getTime()), {
      message: "Invalid date",
    })
    .refine(
      (val) => {
        const [year, month, day] = val.split("-").map(Number)
        const date = new Date(year, month - 1, day)
        return date.getDay() === 1
      },
      { message: "Schedule must start on a Monday" }
    ),
  generation_type: z.string(),
})

type FormValues = z.infer<typeof schema>

export function GenerateScheduleModal({
  isOpen,
  onClose,
  weekStart,
}: GenerateScheduleModalProps) {
  const { data: existingSchedule } = useSchedule(toISODateString(weekStart))
  const generateSchedule = useGenerateSchedule()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      week_start_date: toISODateString(weekStart),
      generation_type: "initial",
    },
  })

  useEffect(() => {
    setValue("week_start_date", toISODateString(weekStart))
  }, [weekStart, setValue])

  useEffect(() => {
    setValue(
      "generation_type",
      existingSchedule ? "manual_replan" : "initial"
    )
  }, [existingSchedule, setValue])

  const generationType = watch("generation_type")

  const onSubmit = (values: FormValues) => {
    generateSchedule.mutate(
      {
        week_start_date: values.week_start_date,
        generation_type: values.generation_type,
      },
      { onSuccess: onClose }
    )
  }

  const apiErrorMessage = generateSchedule.isError
    ? isAxiosError(generateSchedule.error)
      ? (generateSchedule.error.response?.data?.detail ?? "Failed to generate schedule")
      : "Failed to generate schedule"
    : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate Schedule">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Week Starting"
          type="date"
          error={errors.week_start_date?.message}
          {...register("week_start_date")}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"
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
          <p className="text-sm text-blue-700">
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
            type="submit"
            variant="primary"
            loading={generateSchedule.isPending}
          >
            Generate
          </Button>
        </div>
      </form>
    </Modal>
  )
}
