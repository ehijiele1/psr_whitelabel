"use client"

import { useState, useCallback } from "react"
import Papa from "papaparse"
import { Upload, Download, AlertCircle, CheckCircle2, Loader2, FileSpreadsheet, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/browser"
import { generateTenantsTemplate, generatePaymentsTemplate } from "@/lib/csv-template"
import { toast } from "sonner"

interface TenantRow {
  row: number
  full_name: string
  phone: string
  email: string
  property_name: string
  unit_name: string
  unit_type: string
  role: string
  current_rent: string
  deposit_paid: string
  tenancy_start: string
  tenancy_end: string
  next_due_date: string
  advance_months: string
  notes: string
  errors: string[]
}

interface PaymentRow {
  row: number
  tenant_phone: string
  cycle_start: string
  cycle_end: string
  annual_rent_for_cycle: string
  amount_paid: string
  payment_type: string
  payment_date: string
  notes: string
  errors: string[]
}

interface ImportSummary {
  tenantsCreated: number
  paymentsCreated: number
  errors: { row: number; message: string }[]
}

export default function CsvImport() {
  const [tenantsFile, setTenantsFile] = useState<File | null>(null)
  const [paymentsFile, setPaymentsFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [tenantRows, setTenantRows] = useState<TenantRow[]>([])
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([])
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const downloadTemplate = (type: "tenants" | "payments") => {
    const csv = type === "tenants" ? generateTenantsTemplate() : generatePaymentsTemplate()
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${type}_template.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleTenantsFile = useCallback((file: File) => {
    setTenantsFile(file)
    setParsing(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows: TenantRow[] = (results.data as Record<string, string>[]).map((r, i) => ({
          row: i + 2,
          full_name: (r.full_name || "").trim(),
          phone: (r.phone || "").trim(),
          email: (r.email || "").trim(),
          property_name: (r.property_name || "").trim(),
          unit_name: (r.unit_name || "").trim(),
          unit_type: (r.unit_type || "").trim().toLowerCase(),
          role: (r.role || "").trim().toLowerCase() || "tenant",
          current_rent: (r.current_rent || "").trim(),
          deposit_paid: (r.deposit_paid || "").trim(),
          tenancy_start: (r.tenancy_start || "").trim(),
          tenancy_end: (r.tenancy_end || "").trim(),
          next_due_date: (r.next_due_date || "").trim(),
          advance_months: (r.advance_months || "0").trim(),
          notes: (r.notes || "").trim(),
          errors: [],
        }))
        setTenantRows(rows)
        setParsing(false)
      },
      error() {
        toast.error("Failed to parse tenants CSV")
        setParsing(false)
      },
    })
  }, [])

  const handlePaymentsFile = useCallback((file: File) => {
    setPaymentsFile(file)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const rows: PaymentRow[] = (results.data as Record<string, string>[]).map((r, i) => ({
          row: i + 2,
          tenant_phone: (r.tenant_phone || "").trim(),
          cycle_start: (r.cycle_start || "").trim(),
          cycle_end: (r.cycle_end || "").trim(),
          annual_rent_for_cycle: (r.annual_rent_for_cycle || "").trim(),
          amount_paid: (r.amount_paid || "").trim(),
          payment_type: (r.payment_type || "").trim().toLowerCase(),
          payment_date: (r.payment_date || "").trim(),
          notes: (r.notes || "").trim(),
          errors: [],
        }))
        setPaymentRows(rows)
      },
      error() {
        toast.error("Failed to parse payments CSV")
      },
    })
  }, [])

  const validate = useCallback(async () => {
    setValidating(true)
    const supabase = createClient()

    // Fetch existing properties and units for validation
    const { data: properties } = await supabase.from("properties").select("id, name")
    const { data: allUnits } = await supabase.from("units").select("id, name, property_id, type, status")

    const propMap = new Map((properties || []).map((p) => [p.name.toLowerCase(), p.id]))


    // Validate tenant rows
    const validatedTenantRows = tenantRows.map((row) => {
      const errors: string[] = []

      if (!row.full_name) errors.push("Full name is required")
      if (!row.phone) errors.push("Phone is required")
      if (!row.property_name) errors.push("Property name is required")
      else if (!propMap.has(row.property_name.toLowerCase())) {
        errors.push(`Property "${row.property_name}" not found`)
      }
      if (!row.unit_name) errors.push("Unit name is required")
      if (!["apartment", "shop", "stall"].includes(row.unit_type)) {
        errors.push("Unit type must be apartment, shop, or stall")
      }
      if (!row.current_rent || isNaN(Number(row.current_rent)) || Number(row.current_rent) <= 0) {
        errors.push("Current rent must be a positive number")
      }
      if (!row.tenancy_start) errors.push("Tenancy start date is required")
      if (!row.tenancy_end) errors.push("Tenancy end date is required")

      // Check if unit exists and is available under this property
      if (row.property_name && row.unit_name && propMap.has(row.property_name.toLowerCase())) {
        const propId = propMap.get(row.property_name.toLowerCase())
        const match = (allUnits || []).find(
          (u) =>
            u.name.toLowerCase() === row.unit_name.toLowerCase() &&
            u.property_id === propId &&
            u.type === row.unit_type
        )
        if (!match) {
          errors.push(`Unit "${row.unit_name}" (${row.unit_type}) not found in "${row.property_name}"`)
        } else if (match.status !== "available") {
          errors.push(`Unit "${row.unit_name}" is already ${match.status}`)
        }
      }

      return { ...row, errors }
    })
    setTenantRows(validatedTenantRows)

    // Validate payment rows
    const validatedPaymentRows = paymentRows.map((row) => {
      const errors: string[] = []

      if (!row.tenant_phone) errors.push("Tenant phone is required")
      if (!row.cycle_start) errors.push("Cycle start is required")
      if (!row.cycle_end) errors.push("Cycle end is required")
      if (!row.amount_paid || isNaN(Number(row.amount_paid)) || Number(row.amount_paid) <= 0) {
        errors.push("Amount paid must be a positive number")
      }
      if (!["rent", "utility", "combined"].includes(row.payment_type)) {
        errors.push("Payment type must be rent, utility, or combined")
      }
      if (!row.payment_date) errors.push("Payment date is required")

      // Check if tenant phone exists in the uploaded tenants file
      const tenantMatch = validatedTenantRows.find(
        (t) => t.phone === row.tenant_phone && t.errors.length === 0
      )
      if (!tenantMatch) {
        errors.push(
          `No valid tenant found with phone "${row.tenant_phone}" in the tenants CSV`
        )
      }

      return { ...row, errors }
    })
    setPaymentRows(validatedPaymentRows)

    setValidating(false)
  }, [tenantRows, paymentRows])

  const doImport = useCallback(async () => {
    setImporting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("You must be logged in")
      setImporting(false)
      return
    }

    const result: ImportSummary = { tenantsCreated: 0, paymentsCreated: 0, errors: [] }
    const tenantPhoneToId = new Map<string, string>()

    // Get property/unit maps
    const { data: properties } = await supabase.from("properties").select("id, name")
    const { data: allUnits } = await supabase.from("units").select("id, name, property_id, type")
    const propMap = new Map((properties || []).map((p) => [p.name.toLowerCase(), p.id]))

    const validTenants = tenantRows.filter((r) => r.errors.length === 0)

    for (const row of validTenants) {
      try {
        const profilePhoneMap = new Map<string, string>()
        const { data: existingProfiles } = await supabase
          .from("profiles")
          .select("id, phone")
        if (existingProfiles) {
          for (const p of existingProfiles) profilePhoneMap.set(p.phone, p.id)
        }

        let profileId = profilePhoneMap.get(row.phone) || null
        if (!profileId) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: row.email || `${row.phone.replace(/[^0-9]/g, "")}@temp.princester.com`,
            password: crypto.randomUUID().slice(0, 12),
            options: {
              data: { full_name: row.full_name, phone: row.phone, role: row.role || "tenant" },
            },
          })
          if (signUpError || !signUpData.user?.id) {
            result.errors.push({ row: row.row, message: `Failed to create account for ${row.full_name}: ${signUpError?.message}` })
            continue
          }
          profileId = signUpData.user.id
        }

        // Find unit
        const propId = propMap.get(row.property_name.toLowerCase())
        const unit = (allUnits || []).find(
          (u) =>
            u.name.toLowerCase() === row.unit_name.toLowerCase() &&
            u.property_id === propId &&
            u.type === row.unit_type
        )
        if (!unit) {
          result.errors.push({ row: row.row, message: `Unit not found for ${row.full_name}` })
          continue
        }

        // Insert tenant
        const { error: tenantError } = await supabase.from("tenants").insert({
          user_id: profileId,
          unit_id: unit.id,
          property_id: propId,
          rent: Math.round(parseFloat(row.current_rent)),
          deposit_amount: row.deposit_paid ? Math.round(parseFloat(row.deposit_paid)) : null,
          lease_start: row.tenancy_start,
          lease_end: row.tenancy_end,
          status: "active",
          approved_by: user.id,
          notes: row.notes || null,
          next_due_date: row.next_due_date || null,
          advance_months: parseInt(row.advance_months) || 0,
        })

        if (tenantError) {
          result.errors.push({ row: row.row, message: `Failed to insert tenant ${row.full_name}: ${tenantError.message}` })
          continue
        }

        // Mark unit as occupied
        await supabase.from("units").update({ status: "occupied" }).eq("id", unit.id)

        tenantPhoneToId.set(row.phone, profileId)
        result.tenantsCreated++
      } catch {
        result.errors.push({ row: row.row, message: `Unexpected error for ${row.full_name}` })
      }
    }

    // Process payments
    const { data: tenants } = await supabase.from("tenants").select("id, user_id")
    const userToTenantMap = new Map((tenants || []).map((t) => [t.user_id, t.id]))

    const validPayments = paymentRows.filter((r) => r.errors.length === 0)
    for (const row of validPayments) {
      try {
        const profileId = tenantPhoneToId.get(row.tenant_phone)
        if (!profileId) continue

        const tenantId = userToTenantMap.get(profileId)
        if (!tenantId) continue

        const propId = propMap.get(
          tenantRows.find((t) => t.phone === row.tenant_phone)?.property_name.toLowerCase() || ""
        )

        const period =
          row.cycle_start && row.cycle_end
            ? `${row.cycle_start} to ${row.cycle_end}`
            : row.cycle_start || null
        const payType = (row.payment_type || "rent").toLowerCase() === "utility" ? "levy" : (row.payment_type || "rent").toLowerCase()

        const { error: payError } = await supabase.from("payments").insert({
          tenant_id: tenantId,
          property_id: propId || null,
          amount: Math.round(parseFloat(row.amount_paid)),
          type: payType,
          period,
          method: "cash",
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          notes: row.notes || null,
          date: row.payment_date || new Date().toISOString().split("T")[0],
        })

        if (payError) {
          result.errors.push({ row: row.row, message: `Payment import failed: ${payError.message}` })
          continue
        }
        result.paymentsCreated++
      } catch {
        result.errors.push({ row: row.row, message: `Unexpected error for payment row ${row.row}` })
      }
    }

    setSummary(result)
    setImporting(false)
  }, [tenantRows, paymentRows])

  const hasValidRows = tenantRows.some((r) => r.errors.length === 0)
  const errorCount = tenantRows.filter((r) => r.errors.length > 0).length + paymentRows.filter((r) => r.errors.length > 0).length

  if (summary) {
    return (
      <div className="space-y-4 p-6 rounded-lg border">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          <div>
            <h3 className="font-semibold">Import Complete</h3>
            <p className="text-sm text-muted-foreground">
              {summary.tenantsCreated} tenants created &middot; {summary.paymentsCreated} payments recorded
            </p>
          </div>
        </div>
        {summary.errors.length > 0 && (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-sm space-y-1">
            <p className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-1">
              <AlertTriangle className="h-4 w-4" /> {summary.errors.length} errors
            </p>
            {summary.errors.map((e, i) => (
              <p key={i} className="text-xs text-amber-700 dark:text-amber-300">Row {e.row}: {e.message}</p>
            ))}
          </div>
        )}
        <Button variant="outline" onClick={() => { setSummary(null); setTenantRows([]); setPaymentRows([]); setTenantsFile(null); setPaymentsFile(null) }}>
          Start New Import
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" size="sm" onClick={() => downloadTemplate("tenants")}>
          <Download className="h-4 w-4 mr-2" />
          Download Tenants Template
        </Button>
        <Button variant="outline" size="sm" onClick={() => downloadTemplate("payments")}>
          <Download className="h-4 w-4 mr-2" />
          Download Payments Template
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Tenants CSV Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleTenantsFile(f) }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer hover:border-primary/50 ${
            tenantsFile ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-input"
          }`}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = ".csv"
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) handleTenantsFile(file)
            }
            input.click()
          }}
        >
          {parsing ? (
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          ) : tenantsFile ? (
            <>
              <FileSpreadsheet className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-sm font-medium mt-2">{tenantsFile.name}</p>
              <p className="text-xs text-muted-foreground">{tenantRows.length} rows found</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mt-2">Upload Tenants CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Drop file or click to browse</p>
            </>
          )}
        </div>

        {/* Payments CSV Upload */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handlePaymentsFile(f) }}
          className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer hover:border-primary/50 ${
            paymentsFile ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10" : "border-input"
          }`}
          onClick={() => {
            const input = document.createElement("input")
            input.type = "file"
            input.accept = ".csv"
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (file) handlePaymentsFile(file)
            }
            input.click()
          }}
        >
          {paymentsFile ? (
            <>
              <FileSpreadsheet className="h-8 w-8 mx-auto text-emerald-500" />
              <p className="text-sm font-medium mt-2">{paymentsFile.name}</p>
              <p className="text-xs text-muted-foreground">{paymentRows.length} rows found</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium mt-2">Upload Payments CSV</p>
              <p className="text-xs text-muted-foreground mt-1">Optional — upload if you have payment history</p>
            </>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {tenantRows.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Preview ({tenantRows.length} tenants)
            </h3>
            <Button size="sm" onClick={validate} disabled={validating}>
              {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Validate
            </Button>
          </div>

          <div className="max-h-64 overflow-y-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Phone</th>
                  <th className="p-2 text-left">Property</th>
                  <th className="p-2 text-left">Unit</th>
                  <th className="p-2 text-left">Type</th>
                  <th className="p-2 text-left">Rent</th>
                  <th className="p-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {tenantRows.map((row, i) => (
                  <tr key={i} className="border-t hover:bg-muted/30">
                    <td className="p-2 text-muted-foreground">{row.row}</td>
                    <td className="p-2 font-medium">{row.full_name}</td>
                    <td className="p-2">{row.phone}</td>
                    <td className="p-2">{row.property_name}</td>
                    <td className="p-2">{row.unit_name}</td>
                    <td className="p-2 capitalize">{row.unit_type}</td>
                    <td className="p-2">₦{Number(row.current_rent).toLocaleString()}</td>
                    <td className="p-2">
                      {row.errors.length > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive" title={row.errors.join("; ")}>
                          <AlertCircle className="h-3 w-3" /> {row.errors.length} err
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> OK
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {errorCount > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errorCount} row(s) have errors. Hover over status indicators for details. Fix the CSV and re-upload.
            </p>
          )}

          {hasValidRows && (
            <Button onClick={doImport} disabled={importing} className="w-full">
              {importing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                `Import ${tenantRows.filter((r) => r.errors.length === 0).length} Tenants${paymentRows.length > 0 ? ` & ${paymentRows.filter((r) => r.errors.length === 0).length} Payments` : ""}`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
