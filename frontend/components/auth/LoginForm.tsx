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
import { useLogin } from "@/lib/hooks/useAuth"
import { getGoogleAuthUrl } from "@/lib/api/auth"
import { GoogleIcon } from "./GoogleIcon"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
})

type LoginFormValues = z.infer<typeof schema>

export function LoginForm() {
  const [apiError, setApiError] = useState<string | null>(null)
  const [googleLoading, setGoogleLoading] = useState(false)
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = (values: LoginFormValues) => {
    setApiError(null)
    login.mutate(values, {
      onError: (error) => {
        if (isAxiosError(error)) {
          setApiError(error.response?.data?.detail ?? "Login failed")
        } else {
          setApiError("Login failed")
        }
      },
    })
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
        <h1 className="text-2xl font-bold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary mt-1">
          Sign in to your Chronos workspace
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
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="text-right mt-1.5">
            <button
              type="button"
              className="text-xs text-brand-500 hover:text-brand-600 transition-colors duration-150"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {apiError && <ErrorMessage message={apiError} />}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={login.isPending}
        >
          Sign in
        </Button>
      </form>

      <p className="text-center mt-5 text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-brand-500 hover:text-brand-600 font-medium transition-colors duration-150"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
