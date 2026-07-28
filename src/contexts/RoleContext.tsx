"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { createClient } from "@/lib/supabase/browser"
import type { Role } from "@/types"

interface RoleContextType {
  role: Role | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const RoleContext = createContext<RoleContextType | undefined>(undefined)

interface RoleProviderProps {
  children: ReactNode
  initialRole?: Role | null
}

export function RoleProvider({ children, initialRole }: RoleProviderProps) {
  const [role, setRole] = useState<Role | null>(initialRole || null)
  const [isLoading, setIsLoading] = useState(!initialRole)
  const [error, setError] = useState<string | null>(null)

  const fetchRole = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setRole(null)
        setIsLoading(false)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (profileError) {
        console.error("[RoleContext] Failed to fetch role:", profileError)
        setError(profileError.message)
        setRole(null)
      } else {
        setRole(profile?.role as Role || null)
      }
    } catch (err) {
      console.error("[RoleContext] Error fetching role:", err)
      setError((err as Error).message)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch role on mount if not provided as initial prop
  useEffect(() => {
    if (!initialRole) {
      fetchRole()
    }
  }, [initialRole])

  const value: RoleContextType = {
    role,
    isLoading,
    error,
    refetch: fetchRole,
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextType {
  const context = useContext(RoleContext)
  if (context === undefined) {
    throw new Error("useRole must be used within a RoleProvider")
  }
  return context
}

// Helper hook to check if user has a specific role
export function useHasRole(requiredRoles: Role[]): boolean {
  const { role, isLoading } = useRole()
  
  if (isLoading) return false
  if (!role) return false
  
  return requiredRoles.includes(role)
}

// Helper hook to get role with loading state
export function useUserRole(): { role: Role | null; isLoading: boolean; isAdmin: boolean; isTenant: boolean } {
  const { role, isLoading } = useRole()
  
  return {
    role,
    isLoading,
    isAdmin: role === "landlord" || role === "caretaker",
    isTenant: role === "tenant",
  }
}
