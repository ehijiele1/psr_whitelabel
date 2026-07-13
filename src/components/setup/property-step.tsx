"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

interface PropertyStepProps {
  data: { name: string; address: string; type: string }
  onChange: (fields: Partial<PropertyStepProps["data"]>) => void
}

const propertyTypes = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Mixed", label: "Mixed (Residential & Commercial)" },
]

export default function PropertyStep({ data, onChange }: PropertyStepProps) {
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
        <Label htmlFor="propName">Property Name</Label>
        <Input
          id="propName"
          placeholder="e.g. PrinceSteve Heights"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propAddress">Address</Label>
        <Input
          id="propAddress"
          placeholder="35 Godilove Street, Akowonjo, Egbeda, Lagos"
          value={data.address}
          onChange={(e) => onChange({ address: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="propType">Property Type</Label>
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
    </motion.div>
  )
}
