"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"
import LandlordDashboard from "./landlord-view"
import TenantDashboard from "./tenant-view"

export default function DashboardPage() {
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()

      setRole(profile?.role || null)
      setLoading(false)
    }

    fetchRole()
  }, [])

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const adminRoles = ["landlord", "caretaker"]

  if (role && adminRoles.includes(role)) {
    return <LandlordDashboard />
  }

  return <TenantDashboard />
}
