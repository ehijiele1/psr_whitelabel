"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

interface KpiCardProps {
  title: string
  value?: number
  textValue?: string
  subtitle?: string
  prefix?: string
  suffix?: string
  icon: React.ReactNode
  trend?: { value: number; positive: boolean }
  className?: string
  delay?: number
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref!, { once: true })

  useEffect(() => {
    if (!inView) return
    const duration = 1500
    const start = performance.now()
    let rafId: number

    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplayValue(Math.round(easeOutCubic(progress) * value))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [inView, value])

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  )
}

export default function KpiCard({ title, value, textValue, subtitle, prefix = "", suffix = "", icon, trend, className, delay = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold tracking-tight">
              {textValue ? textValue : <AnimatedCounter value={value || 0} prefix={prefix} suffix={suffix} />}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                <span className={cn(
                  "text-xs font-medium",
                  trend.positive ? "text-emerald-600" : "text-destructive"
                )}>
                  {trend.positive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
