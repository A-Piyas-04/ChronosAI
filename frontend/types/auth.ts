export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string
  timezone?: string
}

export interface UserResponse {
  id: string
  email: string
  full_name: string | null
  timezone: string
  auth_provider: string
  is_active: boolean
  created_at: string
}
