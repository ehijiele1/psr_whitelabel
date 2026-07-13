"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/browser"

interface TicketAlert {
  id: string
  title: string
  priority: string
  status: string
  created_at: string
  unit: { name: string }[] | null
}

const priorityBadge: Record<string, { label: string; variant: "destructive" | "warning" | "secondary" }> = {
  urgent: { label: "Urgent", variant: "destructive" },
  high: { label: "High", variant: "warning" },
  medium: { label: "Medium", variant: "secondary" },
  low: { label: "Low", variant: "secondary" },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

export default function MaintenanceAlerts() {
  const router = useRouter()
  const [alerts, setAlerts] = useState<TicketAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAlerts() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("tickets")
        .select("id, title, priority, status, created_at, unit:units!inner(name)")
        .in("status", ["open", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5)
      if (error) {
        console.error("Failed to load maintenance alerts:", error.message)
      } else {
        setAlerts(data ?? [])
      }
      setLoading(false)
    }
    loadAlerts()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.55 }}
    >
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Maintenance Alerts</CardTitle>
          <Badge
            variant="outline"
            className="text-xs font-normal cursor-pointer hover:bg-muted transition-colors"
            onClick={() => router.push("/dashboard/tickets")}
          >
            View all
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No open maintenance tickets.</p>
          ) : (
            alerts.map((alert, i) => {
              const badge = priorityBadge[alert.priority] ?? { label: alert.priority, variant: "secondary" }
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => router.push("/dashboard/tickets")}
                >
                  <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{alert.title}</p>
                      <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {alert.unit?.[0]?.name ?? "—"} · {timeAgo(alert.created_at)}
                    </p>
                  </div>
                </motion.div>
              )
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
