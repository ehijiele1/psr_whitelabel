"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Send,
  MessageSquare,
  ChevronLeft,
  Plus,
  MoreHorizontal,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/browser"
import { toast } from "sonner"

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  message: string
  created_at: string
}

type Conv = {
  partnerId: string
  partnerName: string
  partnerInitials: string
  lastMessage: string
  lastTime: string
  messages: Message[]
}

type TenantItem = {
  user_id: string
  full_name: string
  unit_name?: string
  initials: string
}

export default function MessagesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [conversations, setConversations] = useState<Conv[]>([])
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileList, setShowMobileList] = useState(true)
  const [loading, setLoading] = useState(true)
  const [newMessageOpen, setNewMessageOpen] = useState(false)
  const [tenants, setTenants] = useState<TenantItem[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const activeConv = conversations.find((c) => c.partnerId === selectedConvId)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      const role = profile?.role || ""
      setUserId(user.id)
      setUserRole(role)

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false })

      if (!msgs || msgs.length === 0) {
        setLoading(false)
        return
      }

      const otherIds = new Set<string>()
      const grouped = new Map<string, Message[]>()
      for (const msg of msgs as Message[]) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id
        otherIds.add(otherId)
        if (!grouped.has(otherId)) grouped.set(otherId, [])
        grouped.get(otherId)!.push(msg)
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(otherIds))

      const profileMap = new Map((profiles || []).map((p: { id: string; full_name: string }) => [p.id, p.full_name]))

      const convs: Conv[] = Array.from(grouped.entries()).map(([partnerId, msgs]) => {
        const last = msgs[0]
        const name = profileMap.get(partnerId) || "Unknown"
        return {
          partnerId,
          partnerName: name,
          partnerInitials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase(),
          lastMessage: last.message,
          lastTime: formatTime(last.created_at),
          messages: msgs.reverse(),
        }
      })

      setConversations(convs)
      setLoading(false)
    })()
  }, [supabase])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel("messages")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, async (payload) => {
        const msg = payload.new as Message
        if (msg.sender_id !== userId && msg.receiver_id !== userId) return

        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id

        setConversations((prev) => {
          const existing = prev.find((c) => c.partnerId === otherId)
          if (existing) {
            return prev.map((c) =>
              c.partnerId !== otherId ? c : { ...c, messages: [...c.messages, msg], lastMessage: msg.message, lastTime: "now" }
            )
          }
          return [...prev, { partnerId: otherId, partnerName: "New", partnerInitials: "??", lastMessage: msg.message, lastTime: "now", messages: [msg] }]
        })

        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", otherId).single()
        if (profile) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.partnerId !== otherId || c.partnerName !== "New") return c
              const name = profile.full_name || ""
              return { ...c, partnerName: name, partnerInitials: name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() }
            })
          )
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeConv?.messages.length])

  const handleSend = async () => {
    if (!messageInput.trim() || !selectedConvId || !userId) return
    const { error } = await supabase.from("messages").insert({
      sender_id: userId,
      receiver_id: selectedConvId,
      message: messageInput,
    })
    if (error) {
      toast.error("Failed to send message: " + error.message)
      return
    }
    const newMsg: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      receiver_id: selectedConvId,
      message: messageInput,
      created_at: new Date().toISOString(),
    }
    setConversations((prev) =>
      prev.map((c) =>
        c.partnerId !== selectedConvId ? c : { ...c, messages: [...c.messages, newMsg], lastMessage: messageInput, lastTime: "now" }
      )
    )
    setMessageInput("")
  }

  const handleStartConversation = async (tenantId: string, tenantName: string) => {
    setNewMessageOpen(false)
    const initials = tenantName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    const existing = conversations.find((c) => c.partnerId === tenantId)
    if (existing) {
      setSelectedConvId(tenantId)
      setShowMobileList(false)
      return
    }
    setConversations((prev) => [
      ...prev,
      { partnerId: tenantId, partnerName: tenantName, partnerInitials: initials, lastMessage: "", lastTime: "", messages: [] },
    ])
    setSelectedConvId(tenantId)
    setShowMobileList(false)
  }

  const openNewMessage = useCallback(async () => {
    setNewMessageOpen(true)
    const { data } = await supabase
      .from("tenants")
      .select("user_id, profiles(full_name), units(name)")

    if (data) {
      const mapped: { user_id: string; full_name: string; unit_name: string; initials: string }[] = []
      for (const t of data) {
        const row = t as Record<string, unknown>
        const profiles = (row.profiles as Record<string, unknown>[]) || []
        const units = (row.units as Record<string, unknown>[]) || []
        const fullName = String(profiles[0]?.full_name || "Unknown")
        mapped.push({
          user_id: String(row.user_id),
          full_name: fullName,
          unit_name: String(units[0]?.name || ""),
          initials: fullName
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase(),
        })
      }
      setTenants(mapped)
    }
  }, [supabase])

  const isAdmin = userRole && ["landlord", "owner", "admin", "manager", "caretaker"].includes(userRole)
  const filteredConversations = conversations.filter((c) =>
    c.partnerName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="h-[calc(100vh-8rem)] -mx-4 md:-mx-6 lg:-mx-8">
      <div className="flex h-full bg-card border rounded-xl overflow-hidden">
        <AnimatePresence mode="wait">
          {showMobileList && (
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="w-full md:w-80 lg:w-96 border-r shrink-0 flex flex-col"
            >
              <div className="p-4 border-b space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">Messages</h2>
                  {isAdmin && (
                    <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={openNewMessage}>
                          <Plus className="h-4 w-4 mr-1" />
                          New
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select a Tenant</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {tenants.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">No tenants found</p>
                          ) : (
                            tenants.map((t) => (
                              <button
                                key={t.user_id}
                                onClick={() => handleStartConversation(t.user_id, t.full_name)}
                                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">{t.initials}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{t.full_name}</p>
                                  {t.unit_name && <p className="text-xs text-muted-foreground">{t.unit_name}</p>}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 pl-9 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Loading...</div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">No conversations</div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.partnerId}
                      onClick={() => { setSelectedConvId(conv.partnerId); setShowMobileList(false) }}
                      className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-border/50 hover:bg-muted/30 ${
                        selectedConvId === conv.partnerId ? "bg-muted/50" : ""
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {conv.partnerInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{conv.partnerName}</p>
                          {conv.lastTime && (
                            <span className="text-[10px] text-muted-foreground shrink-0">{conv.lastTime}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {selectedConvId && activeConv ? (
            <motion.div
              key={selectedConvId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col min-w-0"
            >
              <div className="flex items-center gap-3 p-4 border-b shrink-0">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowMobileList(true)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {activeConv.partnerInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activeConv.partnerName}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeConv.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs">Send a message to start the conversation.</p>
                  </div>
                ) : (
                  activeConv.messages.map((msg) => {
                    const isOwn = msg.sender_id === userId
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isOwn ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <div className={`text-[10px] mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    className="flex-1 h-10 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button size="icon" className="rounded-full shrink-0" onClick={handleSend} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden md:flex flex-1 items-center justify-center text-muted-foreground"
            >
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">Select a conversation</p>
                <p className="text-sm">Choose a tenant or start a new message</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString()
}
