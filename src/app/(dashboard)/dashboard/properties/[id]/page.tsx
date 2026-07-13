"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState, useCallback, use } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, Building2, MapPin, Edit, Trash2, Home, Users, Receipt, Plus
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/browser"

interface Property {
  id: string
  name: string
  address: string
  description?: string | null
  type?: string | null
  status: "active" | "maintenance" | "inactive"
  landlord_id: string
  created_at: string
  units?: Unit[]
}

interface Unit {
  id: string
  name: string
  type: string
  monthly_rent: number
  deposit_amount: number
  status: "occupied" | "available" | "maintenance"
  property_id: string
  tenant_id?: string | null
}

interface Tenant {
  id: string
  full_name?: string
  profiles?: { full_name: string; email: string; phone: string } | null
  units?: { name: string; monthly_rent: number } | null
}

interface Payment {
  id: string
  amount: number
  status: string
  due_date?: string
  paid_at?: string
  created_at: string
  tenants?: { profiles: { full_name: string } } | null
}
export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [property, setProperty] = useState<Property | null>(null)
  const [units, setUnits] = useState<Unit[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [payments, setPayments] = useState<Payment[]>([])

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({ name: "", address: "", description: "", type: "Residential" })
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [unitDialogOpen, setUnitDialogOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [unitFormData, setUnitFormData] = useState({
    name: "", type: "apartment", monthly_rent: "", deposit_amount: ""
  })
  const [unitSubmitting, setUnitSubmitting] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteUnitConfirmId, setDeleteUnitConfirmId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const { data: propData } = await supabase
      .from("properties")
      .select("*, units(*)")
      .eq("id", id)
      .single()

    if (propData) {
      setProperty(propData as unknown as Property)
      setUnits((propData as unknown as Property).units || [])
    }

    const { data: tenantData } = await supabase
      .from("tenants")
      .select("*, profiles(full_name, email, phone), units(name, monthly_rent)")
      .eq("property_id", id)

    if (tenantData) {
      setTenants(tenantData as unknown as Tenant[])
    }

    const { data: paymentData } = await supabase
      .from("payments")
      .select("*, tenants(profiles(full_name))")
      .eq("property_id", id)
      .order("created_at", { ascending: false })

    if (paymentData) {
      setPayments(paymentData as unknown as Payment[])
    }
  }, [supabase, id])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData().then(() => setLoading(false))
  }, [fetchData])

  const handleEditProperty = () => {
    if (!property) return
    setEditFormData({
      name: property.name,
      address: property.address,
      description: property.description || "",
      type: property.type || "Residential",
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditSubmitting(true)

    const { error } = await supabase
      .from("properties")
      .update({
        name: editFormData.name,
        address: editFormData.address,
        description: editFormData.description,
        type: editFormData.type,
      })
      .eq("id", id)

    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Property updated")
    }

    setEditSubmitting(false)
    setEditDialogOpen(false)
    fetchData()
  }

  const handleDeleteProperty = async () => {
    if (!window.confirm("Are you sure you want to delete this property? This action cannot be undone.")) return
    setDeleteConfirmId(id)
    const { error } = await supabase.from("properties").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
      setDeleteConfirmId(null)
      return
    }
    toast.success("Property deleted")
    window.location.href = "/dashboard/properties"
  }

  const handleOpenAddUnit = () => {
    setEditingUnit(null)
    setUnitFormData({ name: "", type: "apartment", monthly_rent: "", deposit_amount: "" })
    setUnitDialogOpen(true)
  }

  const handleOpenEditUnit = (unit: Unit) => {
    setEditingUnit(unit)
    setUnitFormData({
      name: unit.name,
      type: unit.type,
      monthly_rent: String(unit.monthly_rent),
      deposit_amount: String(unit.deposit_amount),
    })
    setUnitDialogOpen(true)
  }

  const handleUnitSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUnitSubmitting(true)

    if (editingUnit) {
      const { error } = await supabase
        .from("units")
        .update({
          name: unitFormData.name,
          type: unitFormData.type,
          monthly_rent: Number(unitFormData.monthly_rent),
          deposit_amount: Number(unitFormData.deposit_amount),
        })
        .eq("id", editingUnit.id)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Unit updated")
      }
    } else {
      const { error } = await supabase.from("units").insert({
        name: unitFormData.name,
        type: unitFormData.type,
        monthly_rent: Number(unitFormData.monthly_rent),
        deposit_amount: Number(unitFormData.deposit_amount),
        property_id: id,
        status: "available",
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Unit added")
      }
    }

    setUnitSubmitting(false)
    setUnitDialogOpen(false)
    setEditingUnit(null)
    fetchData()
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!window.confirm("Are you sure you want to delete this unit?")) return
    setDeleteUnitConfirmId(unitId)
    const { error } = await supabase.from("units").delete().eq("id", unitId)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Unit deleted")
    }
    setDeleteUnitConfirmId(null)
    fetchData()
  }

  const occupiedCount = units.filter((u) => u.status === "occupied").length
  const monthlyRevenue = units
    .filter((u) => u.status === "occupied")
    .reduce((sum, u) => sum + u.monthly_rent, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-32" />
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="font-medium">Property not found</p>
        <Link href="/dashboard/properties" className="text-sm text-primary hover:underline mt-1 inline-block">
          Back to properties
        </Link>
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
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to properties
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
            <Badge variant={property.status === "active" ? "success" : property.status === "maintenance" ? "warning" : "outline"}>
              {property.status}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {property.address}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={handleEditProperty}>
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Property</DialogTitle>
                <DialogDescription>Update the property details below.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Property Name</Label>
                  <Input
                    id="edit-name"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <select
                    id="edit-type"
                    value={editFormData.type}
                    onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editSubmitting}>
                    {editSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={handleDeleteProperty}
            disabled={deleteConfirmId === id}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {deleteConfirmId === id ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Units", value: String(units.length), icon: Home },
          { label: "Occupied", value: String(occupiedCount), icon: Users },
          {
            label: "Occupancy Rate",
            value: units.length > 0 ? `${Math.round((occupiedCount / units.length) * 100)}%` : "0%",
            icon: Building2,
          },
          { label: "Monthly Revenue", value: formatCurrency(monthlyRevenue), icon: Receipt },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="units">Units ({units.length})</TabsTrigger>
          <TabsTrigger value="tenants">Tenants ({tenants.length})</TabsTrigger>
          <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
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
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">About this property</h3>
                  <p className="text-sm text-muted-foreground">
                    {property.description || "No description provided."}
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Property Type</span>
                      <p className="font-medium">{property.type || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Units</span>
                      <p className="font-medium">{units.length}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Occupied Units</span>
                      <p className="font-medium">{occupiedCount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vacant Units</span>
                      <p className="font-medium">{units.length - occupiedCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="units" className="mt-4">
              <div className="flex justify-end mb-4">
                <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-1.5" onClick={handleOpenAddUnit}>
                      <Plus className="h-4 w-4" />
                      Add Unit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingUnit ? "Edit Unit" : "Add Unit"}</DialogTitle>
                      <DialogDescription>
                        {editingUnit ? "Update the unit details." : "Fill in the details to add a new unit."}
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUnitSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit-name">Unit Name</Label>
                        <Input
                          id="unit-name"
                          placeholder="e.g. Apartment 1"
                          value={unitFormData.name}
                          onChange={(e) => setUnitFormData({ ...unitFormData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit-type">Type</Label>
                        <select
                          id="unit-type"
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          value={unitFormData.type}
                          onChange={(e) => setUnitFormData({ ...unitFormData, type: e.target.value })}
                        >
                          <option value="apartment">Apartment</option>
                          <option value="stall">Stall</option>
                          <option value="shop">Shop</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit-rent">Monthly Rent (₦)</Label>
                        <Input
                          id="unit-rent"
                          type="number"
                          placeholder="e.g. 450000"
                          value={unitFormData.monthly_rent}
                          onChange={(e) => setUnitFormData({ ...unitFormData, monthly_rent: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit-deposit">Deposit Amount (₦)</Label>
                        <Input
                          id="unit-deposit"
                          type="number"
                          placeholder="e.g. 450000"
                          value={unitFormData.deposit_amount}
                          onChange={(e) => setUnitFormData({ ...unitFormData, deposit_amount: e.target.value })}
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => setUnitDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={unitSubmitting}>
                          {unitSubmitting ? "Saving..." : editingUnit ? "Save Changes" : "Add Unit"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              {units.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    <Home className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No units yet. Add your first unit.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {units.map((unit, i) => (
                    <motion.div
                      key={unit.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-sm">{unit.name}</h4>
                            <div className="flex items-center gap-1">
                              <Badge
                                variant={unit.status === "occupied" ? "success" : unit.status === "available" ? "outline" : "warning"}
                                className="text-[10px] px-2 py-0"
                              >
                                {unit.status}
                              </Badge>
                              <div className="flex gap-0.5">
                                <button
                                  onClick={() => handleOpenEditUnit(unit)}
                                  className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Edit className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUnit(unit.id)}
                                  disabled={deleteUnitConfirmId === unit.id}
                                  className="h-6 w-6 rounded hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>
                              {unit.type.charAt(0).toUpperCase() + unit.type.slice(1)} ·{" "}
                              {formatCurrency(unit.monthly_rent)}/mo
                            </p>
                            {unit.status === "available" && (
                              <p className="text-primary font-medium">Available</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tenants" className="mt-4">
              {tenants.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No tenants for this property yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                          <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Email</th>
                          <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Unit</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Rent</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tenants.map((tenant, i) => (
                          <motion.tr
                            key={tenant.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-3.5 text-sm font-medium">
                              {tenant.profiles?.full_name || tenant.full_name || "Unknown"}
                            </td>
                            <td className="px-6 py-3.5 text-sm text-muted-foreground">
                              {tenant.profiles?.email || "—"}
                            </td>
                            <td className="px-6 py-3.5 text-sm text-muted-foreground">
                              {tenant.units?.name || "—"}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-medium text-right">
                              {tenant.units?.monthly_rent
                                ? formatCurrency(tenant.units.monthly_rent)
                                : "—"}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <Badge variant="success" className="text-xs">active</Badge>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-4">
              {payments.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No payment records for this property yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Tenant</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Amount</th>
                          <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                          <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment, i) => (
                          <motion.tr
                            key={payment.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                          >
                            <td className="px-6 py-3.5 text-sm font-medium">
                              {payment.tenants?.profiles?.full_name || "—"}
                            </td>
                            <td className="px-6 py-3.5 text-sm font-medium text-right">
                              {formatCurrency(payment.amount)}
                            </td>
                            <td className="px-6 py-3.5">
                              <Badge
                                variant={
                                  payment.status === "paid"
                                    ? "success"
                                    : payment.status === "pending"
                                      ? "warning"
                                      : "destructive"
                                }
                                className="text-xs"
                              >
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-3.5 text-sm text-muted-foreground text-right">
                              {payment.paid_at
                                ? new Date(payment.paid_at).toLocaleDateString()
                                : payment.due_date
                                  ? new Date(payment.due_date).toLocaleDateString()
                                  : new Date(payment.created_at).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}
