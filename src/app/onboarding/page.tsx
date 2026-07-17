"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, ArrowLeft, ArrowRight, Building2, Save, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ui/theme-toggle"
import { useAutosave } from "@/hooks/use-autosave"
import PersonalInfo from "@/components/onboarding/personal-info"
import AdditionalInfo from "@/components/onboarding/additional-info"
import PropertySelection from "@/components/onboarding/property-selection"
import DocumentUpload from "@/components/onboarding/document-upload"
import AgreementReview from "@/components/onboarding/agreement-review"
import ReviewSign from "@/components/onboarding/review-sign"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

const STEPS = [
  { num: 1, label: "Personal Info" },
  { num: 2, label: "Additional Info" },
  { num: 3, label: "Property" },
  { num: 4, label: "Documents" },
  { num: 5, label: "Agreement" },
  { num: 6, label: "Review & Sign" },
]

export default function OnboardingPage() {
  const { data, updateStep, updateField, clearDraft } = useAutosave()
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [creatingAccount, setCreatingAccount] = useState(false)
  const [submittedData, setSubmittedData] = useState({ fullName: "", email: "" })
  const [appRef] = useState(() => `PS-APP-${Date.now().toString(36).toUpperCase()}`)

  const ensureUser = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) return user

    if (!data.personalInfo.email) {
      toast.error("Email is required to create your account")
      return null
    }

    const tempPassword = crypto.randomUUID()
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.personalInfo.email,
      password: tempPassword,
      options: {
        data: {
          full_name: data.personalInfo.fullName,
          phone: data.personalInfo.phone,
        },
      },
    })

    if (signUpError) {
      toast.error(signUpError.message)
      return null
    }

    if (!signUpData.user?.id) {
      toast.error("Failed to create account. Please try again.")
      return null
    }

    if (signUpData.session) {
      await supabase.auth.setSession(signUpData.session)
    }

    return signUpData.user
  }, [data.personalInfo])

  const uploadPendingFiles = useCallback(async (userId: string) => {
    const supabase = createClient()
    const uploaded: string[] = []

    for (const file of data.documents.pendingFiles) {
      const filePath = `${userId}/${Date.now()}-${file.name}`

      const base64Data = file.data.split(",")[1] || file.data
      const byteChars = atob(base64Data)
      const byteArrays: Uint8Array[] = []
      for (let offset = 0; offset < byteChars.length; offset += 512) {
        const slice = byteChars.slice(offset, offset + 512)
        const byteNumbers = new Array(slice.length)
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i)
        }
        byteArrays.push(new Uint8Array(byteNumbers))
      }
      const blob = new Blob(byteArrays as BlobPart[])

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, blob)

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath)

      if (urlData?.publicUrl) {
        uploaded.push(urlData.publicUrl)
      }
    }

    return uploaded
  }, [data.documents.pendingFiles])

  const handleStepChange = useCallback(async (nextStep: number) => {
    if (nextStep === 3 && !creatingAccount) {
      setCreatingAccount(true)
      const user = await ensureUser()
      setCreatingAccount(false)
      if (!user) return
    }
    updateStep(nextStep)
  }, [ensureUser, creatingAccount, updateStep])

  const handleSubmit = async () => {
    setSubmitting(true)
    const supabase = createClient()

    let { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      user = await ensureUser()
      if (!user) {
        setSubmitting(false)
        return
      }
    }

    let uploadedFiles = [...data.documents.uploadedFiles]
    if (data.documents.pendingFiles.length > 0) {
      const newUrls = await uploadPendingFiles(user.id)
      uploadedFiles = [...uploadedFiles, ...newUrls]
    }

    const { error: insertError } = await supabase.from("applications").insert({
      user_id: user.id,
      form_data: {
        personalInfo: data.personalInfo,
        additionalInfo: data.additionalInfo,
        propertySelection: data.propertySelection,
        documents: { ...data.documents, uploadedFiles, pendingFiles: [] },
        agreement: data.agreement,
      },
      status: "pending",
      submitted_at: new Date().toISOString(),
    })

    if (insertError) {
      toast.error(insertError.message)
      setSubmitting(false)
      return
    }

    setSubmittedData({ fullName: data.personalInfo.fullName, email: data.personalInfo.email })
    setSubmitting(false)
    setSubmitted(true)
    clearDraft()
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-emerald-600 dark:text-emerald-100" />
          </div>
          <h1 className="text-2xl font-bold">Application Submitted!</h1>
          <p className="text-sm text-muted-foreground">
            Thank you, {submittedData.fullName}. Your application has been received and is being reviewed by the landlord.
          </p>
          <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p>Your application reference: <span className="font-mono font-medium text-foreground">{appRef}</span></p>
            <p className="mt-1">We&apos;ll notify you at {submittedData.email} once your application is approved.</p>
          </div>
          <Button onClick={clearDraft} className="mt-4">
            Start New Application
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
            PS
          </div>
          <div>
            <h1 className="text-xl font-bold">PrinceSteve Residence</h1>
            <p className="text-xs text-muted-foreground">Tenant Application</p>
          </div>
          <Link href="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#005A36] dark:hover:text-[#00a85e] transition-colors ml-auto">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Save className="h-3.5 w-3.5" />
              Auto-saved
            </div>
            <button
              type="button"
              onClick={() => {
                if (confirm("Clear all entered data and start a fresh application?")) {
                  clearDraft()
                }
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
              title="Clear saved draft and start over"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Start Fresh
            </button>
            <ThemeToggle />
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    data.step > step.num
                      ? "bg-primary text-primary-foreground"
                      : data.step === step.num
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {data.step > step.num ? <Check className="h-4 w-4" /> : step.num}
                </div>
                <span className={`text-xs mt-1.5 hidden sm:inline ${data.step === step.num ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-1.5rem] ${data.step > step.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
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
                onSignatureChange={(signature) => updateField("agreement", { signature })}
              />
            )}
          </AnimatePresence>

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
              {data.step < 6 ? (
                <Button
                  onClick={() => handleStepChange(data.step + 1)}
                  disabled={
                    creatingAccount ||
                    (data.step === 1 && (!data.personalInfo.fullName || !data.personalInfo.email)) ||
                    (data.step === 3 && !data.propertySelection.preferredProperty) ||
                    (data.step === 5 && (!data.agreement.acceptedTerms || !data.agreement.paymentMethod))
                  }
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !data.personalInfo.fullName || !data.agreement.signature.trim()}
                >
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

        <p className="text-center text-xs text-muted-foreground mt-4">
          Your application progress is saved automatically. You can close this page and resume later.
        </p>
      </div>
    </div>
  )
}
