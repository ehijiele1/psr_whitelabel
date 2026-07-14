"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { FileText, CheckCircle } from "lucide-react"

interface AgreementReviewProps {
  data: {
    personalInfo: { fullName: string }
    additionalInfo: { guarantorName: string; guarantorAddress: string }
    propertySelection: { preferredProperty: string; moveInDate: string }
    agreement: {
      acceptedTerms: boolean
      paymentMethod: "online" | "offline" | ""
      rentAmount: string
      securityDeposit: string
      termDuration: string
    }
  }
  onChange: (fields: Partial<{
    acceptedTerms: boolean
    paymentMethod: "online" | "offline" | ""
    rentAmount: string
    securityDeposit: string
    termDuration: string
  }>) => void
}

const formatAmount = (val: string) => {
  const n = Number(val)
  return isNaN(n) ? val : n.toLocaleString("en-US")
}

const today = new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export default function AgreementReview({ data, onChange }: AgreementReviewProps) {
  const [expanded, setExpanded] = useState(false)

  const tenantName = data.personalInfo.fullName || "[Tenant Name]"
  const guarantorName = data.additionalInfo.guarantorName || "[Guarantor Name]"
  const guarantorAddress = data.additionalInfo.guarantorAddress || "[Guarantor Address]"
  const moveInDate = data.propertySelection.moveInDate
    ? new Date(data.propertySelection.moveInDate).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "[Move-In Date]"
  const rentAmount = data.agreement.rentAmount || "[Rent Amount]"
  const securityDeposit = data.agreement.securityDeposit || "[Security Deposit]"
  const termDuration = data.agreement.termDuration || "[Term]"

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Tenancy Agreement</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review your tenancy agreement below. Adjustable terms are shown in green.
        </p>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border space-y-3">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Residential Tenancy Agreement</span>
            </div>
            <span className="text-xs text-muted-foreground">{expanded ? "Hide" : "Show"} full agreement</span>
          </button>

          {expanded && (
            <div className="px-3 pb-3 text-xs leading-relaxed text-muted-foreground space-y-2 max-h-96 overflow-y-auto border-t pt-3">
              <p className="font-medium text-foreground">
                THIS LEASE (the &ldquo;Lease&rdquo;) dated this {today}
              </p>
              <p>BETWEEN:</p>
              <p className="font-medium text-foreground">Mrs. Ibadin R.E (the &ldquo;Landlady&rdquo;)</p>
              <p>AND:</p>
              <p className="font-medium text-foreground">{tenantName} (the &ldquo;Tenant&rdquo;)</p>
              <p>AND:</p>
              <p className="font-medium text-foreground">{guarantorName} (the &ldquo;Guarantor&rdquo;)</p>
              <p className="text-xs text-muted-foreground">(individually the &ldquo;Party&rdquo; and collectively the &ldquo;Parties&rdquo;)</p>

              <p className="pt-2">IN CONSIDERATION of the Landlady leasing certain premises to the Tenant and other valuable consideration, the receipt and sufficiency of which consideration is acknowledged, the Parties agree as follows:</p>

              <p className="font-medium text-foreground pt-1">Leased Property</p>
              <p>1. The Landlady agrees to rent to the Tenant the flat, municipally described as 35 Godilove Street, Akowonjo, Egbeda, Lagos (the &ldquo;Property&rdquo;), for use as residential premises only. The Property is more particularly described as: A Yellow and Brown building with black gate.</p>
              <p>2. No guest(s) of the Tenant may occupy the Property for longer than one week without the prior consent of the Landlady.</p>
              <p>3. No pets or animals are allowed without prior written permission of the Landlady.</p>
              <p>4. Car park space is limited; no vehicle may park without consent of the Landlady.</p>
              <p>5. The Property is provided without any furnishings or chattels.</p>

              <p className="font-medium text-foreground pt-1">Term</p>
              <p>6. The term of the Lease is a periodic tenancy commencing at 12:00 noon on {moveInDate} and continuing on a {termDuration} basis until the Landlady or the Tenant terminates the tenancy (the &ldquo;Term&rdquo;).</p>
              <p>7. If the tenant is in default, upon 30 days notice the Landlady may terminate this tenancy, exercise rights of distress, or exercise any other available rights at law.</p>

              <p className="font-medium text-foreground pt-1">Rent</p>
              <p>8. Subject to the provisions of this Lease, the rent for the Property is ₦{formatAmount(rentAmount)}.00 per year (the &ldquo;Rent&rdquo;).</p>
              <p>9. The Tenant will pay the Rent on or before the anniversary of every year of the Term by cash or direct transfer or deposit to the account supplied by the Landlady.</p>
              <p>10. The Landlady may review the rent and provide a minimum of 120 days notice to increase the rent.</p>

              <p className="font-medium text-foreground pt-1">Security Deposit</p>
              <p>11. On execution of this Lease, the Tenant will pay the Landlady a security deposit of ₦{formatAmount(securityDeposit)}.00 (the &ldquo;Security&rdquo;).</p>

              <p className="font-medium text-foreground pt-1">Sureties</p>
              <p>14. The Guarantor, {guarantorName} of {guarantorAddress}, guarantees to the Landlady that the Tenant will comply with the Tenant&rsquo;s obligations under this Lease.</p>

              <p className="font-medium text-foreground pt-1">General Provisions</p>
              <p>40. All monetary amounts are based in the Nigerian Naira.</p>
              <p>41. This Lease may only be amended by a written document executed by the Parties.</p>
              <p>42. Electronic signatures are binding and considered original signatures.</p>
              <p>43. This Lease constitutes the entire agreement between the Parties.</p>
              <p>45. Time is of the essence in this Lease.</p>

              <p className="pt-2">IN WITNESS WHEREOF the Parties have duly affixed their signatures.</p>
              <p>The Tenant acknowledges receiving a duplicate of this Lease signed by the Tenant, the Landlady, and the Guarantor on the _____ day of ______________________, 20____.</p>
              <p>The Guarantor acknowledges receiving a duplicate of this Lease signed by the Tenant, the Landlady, and the Guarantor on the _____ day of ______________________, 20____.</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            Adjustable Terms
          </h3>
          <p className="text-xs text-muted-foreground">
            Fill in the financial terms below. These will be reflected in the agreement.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Annual Rent (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 1500000"
                value={data.agreement.rentAmount}
                onChange={(e) => onChange({ rentAmount: e.target.value })}
                className="border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Security Deposit (₦)</Label>
              <Input
                type="number"
                placeholder="e.g. 500000"
                value={data.agreement.securityDeposit}
                onChange={(e) => onChange({ securityDeposit: e.target.value })}
                className="border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Term Duration</Label>
              <Input
                placeholder="e.g. 1 year"
                value={data.agreement.termDuration}
                onChange={(e) => onChange({ termDuration: e.target.value })}
                className="border-emerald-300 dark:border-emerald-700 focus-visible:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium">Payment Method</h3>
          <p className="text-xs text-muted-foreground">
            Choose your preferred payment method for rent and deposit.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onChange({ paymentMethod: "online" })}
              className={`flex-1 p-4 rounded-lg border text-sm text-center transition-colors ${
                data.agreement.paymentMethod === "online"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input hover:border-primary/50"
              }`}
            >
              <span className="block font-medium">Online Payment</span>
              <span className="block text-xs text-muted-foreground mt-1">Pay via Paystack (card, transfer, USSD)</span>
            </button>
            <button
              type="button"
              onClick={() => onChange({ paymentMethod: "offline" })}
              className={`flex-1 p-4 rounded-lg border text-sm text-center transition-colors ${
                data.agreement.paymentMethod === "offline"
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-input hover:border-primary/50"
              }`}
            >
              <span className="block font-medium">Offline Payment</span>
              <span className="block text-xs text-muted-foreground mt-1">Bank transfer or cash deposit</span>
            </button>
          </div>
        </div>

        <label className="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50">
          <input
            type="checkbox"
            checked={data.agreement.acceptedTerms}
            onChange={(e) => onChange({ acceptedTerms: e.target.checked })}
            className="mt-0.5"
          />
          <div>
            <span className="text-sm font-medium">I accept the terms of the lease agreement</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              By checking this box, you agree to the Residential Tenancy Agreement above and authorize the Landlady to proceed with your application.
            </p>
          </div>
        </label>
      </div>
    </motion.div>
  )
}
