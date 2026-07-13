"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Bell, Shield, CreditCard, Save, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface NotifPrefs {
  rent_reminders: boolean
  payment_alerts: boolean
  ticket_updates: boolean
}

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paystackKey, setPaystackKey] = useState("")
  const [bankAccount, setBankAccount] = useState("")
  const [smsApiKey, setSmsApiKey] = useState("")
  const [prefs, setPrefs] = useState<NotifPrefs>({
    rent_reminders: true,
    payment_alerts: true,
    ticket_updates: true,
  })

  useEffect(() => {
    const storedPaystack = localStorage.getItem("paystack_public_key")
    const storedBank = localStorage.getItem("bank_account")
    const storedSms = localStorage.getItem("sms_api_key")
    Promise.resolve().then(() => {
      if (storedPaystack) setPaystackKey(storedPaystack)
      if (storedBank) setBankAccount(storedBank)
      if (storedSms) setSmsApiKey(storedSms)
    })

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      supabase
        .from("notification_preferences")
        .select("rent_reminders, payment_alerts, ticket_updates")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setPrefs(data)
          setLoading(false)
        })
    })
  }, [])

  const togglePref = (key: keyof NotifPrefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); toast.error("Not authenticated"); return }

    const { error } = await supabase.from("notification_preferences").upsert({
      user_id: user.id,
      ...prefs,
    })

    if (error) {
      setSaving(false)
      toast.error(error.message)
      return
    }

    localStorage.setItem("paystack_public_key", paystackKey)
    localStorage.setItem("bank_account", bankAccount)
    localStorage.setItem("sms_api_key", smsApiKey)

    setSaving(false)
    toast.success("Settings saved")
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const notifItems = [
    { key: "rent_reminders" as const, label: "Rent reminders", desc: "Get notified when rent is due" },
    { key: "payment_alerts" as const, label: "Payment confirmations", desc: "Receive alerts when tenants pay" },
    { key: "ticket_updates" as const, label: "Maintenance tickets", desc: "Updates on new and resolved tickets" },
  ]

  if (loading) return (
    <div className="space-y-6 max-w-2xl">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and property preferences.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Notifications</h2>
          </div>
          {notifItems.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[item.key]}
                  onChange={() => togglePref(item.key)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Payment Settings</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paystack">Paystack Public Key</Label>
            <Input id="paystack" placeholder="pk_test_xxxxxxxxxxxxx" value={paystackKey} onChange={(e) => setPaystackKey(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank">Bank Account (for offline payments)</Label>
            <Input id="bank" placeholder="Account name - Bank - Account number" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">SMS Provider</h2>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sms">eBulkSMS API Key</Label>
            <Input id="sms" type="password" placeholder="Enter your API key" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground">
            Used for sending rent reminders and payment confirmations via SMS.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saving ? "Saving..." : saved ? "Saved!" : "Save Settings"}
        </Button>
      </div>
    </motion.div>
  )
}
