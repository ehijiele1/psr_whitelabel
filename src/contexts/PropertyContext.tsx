"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react"
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
  const activePropertyIdRef = useRef<string | null>(null)

  const refreshProperties = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setProperties([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase.from("properties").select("id, name").order("name")

    if (error) {
      console.error("[PropertyContext] Failed to load properties:", error.message)
    } else if (data) {
      setProperties(data)
      if (!activePropertyIdRef.current && data.length > 0) {
        activePropertyIdRef.current = data[0].id
        setActivePropertyId(data[0].id)
      }
    }
    setLoading(false)
  }, [])

  const updateActivePropertyId = useCallback((id: string | null) => {
    activePropertyIdRef.current = id
    setActivePropertyId(id)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProperties()
  }, [refreshProperties])

  return (
    <PropertyContext.Provider value={{ activePropertyId, setActivePropertyId: updateActivePropertyId, properties, isLoading, refreshProperties }}>
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