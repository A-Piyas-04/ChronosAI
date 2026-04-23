"use client"

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import { format } from "date-fns"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Input"
import { Select } from "@/components/ui/Select"
import { Toggle } from "@/components/ui/Toggle"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { useCreateTask, useUpdateTask } from "@/lib/hooks/useTasks"
import { useToast } from "@/lib/providers/ToastProvider"
import { cn } from "@/lib/utils/cn"
import type { TaskResponse } from "@/types/task"

const schema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().max(500, "Max 500 characters").optional(),
  estimated_minutes: z.coerce
    .number()
    .min(15, "Minimum 15 minutes")
    .max(480, "Maximum 8 hours"),
  deadline_at: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        return new Date(val) > new Date()
      },
      { message: "Deadline must be in the future" }
    ),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  task_type: z.enum(["deep", "mechanical", "unspecified"]),
  preferred_time_of_day: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["morning", "afternoon", "evening"]).optional()
  ),
  is_flexible: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface TaskFormProps {
  task?: TaskResponse
  onClose: () => void
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
      {children}
    </h3>
  )
}

export function TaskForm({ task, onClose }: TaskFormProps) {
  const isEditing = !!task
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const mutation = isEditing ? updateTask : createTask
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      estimated_minutes: 45,
      deadline_at: "",
      priority: "medium",
      task_type: "unspecified",
      preferred_time_of_day: undefined,
      is_flexible: true,
    },
  })

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        estimated_minutes: task.estimated_minutes,
        deadline_at: task.deadline_at
          ? format(new Date(task.deadline_at), "yyyy-MM-dd'T'HH:mm")
          : "",
        priority: task.priority,
        task_type: task.task_type,
        preferred_time_of_day: task.preferred_time_of_day ?? undefined,
        is_flexible: task.is_flexible,
      })
    }
  }, [task, reset])

  const descriptionValue = watch("description") ?? ""

  const onSubmit = (values: FormValues) => {
    const payload = {
      title: values.title,
      description: values.description || undefined,
      estimated_minutes: values.estimated_minutes,
      deadline_at: values.deadline_at || undefined,
      priority: values.priority,
      task_type: values.task_type,
      preferred_time_of_day: values.preferred_time_of_day,
      is_flexible: values.is_flexible,
    }

    if (isEditing && task) {
      updateTask.mutate(
        { id: task.id, data: payload },
        {
          onSuccess: () => {
            showToast("Task updated", "success")
            onClose()
          },
        }
      )
    } else {
      createTask.mutate(payload, {
        onSuccess: () => {
          showToast("Task added", "success")
          onClose()
        },
      })
    }
  }

  const mutationError = mutation.error
  const apiErrorMessage = isAxiosError(mutationError)
    ? (mutationError.response?.data?.detail ?? "Something went wrong")
    : mutation.isError
    ? "Something went wrong"
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <section>
        <SectionLabel>What needs to be done?</SectionLabel>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Task name"
            aria-label="Task name"
            className={cn(
              "w-full px-0 py-2 text-base font-medium bg-transparent",
              "text-text-primary placeholder:text-text-tertiary",
              "border-0 border-b border-border-subtle",
              "focus:outline-none focus:border-brand-500 transition-colors duration-150"
            )}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-xs text-danger-text">{errors.title.message}</p>
          )}

          <Textarea
            placeholder="Optional description"
            {...register("description")}
            className="min-h-[60px]"
          />
          <div className="flex justify-between items-center">
            {errors.description ? (
              <span className="text-xs text-danger-text">
                {errors.description.message}
              </span>
            ) : (
              <span />
            )}
            <span className="text-xs text-text-tertiary">
              {descriptionValue.length} / 500
            </span>
          </div>
        </div>
      </section>

      <section className="mt-4 pt-5 border-t border-border-subtle">
        <SectionLabel>How should we schedule it?</SectionLabel>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Input
                label="Duration"
                type="number"
                min={15}
                max={480}
                step={5}
                error={errors.estimated_minutes?.message}
                {...register("estimated_minutes")}
              />
              <span className="absolute right-3 top-[34px] text-xs text-text-tertiary pointer-events-none">
                min
              </span>
            </div>
            <Input
              label="Deadline"
              type="datetime-local"
              error={errors.deadline_at?.message}
              {...register("deadline_at")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Priority"
              error={errors.priority?.message}
              {...register("priority")}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>

            <Select
              label="Type"
              error={errors.task_type?.message}
              {...register("task_type")}
            >
              <option value="unspecified">Unspecified</option>
              <option value="deep">Deep Work</option>
              <option value="mechanical">Mechanical</option>
            </Select>
          </div>

          <Select
            label="Preferred time of day"
            {...register("preferred_time_of_day")}
          >
            <option value="">Any time</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
          </Select>

          <div className="pt-2">
            <Controller
              name="is_flexible"
              control={control}
              render={({ field }) => (
                <Toggle
                  label="Flexible timing"
                  description="Chronos can move this session"
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        </div>
      </section>

      {apiErrorMessage && <ErrorMessage message={apiErrorMessage} />}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={mutation.isPending}>
          {isEditing ? "Save Changes" : "Add Task"}
        </Button>
      </div>
    </form>
  )
}
