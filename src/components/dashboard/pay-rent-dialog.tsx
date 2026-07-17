"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CreditCard, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { initPaystackPayment, formatCurrency } from "@/lib/paystack-client"

interface PayRentDialogProps {
  tenantId: string
  propertyId: string
  rentAmount: number
  email: string
  onSuccess: () => void
}

export default function PayRentDialog({ tenantId, propertyId, rentAmount, email, onSuccess }: PayRentDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paid, setPaid] = useState(false)

  const handlePay = () => {
    setLoading(true)
    const now = new Date()
    const cycleStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]
    const cycleEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0]

    initPaystackPayment({
      email,
      amount: rentAmount,
      metadata: {
        tenant_id: tenantId,
        property_id: propertyId,
        cycle_start: cycleStart,
        cycle_end: cycleEnd,
      },
      onSuccess: () => {
        setLoading(false)
        setPaid(true)
        setTimeout(() => {
          setOpen(false)
          setPaid(false)
          onSuccess()
        }, 2000)
      },
      onClose: () => {
        setLoading(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2">
          <CreditCard className="h-4 w-4" />
          Pay Rent
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pay Rent</DialogTitle>
          <DialogDescription>
            You are about to pay {formatCurrency(rentAmount)} for your current rent cycle.
          </DialogDescription>
        </DialogHeader>
        {paid ? (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto mb-4"
            >
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <p className="font-semibold text-lg">Payment Successful!</p>
            <p className="text-sm text-muted-foreground mt-1">Your receipt will be available shortly.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-lg">{formatCurrency(rentAmount)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Payment Method</span>
                <span>Paystack (Card, USSD, Bank Transfer)</span>
              </div>
            </div>
            <Button onClick={handlePay} disabled={loading} className="w-full gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Processing..." : `Pay ${formatCurrency(rentAmount)}`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
