"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/browser"

interface Property {
  id: string
  name: string
}

interface PropertyContextType {
  activePropertyId: string | null
  setActivePropertyId: (id: string | null) => void
  properties: Property[]
  isLoading: boolean
  refreshProperties: () => Promise<void>
}

const PropertyContext = createContext<PropertyContextType | undefined>(undefined)

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setLoading] = useState(true)

  const refreshProperties = async () => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("properties")
      .select("id, name")
      .order("name")

    if (!error && data) {
      setProperties(data)
      if (!activePropertyId && data.length > 0) {
        setActivePropertyId(data[0].id)
      }
    }
    setLoading(false)
  }

  useEffect(() => {
    refreshProperties()
  }, [])

  return (
    <PropertyContext.Provider value={{ activePropertyId, setActivePropertyId, properties, isLoading, refreshProperties }}>
      {children}
    </PropertyContext.Provider>
  )
}

export const useProperty = () => {
  const context = useContext(PropertyContext)
  if (!context) {
    throw new Error("useProperty must be used within a PropertyProvider")
  }
  return context
}
