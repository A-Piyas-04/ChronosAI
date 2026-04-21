"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import { format } from "date-fns"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { useCreateTask, useUpdateTask } from "@/lib/hooks/useTasks"
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

const selectClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"

export function TaskForm({ task, onClose }: TaskFormProps) {
  const isEditing = !!task
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const mutation = isEditing ? updateTask : createTask

  const {
    register,
    handleSubmit,
    watch,
    reset,
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
        { onSuccess: onClose }
      )
    } else {
      createTask.mutate(payload, { onSuccess: onClose })
    }
  }

  const mutationError = mutation.error
  const apiErrorMessage = isAxiosError(mutationError)
    ? (mutationError.response?.data?.detail ?? "Something went wrong")
    : mutation.isError
    ? "Something went wrong"
    : null

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <Input
        label="Title"
        error={errors.title?.message}
        placeholder="Task title"
        {...register("title")}
      />

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          rows={3}
          placeholder="Optional description"
          className={cn(
            "w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none",
            errors.description
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:ring-indigo-500"
          )}
          {...register("description")}
        />
        <div className="flex justify-between">
          {errors.description ? (
            <span className="text-xs text-red-600">{errors.description.message}</span>
          ) : (
            <span />
          )}
          <span className="text-xs text-gray-400">{descriptionValue.length} / 500</span>
        </div>
      </div>

      <Input
        label="Estimated Duration (minutes)"
        type="number"
        min={15}
        max={480}
        step={5}
        error={errors.estimated_minutes?.message}
        {...register("estimated_minutes")}
      />

      <Input
        label="Deadline (optional)"
        type="datetime-local"
        error={errors.deadline_at?.message}
        {...register("deadline_at")}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Priority</label>
          <select className={selectClass} {...register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
          {errors.priority && (
            <span className="text-xs text-red-600">{errors.priority.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Task Type</label>
          <select className={selectClass} {...register("task_type")}>
            <option value="deep">Deep Work</option>
            <option value="mechanical">Mechanical</option>
            <option value="unspecified">Unspecified</option>
          </select>
          {errors.task_type && (
            <span className="text-xs text-red-600">{errors.task_type.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Preferred Time of Day (optional)
        </label>
        <select className={selectClass} {...register("preferred_time_of_day")}>
          <option value="">Any Time</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          {...register("is_flexible")}
        />
        <span className="text-sm text-gray-700">
          Allow Chronos to move this session if needed
        </span>
      </label>

      {apiErrorMessage && <ErrorMessage message={apiErrorMessage} />}

      <Button
        type="submit"
        variant="primary"
        className="w-full"
        loading={mutation.isPending}
      >
        {isEditing ? "Save Changes" : "Add Task"}
      </Button>
    </form>
  )
}
