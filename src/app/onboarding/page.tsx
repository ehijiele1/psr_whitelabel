"use client"

import { useOnboarding } from "@/hooks/use-onboarding"
import OnboardingHeader from "@/components/onboarding/onboarding-header"
import OnboardingWizard from "@/components/onboarding/onboarding-wizard"
import SubmissionSuccess from "@/components/onboarding/submission-success"

export default function OnboardingPage() {
  // Single source of truth for the entire page.
  const {
    submitted,
    submittedData,
    appRef,
    data,
    updateStep,
    updateField,
    clearDraft,
    submitting,
    creatingAccount,
    handleStepChange,
    handleSubmit,
    startNewApplication,
  } = useOnboarding()

  if (submitted) {
    return (
      <SubmissionSuccess
        appRef={appRef}
        fullName={submittedData.fullName}
        email={submittedData.email}
        onStartNew={startNewApplication}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <OnboardingHeader onClearDraft={clearDraft} />
        <OnboardingWizard
          data={data}
          updateStep={updateStep}
          updateField={updateField}
          submitting={submitting}
          creatingAccount={creatingAccount}
          handleStepChange={handleStepChange}
          handleSubmit={handleSubmit}
        />
        <p className="text-center text-xs text-muted-foreground mt-4">
          Your application progress is saved automatically. You can close this page and resume later.
        </p>
      </div>
    </div>
  )
}
