"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMe } from "@/lib/hooks/useAuth"
import { logout } from "@/lib/api/auth"
import { cn } from "@/lib/utils/cn"
import { Logo } from "./Logo"
import { ThemeToggle } from "./ThemeToggle"

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "This Week",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
        />
      </svg>
    ),
  },
  {
    href: "/tasks",
    label: "Tasks",
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
]

function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
      />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: user } = useMe()

  const initial = user?.email?.charAt(0).toUpperCase() ?? "?"

  return (
    <aside className="fixed top-0 left-0 w-60 h-screen z-40 flex-col bg-bg-surface border-r border-border-subtle hidden md:flex">
      <div className="px-5 py-5">
        <Logo size="md" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider px-3 mb-2">
          Workspace
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
                "transition-all duration-150",
                isActive
                  ? cn(
                      "bg-brand-50 text-brand-600",
                      "dark:bg-brand-100/10 dark:text-brand-400",
                      "border-l-2 border-brand-500 dark:border-brand-400 -ml-px pl-[10px]"
                    )
                  : "text-text-secondary hover:bg-bg-sunken hover:text-text-primary"
              )}
            >
              <span
                className={cn(
                  "transition-colors",
                  isActive
                    ? "text-brand-500 dark:text-brand-400"
                    : "text-text-tertiary group-hover:text-text-secondary"
                )}
              >
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-border-subtle">
        {user?.email && (
          <div className="bg-bg-sunken rounded-md p-3 mb-3 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-200/10 dark:text-brand-400 flex items-center justify-center text-xs font-semibold shrink-0">
              {initial}
            </div>
            <p className="text-xs text-text-secondary truncate flex-1">
              {user.email}
            </p>
            <span
              className="w-1.5 h-1.5 rounded-full bg-success-text shrink-0"
              aria-label="Connected"
            />
          </div>
        )}

        <div className="flex justify-between items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="w-9 h-9 rounded-md flex items-center justify-center text-text-secondary hover:bg-bg-sunken hover:text-text-primary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          >
            <LogoutIcon />
          </button>
        </div>
      </div>
    </aside>
  )
}
