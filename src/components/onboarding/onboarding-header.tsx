"use client"

import Link from "next/link"
import { Save, Trash2 } from "lucide-react"
import ThemeToggle from "@/components/ui/theme-toggle"
import { brand } from "@/lib/config"

interface OnboardingHeaderProps {
  onClearDraft: () => void
}

export default function OnboardingHeader({ onClearDraft }: OnboardingHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-bold">
        {brand.shortName.charAt(0).toUpperCase()}
      </div>
      <div>
        <h1 className="text-xl font-bold">{brand.name}</h1>
        <p className="text-xs text-muted-foreground">Tenant Application</p>
      </div>
      <Link
        href="/"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[#005A36] dark:hover:text-[#00a85e] transition-colors ml-auto"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Home
      </Link>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Save className="h-3.5 w-3.5" />
          Auto-saved
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm("Clear all entered data and start a fresh application?")) {
              onClearDraft()
            }
          }}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
          title="Clear saved draft and start over"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Start Fresh
        </button>
        <ThemeToggle />
      </div>
    </div>
  )
}
