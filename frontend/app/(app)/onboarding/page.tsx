"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { StepIndicator } from "@/components/onboarding/StepIndicator"
import { PreferencesForm } from "@/components/onboarding/PreferencesForm"
import { CalendarConnect } from "@/components/onboarding/CalendarConnect"
import { Button } from "@/components/ui/Button"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <StepIndicator currentStep={currentStep} totalSteps={3} />

        {currentStep === 1 && (
          <PreferencesForm onComplete={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && (
          <CalendarConnect onComplete={() => setCurrentStep(3)} />
        )}

        {currentStep === 3 && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
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
            <h2 className="text-2xl font-semibold text-gray-900">
              You&apos;re all set!
            </h2>
            <p className="text-sm text-gray-700 max-w-sm">
              Your preferences are saved. Generate your first schedule from the
              dashboard.
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
  )
}
