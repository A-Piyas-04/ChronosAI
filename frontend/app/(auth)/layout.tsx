import { Logo } from "@/components/ui/Logo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"

function FeaturePill({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="text-brand-500 dark:text-brand-400">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-bg-base">
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-bg-sunken flex-col justify-between p-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
        >
          <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-brand-500/5 blur-3xl dark:bg-brand-500/10" />
          <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-brand-400/5 blur-3xl dark:bg-brand-400/10" />
          <svg
            className="absolute top-8 right-8 w-64 h-64 text-brand-500/[0.06] dark:text-brand-400/10"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="100" cy="100" r="80" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="1" />
          </svg>
          <svg
            className="absolute bottom-8 left-8 w-56 h-56 text-brand-500/[0.05] dark:text-brand-400/[0.08]"
            viewBox="0 0 200 200"
            fill="none"
            aria-hidden="true"
          >
            <rect
              x="20"
              y="20"
              width="160"
              height="160"
              stroke="currentColor"
              strokeWidth="1"
              rx="20"
            />
            <rect
              x="50"
              y="50"
              width="100"
              height="100"
              stroke="currentColor"
              strokeWidth="1"
              rx="14"
            />
          </svg>
        </div>

        <div className="relative z-10">
          <Logo size="md" />
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-semibold text-text-primary leading-snug">
            Your time is the only resource you can&apos;t restock.
          </h2>
          <p className="text-sm text-text-secondary mt-3">
            Chronos learns your rhythm and builds your week.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-2.5">
          <FeaturePill
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            }
          >
            Smart scheduling
          </FeaturePill>
          <FeaturePill
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            }
          >
            Calendar sync
          </FeaturePill>
          <FeaturePill
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 17l6-6 4 4 8-8M14 7h7v7"
                />
              </svg>
            }
          >
            Weekly insights
          </FeaturePill>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 bg-bg-base relative">
        <div className="absolute top-4 right-4 lg:hidden">
          <ThemeToggle />
        </div>
        <div className="absolute top-4 right-4 hidden lg:block">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex justify-center mb-6 lg:hidden">
            <Logo size="md" />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
