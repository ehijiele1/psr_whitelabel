"use client"

import React from "react"
import { useProperty } from "@/contexts/PropertyContext"
import { Select } from "@/components/ui/select"
import { Building2 } from "lucide-react"

export default function PropertySelector() {
  const { properties, activePropertyId, setActivePropertyId, isLoading } = useProperty()

  if (isLoading) return <div className="h-10 w-48 animate-pulse bg-muted rounded-md" />

  return (
    <div className="flex items-center gap-2">
      <Building2 className="w-4 h-4 text-muted-foreground" />
      <Select
        value={activePropertyId ?? ""}
        onChange={(e) => setActivePropertyId(e.target.value)}
        className="w-[200px] h-9"
      >
        <option value="">Select Property</option>
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
