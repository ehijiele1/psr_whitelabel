"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/browser"
import { formatCurrency } from "@/lib/paystack"
import { Loader2 } from "lucide-react"

interface Payment {
  id: string
  amount: number
  type: string
  cycle_start: string
  cycle_end: string
  method: string
  status: string
  created_at: string
}

interface PaymentHistoryProps {
  tenantId: string
}

const statusVariant: Record<string, "success" | "warning" | "destructive"> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
}

export default function PaymentHistory({ tenantId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPayments = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false })

      if (data) setPayments(data as Payment[])
      setLoading(false)
    }

    fetchPayments()
  }, [tenantId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No payment history yet.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Period</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Method</th>
            <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
            <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.04 } },
          }}
        >
          {payments.map((payment) => (
            <motion.tr
              key={payment.id}
              variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
              }}
              className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
            >
              <td className="px-6 py-3.5 text-sm font-medium">
                {formatCurrency(payment.amount)}
              </td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground capitalize">
                {payment.type}
              </td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground">
                {new Date(payment.cycle_start).toLocaleDateString()} –{" "}
                {new Date(payment.cycle_end).toLocaleDateString()}
              </td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground capitalize">
                {payment.method}
              </td>
              <td className="px-6 py-3.5">
                <Badge variant={statusVariant[payment.status] || "outline"} className="text-xs capitalize">
                  {payment.status}
                </Badge>
              </td>
              <td className="px-6 py-3.5 text-sm text-muted-foreground text-right">
                {new Date(payment.created_at).toLocaleDateString()}
              </td>
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  )
}
