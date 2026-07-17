"use client"

declare global {
  interface Window {
    PaystackPop: {
      setup(config: {
        key: string
        email: string
        amount: number
        currency: string
        ref?: string
        metadata?: Record<string, unknown>
        callback: (response: { reference: string; trans: string }) => void
        onClose: () => void
      }): { openIframe(): void }
    }
  }
}

export interface PaystackConfig {
  email: string
  amount: number
  metadata?: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose?: () => void
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!

export function initPaystackPayment(config: PaystackConfig) {
  const reference = `PSR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: config.amount * 100,
    currency: "NGN",
    ref: reference,
    metadata: config.metadata,
    callback: (response) => {
      config.onSuccess(response.reference)
    },
    onClose: () => {
      config.onClose?.()
    },
  })

  handler.openIframe()
}

export function formatCurrency(amount: number): string {
  return `₦${amount.toLocaleString()}`
}

export function initPaystackPop(options: {
  email: string
  amount: number
  reference?: string
  metadata?: Record<string, unknown>
  callback?: (response: { reference: string; transaction?: string; status: string }) => void
  onClose?: () => void
}) {
  const handler = (window as any).PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: options.email,
    amount: options.amount * 100,
    currency: "NGN",
    ref: options.reference || `PSR-${Date.now()}`,
    metadata: options.metadata,
    callback: options.callback,
    onClose: options.onClose,
  })

  handler?.openIframe()
}
