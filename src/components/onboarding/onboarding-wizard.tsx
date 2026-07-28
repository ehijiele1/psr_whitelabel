"use client"

import { AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Building2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import StepIndicator from "./step-indicator"
import { ONBOARDING_STEPS, TOTAL_STEPS } from "./steps"
import PersonalInfo from "./personal-info"
import AdditionalInfo from "./additional-info"
import PropertySelection from "./property-selection"
import DocumentUpload from "./document-upload"
import AgreementReview from "./agreement-review"
import ReviewSign from "./review-sign"

interface OnboardingWizardProps {
  data: ReturnType<typeof import("@/hooks/use-autosave").useAutosave>["data"]
  updateStep: ReturnType<typeof import("@/hooks/use-autosave").useAutosave>["updateStep"]
  updateField: ReturnType<typeof import("@/hooks/use-autosave").useAutosave>["updateField"]
  submitting: boolean
  creatingAccount: boolean
  handleStepChange: (nextStep: number) => Promise<void>
  handleSubmit: () => Promise<void>
}

/**
 * Multi-step onboarding wizard.
 * Composes step indicator + step content + navigation buttons.
 *
 * Stateless: receives state and handlers from the parent page.
 */
export default function OnboardingWizard({
  data,
  updateStep,
  updateField,
  submitting,
  creatingAccount,
  handleStepChange,
  handleSubmit,
}: OnboardingWizardProps) {
  const canGoNext =
    !creatingAccount &&
    !((data.step === 1 && (!data.personalInfo.fullName || !data.personalInfo.email)) ||
      (data.step === 3 && !data.propertySelection.preferredProperty) ||
      (data.step === 5 && (!data.agreement.acceptedTerms || !data.agreement.paymentMethod)))

  const canSubmit =
    !submitting &&
    !!data.personalInfo.fullName &&
    !!data.agreement.signature.trim()

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      <StepIndicator steps={ONBOARDING_STEPS} currentStep={data.step} />

      <div className="border rounded-xl p-6 shadow-sm -mt-4 mb-8">
        <AnimatePresence mode="wait">
          {data.step === 1 && (
            <PersonalInfo
              key="step1"
              data={data.personalInfo}
              onChange={(fields) => updateField("personalInfo", fields)}
            />
          )}
          {data.step === 2 && (
            <AdditionalInfo
              key="step2"
              data={data.additionalInfo}
              onChange={(fields) => updateField("additionalInfo", fields)}
            />
          )}
          {data.step === 3 && (
            <PropertySelection
              key="step3"
              data={data.propertySelection}
              onChange={(fields) => updateField("propertySelection", fields)}
            />
          )}
          {data.step === 4 && (
            <DocumentUpload
              key="step4"
              data={data.documents}
              onChange={(fields) => updateField("documents", fields)}
            />
          )}
          {data.step === 5 && (
            <AgreementReview
              key="step5"
              data={data}
              onChange={(fields) => updateField("agreement", fields)}
            />
          )}
          {data.step === 6 && (
            <ReviewSign
              key="step6"
              data={data}
              onSubmit={handleSubmit}
              onSignatureChange={(signature) =>
                updateField("agreement", { signature })
              }
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <Button
          variant="outline"
          onClick={() => updateStep(data.step - 1)}
          disabled={data.step === 1 || creatingAccount}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-2">
          {creatingAccount && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Creating account...
            </span>
          )}
          {data.step < TOTAL_STEPS ? (
            <Button
              onClick={() => handleStepChange(data.step + 1)}
              disabled={!canGoNext}
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Building2 className="h-4 w-4 mr-2" />
              )}
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
