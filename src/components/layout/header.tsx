"use client"

import {
  Bell,
  Menu,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ThemeToggle from "@/components/ui/theme-toggle"
import PropertySelector from "@/components/dashboard/property-selector"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/browser"

interface HeaderProps {
  onMenuClick: () => void
}

interface AppNotice {
  id: string
  title: string
  content: string
  sender_name: string
  recipient_id: string
  type: string
  read_by: string[] | null
  sent_at: string
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [profile, setProfile] = useState<{ fullName: string; email: string } | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [notices, setNotices] = useState<AppNotice[]>([])
  const [unread, setUnread] = useState(0)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (active) setProfileLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", user.id)
        .single()

      // Fall back to auth metadata when the profile row is missing/incomplete.
      const fullName =
        (data && data.full_name) ||
        (user.user_metadata && (user.user_metadata.full_name as string)) ||
        (user.email ? user.email.split("@")[0] : "") ||
        "User"
      const email = (data && data.email) || (user.email as string) || ""

      if (active) {
        if (!error && data) setProfile({ fullName, email })
        else setProfile({ fullName, email })
        setProfileLoading(false)
      }

      // Notifications (notices) for the bell.
      const { data: noticeData } = await supabase
        .from("notices")
        .select("id, title, content, sender_name, recipient_id, type, read_by, sent_at")
        .or(`recipient_id.eq.ALL,recipient_id.eq.${user.id}`)
        .order("sent_at", { ascending: false })
        .limit(20)

      if (active && noticeData) {
        const list = noticeData as AppNotice[]
        setNotices(list)
        setUnread(list.filter((n) => !(n.read_by || []).includes(user.id)).length)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    for (const n of notices) {
      if (!(n.read_by || []).includes(user.id)) {
        const updated = [...(n.read_by || []), user.id]
        await supabase.from("notices").update({ read_by: updated }).eq("id", n.id)
      }
    }
    setNotices((prev) => prev.map((n) => ({ ...n, read_by: [...(n.read_by || []), user.id] })))
    setUnread(0)
  }

  const displayName = profile?.fullName || "User"

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 shrink-0">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1">
        <h2 className="text-sm font-medium text-muted-foreground">
          Welcome back,
          <span className="text-foreground font-semibold"> {displayName}</span>
        </h2>
        <p className="text-xs text-muted-foreground">
          Here&apos;s what&apos;s happening at your properties today.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <PropertySelector />
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notices.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notices.map((n) => {
                  return (
                    <div
                      key={n.id}
                      className="px-3 py-2 border-b last:border-0 text-sm hover:bg-muted/50"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium truncate">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {formatTime(n.sent_at)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {n.content}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-1">
              {profileLoading ? (
                <span className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              ) : (
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
