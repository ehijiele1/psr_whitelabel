"use client"

import { useEffect, useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Shield, Plus, Send, UserPlus, Loader2, Mail, Phone } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/browser"
import { createInvitation } from "@/lib/supabase/invitations"
import { toast } from "sonner"

interface StaffMember {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: string
  created_at: string
  updated_at: string
}

const STAFF_ROLES = ["caretaker"]

const roleBadge: Record<string, { label: string; variant: "default" | "secondary" | "warning" }> = {
  landlord: { label: "Landlord", variant: "default" },
  caretaker: { label: "Caretaker", variant: "warning" },
}

export default function StaffPage() {
  const supabase = createClient()

  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createMethod, setCreateMethod] = useState<"password" | "invite">("password")
  const [newFullName, setNewFullName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newRole, setNewRole] = useState("caretaker")
  const [newPassword, setNewPassword] = useState("")

  const fetchStaff = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()
    setCurrentUserRole(profile?.role || null)

    if (!profile || profile.role !== "landlord") {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, created_at, updated_at")
      .in("role", STAFF_ROLES)
      .order("created_at", { ascending: false })

    if (error) {
      setFetchError(error.message)
    } else if (data) {
      setStaff(data as StaffMember[])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStaff().then(() => {})
  }, [fetchStaff])

  const handleAddStaff = async () => {
    setSubmitting(true)

    if (createMethod === "password") {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: newEmail,
        password: newPassword,
        options: {
          data: { full_name: newFullName, phone: newPhone, role: newRole },
        },
      })
      if (signUpError || !signUpData.user) {
        toast.error(signUpError?.message || "Failed to create account")
        setSubmitting(false)
        return
      }
      toast.success(`${newFullName} added as ${newRole}`)
    } else {
      const result = await createInvitation({
        phone: newPhone,
        email: newEmail,
        full_name: newFullName,
        role: newRole,
      })
      if (!result.success) {
        toast.error(result.error || "Failed to create invitation")
        setSubmitting(false)
        return
      }
      toast.success("Invitation created")
    }

    setSubmitting(false)
    setDialogOpen(false)
    setNewFullName("")
    setNewEmail("")
    setNewPhone("")
    setNewPassword("")
    setNewRole("caretaker")
    fetchStaff()
  }

  const canManage = currentUserRole === "landlord"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage caretaker accounts.
              </p>
        </div>
        {canManage && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        )}
      </div>

      {fetchError && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center justify-between">
          <span>{fetchError}</span>
          <Button variant="outline" size="sm" onClick={fetchStaff}>Retry</Button>
        </div>
      )}

      <Card>
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">No staff accounts yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add caretaker accounts above.
              </p>
          </div>
        ) : (
          <div className="divide-y">
            {staff.map((member) => {
              const badge = roleBadge[member.role] || { label: member.role, variant: "secondary" as const }
              return (
                <div key={member.id} className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {(member.full_name || "U").split(" ").map((n: string) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{member.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{member.email}</span>
                      {member.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{member.phone}</span>}
                    </div>
                  </div>
                  <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Create a staff account or send an invitation.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreateMethod("password")}
                className={`flex-1 py-2 rounded-lg border text-sm text-center transition-colors ${
                  createMethod === "password"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-input hover:border-primary/50"
                }`}
              >
                <UserPlus className="h-4 w-4 mx-auto mb-1" />
                Set Password
              </button>
              <button
                type="button"
                onClick={() => setCreateMethod("invite")}
                className={`flex-1 py-2 rounded-lg border text-sm text-center transition-colors ${
                  createMethod === "invite"
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-input hover:border-primary/50"
                }`}
              >
                <Send className="h-4 w-4 mx-auto mb-1" />
                Send Invite
              </button>
            </div>

            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="Staff full name"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+234 800 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="caretaker">Caretaker</option>
              </select>
            </div>

            {createMethod === "password" && (
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  placeholder="Set temporary password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button className="w-full" onClick={handleAddStaff} disabled={submitting}>
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
              ) : createMethod === "password" ? (
                <><UserPlus className="h-4 w-4 mr-2" /> Create Account</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Send Invitation</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
