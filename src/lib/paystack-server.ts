import { env } from '@/lib/env'
import { fetchWithRetry } from '@/lib/fetch'
import { log, logAuditEvent } from '@/lib/logger'

const PAYSTACK_SECRET_KEY = env.paystackSecretKey
const PAYSTACK_API_URL = 'https://api.paystack.co'
const PAYSTACK_TIMEOUT = 15000 // 15 seconds

// Create a Paystack client with built-in timeouts and retries
const paystack = {
  initializeTransaction: async (options: {
    email: string
    amount: number
    reference?: string
    metadata?: Record<string, unknown>
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> => {
    log.debug('[Paystack] Initializing transaction', {
      email: options.email,
      amount: options.amount,
      reference: options.reference,
    });
    
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        method: "POST",
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: options.email,
          amount: options.amount * 100,
          reference: options.reference,
          metadata: options.metadata,
          currency: "NGN",
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      log.error('[Paystack] Failed to initialize transaction', {
        status: response.status,
        error: errorData.message || 'Unknown error',
        email: options.email,
        amount: options.amount,
      });
      throw new Error(errorData.message || "Failed to initialize Paystack transaction")
    }

    const data = await response.json()
    
    logAuditEvent('paystack_transaction_initialized', {
      targetType: 'paystack_transaction',
      targetId: data.data.reference,
      status: 'success',
    });
    
    return data.data
  },

  verifyTransaction: async (reference: string): Promise<{
    status: string
    amount: number
    currency: string
    paid_at: string
    customer_email: string
    metadata?: Record<string, unknown>
  }> => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to verify Paystack transaction")
    }

    const data = await response.json()
    return data.data
  },

  createPlan: async (options: {
    name: string
    amount: number
    interval: "daily" | "weekly" | "monthly" | "quarterly" | "biannually" | "annually"
    description?: string
    send_invoices?: boolean
    send_sms?: boolean
    currency?: string
  }): Promise<{ plan_code: string; id: number; name: string }> => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/plan`,
      {
        method: "POST",
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { 
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          name: options.name,
          amount: options.amount * 100,
          interval: options.interval,
          description: options.description,
          send_invoices: options.send_invoices ?? true,
          send_sms: options.send_sms ?? true,
          currency: options.currency || "NGN",
        }),
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to create Paystack plan")
    }
    
    const data = await response.json()
    return { plan_code: data.data.plan_code, id: data.data.id, name: data.data.name }
  },

  listPlans: async (): Promise<{ plan_code: string; name: string; amount: number; interval: string; status: string; id: number }[]> => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/plan?perPage=100`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to fetch Paystack plans")
    }
    
    const data = await response.json()
    return (data.data || []).map((p: any) => ({
      plan_code: p.plan_code,
      name: p.name,
      amount: p.amount / 100,
      interval: p.interval,
      status: p.status,
      id: p.id,
    }))
  },

  initializeSubscription: async (options: {
    email: string
    amount: number
    plan: string
    metadata?: Record<string, unknown>
  }): Promise<{ authorization_url: string; access_code: string; reference: string }> => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/transaction/initialize`,
      {
        method: "POST",
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { 
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          email: options.email,
          amount: options.amount * 100,
          plan: options.plan,
          metadata: options.metadata,
          currency: "NGN",
        }),
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to initialize Paystack subscription")
    }
    
    const data = await response.json()
    return data.data
  },

  listSubscriptions: async (): Promise<{
    subscription_code: string
    status: string
    plan: { name: string; amount: number; interval: string }
    next_payment_date: string
  }[]> => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/subscription?perPage=100`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    )
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to fetch subscriptions")
    }
    
    const data = await response.json()
    return (data.data || []).map((s: any) => ({
      subscription_code: s.subscription_code,
      status: s.status,
      plan: { name: s.plan.name, amount: s.plan.amount / 100, interval: s.plan.interval },
      next_payment_date: s.next_payment_date,
    }))
  },

  enableSubscription: async (code: string): Promise<void> => {
    // First, get the email token
    const tokenResponse = await fetchWithRetry(
      `${PAYSTACK_API_URL}/subscription/${code}`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    )
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to get subscription token")
    }
    
    const tokenData = await tokenResponse.json()
    const token = tokenData.data?.email_token
    
    if (!token) throw new Error("No email token found")
    
    // Enable the subscription
    const enableResponse = await fetchWithRetry(
      `${PAYSTACK_API_URL}/subscription/enable`,
      {
        method: "POST",
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { 
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ code, token }),
      }
    )
    
    if (!enableResponse.ok) {
      const errorData = await enableResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to enable subscription")
    }
  },

  disableSubscription: async (code: string): Promise<void> => {
    // First, get the email token
    const tokenResponse = await fetchWithRetry(
      `${PAYSTACK_API_URL}/subscription/${code}`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
      }
    )
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to get subscription token")
    }
    
    const tokenData = await tokenResponse.json()
    const token = tokenData.data?.email_token
    
    if (!token) throw new Error("No email token found")
    
    // Disable the subscription
    const disableResponse = await fetchWithRetry(
      `${PAYSTACK_API_URL}/subscription/disable`,
      {
        method: "POST",
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: { 
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ code, token }),
      }
    )
    
    if (!disableResponse.ok) {
      const errorData = await disableResponse.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to disable subscription")
    }
  },

  listBanks: async (country: string = "nigeria") => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/bank?country=${country}`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || "Failed to fetch banks")
    }

    const data = await response.json()
    return data.data
  },

  validateAccountNumber: async (accountNumber: string, bankCode: string) => {
    const response = await fetchWithRetry(
      `${PAYSTACK_API_URL}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        timeout: PAYSTACK_TIMEOUT,
        maxRetries: 3,
        retryDelay: 1000,
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { valid: false, error: errorData.message || "Invalid account number or bank code" }
    }

    const data = await response.json()
    return { valid: true, ...data.data }
  },
}

// Export the individual functions for backward compatibility
export const initializeTransaction = paystack.initializeTransaction
export const verifyTransaction = paystack.verifyTransaction
export const createPlan = paystack.createPlan
export const listPlans = paystack.listPlans
export const initializeSubscription = paystack.initializeSubscription
export const listSubscriptions = paystack.listSubscriptions
export const enableSubscription = paystack.enableSubscription
export const disableSubscription = paystack.disableSubscription
export const listBanks = paystack.listBanks
export const validateAccountNumber = paystack.validateAccountNumber
