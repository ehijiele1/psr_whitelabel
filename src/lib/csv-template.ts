export function generateTenantsTemplate(): string {
  const headers = [
    "full_name",
    "phone",
    "email",
    "property_name",
    "unit_name",
    "unit_type",
    "role",
    "current_rent",
    "deposit_paid",
    "tenancy_start",
    "tenancy_end",
    "next_due_date",
    "advance_months",
    "notes",
  ]

  const examples = [
    [
      "Example: Chidi Okonkwo",
      "+234 802 123 4567",
      "chidi@example.com",
      "PrinceSteve Heights",
      "Apt 3B",
      "apartment",
      "resident",
      "1500000",
      "500000",
      "2023-06-01",
      "2026-05-31",
      "2025-12-01",
      "6",
      "Residential tenant — pays LAWMA + Sanitation + LUC",
    ],
    [
      "Example: Fatima Bello",
      "+234 803 987 6543",
      "",
      "Ikeja Commercial Plaza",
      "Shop 5",
      "shop",
      "stall_tenant",
      "2400000",
      "1000000",
      "2024-01-01",
      "2026-12-31",
      "2025-07-01",
      "0",
      "Shop tenant — LAWMA only",
    ],
    [
      "Example: Musa Ibrahim",
      "+234 805 555 1111",
      "",
      "Surulere Shopping Complex",
      "Stall 12",
      "stall",
      "stall_tenant",
      "600000",
      "200000",
      "2024-03-15",
      "2025-03-14",
      "2025-03-15",
      "0",
      "Stall tenant — LAWMA only",
    ],
  ]

  const rows = [headers, ...examples]
  return rows.map((r) => r.join(",")).join("\n")
}

export function generatePaymentsTemplate(): string {
  const headers = [
    "tenant_phone",
    "cycle_start",
    "cycle_end",
    "annual_rent_for_cycle",
    "amount_paid",
    "payment_type",
    "payment_date",
    "notes",
  ]

  const examples = [
    [
      "+234 802 123 4567",
      "2023-06-01",
      "2024-05-31",
      "1200000",
      "600000",
      "rent",
      "2023-05-15",
      "50% first installment (rent was ₦1,200,000/yr)",
    ],
    [
      "+234 802 123 4567",
      "2023-06-01",
      "2024-05-31",
      "1200000",
      "600000",
      "rent",
      "2023-11-20",
      "50% second installment",
    ],
    [
      "+234 802 123 4567",
      "2024-06-01",
      "2025-05-31",
      "1500000",
      "750000",
      "rent",
      "2024-05-10",
      "50% first (rent increased to ₦1,500,000)",
    ],
    [
      "+234 802 123 4567",
      "2024-06-01",
      "2025-05-31",
      "1500000",
      "750000",
      "rent",
      "2024-11-05",
      "50% second",
    ],
    [
      "+234 802 123 4567",
      "2024-06-01",
      "2025-05-31",
      "1500000",
      "25000",
      "utility",
      "2024-06-05",
      "LAWMA + Sanitation for the year",
    ],
    [
      "+234 803 987 6543",
      "2024-01-01",
      "2024-12-31",
      "2200000",
      "2200000",
      "rent",
      "2023-12-20",
      "Full annual rent paid upfront",
    ],
    [
      "+234 803 987 6543",
      "2024-01-01",
      "2024-12-31",
      "2200000",
      "50000",
      "utility",
      "2024-01-05",
      "LAWMA for Shop 5 (annual)",
    ],
    [
      "+234 805 555 1111",
      "2024-03-15",
      "2025-03-14",
      "600000",
      "300000",
      "rent",
      "2024-03-10",
      "50% first installment",
    ],
    [
      "+234 805 555 1111",
      "2024-03-15",
      "2025-03-14",
      "600000",
      "300000",
      "rent",
      "2024-09-10",
      "50% second installment",
    ],
    [
      "+234 805 555 1111",
      "2024-03-15",
      "2025-03-14",
      "600000",
      "30000",
      "utility",
      "2024-03-10",
      "LAWMA for Stall 12 (annual)",
    ],
  ]

  const rows = [headers, ...examples]
  return rows.map((r) => r.join(",")).join("\n")
}

export function parseImportCSV(csv: string): Record<string, unknown>[] {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim())

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    const record: Record<string, unknown> = {}

    headers.forEach((header, index) => {
      if (index < values.length && values[index]) {
        record[header] = values[index]
      }
    })

    return record
  })
}
