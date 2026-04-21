import { useMutation, useQuery } from "@tanstack/react-query"
import Cookies from "js-cookie"
import { getGoogleAuthUrl, getMe, login, register } from "@/lib/api/auth"
import type { LoginRequest, RegisterRequest } from "@/types/auth"

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!Cookies.get("chronos_token"),
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data) => {
      Cookies.set("chronos_token", data.access_token, { expires: 7 })
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard"
      }
    },
  })
}

export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => register(data),
    onSuccess: (data) => {
      Cookies.set("chronos_token", data.access_token, { expires: 7 })
      if (typeof window !== "undefined") {
        window.location.href = "/onboarding"
      }
    },
  })
}

export function useGoogleAuthUrl() {
  return useQuery({
    queryKey: ["google-auth-url"],
    queryFn: getGoogleAuthUrl,
    enabled: false,
  })
}
