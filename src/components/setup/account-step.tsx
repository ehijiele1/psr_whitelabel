"use client"

import { motion } from "framer-motion"
import { Mail, Lock, User, Phone } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AccountStepProps {
  form: { fullName: string; email: string; phone: string; password: string }
  onChange: (fields: Partial<AccountStepProps["form"]>) => void
}

export default function AccountStep({ form, onChange }: AccountStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold">Create Owner Account</h1>
        <p className="text-sm text-muted-foreground">
          This will be the primary administrator account.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="fullName"
            placeholder="Jane Doe"
            className="pl-9"
            value={form.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="owner@example.com"
            className="pl-9"
            value={form.email}
            onChange={(e) => onChange({ email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            placeholder="+234 800 000 0000"            className="pl-9"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            placeholder="At least 6 characters"
            className="pl-9"
            value={form.password}
            onChange={(e) => onChange({ password: e.target.value })}
            required
            minLength={6}
          />
        </div>
      </div>
    </motion.div>
  )
}
