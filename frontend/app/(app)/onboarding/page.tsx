"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StepIndicator } from "@/components/onboarding/StepIndicator"
import { PreferencesForm } from "@/components/onboarding/PreferencesForm"
import { CalendarConnect } from "@/components/onboarding/CalendarConnect"
import { Button } from "@/components/ui/Button"

const STEP_LABELS = ["Preferences", "Calendar", "Ready"]

const HEADERS: Record<1 | 2 | 3, { title: string; subtitle: string }> = {
  1: {
    title: "Let's set up Chronos",
    subtitle:
      "Tell us about your work schedule so we can plan around you.",
  },
  2: {
    title: "Connect your calendar",
    subtitle: "Chronos needs to know your fixed commitments.",
  },
  3: {
    title: "You're ready to go",
    subtitle: "Generate your first schedule from the dashboard.",
  },
}

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const router = useRouter()

  const header = HEADERS[currentStep]

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl animate-slide-up">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={3}
          labels={STEP_LABELS}
        />

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {header.title}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{header.subtitle}</p>
        </div>

        <div className="bg-bg-surface rounded-xl border border-border-subtle shadow-md p-6 md:p-8">
          {currentStep === 1 && (
            <PreferencesForm onComplete={() => setCurrentStep(2)} />
          )}

          {currentStep === 2 && (
            <CalendarConnect onComplete={() => setCurrentStep(3)} />
          )}

          {currentStep === 3 && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-success-bg border border-success-border flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-success-text"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-text-secondary max-w-sm">
                Your preferences are saved. Head to the dashboard to generate
                your first schedule.
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => router.push("/dashboard")}
                className="mt-2"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
