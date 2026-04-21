import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url))
  }

  const backendUrl = process.env.NEXT_PUBLIC_API_URL
  let response: Response

  try {
    response = await fetch(
      `${backendUrl}/api/v1/auth/google/callback?code=${code}`,
      { cache: "no-store" }
    )
  } catch {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }

  if (!response.ok) {
    return NextResponse.redirect(new URL("/login?error=oauth_failed", request.url))
  }

  const data = (await response.json()) as { access_token: string }

  const res = NextResponse.redirect(new URL("/dashboard", request.url))
  res.cookies.set("chronos_token", data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
  return res
}
