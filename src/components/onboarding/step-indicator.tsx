"use client"

import { Check } from "lucide-react"

export interface Step {
  num: number
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                currentStep > step.num
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step.num
                  ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
            </div>
            <span
              className={`text-xs mt-1.5 hidden sm:inline ${
                currentStep === step.num
                  ? "font-medium text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mt-[-1.5rem] ${
                currentStep > step.num ? "bg-primary" : "bg-muted"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
