"use client"

import { brand, generateReference } from "@/lib/config"

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
  const reference = generateReference()

  const handler = window.PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: config.email,
    amount: config.amount * 100,
    currency: brand.currencyCode,
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
  return `${brand.currencySymbol}${amount.toLocaleString(brand.locale)}`
}

export function initPaystackPop(options: {
  email: string
  amount: number
  reference?: string
  metadata?: Record<string, unknown>
  callback?: (response: { reference: string; transaction?: string; status: string }) => void
  onClose?: () => void
}) {
  const handler = (window as unknown as { PaystackPop?: { setup: (opts: unknown) => { openIframe: () => void } } }).PaystackPop?.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: options.email,
    amount: options.amount * 100,
    currency: brand.currencyCode,
    ref: options.reference || generateReference(),
    metadata: options.metadata,
    callback: options.callback,
    onClose: options.onClose,
  })

  handler?.openIframe()
}
