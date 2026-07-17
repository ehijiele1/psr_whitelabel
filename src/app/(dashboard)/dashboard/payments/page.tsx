"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { Receipt, Search, Check, X, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { formatCurrency } from "@/lib/paystack-client"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

interface PaymentTenant {
  id: string
  profiles: { full_name: string }
  units: { name: string }
}

interface Payment {
  id: string
  tenant_id: string
  amount: number
  type: string
  period: string | null
  method: string
  notes: string | null
  status: string
  created_at: string
  approved_by: string | null
  approved_at: string | null
  tenants: PaymentTenant
}

interface TenantOption {
  id: string
  full_name: string
  unit_name: string
  monthly_rent: number
  property_id: string
}

const statusStyles: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  paid: { label: "Paid", variant: "success" },
  pending: { label: "Pending", variant: "warning" },
  overdue: { label: "Overdue", variant: "destructive" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "destructive" },
}

export default function PaymentsPage() {
  const supabase = createClient()

  const [payments, setPayments] = useState<Payment[]>([])
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string } | null>(null)

  const [formData, setFormData] = useState({
    tenant_id: "",
    type: "rent",
    amount: "",
    period_start: "",
    period_end: "",
    method: "paystack",
    notes: "",
  })

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*, tenants!inner(id, profiles!inner(full_name), units!inner(name))")
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(error.message)
      } else {
        setPayments((data as Payment[]) || [])
      }
    } catch {
      toast.error("Failed to load payments")
    } finally {
      setLoading(false)
    }
  }, [supabase])

  const fetchTenants = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, profiles!inner(full_name), units!inner(name, monthly_rent, property_id)")

      if (error) {
        toast.error(error.message)
      } else {
        setTenants(
          ((data as unknown as {
            id: string
            profiles: { full_name: string }
            units: { name: string; monthly_rent: number; property_id: string }
          }[]) || []).map((t) => ({
            id: t.id,
            full_name: t.profiles.full_name,
            unit_name: t.units.name,
            monthly_rent: t.units.monthly_rent,
            property_id: t.units.property_id,
          }))
        )
      }
      } catch {
        toast.error("Failed to load payments")
      }
  }, [supabase])

  useEffect(() => {
    const init = async () => {
      const { data: { user: u } } = await supabase.auth.getUser()
      setUser(u ? { id: u.id } : null)
      await Promise.all([fetchPayments(), fetchTenants()])
    }
    init()
  }, [supabase, fetchPayments, fetchTenants])

  const totalCollected = payments
    .filter((p) => p.status === "approved" || p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0)
  const totalOverdue = payments
    .filter((p) => p.status === "overdue")
    .reduce((sum, p) => sum + p.amount, 0)

  const filteredPayments = payments.filter((p) => {
    const matchesFilter = filter === "all" || p.status === filter
    const matchesSearch = p.tenants?.profiles?.full_name
      ?.toLowerCase()
      .includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleApprove = async (id: string) => {
    setApprovingId(id)
    const { error } = await supabase
      .from("payments")
      .update({ status: "approved", approved_by: user?.id, approved_at: new Date().toISOString() })
      .eq("id", id)
    if (error) {
      console.error("Error approving payment:", error)
      toast.error(error.message)
    } else {
      toast.success("Payment approved")
    }
    setApprovingId(null)
    fetchPayments()
  }

  const handleReject = async (id: string) => {
    setRejectingId(id)
    const { error } = await supabase
      .from("payments")
      .update({ status: "rejected" })
      .eq("id", id)
    if (error) {
      console.error("Error rejecting payment:", error)
      toast.error(error.message)
    } else {
      toast.success("Payment rejected")
    }
    setRejectingId(null)
    fetchPayments()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const selectedTenant = tenants.find((t) => t.id === formData.tenant_id)
    if (!selectedTenant) {
      toast.error("Please select a tenant")
      setSubmitting(false)
      return
    }
    const period =
      formData.period_start && formData.period_end
        ? `${formData.period_start} to ${formData.period_end}`
        : formData.period_start || null
    const { error } = await supabase.from("payments").insert({
      tenant_id: formData.tenant_id,
      tenant_name: selectedTenant.full_name,
      unit: selectedTenant.unit_name,
      property_id: selectedTenant.property_id,
      amount: Number(formData.amount),
      type: formData.type,
      period,
      method: formData.method,
      date: formData.period_start || new Date().toISOString().split("T")[0],
      notes: formData.notes || null,
      status: "pending",
    })
    if (error) {
      console.error("Error recording payment:", error)
      toast.error(error.message)
    } else {
      toast.success("Payment recorded")
      setDialogOpen(false)
      setFormData({
        tenant_id: "",
        type: "rent",
        amount: "",
        period_start: "",
        period_end: "",
        method: "paystack",
        notes: "",
      })
      fetchPayments()
    }
    setSubmitting(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track rent and utility payments across all properties.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Receipt className="h-4 w-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a new rent or utility payment.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tenant">Tenant</Label>
                <select
                  id="tenant"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.tenant_id}
                  onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                  required
                >
                  <option value="">Select tenant...</option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} — {t.unit_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Payment Type</Label>
                <select
                  id="type"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="rent">Rent</option>
                  <option value="levy">Levy</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₦)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g. 450000"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="period_start">Cycle Start</Label>
                  <Input
                    id="period_start"
                    type="date"
                    value={formData.period_start}
                    onChange={(e) =>
                      setFormData({ ...formData, period_start: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end">Cycle End</Label>
                  <Input
                    id="period_end"
                    type="date"
                    value={formData.period_end}
                    onChange={(e) =>
                      setFormData({ ...formData, period_end: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Payment Method</Label>
                <select
                  id="method"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                >
                  <option value="paystack">Paystack</option>
                  <option value="cash">Cash</option>
                  <option value="bank transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  placeholder="Optional notes..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Record Payment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total Collected</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatCurrency(totalCollected)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {payments.filter((p) => p.status === "approved" || p.status === "paid").length} transactions
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Pending Approval</p>
              <p className="text-xl font-bold text-amber-600 mt-0.5">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-muted-foreground mt-1">{payments.filter((p) => p.status === "pending").length} awaiting approval</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Overdue</p>
              <p className="text-xl font-bold text-destructive mt-0.5">{formatCurrency(totalOverdue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{payments.filter((p) => p.status === "overdue").length} overdue bills</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by tenant name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["all", "paid", "pending", "overdue"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No payments found</p>
            <p className="text-sm">
              {search || filter !== "all"
                ? "Try adjusting your search or filter."
                : "Record your first payment to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Unit</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Period</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Method</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                </tr>
              </thead>
              <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
                {filteredPayments.map((payment) => {
                  const status = statusStyles[payment.status] || statusStyles.pending
                  const name = payment.tenants?.profiles?.full_name || "Unknown"
                  const unit = payment.tenants?.units?.name || "—"
                  const isApproving = approvingId === payment.id
                  const isRejecting = rejectingId === payment.id
                  const period = payment.period || "—"
                  const date = new Date(payment.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  return (
                    <motion.tr
                      key={payment.id}
                      variants={staggerItem}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors group"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">{unit}</td>
                      <td className="px-6 py-3 text-sm font-medium text-right">{formatCurrency(payment.amount)}</td>
                      <td className="px-6 py-3 text-sm">
                        <Badge
                          variant={payment.type === "Rent" || payment.type === "rent" ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {payment.type}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{period}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground capitalize">{payment.method}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{date}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Badge variant={status.variant} className="text-xs">{status.label}</Badge>
                          {payment.status === "pending" && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleApprove(payment.id)}
                                disabled={isApproving || isRejecting}
                                className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 flex items-center justify-center disabled:opacity-50"
                                title="Approve"
                              >
                                {isApproving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              </button>
                              <button
                                onClick={() => handleReject(payment.id)}
                                disabled={isApproving || isRejecting}
                                className="h-6 w-6 rounded-full bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 flex items-center justify-center disabled:opacity-50"
                                title="Reject"
                              >
                                {isRejecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
