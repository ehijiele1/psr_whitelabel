"use client"

import { useEffect, useState, useMemo } from "react"
import { Loader2 } from "lucide-react"
import { Building2, Users, TrendingUp, Clock } from "lucide-react"
import KpiCard from "@/components/dashboard/kpi-card"
import RevenueChart from "@/components/dashboard/revenue-chart-lazy"
import OccupancyChart from "@/components/dashboard/occupancy-chart-lazy"
import RecentPayments from "@/components/dashboard/recent-payments"
import QuickActions from "@/components/dashboard/quick-actions"
import MaintenanceAlerts from "@/components/dashboard/maintenance-alerts"
import { createClient } from "@/lib/supabase/browser"
import { useProperty } from "@/contexts/PropertyContext"
import { brand } from "@/lib/config"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default function LandlordDashboard() {
  const { activePropertyId } = useProperty()
  const supabase = useMemo(() => createClient(), [])
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    totalUnits: 0,
    occupiedUnits: 0,
  })
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])
  const [occupancyData, setOccupancyData] = useState<{ name: string; value: number; color: string }[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activePropertyId) return
    const active = true

    ;(async () => {
      try {
        await Promise.resolve()
        if (!active) return
        setLoading(true)
        const responses = await Promise.allSettled([
          supabase.from("properties").select("id", { count: "exact", head: true }),
          supabase.from("tenants").select("id", { count: "exact", head: true }).eq("status", "active").eq("property_id", activePropertyId),
          supabase.from("units").select("id", { count: "exact", head: true }).eq("property_id", activePropertyId),
          supabase.from("units").select("id", { count: "exact", head: true }).eq("status", "occupied").eq("property_id", activePropertyId),
          supabase.from("payments").select("amount, created_at").eq("status", "approved").eq("property_id", activePropertyId),
          supabase.from("payments").select("amount").neq("status", "approved").eq("property_id", activePropertyId),
        ])

        const getCount = (res: PromiseSettledResult<{ count: number | null }>) =>
          res.status === "fulfilled" ? res.value.count || 0 : 0
        const getData = (res: PromiseSettledResult<{ data: unknown[] | null }>) =>
          res.status === "fulfilled" ? res.value.data || [] : []

        const propertiesCount = getCount(responses[0])
        const tenantsCount = getCount(responses[1])
        const unitsCount = getCount(responses[2])
        const occupiedCount = getCount(responses[3])
        const approvedPayments = getData(responses[4]) as { amount: number; created_at: string }[]
        const pendingData = getData(responses[5]) as { amount: number }[]

        const revenue = (approvedPayments || []).reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0)
        const pending = (pendingData || []).reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0)

        setStats({
          totalProperties: propertiesCount || 0,
          activeTenants: tenantsCount || 0,
          totalRevenue: revenue,
          pendingPayments: pending,
          totalUnits: unitsCount || 0,
          occupiedUnits: occupiedCount || 0,
        })

        const monthlyRevenue: Record<string, number> = {}
        for (const p of approvedPayments || []) {
          if (p.created_at) {
            const d = new Date(p.created_at)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
            monthlyRevenue[key] = (monthlyRevenue[key] || 0) + (p.amount || 0)
          }
        }
        const now = new Date()
        const chartData = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          return { month: MONTHS[d.getMonth()], revenue: monthlyRevenue[key] || 0 }
        })
        setRevenueData(chartData)

        setOccupancyData([
          { name: "Occupied", value: occupiedCount || 0, color: "#1e3a5f" },
          { name: "Vacant", value: Math.max(0, (unitsCount || 0) - (occupiedCount || 0)), color: "#e2e6ee" },
        ])
      } catch (err) {
        console.error('Failed to fetch landlord dashboard data:', err)
      } finally {
        if (active) setLoading(false)
      }
    })()
  }, [activePropertyId, supabase])

  if (!activePropertyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center">
        <div className="max-w-sm p-6 bg-muted rounded-xl border border-dashed">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Property Selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Please select a property from the header to view your dashboard statistics and reports.
          </p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your property operations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={<Building2 className="w-5 h-5" />}
          delay={0}
        />
        <KpiCard
          title="Occupied Units"
          value={stats.occupiedUnits}
          suffix={stats.totalUnits ? `/ ${stats.totalUnits}` : ""}
          icon={<Users className="w-5 h-5" />}
          delay={0.05}
        />
        <KpiCard
          title="Total Revenue"
          value={stats.totalRevenue}
          prefix={brand.currencySymbol}
          icon={<TrendingUp className="w-5 h-5" />}
          delay={0.1}
        />
        <KpiCard
          title="Pending Payments"
          value={stats.pendingPayments}
          prefix={brand.currencySymbol}
          icon={<Clock className="w-5 h-5" />}
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>
        <div>
          <OccupancyChart data={occupancyData} />
        </div>
      </div>

      <RecentPayments propertyId={activePropertyId} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <QuickActions />
        <MaintenanceAlerts />
      </div>
    </div>
  )
}