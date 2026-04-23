"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { isAxiosError } from "axios"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ErrorMessage } from "@/components/ui/ErrorMessage"
import { useRegister } from "@/lib/hooks/useAuth"
import { getGoogleAuthUrl } from "@/lib/api/auth"
import { GoogleIcon } from "./GoogleIcon"

const schema = z
  .object({
    full_name: z.string().optional(),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Min 8 characters"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  })

type RegisterFormValues = z.infer<typeof schema>

export function RegisterForm() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const registerMutation = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: RegisterFormValues) => {
    setApiError(null)
    registerMutation.mutate(
      {
        email: values.email,
        password: values.password,
        full_name: values.full_name || undefined,
        timezone: "UTC",
      },
      {
        onError: (error) => {
          if (isAxiosError(error)) {
            setApiError(error.response?.data?.detail ?? "Registration failed")
          } else {
            setApiError("Registration failed")
          }
        },
      }
    )
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const data = await getGoogleAuthUrl()
      window.location.href = data.authorization_url
    } catch {
      setApiError("Failed to start Google login. Please try again.")
      setGoogleLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">
          Create your account
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Start scheduling your best work
        </p>
      </div>

      <Button
        variant="secondary"
        className="w-full hover:-translate-y-px"
        onClick={handleGoogleLogin}
        loading={googleLoading}
        type="button"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border-subtle" />
        <span className="text-xs text-text-tertiary px-2">or</span>
        <div className="flex-1 h-px bg-border-subtle" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full Name"
          type="text"
          autoComplete="name"
          placeholder="Optional"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 characters"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat your password"
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        {apiError && <ErrorMessage message={apiError} />}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={registerMutation.isPending}
        >
          Create account
        </Button>
      </form>

      <p className="text-center mt-5 text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-500 hover:text-brand-600 font-medium transition-colors duration-150"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
