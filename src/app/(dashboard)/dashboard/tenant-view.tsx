"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Home, Receipt, Ticket, User, Calendar, CreditCard, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import KpiCard from "@/components/dashboard/kpi-card"
import PayRentDialog from "@/components/dashboard/pay-rent-dialog"
import PaymentHistory from "@/components/dashboard/payment-history"
import { createClient } from "@/lib/supabase/browser"

interface TenantInfo {
  id: string
  property_id: string
  unit_name: string
  property_name: string
  rent: number
  lease_start: string
  lease_end: string
  status: string
}

export default function TenantDashboard() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPaid: 0,
    pendingAmount: 0,
    openTickets: 0,
  })

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tenantData, error: tenantError } = await supabase
      .from("tenants")
      .select("*, units!inner(id, name, monthly_rent), properties!inner(id, name)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle()

    if (tenantError || !tenantData) return

    const tenantProps = tenantData.properties as { id: string; name: string }
    const tenantUnits = tenantData.units as { id: string; name: string; monthly_rent: number }

    setTenant({
      id: tenantData.id,
      property_id: tenantProps.id,
      unit_name: tenantUnits.name,
      property_name: tenantProps.name,
      rent: tenantUnits.monthly_rent,
      lease_start: tenantData.lease_start,
      lease_end: tenantData.lease_end,
      status: tenantData.status,
    })

    supabase
      .from("profiles")
      .select("email")
      .eq("user_id", user.id)
      .single()
      .then(({ data: profileData }) => {
        if (profileData) setEmail(profileData.email || "")
      })

    const { data: payments } = await supabase
      .from("payments")
      .select("amount, status")
      .eq("tenant_id", tenantData.id)

    const paid = (payments || [])
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + (p.amount || 0), 0)

    const pending = (payments || [])
      .filter((p) => p.status !== "approved")
      .reduce((s, p) => s + (p.amount || 0), 0)

    const { count: ticketCount } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantData.id)
      .neq("status", "closed")

    setStats({
      totalPaid: paid,
      pendingAmount: pending,
      openTickets: ticketCount || 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData().then(() => {})
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No active tenancy found.</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back! Here is your tenancy overview.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="My Unit"
          textValue={tenant.unit_name}
          subtitle={tenant.property_name}
          icon={<Home className="w-5 h-5" />}
          delay={0}
        />
        <KpiCard
          title="Monthly Rent"
          value={tenant.rent}
          prefix="₦"
          icon={<Receipt className="w-5 h-5" />}
          delay={0.05}
        />
        <KpiCard
          title="Total Paid"
          value={stats.totalPaid}
          prefix="₦"
          icon={<User className="w-5 h-5" />}
          delay={0.1}
        />
        <KpiCard
          title="Open Tickets"
          value={stats.openTickets}
          icon={<Ticket className="w-5 h-5" />}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4" />
              Lease Period
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Start:</span>{" "}
                <span className="font-medium">{new Date(tenant.lease_start).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">End:</span>{" "}
                <span className="font-medium">{new Date(tenant.lease_end).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>{" "}
                <span className="font-medium capitalize text-emerald-600">{tenant.status}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="w-4 h-4" />
              Pay Rent
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pay your monthly rent of {new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(tenant.rent)} securely via Paystack.
            </p>
            <PayRentDialog
              tenantId={tenant.id}
              propertyId={tenant.property_id}
              rentAmount={tenant.rent}
              email={email}
              onSuccess={fetchData}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="w-4 h-4" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <PaymentHistory tenantId={tenant.id} />
        </CardContent>
      </Card>
    </motion.div>
  )
}
