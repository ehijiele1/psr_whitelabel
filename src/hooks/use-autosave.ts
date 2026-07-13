"use client"

import { useState, useCallback, useRef } from "react"

const STORAGE_KEY = "ps-onboarding-draft"

export interface OnboardingData {
  step: number
  personalInfo: {
    fullName: string
    email: string
    phone: string
    passportPhoto: string
  }
  additionalInfo: {
    dateOfBirth: string
    gender: string
    maritalStatus: string
    occupation: string
    employerName: string
    employerAddress: string
    nextOfKinName: string
    nextOfKinPhone: string
    nextOfKinAddress: string
    nextOfKinRelationship: string
    emergencyName: string
    emergencyPhone: string
    emergencyRelationship: string
    guarantorName: string
    guarantorPhone: string
    guarantorEmail: string
    guarantorAddress: string
    previousAddress: string
    numOccupants: string
  }
  propertySelection: {
    preferredProperty: string
    unitType: string
    moveInDate: string
  }
  documents: {
    idType: string
    idNumber: string
    uploadedFiles: string[]
    pendingFiles: { name: string; data: string }[]
  }
  agreement: {
    acceptedTerms: boolean
    paymentMethod: "online" | "offline" | ""
    rentAmount: string
    securityDeposit: string
    termDuration: string
    signature: string
  }
}

const defaultData: OnboardingData = {
  step: 1,
  personalInfo: { fullName: "", email: "", phone: "", passportPhoto: "" },
  additionalInfo: {
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    occupation: "",
    employerName: "",
    employerAddress: "",
    nextOfKinName: "",
    nextOfKinPhone: "",
    nextOfKinAddress: "",
    nextOfKinRelationship: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    guarantorName: "",
    guarantorPhone: "",
    guarantorEmail: "",
    guarantorAddress: "",
    previousAddress: "",
    numOccupants: "1",
  },
  propertySelection: { preferredProperty: "", unitType: "", moveInDate: "" },
  documents: { idType: "", idNumber: "", uploadedFiles: [], pendingFiles: [] },
  agreement: {
    acceptedTerms: false,
    paymentMethod: "",
    rentAmount: "",
    securityDeposit: "",
    termDuration: "1 year",
    signature: "",
  },
}

export function useAutosave() {
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const [data, setData] = useState<OnboardingData>(() => {
    if (typeof window === "undefined") return defaultData
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        return {
          step: parsed.step ?? defaultData.step,
          personalInfo: { ...defaultData.personalInfo, ...parsed.personalInfo },
          additionalInfo: { ...defaultData.additionalInfo, ...parsed.additionalInfo },
          propertySelection: { ...defaultData.propertySelection, ...parsed.propertySelection },
          documents: { ...defaultData.documents, ...parsed.documents },
          agreement: { ...defaultData.agreement, ...parsed.agreement },
        }
      }
    } catch { /* ignore */ }
    return defaultData
  })

  const updateStep = useCallback((step: number) => {
    setData((prev) => {
      const next = { ...prev, step }
      return next
    })
    saveTimer.current = setTimeout(() => {
      try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, step }))
      } catch { /* ignore */ }
    }, 500)
  }, [])

  const updateField = useCallback(<K extends keyof OnboardingData>(
    section: K,
    fields: Partial<OnboardingData[K]>
  ) => {
    setData((prev) => {
      const next = {
        ...prev,
        [section]: { ...(prev[section] as Record<string, unknown>), ...(fields as Record<string, unknown>) },
      }
      return next as OnboardingData
    })
    saveTimer.current = setTimeout(() => {
      try {
        const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")
        const updated = {
          ...current,
          [section]: { ...(current?.[section] || {}), ...fields },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch { /* ignore */ }
    }, 500)
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setData(defaultData)
  }, [])

  return {
    data,
    updateStep,
    updateField,
    clearDraft,
    setData,
  }
}
