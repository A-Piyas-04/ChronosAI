import Cookies from "js-cookie"
import type { LoginRequest, RegisterRequest, TokenResponse, UserResponse } from "@/types/auth"
import { apiClient } from "./client"

export async function login(data: LoginRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/api/v1/auth/login", data)
  return res.data
}

export async function register(data: RegisterRequest): Promise<TokenResponse> {
  const res = await apiClient.post<TokenResponse>("/api/v1/auth/register", data)
  return res.data
}

export async function getMe(): Promise<UserResponse> {
  const res = await apiClient.get<UserResponse>("/api/v1/auth/me")
  return res.data
}

export async function getGoogleAuthUrl(): Promise<{ authorization_url: string }> {
  const res = await apiClient.get<{ authorization_url: string }>("/api/v1/auth/google")
  return res.data
}

export function logout(): void {
  Cookies.remove("chronos_token")
  if (typeof window !== "undefined") {
    window.location.href = "/login"
  }
}
