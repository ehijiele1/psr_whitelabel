"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Loader2 } from "lucide-react"
import { Building2, Users, Ticket, MessageSquare } from "lucide-react"
import KpiCard from "@/components/dashboard/kpi-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { createClient } from "@/lib/supabase/browser"

export default function CaretakerDashboard() {
  const [stats, setStats] = useState({
    totalTenants: 0,
    openTickets: 0,
    pendingPayments: 0,
    unreadMessages: 0,
  })
  const [recentTickets, setRecentTickets] = useState<
    Array<{ id: string; title: string; priority: string; status: string; created_at: string }>
  >([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("No user")

      // Count active tenants
      const { count: tenantCount } = await supabase
        .from("tenants")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")

      // Count open tickets
      const { count: ticketCount } = await supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress"])

      // Count pending payments
      const { count: paymentCount } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")

      // Count unread messages
      const { count: messageCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false)

      // Fetch recent tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select("id, title, status, priority, created_at")
        .order("created_at", { ascending: false })
        .limit(5)

      setStats({
        totalTenants: tenantCount || 0,
        openTickets: ticketCount || 0,
        pendingPayments: paymentCount || 0,
        unreadMessages: messageCount || 0,
      })
      setRecentTickets(tickets || [])
    } catch (err) {
      console.error("[CaretakerDashboard] Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Caretaker Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage tenants, maintenance tickets, and messages.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link href="/dashboard/tenants">
          <KpiCard
            title="Active Tenants"
            value={stats.totalTenants}
            icon={<Users className="w-5 h-5" />}
            delay={0}
          />
        </Link>
        <Link href="/dashboard/tickets">
          <KpiCard
            title="Open Tickets"
            value={stats.openTickets}
            icon={<Ticket className="w-5 h-5" />}
            delay={0.05}
          />
        </Link>
        <Link href="/dashboard/payments">
          <KpiCard
            title="Pending Payments"
            value={stats.pendingPayments}
            icon={<Building2 className="w-5 h-5" />}
            delay={0.1}
          />
        </Link>
        <Link href="/dashboard/messages">
          <KpiCard
            title="Unread Messages"
            value={stats.unreadMessages}
            icon={<MessageSquare className="w-5 h-5" />}
            delay={0.15}
          />
        </Link>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Recent Maintenance Tickets</h2>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets found.</p>
          ) : (
            <div className="space-y-3">
              {recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-4 p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <p className="text-xs text-muted-foreground">
                      #{ticket.id.slice(0, 8)} ·{" "}
                      {new Date(ticket.created_at).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Badge variant={
                      ticket.priority === "urgent" ? "destructive" :
                      ticket.priority === "high" ? "warning" : "default"
                    } className="text-xs">
                      {ticket.priority}
                    </Badge>
                    <Badge variant={
                      ticket.status === "open" ? "warning" :
                      ticket.status === "in_progress" ? "default" : "success"
                    } className="text-xs">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}