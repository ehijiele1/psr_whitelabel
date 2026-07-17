"use client"

import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"

interface AdditionalInfoProps {
  data: {
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
  onChange: (fields: Partial<AdditionalInfoProps["data"]>) => void
}

const genderOptions = ["Male", "Female"]
const maritalOptions = ["Single", "Married", "Divorced", "Widowed"]

export default function AdditionalInfo({ data, onChange }: AdditionalInfoProps) {
  const numOcc = data.numOccupants || "1"
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Additional Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Help us know you better. All information is kept confidential.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Personal Details</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date of Birth</Label>
            <Input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => onChange({ dateOfBirth: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Gender</Label>
            <Select
              value={data.gender}
              onChange={(e) => onChange({ gender: e.target.value })}
            >
              <option value="">Select gender</option>
              {genderOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Marital Status</Label>
            <Select
              value={data.maritalStatus}
              onChange={(e) => onChange({ maritalStatus: e.target.value })}
            >
              <option value="">Select marital status</option>
              {maritalOptions.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label>Employment Details</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Occupation</Label>
            <Input
              placeholder="e.g. Software Engineer"
              value={data.occupation}
              onChange={(e) => onChange({ occupation: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Employer Name</Label>
            <Input
              placeholder="Company name"
              value={data.employerName}
              onChange={(e) => onChange({ employerName: e.target.value })}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Employer Address</Label>
          <Input
            placeholder="Employer's business address"
            value={data.employerAddress}
            onChange={(e) => onChange({ employerAddress: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label>Next of Kin</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              placeholder="Next of kin name"
              value={data.nextOfKinName}
              onChange={(e) => onChange({ nextOfKinName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              placeholder="+234 800 000 0000"
              value={data.nextOfKinPhone}
              onChange={(e) => onChange({ nextOfKinPhone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Input
              placeholder="Residential address"
              value={data.nextOfKinAddress}
              onChange={(e) => onChange({ nextOfKinAddress: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Relationship</Label>
            <Input
              placeholder="e.g. Spouse, Sibling"
              value={data.nextOfKinRelationship}
              onChange={(e) => onChange({ nextOfKinRelationship: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label>Emergency Contact</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              placeholder="Contact name"
              value={data.emergencyName}
              onChange={(e) => onChange({ emergencyName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              placeholder="+234 800 000 0000"
              value={data.emergencyPhone}
              onChange={(e) => onChange({ emergencyPhone: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Relationship</Label>
            <Input
              placeholder="e.g. Parent, Friend"
              value={data.emergencyRelationship}
              onChange={(e) => onChange({ emergencyRelationship: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label>Guarantor Information</Label>
        <p className="text-xs text-muted-foreground -mt-1">
          Your guarantor will be required to sign the lease agreement.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <Input
              placeholder="Guarantor full name"
              value={data.guarantorName}
              onChange={(e) => onChange({ guarantorName: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input
              placeholder="+234 800 000 0000"
              value={data.guarantorPhone}
              onChange={(e) => onChange({ guarantorPhone: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              placeholder="guarantor@email.com"
              value={data.guarantorEmail}
              onChange={(e) => onChange({ guarantorEmail: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Input
              placeholder="Guarantor's address"
              value={data.guarantorAddress}
              onChange={(e) => onChange({ guarantorAddress: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <Label>Rental History</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Previous Address</Label>
            <Input
              placeholder="Current or last residential address"
              value={data.previousAddress}
              onChange={(e) => onChange({ previousAddress: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Number of Occupants</Label>
            <Input
              type="number"
              min="1"
              placeholder="1"
              value={numOcc}
              onChange={(e) => onChange({ numOccupants: e.target.value || "1" })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
