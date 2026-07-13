"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

interface ThemeContextValue {
  dark: boolean
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue>({ dark: false, toggle: () => {} })

export function useTheme() {
  return useContext(ThemeContext)
}

function getInitialDark(): boolean {
  if (typeof window === "undefined") return false
  const stored = localStorage.getItem("theme")
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  return stored === "dark" || (!stored && prefersDark)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(getInitialDark)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    Promise.resolve().then(() => setMounted(true))
  }, [dark])

  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    localStorage.setItem("theme", next ? "dark" : "light")
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
