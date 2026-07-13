"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, Send, CheckCircle, XCircle, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/browser"
import { createInvitation } from "@/lib/supabase/invitations"
import CsvImport from "@/components/tenants/csv-import"

interface Property {
  id: string
  name: string
}

interface Unit {
  id: string
  name: string
  property_id: string
}

const roleOptions = [
  { value: "resident", label: "Home Resident", desc: "Self-onboarding, tech-savvy tenant" },
  { value: "stall_tenant", label: "Stall/Shop Occupant", desc: "Admin-managed, less tech-savvy" },
]

export default function MigratePage() {
  const router = useRouter()
  const [mode, setMode] = useState<"manual" | "bulk">("manual")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    role: "resident",
    propertyId: "",
    unitId: "",
    notes: "",
    paymentEntries: [] as { date: string; amount: string; type: string }[],
  })

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: props } = await supabase.from("properties").select("id, name")
      setProperties(props || [])
    }
    fetchData()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    if (!form.propertyId) {
      supabase.from("units").select("id").limit(1).then(() => setUnits([]))
      return
    }
    supabase
      .from("units")
      .select("id, name, property_id")
      .eq("property_id", form.propertyId)
      .eq("status", "available")
      .then(({ data }) => setUnits(data || []))
  }, [form.propertyId])

  const addPaymentEntry = () => {
    setForm((prev) => ({
      ...prev,
      paymentEntries: [...prev.paymentEntries, { date: "", amount: "", type: "rent" }],
    }))
  }

  const updatePaymentEntry = (index: number, field: string, value: string) => {
    const entries = [...form.paymentEntries]
    entries[index] = { ...entries[index], [field]: value }
    setForm({ ...form, paymentEntries: entries })
  }

  const removePaymentEntry = (index: number) => {
    setForm({
      ...form,
      paymentEntries: form.paymentEntries.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    const paymentHistory = form.paymentEntries
      .filter((e) => e.date && e.amount)
      .map((e) => ({
        date: e.date,
        amount: parseFloat(e.amount),
        type: e.type,
      }))

    const result = await createInvitation({
      phone: form.phone,
      email: form.email || undefined,
      full_name: form.fullName,
      role: form.role,
      property_id: form.propertyId || undefined,
      unit_id: form.unitId || undefined,
      payment_history: paymentHistory,
      notes: form.notes || undefined,
    })

    setSubmitting(false)

    if (!result.success) {
      setError(result.error || "Failed to create invitation")
      return
    }

    const inviteUrl = `${window.location.origin}/invite?token=${result.token}`
    setSuccess(inviteUrl)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-100" />
        </div>
        <h2 className="text-xl font-bold">Tenant Invited</h2>
        <p className="text-sm text-muted-foreground">
          Invitation created for <strong>{form.fullName}</strong>.
        </p>
        <div className="p-4 rounded-lg bg-muted text-xs break-all">
          <p className="font-medium mb-1">Invite link:</p>
          <p className="text-primary">{success}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          This link expires in 7 days. You can send it to the tenant via SMS.
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={() => setSuccess(null)}>
            Add Another Tenant
          </Button>
          <Button onClick={() => router.push("/dashboard/tenants")}>
            View Tenants
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl space-y-6"
    >
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-2xl font-bold tracking-tight">Migrate Tenant</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add existing tenants to the system. Choose manual entry for one-by-one or bulk CSV import.
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex rounded-lg border p-1 bg-muted/30 w-fit">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "manual" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="h-4 w-4" /> Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setMode("bulk")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            mode === "bulk" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Upload className="h-4 w-4" /> Bulk CSV Import
        </button>
      </div>

      {mode === "bulk" && (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <CsvImport />
        </div>
      )}

      {mode === "manual" && (
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border rounded-xl p-6 shadow-sm">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        <div className="space-y-4">
          <h2 className="font-semibold text-sm">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Tenant's full name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="+234 800 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="tenant@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-sm">Tenant Type</h2>
          <div className="space-y-2">
            {roleOptions.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.role === opt.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={form.role === opt.value}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-sm">Assignment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Property</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
              >
                <option value="">Select property...</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                disabled={!form.propertyId}
              >
                <option value="">Select unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Payment History (optional)</h2>
            <Button type="button" variant="outline" size="sm" onClick={addPaymentEntry}>
              <Plus className="h-3 w-3 mr-1" /> Add Payment
            </Button>
          </div>
          {form.paymentEntries.map((entry, i) => (
            <div key={i} className="flex items-end gap-3">
              <div className="space-y-2 flex-1">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={entry.date}
                  onChange={(e) => updatePaymentEntry(i, "date", e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label className="text-xs">Amount (₦)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={entry.amount}
                  onChange={(e) => updatePaymentEntry(i, "amount", e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => removePaymentEntry(i)}
                className="p-2 text-destructive hover:bg-destructive/10 rounded-lg mb-0.5"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label>Notes (optional)</Label>
          <textarea
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            placeholder="Any additional notes about this tenant..."
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating Invitation...</>
          ) : (
            <><Send className="h-4 w-4 mr-2" /> Create & Send Invitation</>
          )}
        </Button>
      </form>
      )}
    </motion.div>
  )
}
