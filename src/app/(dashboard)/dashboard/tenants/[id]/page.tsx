"use client"

interface TenantProfile {
  full_name: string
  email: string | null
  phone: string | null
}

interface TenantUnit {
  id: string
  name: string
  deposit_amount: number | null
}

interface TenantProperty {
  id: string
  name: string
}

interface TenantData {
  id: string
  user_id: string
  status: string
  rent: number | null
  lease_start: string | null
  lease_end: string | null
  notes: string | null
  profiles: TenantProfile
  units: TenantUnit
  properties: TenantProperty
}

interface PaymentData {
  id: string
  amount: number
  status: string
  method: string | null
  period: string | null
  created_at: string
}

interface TicketData {
  id: string
  title: string
  status: string
  priority: string
  created_at: string
}

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, use } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Receipt, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"
import DocumentsTab from "@/components/tenants/documents-tab"
import { brand } from "@/lib/config"

function formatCurrency(amount: number) {
  return brand.currencySymbol + amount.toLocaleString("en-US")
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

const paymentStatusStyles: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  approved: "success",
  pending: "warning",
  rejected: "destructive",
  paid: "success",
}

const ticketStatusStyles: Record<string, "warning" | "secondary" | "success" | "destructive"> = {
  open: "warning",
  in_progress: "secondary",
  resolved: "success",
  closed: "destructive",
}

const ticketPriorityStyles: Record<string, "destructive" | "warning" | "secondary"> = {
  urgent: "destructive",
  high: "destructive",
  medium: "warning",
  low: "secondary",
}

export default function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("overview")

  const [tenant, setTenant] = useState<TenantData | null>(null)
  const [payments, setPayments] = useState<PaymentData[]>([])
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase
        .from("tenants")
        .select("*, profiles(*), units(*), properties(*)")
        .eq("id", id)
        .single(),
      supabase
        .from("payments")
        .select("*")
        .eq("tenant_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tickets")
        .select("*, units(name)")
        .eq("tenant_id", id)
        .order("created_at", { ascending: false }),
    ])
      .then(([tenantResult, paymentsResult, ticketsResult]) => {
        if (tenantResult.data) setTenant(tenantResult.data as unknown as TenantData)
        if (paymentsResult.data) setPayments(paymentsResult.data as unknown as PaymentData[])
        if (ticketsResult.data) setTickets(ticketsResult.data as unknown as TicketData[])
      })
      .catch(() => toast.error("Failed to load tenant details"))
      .finally(() => setLoading(false))
  }, [id, supabase])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to tenants
        </Link>
        <Card>
          <CardContent className="p-12 text-center text-sm text-muted-foreground">
            Tenant not found.
          </CardContent>
        </Card>
      </div>
    )
  }

  const profile = tenant.profiles || {}
  const unit = tenant.units || {}
  const property = tenant.properties || {}

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Link
        href="/dashboard/tenants"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to tenants
      </Link>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {(profile.full_name || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">{profile.full_name || "Unknown"}</h1>
                <Badge variant={(tenant.status === "active" ? "success" : tenant.status === "overdue" ? "destructive" : "secondary") as "success" | "destructive" | "secondary"}>
                  {tenant.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
                {profile.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" /> {profile.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> {unit.name || "-"}, {property.name || "-"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/messages">
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-1.5" />
                  Message
                </Button>
              </Link>
              <Link href="/dashboard/payments">
                <Button size="sm">Record Payment</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Monthly Rent", value: formatCurrency(tenant.rent || 0), icon: Receipt },
          { label: "Deposit", value: formatCurrency(unit.deposit_amount || 0), icon: FileText },
          { label: "Lease Start", value: formatDate(tenant.lease_start), icon: Calendar },
          { label: "Lease End", value: formatDate(tenant.lease_end), icon: Calendar },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold mt-0.5">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
          <TabsTrigger value="tickets">Tickets ({tickets.length})</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <TabsContent value="overview" className="mt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3">Tenancy Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Property</span><p className="font-medium">{property.name || "-"}</p></div>
                      <div><span className="text-muted-foreground">Unit</span><p className="font-medium">{unit.name || "-"}</p></div>
                      <div><span className="text-muted-foreground">Rent Amount</span><p className="font-medium">{formatCurrency(tenant.rent || 0)}/month</p></div>
                      <div><span className="text-muted-foreground">Security Deposit</span><p className="font-medium">{formatCurrency(unit.deposit_amount || 0)}</p></div>
                      <div><span className="text-muted-foreground">Lease Start</span><p className="font-medium">{formatDate(tenant.lease_start)}</p></div>
                      <div><span className="text-muted-foreground">Lease End</span><p className="font-medium">{formatDate(tenant.lease_end)}</p></div>
                      <div><span className="text-muted-foreground">Status</span><p className="font-medium capitalize">{tenant.status}</p></div>
                      {tenant.notes && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Notes</span>
                          <p className="font-medium mt-0.5">{tenant.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Email</span><p className="font-medium">{profile.email || "-"}</p></div>
                      <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{profile.phone || "-"}</p></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Period</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date Paid</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Method</th>
                        <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                            No payments recorded yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((payment, i) => (
                          <tr key={payment.id || i} className="border-b border-border/50 last:border-0">
                            <td className="px-6 py-3 text-sm font-medium">
                              {payment.period ? payment.period : formatDate(payment.created_at)}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-right">{formatCurrency(payment.amount)}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">{formatDate(payment.created_at)}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground capitalize">{payment.method || "-"}</td>
                            <td className="px-6 py-3 text-right">
                              <Badge variant={paymentStatusStyles[payment.status] || "secondary"} className="text-xs">
                                {payment.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="tickets" className="mt-4">
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Ticket</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Title</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Priority</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                        <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                            No maintenance tickets yet.
                          </td>
                        </tr>
                      ) : (
                        tickets.map((ticket) => (
                          <tr key={ticket.id} className="border-b border-border/50 last:border-0">
                            <td className="px-6 py-3 text-sm font-medium">
                              {ticket.id?.toString().padStart(3, "0") || "-"}
                            </td>
                            <td className="px-6 py-3 text-sm">{ticket.title}</td>
                            <td className="px-6 py-3">
                              <Badge variant={ticketPriorityStyles[ticket.priority] || "secondary"} className="text-xs">
                                {ticket.priority}
                              </Badge>
                            </td>
                            <td className="px-6 py-3">
                              <Badge variant={ticketStatusStyles[ticket.status] || "secondary"} className="text-xs">
                                {ticket.status?.replace("_", " ")}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">{formatDate(ticket.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsTab tenantId={id} userId={tenant.user_id} />
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
