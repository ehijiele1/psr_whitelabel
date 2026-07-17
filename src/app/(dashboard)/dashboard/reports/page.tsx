"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Download } from "lucide-react"
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import RevenueChart from "@/components/dashboard/revenue-chart"
import { createClient } from "@/lib/supabase/browser"
import { formatCurrency } from "@/lib/paystack-client"

interface Stats {
  totalRevenue: number
  occupancyRate: number
  collectionRate: number
  newTenants: number
  topProperties: { name: string; occupancy: number }[]
  onTimePct: number
  latePct: number
  overduePct: number
}

function generateCSV(stats: Stats): string {
  const rows = [
    ["Report", "Value"],
    ["Total Revenue (YTD)", `\u20A6${stats.totalRevenue.toLocaleString()}`],
    ["Occupancy Rate", `${stats.occupancyRate}%`],
    ["Collection Rate", `${stats.collectionRate}%`],
    ["New Tenants (Q2)", String(stats.newTenants)],
    [],
    ["Top Properties", "Occupancy"],
    ...stats.topProperties.map((p) => [p.name, `${p.occupancy}%`]),
    [],
    ["Payment Summary", "Percentage"],
    ["On-time", `${stats.onTimePct}%`],
    ["Late", `${stats.latePct}%`],
    ["Overdue", `${stats.overduePct}%`],
  ]
  return rows.map((r) => r.join(",")).join("\n")
}

export default function ReportsPage() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    occupancyRate: 0,
    collectionRate: 0,
    newTenants: 0,
    topProperties: [],
    onTimePct: 0,
    latePct: 0,
    overduePct: 0,
  })
  const [revenueData, setRevenueData] = useState<{ month: string; revenue: number }[]>([])

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      const [propertiesRes, unitsRes, tenantsRes, paymentsRes, approvedRes] = await Promise.all([
        supabase.from("properties").select("id, name"),
        supabase.from("units").select("id, status, property_id"),
        supabase.from("tenants").select("id, created_at"),
        supabase.from("payments").select("amount, status, created_at"),
        supabase.from("payments").select("amount, created_at").eq("status", "approved"),
      ])

      const totalUnits = unitsRes.data?.length || 0
      const occupiedUnits = (unitsRes.data || []).filter((u) => u.status === "occupied").length
      const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0

      const approvedAmount = (approvedRes.data || []).reduce((s: number, p: { amount: number }) => s + (p.amount || 0), 0)

      const allPayments = paymentsRes.data || []
      const onTimeCount = allPayments.filter((p) => p.status === "approved").length
      const overdueCount = allPayments.filter((p) => p.status === "rejected").length
      const pendingCount = allPayments.filter((p) => p.status === "pending").length
      const totalPayments = allPayments.length || 1
      const collectionRate = totalPayments > 0 ? Math.round((onTimeCount / totalPayments) * 100 * 10) / 10 : 0

      const recentTenants = (tenantsRes.data || []).filter((t) => {
        const d = new Date(t.created_at)
        const now = new Date()
        return d >= new Date(now.getFullYear(), now.getMonth() - 3, 1)
      }).length

      const onTimePct = totalPayments > 0 ? Math.round((onTimeCount / totalPayments) * 100) : 0
      const latePct = totalPayments > 0 ? Math.round((pendingCount / totalPayments) * 100) : 0
      const overduePct = totalPayments > 0 ? Math.round((overdueCount / totalPayments) * 100) : 0

      setStats({
        totalRevenue: approvedAmount,
        occupancyRate,
        collectionRate,
        newTenants: recentTenants,
        topProperties: (propertiesRes.data || []).map((p) => {
          const propUnits = (unitsRes.data || []).filter((u) => u.property_id === p.id)
          const total = propUnits.length
          const occ = propUnits.filter((u) => u.status === "occupied").length
          return { name: p.name, occupancy: total > 0 ? Math.round((occ / total) * 100) : 0 }
        }).sort((a, b) => b.occupancy - a.occupancy).slice(0, 3),
        onTimePct,
        latePct,
        overduePct,
      })

      const approvedWithDate = (approvedRes.data || []) as { amount: number; created_at: string }[]
      const monthlyRevenue: Record<string, number> = {}
      for (const p of approvedWithDate) {
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
    })()
  }, [])

  const handleExport = () => {
    const csv = generateCSV(stats)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analytics and performance reports for your portfolio.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: "Total Revenue (YTD)", value: formatCurrency(stats.totalRevenue), change: "" },
          { label: "Occupancy Rate", value: `${stats.occupancyRate}%`, change: "" },
          { label: "Avg. Rent Collection", value: `${stats.collectionRate}%`, change: "" },
          { label: "New Tenants (Q2)", value: String(stats.newTenants), change: "" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-xl font-bold">{stat.value}</p>
                  {stat.change && (
                    <span className="text-xs font-medium text-emerald-600">{stat.change}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-[3/1]">
            <RevenueChart data={revenueData} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performing Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground">No property data yet.</p>
            ) : (
              stats.topProperties.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-muted-foreground">{p.occupancy}% occupancy</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "On-time payments", pct: stats.onTimePct, color: "bg-emerald-500" },
              { label: "Late payments", pct: stats.latePct, color: "bg-amber-500" },
              { label: "Overdue", pct: stats.overduePct, color: "bg-destructive" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.max(item.pct, 2)}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
