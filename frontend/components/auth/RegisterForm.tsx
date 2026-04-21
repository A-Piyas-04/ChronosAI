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

function GoogleIcon() {
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>

      <Button
        variant="secondary"
        className="w-full"
        onClick={handleGoogleLogin}
        loading={googleLoading}
        type="button"
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-3 text-gray-500">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full Name (optional)"
          type="text"
          autoComplete="name"
          error={errors.full_name?.message}
          {...register("full_name")}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />
        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />

        {apiError && <ErrorMessage message={apiError} />}

        <Button
          type="submit"
          variant="primary"
          className="w-full"
          loading={registerMutation.isPending}
        >
          Create account
        </Button>
      </form>

      <p className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
