"use client"

import Link from "next/link"
import ThemeToggle from "@/components/ui/theme-toggle"

export default function Navbar() {

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white dark:bg-[#0f172a] border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#005A36] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-lg font-heading">P</span>
              </div>
              <span className="text-base font-bold text-[#111111] dark:text-white font-heading tracking-tight">
                PrinceSteve <span className="text-[#005A36] dark:text-[#00a85e]">Residence</span>
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 bg-[#005A36] dark:bg-[#00a85e] text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-[#004a2c] dark:hover:bg-[#00944e] transition-colors"
              >
                Get started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
