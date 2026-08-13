"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, Loader2, ArrowLeft, ArrowRight, Building2, Home, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ui/theme-toggle"
import { csrfFetch } from "@/lib/csrf-client"
import Logo from "@/components/layout/logo"
import AccountStep from "@/components/setup/account-step"
import PropertyStep from "@/components/setup/property-step"
import UnitsStep, { getDefaultGroups, type UnitGroup } from "@/components/setup/units-step"

const STEPS = [
  { num: 1, label: "Account", icon: Settings },
  { num: 2, label: "Property", icon: Home },
  { num: 3, label: "Units", icon: Building2 },
]

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  const [account, setAccount] = useState({ fullName: "", email: "", phone: "", password: "" })
  const [property, setProperty] = useState<{ name: string; address: string; type: string; rentCollection: "automatic" | "manual" }>({ name: "", address: "", type: "", rentCollection: "automatic" })
  const [unitGroups, setUnitGroups] = useState<UnitGroup[]>(getDefaultGroups())

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const res = await fetch("/api/setup", { method: "GET" })
        const data = await res.json()
        if (data.complete) {
          router.push("/login")
          return
        }
      } catch {
        // If the status check fails, fall through and show the form.
      }
      setLoading(false)
    }
    checkOwner()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-100" />
          </div>
          <h1 className="text-2xl font-bold">All Set Up!</h1>
          <p className="text-sm text-muted-foreground">
            Owner account created, property &quot;{property.name}&quot; added with {unitGroups.reduce((s, g) => s + g.units.length, 0)} units.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your email ({account.email}) to confirm your account before signing in.
          </p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

  const canProceed = () => {
    if (step === 1) return account.fullName && account.email && account.phone && account.password.length >= 8
    if (step === 2) return property.name && property.address && property.type
    if (step === 3) {
      const totalUnits = unitGroups.reduce((s, g) => s + g.units.length, 0)
      if (totalUnits === 0) return false
      return unitGroups.every((g) =>
        g.units.every((u) => u.monthlyRent && parseFloat(u.monthlyRent) > 0)
      )
    }
    return false
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")
    try {
      const res = await csrfFetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, property, unitGroups }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Setup failed")
        setSubmitting(false)
        return
      }

      setSubmitting(false)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>
      <div className="w-full max-w-lg space-y-6">
        <div className="flex justify-center">
          <Logo />
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-0">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  step === s.num
                    ? "bg-primary text-primary-foreground"
                    : step > s.num
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-3 w-3" />
                {s.label}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${step > s.num ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <AccountStep
                key="step1"
                form={account}
                onChange={(fields) => setAccount({ ...account, ...fields })}
              />
            )}
            {step === 2 && (
              <PropertyStep
                key="step2"
                data={property}
                onChange={(fields) => setProperty({ ...property, ...fields })}
              />
            )}
            {step === 3 && (
              <UnitsStep
                key="step3"
                data={{ groups: unitGroups }}
                onChange={(groups) => setUnitGroups(groups)}
              />
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          {!canProceed() && step < 3 && (
            <p className="mt-4 text-xs text-muted-foreground text-center">
              Fill in all required fields (marked with *) to continue.
            </p>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              disabled={step === 1 || submitting}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!canProceed() || submitting}>
                {submitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up...</>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
