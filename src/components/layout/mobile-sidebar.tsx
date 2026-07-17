"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Ticket,
  MessageSquare,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Home,
} from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import Logo from "./logo"
import { createClient } from "@/lib/supabase/browser"

const adminNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Properties", href: "/dashboard/properties", icon: Building2 },
  { label: "Tenants", href: "/dashboard/tenants", icon: Users },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Tickets", href: "/dashboard/tickets", icon: Ticket },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Applications", href: "/dashboard/applications", icon: FileText },
  { label: "Staff", href: "/dashboard/staff", icon: Shield },
  { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

const tenantNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Payments", href: "/dashboard/payments", icon: Receipt },
  { label: "Tickets", href: "/dashboard/tickets", icon: Ticket },
  { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
]

interface MobileSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function MobileSidebar({ open, onOpenChange }: MobileSidebarProps) {
  const pathname = usePathname()
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single()
      setRole(profile?.role || null)
    }
    fetchRole()
  }, [])

  const adminRoles = ["landlord", "caretaker"]
  const isAdmin = role && adminRoles.includes(role)
  const navItems = role ? (isAdmin ? adminNavItems : tenantNavItems) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-64">
        <SheetHeader className="px-4 h-16 border-b flex items-center justify-start">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange(false)}
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </motion.div>
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
