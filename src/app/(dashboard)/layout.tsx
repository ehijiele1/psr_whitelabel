"use client"

import { useState } from "react"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import MobileSidebar from "@/components/layout/mobile-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { PropertyProvider } from "@/contexts/PropertyContext"
import { RoleProvider } from "@/contexts/RoleContext"
import SessionTimeout from "@/components/auth/session-timeout"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <PropertyProvider>
      <RoleProvider>
        <TooltipProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <MobileSidebar open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen} />
            <SessionTimeout />
            <div className="flex flex-1 flex-col min-w-0">
              <Header onMenuClick={() => setMobileSidebarOpen(true)} />
              <main className="flex-1 overflow-y-auto">
                <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </TooltipProvider>
      </RoleProvider>
    </PropertyProvider>
  )
}
