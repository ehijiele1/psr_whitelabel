"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import ThemeToggle from "@/components/ui/theme-toggle"
import { createClient } from "@/lib/supabase/browser"
import Navbar from "@/components/home/navbar"
import Hero from "@/components/home/hero"
import Features from "@/components/home/features"
import Contact from "@/components/home/contact"
import Footer from "@/components/home/footer"

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [ownerExists, setOwnerExists] = useState(false)

  useEffect(() => {
    const checkOwner = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "owner")
        .maybeSingle()
      setOwnerExists(!!data)
      setChecking(false)
    }
    checkOwner()
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!ownerExists) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#005A36] flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-base font-bold text-foreground">
              PrinceSteve <span className="text-[#005A36] dark:text-[#00a85e]">Residence</span>
            </span>
          </div>
          <ThemeToggle />
        </div>

        <main className="flex-1 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-lg w-full text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#005A36]/10 dark:bg-[#00a85e]/10 flex items-center justify-center mx-auto">
              <Building2 className="h-10 w-10 text-[#005A36] dark:text-[#00a85e]" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Welcome to PrinceSteve Residence
            </h1>

            <p className="text-muted-foreground leading-relaxed">
              Your complete property management solution. Set up your property,
              manage tenants, track payments, and streamline operations — all
              in one place.
            </p>

            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={() => router.push("/setup")}
            >
              Set Up Your Property
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <p className="text-xs text-muted-foreground pt-4">
              Already set up?{" "}
              <button
                onClick={() => router.push("/login")}
                className="text-primary underline hover:no-underline"
              >
                Sign in
              </button>
            </p>
          </motion.div>
        </main>

        <footer className="text-center py-6">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} PrinceSteve Residence. All rights reserved.
          </p>
        </footer>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <Hero />
      <Features />
      <Contact />
      <Footer />
    </>
  )
}
