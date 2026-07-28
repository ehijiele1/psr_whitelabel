"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubmissionSuccessProps {
  appRef: string
  fullName: string
  email: string
  onStartNew: () => void
}

export default function SubmissionSuccess({
  appRef,
  fullName,
  email,
  onStartNew,
}: SubmissionSuccessProps) {
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
          Thank you, {fullName}. Your application has been received and is being reviewed by the landlord.
        </p>
        <div className="p-4 rounded-lg bg-muted/50 text-sm text-muted-foreground">
          <p>
            Your application reference:{" "}
            <span className="font-mono font-medium text-foreground">{appRef}</span>
          </p>
          <p className="mt-1">
            We&apos;ll notify you at {email} once your application is approved.
          </p>
        </div>
        <Button onClick={onStartNew} className="mt-4">
          Start New Application
        </Button>
      </motion.div>
    </div>
  )
}
