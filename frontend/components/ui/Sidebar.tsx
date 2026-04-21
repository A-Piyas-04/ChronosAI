"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMe } from "@/lib/hooks/useAuth"
import { logout } from "@/lib/api/auth"

const navItems = [
  {
    href: "/dashboard",
    label: "This Week",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
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
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
    ),
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: user } = useMe()

  return (
    <aside className="w-60 h-screen fixed top-0 left-0 bg-white border-r border-gray-200 hidden md:flex flex-col">
      <div className="p-6">
        <span className="text-xl font-bold text-indigo-600">Chronos</span>
      </div>

      <nav className="flex-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 mx-3 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200 space-y-2">
        {user?.email && (
          <p className="text-xs text-gray-500 truncate px-1">{user.email}</p>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-3 py-1.5 text-sm bg-transparent hover:bg-gray-100 text-gray-700 rounded-md transition-colors"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
