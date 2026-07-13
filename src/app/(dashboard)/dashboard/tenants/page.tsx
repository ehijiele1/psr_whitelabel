"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { Search, MoreHorizontal, Plus, Pencil, Trash2, Send, UserPlus, Users } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { createClient } from "@/lib/supabase/browser"
import { createInvitation } from "@/lib/supabase/invitations"
import { toast } from "sonner"
import { useProperty } from "@/contexts/PropertyContext"

const statusStyles: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary" }> = {
  active: { label: "Active", variant: "success" },
  overdue: { label: "Overdue", variant: "destructive" },
  pending: { label: "Pending", variant: "warning" },
  expired: { label: "Expired", variant: "secondary" },
  terminated: { label: "Terminated", variant: "secondary" },
}

function formatCurrency(amount: number) {
  return "₦" + amount.toLocaleString("en-US")
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function TenantsPage() {
  const { activePropertyId } = useProperty()
  const supabase = createClient()
  const router = useRouter()

  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTenant, setEditingTenant] = useState<any | null>(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingTenant, setDeletingTenant] = useState<any | null>(null)

  const fetchTenants = useCallback(async () => {
    if (!activePropertyId) return
    setFetchError("")
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("*, profiles(full_name, email, phone), units(name, monthly_rent, property_id), properties(name)")
        .eq("property_id", activePropertyId)
        .order("created_at", { ascending: false })
      if (error) {
        setFetchError(error.message)
      } else if (data) {
        setTenants(data)
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load tenants")
    } finally {
      setLoading(false)
    }
  }, [supabase, activePropertyId])

  useEffect(() => {
    fetchTenants()
  }, [fetchTenants])

  const filteredTenants = tenants.filter((t) => {
    const nameMatch = t.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!nameMatch) return false
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    return true
  })

  function handleAdd() {
    setEditingTenant(null)
    setDialogOpen(true)
  }

  function handleEdit(tenant: any) {
    setEditingTenant(tenant)
    setDialogOpen(true)
  }

  function handleDeleteClick(tenant: any) {
    setDeletingTenant(tenant)
    setDeleteDialogOpen(true)
  }

  async function handleDeleteConfirm() {
    if (!deletingTenant) return
    const { error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", deletingTenant.id)
    if (error) {
      toast.error(error.message)
      setDeleteDialogOpen(false)
      setDeletingTenant(null)
      return
    }
    const { error: unitError } = await supabase
      .from("units")
      .update({ status: "available" })
      .eq("id", deletingTenant.unit_id)
    if (unitError) {
      toast.error("Tenant removed but failed to update unit: " + unitError.message)
    } else {
      toast.success("Tenant removed")
    }
    setDeleteDialogOpen(false)
    setDeletingTenant(null)
    fetchTenants()
  }

  if (!activePropertyId) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-center">
        <div className="max-w-sm p-6 bg-muted rounded-xl border border-dashed">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold">No Property Selected</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Please select a property from the header to manage your tenants.
          </p>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tenants</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all tenants for the selected property.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/dashboard/tenants/migrate")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Migrate
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tenants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      {fetchError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <span>{fetchError}</span>
          <Button variant="outline" size="sm" onClick={fetchTenants}>
            Retry
          </Button>
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Unit</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Property</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Rent</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Lease Ends</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3 w-20">Status</th>
                <th className="w-14" />
              </tr>
            </thead>
            <motion.tbody variants={staggerContainer} initial="hidden" animate="visible">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <motion.tr
                      key={i}
                      variants={staggerItem}
                      className="border-b border-border/50 last:border-0"
                    >
                      <td className="px-6 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><Skeleton className="h-4 w-32" /></div></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-20 ml-auto" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-6 py-3"><Skeleton className="h-5 w-16 ml-auto" /></td>
                      <td />
                    </motion.tr>
                  ))
                : filteredTenants.map((tenant) => {
                    const status = statusStyles[tenant.status] || statusStyles.active
                    return (
                      <motion.tr
                        key={tenant.id}
                        variants={staggerItem}
                        className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <Link href={`/dashboard/tenants/${tenant.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {(tenant.profiles?.full_name || "U")
                                  .split(" ")
                                  .map((n: string) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{tenant.profiles?.full_name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">ID: {tenant.id?.toString().padStart(4, "0")}</p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-3 text-sm">{tenant.units?.name || "-"}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{tenant.properties?.name || "-"}</td>
                        <td className="px-6 py-3 text-sm font-medium text-right">{formatCurrency(tenant.rent_amount || 0)}</td>
                        <td className="px-6 py-3 text-sm text-muted-foreground">{formatDate(tenant.tenancy_end)}</td>
                        <td className="px-6 py-3 text-right">
                          <Badge variant={status.variant} className="text-xs">
                            {status.label}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(tenant)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(tenant)}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </motion.tr>
                    )
                  })}
                </motion.tbody>
          </table>
        </div>
      </Card>

      <TenantDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingTenant={editingTenant}
        onSuccess={fetchTenants}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        tenant={deletingTenant}
        onConfirm={handleDeleteConfirm}
      />
    </motion.div>
  )
}

function TenantDialog({
  open,
  onOpenChange,
  editingTenant,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingTenant: any | null
  onSuccess: () => void
}) {
  const supabase = createClient()
  const isEditing = !!editingTenant

  const [mode, setMode] = useState<"existing" | "new_user">("existing")
  const [createMethod, setCreateMethod] = useState<"password" | "invite">("password")

  const [properties, setProperties] = useState<any[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState("")
  const [availableUnits, setAvailableUnits] = useState<any[]>([])
  const [selectedUnitId, setSelectedUnitId] = useState("")
  const [rentAmount, setRentAmount] = useState("")
  const [userQuery, setUserQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [tenancyStart, setTenancyStart] = useState("")
  const [tenancyEnd, setTenancyEnd] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const [newFullName, setNewFullName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    if (!open) return
    supabase
      .from("properties")
      .select("id, name")
      .order("name")
      .then(({ data }) => { if (data) setProperties(data) })

    if (isEditing && editingTenant) {
      setSelectedPropertyId(editingTenant.property_id || "")
      setSelectedUnitId(editingTenant.unit_id || "")
      setRentAmount(String(editingTenant.rent_amount || ""))
      setSelectedUserId(editingTenant.user_id || "")
      setTenancyStart(editingTenant.tenancy_start?.split("T")[0] || "")
      setTenancyEnd(editingTenant.tenancy_end?.split("T")[0] || "")
      setNotes(editingTenant.notes || "")
      setUserQuery(editingTenant.profiles?.full_name || "")
    } else {
      setMode("existing")
      setCreateMethod("password")
      setSelectedPropertyId("")
      setSelectedUnitId("")
      setRentAmount("")
      setSelectedUserId("")
      setTenancyStart("")
      setTenancyEnd("")
      setNotes("")
      setUserQuery("")
      setSearchResults([])
      setNewFullName("")
      setNewEmail("")
      setNewPhone("")
      setNewPassword("")
    }
  }, [open, isEditing, editingTenant, supabase])

  useEffect(() => {
    if (!selectedPropertyId) {
      setAvailableUnits([])
      setSelectedUnitId("")
      return
    }
    const query = supabase
      .from("units")
      .select("id, name, monthly_rent")
      .eq("property_id", selectedPropertyId)
    if (!isEditing) {
      query.eq("status", "available")
    }
    query.order("name").then(({ data }) => {
      if (data) setAvailableUnits(data)
      if (!isEditing) setSelectedUnitId("")
    })
  }, [selectedPropertyId, isEditing, supabase])

  useEffect(() => {
    if (!selectedUnitId || isEditing) return
    const unit = availableUnits.find((u) => u.id === selectedUnitId)
    if (unit) setRentAmount(String(unit.monthly_rent))
  }, [selectedUnitId, availableUnits, isEditing])

  useEffect(() => {
    if (!userQuery || userQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .or(`full_name.ilike.%${userQuery}%,email.ilike.%${userQuery}%,phone.ilike.%${userQuery}%`)
        .limit(10)
      if (data) setSearchResults(data)
    }, 300)
    return () => clearTimeout(timer)
  }, [userQuery, supabase])

  async function handleSubmit() {
    setSubmitting(true)

    let userId = selectedUserId

    if (!isEditing && mode === "new_user") {
      if (createMethod === "password") {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: newEmail,
          password: newPassword,
          options: {
            data: { full_name: newFullName, phone: newPhone, role: "resident" },
          },
        })
        if (signUpError || !signUpData.user) {
          toast.error(signUpError?.message || "Failed to create account")
          setSubmitting(false)
          return
        }
        userId = signUpData.user.id
      } else {
        const result = await createInvitation({
          phone: newPhone,
          email: newEmail || undefined,
          full_name: newFullName,
          role: "resident",
          property_id: selectedPropertyId || undefined,
          unit_id: selectedUnitId || undefined,
          notes: notes || undefined,
        })
        setSubmitting(false)
        if (!result.success) {
          toast.error(result.error || "Failed to create invitation")
          return
        }
        toast.success("Invitation created")
        onOpenChange(false)
        onSuccess()
        return
      }
    }

    const payload = {
      user_id: userId,
      unit_id: selectedUnitId,
      property_id: selectedPropertyId,
      tenancy_start: tenancyStart,
      tenancy_end: tenancyEnd,
      rent_amount: Number(rentAmount),
      notes,
    }

    if (isEditing && editingTenant) {
      const { error } = await supabase.from("tenants").update(payload).eq("id", editingTenant.id)
      if (error) {
        toast.error(error.message)
        setSubmitting(false)
        return
      }
      toast.success("Tenant updated")
    } else {
      const { error } = await supabase.from("tenants").insert({ ...payload, status: "active" })
      if (error) {
        toast.error(error.message)
        setSubmitting(false)
        return
      }
      toast.success("Tenant added")
      await supabase.from("units").update({ status: "occupied" }).eq("id", selectedUnitId)
    }
    setSubmitting(false)
    onOpenChange(false)
    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update tenant details and lease information." : "Register a new tenant."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isEditing && (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("existing")}
                  className={`flex-1 py-2 rounded-lg border text-sm text-center transition-colors ${
                    mode === "existing"
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  Existing User
                </button>
                <button
                  type="button"
                  onClick={() => setMode("new_user")}
                  className={`flex-1 py-2 rounded-lg border text-sm text-center transition-colors ${
                    mode === "new_user"
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-input hover:border-primary/50"
                  }`}
                >
                  New User
                </button>
              </div>

              {mode === "existing" ? (
                <div className="space-y-2">
                  <Label>Find Profile</Label>
                  <Input
                    placeholder="Type name, email or phone..."
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="border rounded-md max-h-32 overflow-y-auto">
                      {searchResults.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() => {
                            setSelectedUserId(profile.id)
                            setUserQuery(profile.full_name || profile.email)
                            setSearchResults([])
                          }}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors ${
                            selectedUserId === profile.id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="font-medium">{profile.full_name}</div>
                          <div className="text-xs text-muted-foreground">{profile.email} · {profile.phone}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="Tenant's full name"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        required={createMethod === "password"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+234 800 000 0000"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCreateMethod("password")}
                      className={`flex-1 py-2 rounded-lg border text-xs text-center transition-colors ${
                        createMethod === "password"
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-input hover:border-primary/50"
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5 mx-auto mb-1" />
                      Set Password
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMethod("invite")}
                      className={`flex-1 py-2 rounded-lg border text-xs text-center transition-colors ${
                        createMethod === "invite"
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-input hover:border-primary/50"
                      }`}
                    >
                      <Send className="h-3.5 w-3.5 mx-auto mb-1" />
                      Send Invite
                    </button>
                  </div>

                  {createMethod === "password" && (
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input
                        type="password"
                        placeholder="Set temporary password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label>Property</Label>
            <select
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Select property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Unit</Label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{isEditing ? "Select unit" : "Select available unit"}</option>
              {availableUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name} - ₦{u.monthly_rent?.toLocaleString("en-US")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Rent Amount (monthly)</Label>
            <Input
              type="number"
              value={rentAmount}
              onChange={(e) => setRentAmount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tenancy Start</Label>
              <Input
                type="date"
                value={tenancyStart}
                onChange={(e) => setTenancyStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tenancy End</Label>
              <Input
                type="date"
                value={tenancyEnd}
                onChange={(e) => setTenancyEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Saving..." : isEditing ? "Update Tenant" : "Add Tenant"}
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  open,
  onOpenChange,
  tenant,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant: any | null
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Delete Tenant</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">{tenant?.profiles?.full_name || "this tenant"}</span>?
            This will also set the unit back to available.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
