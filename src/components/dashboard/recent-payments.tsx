"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { createClient } from "@/lib/supabase/browser"

interface Payment {
  id: string
  amount: number
  type: string
  status: string
  created_at: string
  tenant: { full_name: string }[] | null
  unit: { name: string }[] | null
}

const statusStyles: Record<string, { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  paid: { label: "Paid", variant: "success" },
  confirmed: { label: "Confirmed", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "destructive" },
  failed: { label: "Failed", variant: "destructive" },
}

function formatAmount(amount: number) {
  return `₦${(amount / 100).toLocaleString()}`
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export default function RecentPayments({ propertyId }: { propertyId: string }) {
  const router = useRouter()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPayments() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, type, status, created_at, tenant:tenants!inner(full_name), unit:units!inner(name)")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })
        .limit(5)
      if (error) {
        console.error("Failed to load recent payments:", error.message)
      } else {
        setPayments(data ?? [])
      }
      setLoading(false)
    }
    loadPayments()
  }, [propertyId])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Payments</CardTitle>
          <Badge
            variant="outline"
            className="text-xs font-normal cursor-pointer hover:bg-muted transition-colors"
            onClick={() => router.push("/dashboard/payments")}
          >
            View all
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No payments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Unit</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  </tr>
                </thead>
                <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                  {payments.map((payment) => {
                    const status = statusStyles[payment.status] ?? { label: payment.status, variant: "secondary" }
                    const tenantName = payment.tenant?.[0]?.full_name ?? "Unknown"
                    return (
                      <motion.tr
                        key={payment.id}
                        variants={staggerItem}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {tenantName.split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{tenantName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">
                          {payment.unit?.[0]?.name ?? "—"}
                        </td>
                        <td className="px-6 py-3.5 text-sm font-medium text-right">
                          {formatAmount(payment.amount)}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground capitalize">
                          {payment.type}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground">
                          {formatDate(payment.created_at)}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
