"use client"

import { motion } from "framer-motion"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import PhotoCapture from "./photo-capture"

interface PersonalInfoProps {
  data: { fullName: string; email: string; phone: string; passportPhoto: string }
  onChange: (fields: Partial<{ fullName: string; email: string; phone: string; passportPhoto: string }>) => void
}

export default function PersonalInfo({ data, onChange }: PersonalInfoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold">Personal Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us about yourself. Your progress is saved automatically.
        </p>
      </div>

      <div className="space-y-4">
        <PhotoCapture
          value={data.passportPhoto}
          onChange={(photo) => onChange({ passportPhoto: photo })}
        />

        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            placeholder="Enter your full name"
            value={data.fullName}
            onChange={(e) => onChange({ fullName: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              placeholder="+234 800 000 0000"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
