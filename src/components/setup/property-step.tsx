"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface PropertyStepProps {
  data: { name: string; address: string; type: string; rentCollection: "automatic" | "manual" }
  onChange: (fields: Partial<PropertyStepProps["data"]>) => void
}

const propertyTypes = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Mixed", label: "Mixed (Residential & Commercial)" },
]

export default function PropertyStep({ data, onChange }: PropertyStepProps) {
  const rentCollection = data.rentCollection || "automatic"

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold">Add Your Property</h1>
        <p className="text-sm text-muted-foreground">
          Tell us about the first property you want to manage. You can add more later.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="propName">
          Property Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propName"
          placeholder="e.g. Maple Heights Estate"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propAddress">
          Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="propAddress"
          placeholder="12 Example Avenue, Your City"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propType">
          Property Type <span className="text-destructive">*</span>
        </Label>
        <Select
          id="propType"
          value={data.type}
          onChange={(e) => onChange({ type: e.target.value })}
          required
        >
          <option value="">Select property type</option>
          {propertyTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label>Rent Collection Preference</Label>
        <p className="text-xs text-muted-foreground">Choose how you&apos;d like to collect rent from tenants.</p>
        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={() => onChange({ rentCollection: "automatic" })}
            className={`flex-1 p-3 rounded-lg border text-sm text-center transition-colors ${
              rentCollection === "automatic"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-input hover:border-primary/50"
            }`}
          >
            <span className="block font-medium">Automatic</span>
            <span className="block text-xs text-muted-foreground mt-1">Send rent reminders &amp; track online payments</span>
          </button>
          <button
            type="button"
            onClick={() => onChange({ rentCollection: "manual" })}
            className={`flex-1 p-3 rounded-lg border text-sm text-center transition-colors ${
              rentCollection === "manual"
                ? "border-primary bg-primary/5 text-primary font-medium"
                : "border-input hover:border-primary/50"
            }`}
          >
            <span className="block font-medium">Manual</span>
            <span className="block text-xs text-muted-foreground mt-1">I&apos;ll collect rent offline and record it manually</span>
          </button>
        </div>
      </div>
    </motion.div>
  )
}
