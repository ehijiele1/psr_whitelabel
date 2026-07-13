"use client"

import Link from "next/link"

export default function Hero() {
  return (
    <section className="bg-white dark:bg-[#0f172a] py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-8">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          THE BEST OR NOTHING
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#111111] dark:text-white leading-tight tracking-tight max-w-4xl mx-auto">
          Property management, done the{" "}
          <span className="text-[#005A36] dark:text-[#00a85e]">PrinceSteve</span> way.
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#555555] dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Manage tenants, rent collection, utility billing, maintenance and messaging across all your properties — in Naira, from one beautiful dashboard.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-[#005A36] dark:bg-[#00a85e] text-white text-sm font-medium px-6 py-3 rounded-full hover:bg-[#004a2c] dark:hover:bg-[#00944e] transition-colors shadow-sm"
          >
            Apply for tenancy
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-[#111111] dark:text-white text-sm font-medium px-6 py-3 rounded-full hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
          >
            Sign in
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="mt-3 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs text-[#999999] dark:text-gray-500">
          <span>New tenant? Start your application</span>
          <span className="hidden sm:inline">|</span>
          <span>Already have an account? Sign in</span>
        </div>
      </div>
    </section>
  )
}
