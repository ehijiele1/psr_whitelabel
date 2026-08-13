"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/browser"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000

export default function SessionTimeout() {
  const router = useRouter()
  const [showWarning, setShowWarning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    warningRef.current = setTimeout(() => {
      setShowWarning(true)
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)

    timerRef.current = setTimeout(async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    }, IDLE_TIMEOUT_MS)
  }, [router])

  const resetTimer = useCallback(() => {
    setShowWarning(false)
    scheduleTimers()
  }, [scheduleTimers])

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"]
    const handleActivity = () => resetTimer()
    events.forEach((event) => window.addEventListener(event, handleActivity))
    scheduleTimers()
    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      if (timerRef.current) clearTimeout(timerRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
    }
  }, [resetTimer, scheduleTimers])

  const extendSession = () => {
    resetTimer()
  }

  const logoutNow = async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <Dialog open={showWarning} onOpenChange={(open) => { if (!open) extendSession() }}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Session Expiring</DialogTitle>
          <DialogDescription>
            Your session will expire in 1 minute due to inactivity.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={logoutNow}>
            Log Out Now
          </Button>
          <Button onClick={extendSession}>
            Stay Logged In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
