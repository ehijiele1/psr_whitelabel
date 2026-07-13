"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import ThemeToggle from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase/browser"
import { getInvitationByToken, claimInvitation } from "@/lib/supabase/invitations"

interface InvitationData {
  id: string
  email: string | null
  phone: string | null
  full_name: string
  role: string
  status: string
  expires_at: string
  payment_history: unknown
  notes: string | null
}

function InviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [claimed, setClaimed] = useState(false)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [registering, setRegistering] = useState(false)
  const [password, setPassword] = useState("")

  useEffect(() => {
    if (!token) {
      Promise.resolve().then(() => {
        setError("Invalid invitation link")
        setLoading(false)
      })
      return
    }

    getInvitationByToken(token).then((inv) => {
      if (!inv) {
        setError("Invitation not found or expired")
      } else if (inv.status !== "pending") {
        setError("This invitation has already been used")
      } else if (new Date(inv.expires_at) < new Date()) {
        setError("This invitation has expired")
      } else {
        setInvitation(inv as unknown as InvitationData)
      }
      setLoading(false)
    })
  }, [token])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setRegistering(true)

    if (!invitation) {
      setError("Invitation data not found")
      setRegistering(false)
      return
    }

    const supabase = createClient()

    const email = invitation.email || `${invitation.phone}@invite.princessteve.app`
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: invitation.full_name,
          phone: invitation.phone,
          role: invitation.role,
        },
      },
    })

    if (authError) {
      setError(authError.message)
      setRegistering(false)
      return
    }

    const result = await claimInvitation(token!)
    if (!result.success) {
      setError(result.error || "Failed to claim invitation")
      setRegistering(false)
      return
    }

    setClaimed(true)
    setRegistering(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold">Invalid Invitation</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

  if (claimed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-100" />
          </div>
          <h1 className="text-2xl font-bold">Welcome Aboard!</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been created. Please check your email to confirm your account before signing in.
          </p>
          <Button onClick={() => router.push("/login")} className="mt-4">
            Go to Login
          </Button>
        </motion.div>
      </div>
    )
  }

    if (!invitation) return null

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">You&apos;re Invited!</h1>
          <p className="text-sm text-muted-foreground">
            Hi <strong>{invitation.full_name}</strong>, please set your password to join PrinceSteve Residence.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 bg-card border rounded-xl p-6 shadow-sm">
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-1">
            <p><span className="text-muted-foreground">Name:</span> {invitation.full_name}</p>
            <p><span className="text-muted-foreground">Phone:</span> {invitation.phone || "—"}</p>
            {invitation.email && <p><span className="text-muted-foreground">Email:</span> {invitation.email}</p>}
            <p><span className="text-muted-foreground">Role:</span> <span className="capitalize">{invitation.role.replace("_", " ")}</span></p>
          </div>

          {Array.isArray(invitation.payment_history) && invitation.payment_history.length > 0 && (
            <div className="p-4 rounded-lg border text-sm">
              <p className="font-medium mb-2">Existing Payment History</p>
              {(invitation.payment_history as { date: string; amount: number }[]).map((p, i) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b last:border-0">
                  <span>{p.date}</span>
                  <span className="font-medium">₦{Number(p.amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            After registration, please review and update your personal details.
          </p>

          <Button type="submit" className="w-full" disabled={registering}>
            {registering ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Setting up account...</>
            ) : (
              "Accept Invitation & Register"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <InviteContent />
    </Suspense>
  )
}
