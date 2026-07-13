"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, Receipt, Wrench, ArrowRight } from "lucide-react"

const actions = [
  { label: "Add Tenant", icon: UserPlus, variant: "default" as const, href: "/dashboard/tenants" },
  { label: "Record Payment", icon: Receipt, variant: "outline" as const, href: "/dashboard/payments" },
  { label: "Create Ticket", icon: Wrench, variant: "outline" as const, href: "/dashboard/tickets" },
]

export default function QuickActions() {
  const router = useRouter()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {actions.map((action) => (
            <motion.div
              key={action.label}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button
                variant={action.variant}
                className="w-full justify-between group"
                onClick={() => router.push(action.href)}
              >
                <span className="flex items-center gap-2">
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </span>
                <ArrowRight className="h-4 w-4 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </Button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  )
}
