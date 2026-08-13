"use client"

import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, GripVertical } from "lucide-react"
import { brand } from "@/lib/config"

interface UnitConfig {
  name: string
  monthlyRent: string
  deposit: string
  lawma: string
  sanitation: string
  luc: string
}

interface UnitGroup {
  type: "apartment" | "shop" | "stall"
  label: string
  quantity: string
  defaultRent: string
  defaultDeposit: string
  lawma: string
  sanitation: string
  units: UnitConfig[]
}

interface UnitsStepProps {
  data: { groups: UnitGroup[] }
  onChange: (groups: UnitGroup[]) => void
}

function createUnitGroup(type: UnitGroup["type"], label: string): UnitGroup {
  return { type, label, quantity: "0", defaultRent: "", defaultDeposit: "", lawma: "", sanitation: "", units: [] }
}

function buildUnits(type: string, count: number, defaultRent: string, defaultDeposit: string): UnitConfig[] {
  const prefix = type === "apartment" ? "Apt" : type === "shop" ? "Shop" : "Stall"
  return Array.from({ length: count }, (_, i) => ({
    name: `${prefix} ${i + 1}`,
    monthlyRent: defaultRent,
    deposit: defaultDeposit,
    lawma: "",
    sanitation: "",
    luc: "",
  }))
}

const groupTypes: { type: UnitGroup["type"]; label: string }[] = [
  { type: "apartment", label: "Apartments" },
  { type: "shop", label: "Shops" },
  { type: "stall", label: "Stalls" },
]

export function getDefaultGroups(): UnitGroup[] {
  return groupTypes.map((g) => createUnitGroup(g.type, g.label))
}

export type { UnitGroup, UnitConfig }

export default function UnitsStep({ data, onChange }: UnitsStepProps) {
  const updateGroup = (idx: number, fields: Partial<UnitGroup>) => {
    const next = [...data.groups]
    const group = { ...next[idx], ...fields }
    if ("quantity" in fields) {
      const q = parseInt(group.quantity) || 0
      group.units = buildUnits(group.type, q, group.defaultRent, group.defaultDeposit)
    }
    if ("defaultRent" in fields || "defaultDeposit" in fields) {
      group.units = group.units.map((u) => ({
        ...u,
        monthlyRent: fields.defaultRent ?? group.defaultRent,
        deposit: fields.defaultDeposit ?? group.defaultDeposit,
      }))
    }
    next[idx] = group
    onChange(next)
  }

  const updateUnit = (groupIdx: number, unitIdx: number, fields: Partial<UnitConfig>) => {
    const next = [...data.groups]
    next[groupIdx].units[unitIdx] = { ...next[groupIdx].units[unitIdx], ...fields }
    onChange(next)
  }

  const removeUnit = (groupIdx: number, unitIdx: number) => {
    const next = [...data.groups]
    next[groupIdx].units.splice(unitIdx, 1)
    next[groupIdx].quantity = String(next[groupIdx].units.length)
    onChange(next)
  }

  const addUnit = (groupIdx: number) => {
    const next = [...data.groups]
    const g = next[groupIdx]
    const prefix = g.type === "apartment" ? "Apt" : g.type === "shop" ? "Shop" : "Stall"
    g.units.push({
      name: `${prefix} ${g.units.length + 1}`,
      monthlyRent: g.defaultRent,
      deposit: g.defaultDeposit,
      lawma: g.lawma,
      sanitation: g.sanitation,
      luc: "",
    })
    g.quantity = String(g.units.length)
    onChange(next)
  }

  const chargeHelp: Record<string, Record<string, string>> = {
    lawma: { apartment: "Fixed for all apartments", shop: "Fixed for all shops", stall: "Fixed for all stalls" },
    sanitation: { apartment: "Fixed for all apartments", shop: "N/A for shops", stall: "N/A for stalls" },
    luc: { apartment: "Per-unit — each apartment has its own LUC", shop: "N/A for shops", stall: "N/A for stalls" },
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold">Units &amp; Charges</h1>
        <p className="text-sm text-muted-foreground">
          Configure the units in this property and their monthly utility charges.
        </p>
      </div>

      {data.groups.map((group, gi) => (
        <div key={group.type} className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">{group.label}</h3>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Quantity:</Label>
              <Input
                type="number"
                min="0"
                className="w-20 h-8 text-sm"
                value={group.quantity}
                onChange={(e) => updateGroup(gi, { quantity: e.target.value })}
              />
            </div>
          </div>

          {group.units.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2 bg-muted/30 rounded-lg text-xs font-medium text-muted-foreground">
                <Label className="text-xs font-medium text-muted-foreground">
                  Default Monthly Rent ({brand.currencySymbol})
                </Label>
                <Input
                  type="number"
                  placeholder="Applied to all units below"
                  className="h-8 text-sm"
                  value={group.defaultRent}
                  onChange={(e) => updateGroup(gi, { defaultRent: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2 bg-muted/30 rounded-lg text-xs font-medium text-muted-foreground">
                <span>Unit Name</span>
                <span>Monthly Rent ({brand.currencySymbol}) *</span>
                <span className="sm:hidden" />
              </div>

              {group.units.map((unit, ui) => (
                <div
                  key={ui}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2 rounded-lg border bg-card relative"
                >
                  <div className="flex items-center gap-1">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <Input
                      className="h-9 text-sm"
                      value={unit.name}
                      onChange={(e) => updateUnit(gi, ui, { name: e.target.value })}
                    />
                  </div>
                  <Input
                    type="number"
                    placeholder="Rent"
                    className="h-9 text-sm"
                    value={unit.monthlyRent}
                    onChange={(e) => updateUnit(gi, ui, { monthlyRent: e.target.value })}
                  />
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => removeUnit(gi, ui)}
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {group.units.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Set quantity above to add {group.label.toLowerCase()}.
            </p>
          )}

          {group.units.length > 0 && (
            <>
              <div className="border-t pt-3 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Monthly Utility Charges — Same for all {group.label.toLowerCase()}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">LAWMA ({brand.currencySymbol})</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      className="h-9 text-sm"
                      value={group.lawma}
                      onChange={(e) => {
                        const val = e.target.value
                        updateGroup(gi, { lawma: val })
                      }}
                    />
                    <p className="text-[10px] text-muted-foreground">{chargeHelp.lawma[group.type]}</p>
                  </div>
                  {group.type === "apartment" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Sanitation ({brand.currencySymbol})</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 3000"
                        className="h-9 text-sm"
                        value={group.sanitation}
                        onChange={(e) => updateGroup(gi, { sanitation: e.target.value })}
                      />
                      <p className="text-[10px] text-muted-foreground">{chargeHelp.sanitation[group.type]}</p>
                    </div>
                  )}
                  {group.type === "apartment" && (
                    <div className="space-y-1">
                      <Label className="text-xs">LUC ({brand.currencySymbol}) — per unit</Label>
                      <p className="text-[10px] text-muted-foreground">
                        Set individually below. Leave 0 if not applicable.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {group.type === "apartment" && (
                <div className="border-t pt-3 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">
                    Per-Unit LUC Amounts
                  </h4>
                  {group.units.map((unit, ui) => (
                    <div key={ui} className="flex items-center gap-2">
                      <span className="text-xs font-medium w-20 truncate">{unit.name}:</span>
                      <Input
                        type="number"
                        placeholder="LUC amount"
                        className="h-8 text-sm flex-1"
                        value={unit.luc}
                        onChange={(e) => updateUnit(gi, ui, { luc: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {group.units.length > 0 && (
            <button
              type="button"
              onClick={() => addUnit(gi)}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Plus className="h-3 w-3" /> Add another {group.type}
            </button>
          )}
        </div>
      ))}
    </motion.div>
  )
}
