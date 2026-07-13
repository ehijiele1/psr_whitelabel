"use client"

import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface PropertySelectionProps {
  data: { preferredProperty: string; unitType: string; moveInDate: string }
  onChange: (fields: Partial<{ preferredProperty: string; unitType: string; moveInDate: string }>) => void
}

const properties = [
  { value: "prince-steve-heights", label: "PrinceSteve Heights, VI" },
  { value: "ikeja-plaza", label: "Ikeja Commercial Plaza" },
  { value: "lekki-estate", label: "Lekki Phase 1 Estate" },
  { value: "surulere-complex", label: "Surulere Shopping Complex" },
]

const unitTypes = [
  { value: "apartment", label: "Apartment" },
  { value: "stall", label: "Stall" },
  { value: "shop", label: "Shop" },
]

export default function PropertySelection({ data, onChange }: PropertySelectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Property Selection</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose your preferred property and unit type.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Preferred Property</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {properties.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => onChange({ preferredProperty: p.value })}
                className={`p-3 rounded-lg border text-sm text-left transition-colors ${
                  data.preferredProperty === p.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-input hover:border-primary/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Unit Type</Label>
          <div className="flex gap-2">
            {unitTypes.map((ut) => (
              <button
                key={ut.value}
                type="button"
                onClick={() => onChange({ unitType: ut.value })}
                className={`flex-1 p-3 rounded-lg border text-sm text-center transition-colors ${
                  data.unitType === ut.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-input hover:border-primary/50"
                }`}
              >
                {ut.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="moveInDate">Preferred Move-In Date</Label>
          <Input
            id="moveInDate"
            type="date"
            value={data.moveInDate}
            onChange={(e) => onChange({ moveInDate: e.target.value })}
          />
        </div>
      </div>
    </motion.div>
  )
}
