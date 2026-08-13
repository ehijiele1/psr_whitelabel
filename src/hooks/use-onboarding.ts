"use client"

/**
 * Onboarding flow orchestration hook.
 * Extracts the auth/file-upload/submission logic out of the page component.
 */

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { useAutosave } from "@/hooks/use-autosave"
import { createClient } from "@/lib/supabase/browser"
import type { User } from "@supabase/supabase-js"

interface SubmissionData {
  fullName: string
  email: string
}

interface UseOnboardingReturn {
  data: ReturnType<typeof useAutosave>["data"]
  updateStep: ReturnType<typeof useAutosave>["updateStep"]
  updateField: ReturnType<typeof useAutosave>["updateField"]
  clearDraft: ReturnType<typeof useAutosave>["clearDraft"]
  submitted: boolean
  submitting: boolean
  creatingAccount: boolean
  submittedData: SubmissionData
  appRef: string
  ensureUser: () => Promise<User | null>
  uploadPendingFiles: (userId: string) => Promise<string[]>
  handleStepChange: (nextStep: number) => Promise<void>
  handleSubmit: () => Promise<void>
  startNewApplication: () => void
}

export function useOnboarding(): UseOnboardingReturn {
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

  const startNewApplication = () => {
    clearDraft()
  }

  return {
    data,
    updateStep,
    updateField,
    clearDraft,
    submitted,
    submitting,
    creatingAccount,
    submittedData,
    appRef,
    ensureUser,
    uploadPendingFiles,
    handleStepChange,
    handleSubmit,
    startNewApplication,
  }
}
