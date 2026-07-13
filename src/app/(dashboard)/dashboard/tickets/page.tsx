"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import { Ticket, Plus, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

interface TicketData {
  id: string
  tenant_id: string
  unit_id: string
  property_id: string
  title: string
  description: string | null
  priority: string
  status: string
  created_at: string
  resolved_at: string | null
  tenants: { id: string; profiles: { full_name: string } }
  units: { name: string }
  properties: { name: string }
}

interface PropertyOption {
  id: string
  name: string
}

interface UnitOption {
  id: string
  name: string
}

const priorityStyles: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
  urgent: "destructive",
  high: "warning",
  medium: "default",
  low: "secondary",
}

const statusStyles: Record<string, "warning" | "default" | "success" | "secondary"> = {
  open: "warning",
  in_progress: "default",
  resolved: "success",
  closed: "secondary",
}

export default function TicketsPage() {
  const supabase = createClient()

  const [tickets, setTickets] = useState<TicketData[]>([])
  const [properties, setProperties] = useState<PropertyOption[]>([])
  const [units, setUnits] = useState<UnitOption[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    property_id: "",
    unit_id: "",
    title: "",
    description: "",
    priority: "medium",
  })

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, tenants!inner(id, profiles!inner(full_name)), units!inner(name), properties!inner(name)")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tickets:", error)
    } else {
      setTickets((data as TicketData[]) || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets().then(() => {})
  }, [fetchTickets])

  useEffect(() => {
    supabase
      .from("properties")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching properties:", error)
        } else {
          setProperties((data as PropertyOption[]) || [])
        }
      })
  }, [supabase])

  const handlePropertyChange = async (propertyId: string) => {
    setFormData({ ...formData, property_id: propertyId, unit_id: "" })
    if (!propertyId) {
      setUnits([])
      return
    }
    const { data, error } = await supabase
      .from("units")
      .select("id, name")
      .eq("property_id", propertyId)
      .order("name")

    if (error) {
      console.error("Error fetching units:", error)
    } else {
      setUnits((data as UnitOption[]) || [])
    }
  }

  const handleUpdateStatus = async (id: string, status: string, extra: Record<string, unknown> = {}) => {
    setUpdatingId(id)
    const { error } = await supabase
      .from("tickets")
      .update({ status, ...extra })
      .eq("id", id)
    if (error) {
      console.error("Error updating ticket:", error)
      toast.error(error.message)
    } else {
      toast.success("Ticket updated to " + status)
    }
    setUpdatingId(null)
    fetchTickets()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      return
    }

    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    const tenantId = tenant?.id || null

    const { error } = await supabase.from("tickets").insert({
      tenant_id: tenantId,
      unit_id: formData.unit_id || null,
      property_id: formData.property_id || null,
      title: formData.title,
      description: formData.description || null,
      priority: formData.priority,
      status: "open",
    })
    if (error) {
      console.error("Error creating ticket:", error)
      toast.error(error.message)
    } else {
      toast.success("Ticket created")
      setDialogOpen(false)
      setFormData({
        property_id: "",
        unit_id: "",
        title: "",
        description: "",
        priority: "medium",
      })
      setUnits([])
      fetchTickets()
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance Tickets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage maintenance requests across all properties.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Ticket</DialogTitle>
              <DialogDescription>
                Create a new maintenance ticket.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="property">Property</Label>
                <select
                  id="property"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.property_id}
                  onChange={(e) => handlePropertyChange(e.target.value)}
                >
                  <option value="">Select property...</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <select
                  id="unit"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.unit_id}
                  onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                  disabled={!formData.property_id}
                >
                  <option value="">Select unit...</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Water leak in bathroom"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Describe the issue..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
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
                  {submitting ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Ticket className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm">Create your first maintenance ticket to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Ticket</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Title</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Property</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Priority</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => {
                  const isUpdating = updatingId === ticket.id
                  const date = new Date(ticket.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                  return (
                    <tr
                      key={ticket.id}
                      className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm font-medium">#{ticket.id.slice(0, 8)}</td>
                      <td className="px-6 py-3 text-sm">{ticket.title}</td>
                      <td className="px-6 py-3 text-sm">{ticket.tenants?.profiles?.full_name || "—"}</td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{ticket.properties?.name || "—"}</td>
                      <td className="px-6 py-3">
                        <Badge variant={priorityStyles[ticket.priority] || "default"} className="text-xs capitalize">
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-3">
                        <Badge variant={statusStyles[ticket.status] || "default"} className="text-xs capitalize">
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">{date}</td>
                      <td className="px-6 py-3">
                        {ticket.status !== "closed" && ticket.status !== "resolved" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={isUpdating}>
                                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {ticket.status === "open" && (
                                <DropdownMenuItem
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(ticket.id, "in_progress")}
                                >
                                  Mark In Progress
                                </DropdownMenuItem>
                              )}
                              {ticket.status === "in_progress" && (
                                <DropdownMenuItem
                                  disabled={isUpdating}
                                  onClick={() =>
                                    handleUpdateStatus(ticket.id, "resolved", {
                                      resolved_at: new Date().toISOString(),
                                    })
                                  }
                                >
                                  Resolve
                                </DropdownMenuItem>
                              )}
                              {(ticket.status === "open" || ticket.status === "in_progress") && (
                                <DropdownMenuItem
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateStatus(ticket.id, "closed")}
                                >
                                  Close
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </motion.div>
  )
}
