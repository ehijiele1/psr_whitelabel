"use client"

import { motion } from "framer-motion"
import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Building2, MapPin, Users, Home, ArrowRight, Plus, Search, MoreHorizontal, Edit, Trash2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { staggerContainer, staggerItem } from "@/lib/animations"
import { createClient } from "@/lib/supabase/browser"
import { useProperty } from "@/contexts/PropertyContext"

type PropertyStatus = "active" | "maintenance" | "inactive"

interface Property {
  id: string
  name: string
  address: string
  description?: string | null
  type?: string | null
  status: PropertyStatus
  landlord_id: string
  units: { count: number }[]
  created_at: string
}

interface PropertyFormData {
  name: string
  address: string
  description: string
  type: string
}

const typeColors: Record<string, string> = {
  Residential: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
  Commercial: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  Mixed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
}

const emptyForm: PropertyFormData = { name: "", address: "", description: "", type: "Residential" }

export default function PropertiesPage() {
  const { activePropertyId, setActivePropertyId, refreshProperties } = useProperty()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("All Types")
  const [statusFilter, setStatusFilter] = useState("All Status")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [formData, setFormData] = useState<PropertyFormData>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchProperties = useCallback(async () => {
    const { data, error } = await supabase
      .from("properties")
      .select("*, units(count)")
      .order("created_at", { ascending: false })
    if (error) {
      console.error("Error fetching properties:", error)
    } else {
      setProperties((data as Property[]) || [])
    }
  }, [supabase])

  useEffect(() => {
    fetchProperties().then(() => setLoading(false))
  }, [fetchProperties])

  const handleOpenAdd = () => {
    setEditingProperty(null)
    setFormData(emptyForm)
    setDialogOpen(true)
  }

  const handleOpenEdit = (property: Property) => {
    setEditingProperty(property)
    setFormData({
      name: property.name,
      address: property.address,
      description: property.description || "",
      type: property.type || "Residential",
    })
    setDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    const { error } = await supabase.from("properties").delete().eq("id", id)
    if (error) {
      toast.error(error.message)
    } else {
      toast.success("Property deleted")
      if (activePropertyId === id) {
        setActivePropertyId(null)
      }
    }
    setDeletingId(null)
    fetchProperties()
    refreshProperties()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("You must be logged in")
      setSubmitting(false)
      return
    }

    if (editingProperty) {
      const { error } = await supabase
        .from("properties")
        .update({
          name: formData.name,
          address: formData.address,
          description: formData.description,
          type: formData.type,
        })
        .eq("id", editingProperty.id)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Property updated")
      }
    } else {
      const { error } = await supabase.from("properties").insert({
        name: formData.name,
        address: formData.address,
        description: formData.description,
        type: formData.type,
        landlord_id: user.id,
        status: "active",
      })
      if (error) {
        toast.error(error.message)
      } else {
        toast.success("Property created")
      }
    }

    setSubmitting(false)
    setDialogOpen(false)
    setEditingProperty(null)
    setFormData(emptyForm)
    fetchProperties()
    refreshProperties()
  }

  const unitCount = (property: Property): number => {
    if (property.units && property.units.length > 0) {
      return (property.units[0] as unknown as { count: number }).count
    }
    return 0
  }

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesType =
      typeFilter === "All Types" ||
      (p.type && p.type.toLowerCase() === typeFilter.toLowerCase())
    const matchesStatus =
      statusFilter === "All Status" ||
      p.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Properties</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your properties and units.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={handleOpenAdd}>
              <Plus className="h-4 w-4" />
              Add Property
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingProperty ? "Edit Property" : "Add Property"}
              </DialogTitle>
              <DialogDescription>
                {editingProperty
                  ? "Update the property details below."
                  : "Fill in the details to add a new property."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Property Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. PrinceSteve Heights"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="e.g. 42 Adeola Odeku, Victoria Island"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  placeholder="Optional description of the property..."
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
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
                  {submitting
                    ? "Saving..."
                    : editingProperty
                      ? "Save Changes"
                      : "Add Property"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option>All Types</option>
          <option>Residential</option>
          <option>Commercial</option>
          <option>Mixed</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option>All Status</option>
          <option>Active</option>
          <option>Maintenance</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-px w-full" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No properties found</p>
          <p className="text-sm">
            {search || typeFilter !== "All Types" || statusFilter !== "All Status"
              ? "Try adjusting your filters."
              : "Add your first property to get started."}
          </p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filteredProperties.map((property) => (
            <motion.div key={property.id} variants={staggerItem} className={`relative group/card ${activePropertyId === property.id ? "ring-2 ring-primary rounded-xl overflow-hidden" : ""}`}>
              <Link href={`/dashboard/properties/${property.id}`}>
                <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 h-full ${activePropertyId === property.id ? "border-primary" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <Badge
                        variant={
                          property.status === "active"
                            ? "success"
                            : property.status === "maintenance"
                              ? "warning"
                              : "outline"
                        }
                        className="text-[10px] px-2 py-0.5"
                      >
                        {property.status}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-base mb-1 group-hover:text-primary transition-colors">
                      {property.name}
                    </h3>
                    <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-4">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>{property.address}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span>{unitCount(property)} units</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{unitCount(property)} total</span>
                      </div>
                      <span
                        className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColors[property.type || ""] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"}`}
                      >
                        {property.type || "N/A"}
                      </span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                      <span className="text-sm font-medium text-primary">
                        {unitCount(property) > 0
                          ? `${unitCount(property)} unit${unitCount(property) === 1 ? "" : "s"}`
                          : "No units"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <div className="absolute top-3 right-12 z-10 opacity-0 group-hover/card:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                      onClick={(e) => e.preventDefault()}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        handleOpenEdit(property)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.preventDefault()
                        if (
                          window.confirm(
                            `Are you sure you want to delete "${property.name}"? This action cannot be undone.`
                          )
                        ) {
                          handleDelete(property.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
