"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileText, CheckCircle, XCircle, Eye, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

interface Application {
  id: string
  user_id: string
  unit_id: string | null
  property_id: string | null
  step: number
  form_data: Record<string, unknown>
  status: string
  submitted_at: string
  profiles?: { full_name: string; email: string; phone: string }
  units?: { name: string; monthly_rent: number }
  properties?: { name: string }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Application | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from("applications")
          .select("*, profiles(full_name, email, phone), units(name, monthly_rent), properties(name)")
          .order("submitted_at", { ascending: false })
        if (error) {
          toast.error(error.message)
        } else if (data) {
          setApplications(data as unknown as Application[])
        }
      } catch {
        toast.error("Failed to load applications")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleAction = async (id: string, action: "approved" | "rejected") => {
    setActionLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setActionLoading(false)
      return
    }

    const app = applications.find((a) => a.id === id)
    if (!app) {
      setActionLoading(false)
      return
    }

    if (action === "approved") {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", id)

      if (updateError) {
        toast.error(updateError.message)
        setActionLoading(false)
        return
      }

      if (app.unit_id) {
        const { data: unit, error: unitError } = await supabase
          .from("units")
          .select("monthly_rent")
          .eq("id", app.unit_id)
          .single()

        if (unitError) {
          toast.error(unitError.message)
          setActionLoading(false)
          return
        }

        const now = new Date()
        const tenancyStart = now.toISOString().split("T")[0]
        const tenancyEnd = new Date(now.getTime() + 365 * 86400000).toISOString().split("T")[0]
        const { error: tenantError } = await supabase.from("tenants").insert({
          user_id: app.user_id,
          unit_id: app.unit_id,
          property_id: app.property_id,
          tenancy_start: tenancyStart,
          tenancy_end: tenancyEnd,
          rent_amount: unit?.monthly_rent || 0,
          status: "active",
          approved_by: user.id,
        })

        if (tenantError) {
          toast.error("Application approved but tenant creation failed: " + tenantError.message)
          setActionLoading(false)
          return
        }

        await supabase.from("units").update({ status: "occupied" }).eq("id", app.unit_id)
        await supabase.from("profiles").update({ role: "resident" }).eq("id", app.user_id)
      }

      toast.success("Application approved")
    } else {
      const { error } = await supabase
        .from("applications")
        .update({ status: "rejected", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
        .eq("id", id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Application rejected")
      }
    }

    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: action } : a))
    )
    setSelected(null)
    setActionLoading(false)
  }

  const renderFormData = (data: Record<string, unknown>) => {
    if (!data || Object.keys(data).length === 0) return null
    return (
      <div className="space-y-2 pt-4 border-t">
        <h4 className="text-sm font-medium">Additional Information</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
              <p className="font-medium truncate">{String(value ?? "N/A")}</p>
            </div>
          ))}
        </div>
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
        <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve tenant applications from the onboarding portal.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading applications...</div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">No applications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Applications from the tenant onboarding portal will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {(app.profiles?.full_name || "?").split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{app.profiles?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {app.profiles?.email} {app.units?.name ? `\u00b7 ${app.units.name}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant={
                      app.status === "approved" ? "success" :
                      app.status === "rejected" ? "destructive" :
                      "warning"
                    }
                    className="text-xs"
                  >
                    {app.status}
                  </Badge>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelected(app)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Application Details</DialogTitle>
                        </DialogHeader>
                        {selected && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div><span className="text-muted-foreground">Name</span><p className="font-medium">{selected.profiles?.full_name}</p></div>
                              <div><span className="text-muted-foreground">Email</span><p className="font-medium">{selected.profiles?.email}</p></div>
                              <div><span className="text-muted-foreground">Phone</span><p className="font-medium">{selected.profiles?.phone}</p></div>
                              <div><span className="text-muted-foreground">Unit</span><p className="font-medium">{selected.units?.name || "Not specified"}</p></div>
                              <div><span className="text-muted-foreground">Rent</span><p className="font-medium">{selected.units?.monthly_rent ? `\u20A6${selected.units.monthly_rent.toLocaleString()}` : "N/A"}</p></div>
                              <div><span className="text-muted-foreground">Submitted</span><p className="font-medium">{selected.submitted_at ? new Date(selected.submitted_at).toLocaleDateString() : "N/A"}</p></div>
                            </div>
                            {selected.form_data && renderFormData(selected.form_data)}
                            {selected.status === "draft" || selected.status === "pending" ? (
                              <div className="flex gap-2 pt-4 border-t">
                                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleAction(selected.id, "rejected")} disabled={actionLoading}>
                                  {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                                  Reject
                                </Button>
                                <Button size="sm" className="flex-1" onClick={() => handleAction(selected.id, "approved")} disabled={actionLoading}>
                                  {actionLoading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                  Approve
                                </Button>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center pt-4 border-t">
                                This application has been {selected.status}.
                              </p>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
