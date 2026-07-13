"use client"

import { motion } from "framer-motion"
import { CheckCircle, PenLine } from "lucide-react"
import { Label } from "@/components/ui/label"

interface ReviewSignProps {
  data: {
    personalInfo: { fullName: string; email: string; phone: string; passportPhoto: string }
    additionalInfo: {
      dateOfBirth: string
      gender: string
      maritalStatus: string
      occupation: string
      employerName: string
      guarantorName: string
      nextOfKinName: string
      numOccupants: string
    }
    propertySelection: { preferredProperty: string; unitType: string; moveInDate: string }
    documents: { idType: string; idNumber: string; uploadedFiles: string[]; pendingFiles: { name: string; data: string }[] }
    agreement: {
      acceptedTerms: boolean
      paymentMethod: string
      rentAmount: string
      securityDeposit: string
      termDuration: string
      signature: string
    }
  }
  onSubmit: () => void
  onSignatureChange: (signature: string) => void
}

const propertyLabels: Record<string, string> = {
  "prince-steve-heights": "PrinceSteve Heights, VI",
  "ikeja-plaza": "Ikeja Commercial Plaza",
  "lekki-estate": "Lekki Phase 1 Estate",
  "surulere-complex": "Surulere Shopping Complex",
}

const idTypeLabels: Record<string, string> = {
  "national-id": "National ID",
  passport: "International Passport",
  "drivers-license": "Driver's License",
  "voter-card": "Voter's Card",
}

export default function ReviewSign({ data, onSignatureChange }: ReviewSignProps) {
  const canSubmit = data.personalInfo.fullName && data.agreement.signature.trim().length > 0

  const totalDocs =
    data.documents.uploadedFiles.length + data.documents.pendingFiles.length

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Review & Sign</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Please review all your information before submitting.
        </p>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-sm">Personal Information</h3>
          </div>
          <div className="flex gap-4 pl-6">
            {data.personalInfo.passportPhoto && (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-muted flex-shrink-0">
                <img
                  src={data.personalInfo.passportPhoto}
                  alt="Passport photo"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm flex-1">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.personalInfo.fullName}</span></div>
              <div><span className="text-muted-foreground">Email:</span> <span>{data.personalInfo.email}</span></div>
              <div><span className="text-muted-foreground">Phone:</span> <span>{data.personalInfo.phone}</span></div>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-sm">Additional Info</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pl-6">
            <div><span className="text-muted-foreground">Occupation:</span> <span>{data.additionalInfo.occupation || "Not provided"}</span></div>
            <div><span className="text-muted-foreground">Employer:</span> <span>{data.additionalInfo.employerName || "Not provided"}</span></div>
            <div><span className="text-muted-foreground">Next of Kin:</span> <span>{data.additionalInfo.nextOfKinName || "Not provided"}</span></div>
            <div><span className="text-muted-foreground">Guarantor:</span> <span>{data.additionalInfo.guarantorName || "Not provided"}</span></div>
            <div><span className="text-muted-foreground">Occupants:</span> <span>{data.additionalInfo.numOccupants}</span></div>
            <div><span className="text-muted-foreground">Marital Status:</span> <span>{data.additionalInfo.maritalStatus || "Not stated"}</span></div>
          </div>
        </div>

        <div className="p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-sm">Property Selection</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pl-6">
            <div><span className="text-muted-foreground">Property:</span> <span className="font-medium">{propertyLabels[data.propertySelection.preferredProperty] || data.propertySelection.preferredProperty}</span></div>
            <div><span className="text-muted-foreground">Unit Type:</span> <span className="font-medium capitalize">{data.propertySelection.unitType}</span></div>
            <div><span className="text-muted-foreground">Move-In:</span> <span>{data.propertySelection.moveInDate}</span></div>
          </div>
        </div>

        <div className="p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-sm">Documents</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pl-6">
            <div><span className="text-muted-foreground">ID Type:</span> <span className="font-medium">{idTypeLabels[data.documents.idType] || data.documents.idType}</span></div>
            <div><span className="text-muted-foreground">ID Number:</span> <span>{data.documents.idNumber}</span></div>
            <div><span className="text-muted-foreground">Files:</span> <span>{totalDocs} selected</span></div>
          </div>
        </div>

        <div className="p-4 rounded-lg border space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h3 className="font-medium text-sm">Agreement & Payment</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm pl-6">
            <div><span className="text-muted-foreground">Rent:</span> <span className="font-medium">₦{data.agreement.rentAmount || "TBD"}/yr</span></div>
            <div><span className="text-muted-foreground">Deposit:</span> <span className="font-medium">₦{data.agreement.securityDeposit || "TBD"}</span></div>
            <div><span className="text-muted-foreground">Term:</span> <span>{data.agreement.termDuration}</span></div>
            <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium capitalize">{data.agreement.paymentMethod === "online" ? "Online (Paystack)" : data.agreement.paymentMethod === "offline" ? "Offline (Bank Transfer)" : "Not selected"}</span></div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Digital Signature</Label>
          <div className="relative">
              <input
                type="text"
                placeholder="Type your full name as signature"
                value={data.agreement.signature}
                onChange={(e) => onSignatureChange(e.target.value)}
                className="w-full h-16 rounded-lg border border-input bg-background px-4 text-xl font-[cursive] tracking-wider shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            <PenLine className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            By typing your name, you agree to the terms of the lease agreement.
          </p>
          {!canSubmit && data.personalInfo.fullName && (
            <p className="text-xs text-destructive">
              Please type your full name as signature to submit.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
