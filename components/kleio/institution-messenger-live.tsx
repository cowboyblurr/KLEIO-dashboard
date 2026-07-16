"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  Loader2,
  LockKeyhole,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  UserRound,
  WifiOff,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getOrCreateDirectInstitutionConversation,
  getSupabaseBrowserClient,
  loadInstitutionConversations,
  loadInstitutionMessages,
  loadInstitutionMessengerContexts,
  markInstitutionConversationRead,
  searchInstitutionMessengerMembers,
  sendInstitutionMessage,
  type InstitutionConversationSummary,
  type InstitutionMessage,
  type InstitutionMessengerContext,
  type InstitutionMessengerMember,
  type KleioAccount,
} from "@/lib/kleio-supabase"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type RealtimeState = "connecting" | "connected" | "reconnecting" | "disconnected"
type MessageDelivery = "sending" | "failed" | "confirmed"
type DisplayMessage = InstitutionMessage & { delivery?: MessageDelivery }
type MessengerState = "loading" | "ready" | "no-membership" | "unauthorized" | "error"
type OpenMessengerDetail = { userId?: string }

function formatTimestamp(value: string | null, locale: string) {
  if (!value) return locale === "es" ? "Sin mensajes" : "No messages yet"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale === "es" ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "object" && error && "message" in error && typeof error.message === "string") return error.message
  return fallback
}

function mergeMessage(current: DisplayMessage[], incoming: DisplayMessage) {
  const existingIndex = current.findIndex((message) =>
    message.id === incoming.id ||
    Boolean(incoming.client_nonce && message.client_nonce === incoming.client_nonce),
  )
  if (existingIndex === -1) {
    return [...current, incoming].sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  const next = [...current]
  next[existingIndex] = { ...incoming, delivery: incoming.delivery ?? "confirmed" }
  return next.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export function InstitutionMessengerLive({ account }: { account: KleioAccount }) {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const mountedRef = useRef(true)
  const selectedConversationRef = useRef<string | null>(null)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<MessengerState>("loading")
  const [context, setContext] = useState<InstitutionMessengerContext | null>(null)
  const [conversations, setConversations] = useState<InstitutionConversationSummary[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [draft, setDraft] = useState("")
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [memberQuery, setMemberQuery] = useState("")
  const [members, setMembers] = useState<InstitutionMessengerMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [realtimeState, setRealtimeState] = useState<RealtimeState>("connecting")

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.conversation_id === selectedConversationId) ?? null,
    [conversations, selectedConversationId],
  )

  const unreadTotal = useMemo(
    () => conversations.reduce((total, conversation) => total + Number(conversation.unread_count || 0), 0),
    [conversations],
  )

  const refreshConversations = useCallback(async (institutionId?: string): Promise<InstitutionConversationSummary[] | null> => {
    const resolvedInstitutionId = institutionId ?? context?.institution_id
    if (!resolvedInstitutionId) return null
    try {
      const rows = await loadInstitutionConversations(resolvedInstitutionId)
      if (!mountedRef.current) return rows
      setConversations(rows)
      setLoadError(null)
      setSelectedConversationId((current) => {
        if (current && rows.some((conversation) => conversation.conversation_id === current)) return current
        return rows[0]?.conversation_id ?? null
      })
      return rows
    } catch (error) {
      const message = errorMessage(error, es ? "No se pudieron cargar las conversaciones." : "Unable to load conversations.")
      if (/access|permission|denied|membership/i.test(message)) setState("unauthorized")
      else {
        setLoadError(message)
        setState("error")
      }
      return null
    }
  }, [context?.institution_id, es])

  const initialize = useCallback(async () => {
    setState("loading")
    setLoadError(null)
    try {
      const contexts = await loadInstitutionMessengerContexts()
      if (!mountedRef.current) return
      const firstContext = contexts.find((entry) => entry.member_status === "active") ?? null
      if (!firstContext) {
        setContext(null)
        setConversations([])
        setState("no-membership")
        return
      }
      setContext(firstContext)
      const rows = await refreshConversations(firstContext.institution_id)
      if (mountedRef.current && rows !== null) setState("ready")
    } catch (error) {
      if (!mountedRef.current) return
      setLoadError(errorMessage(error, es ? "No se pudo abrir la mensajería institucional." : "Unable to open institution messaging."))
      setState("error")
    }
  }, [es, refreshConversations])

  useEffect(() => {
    mountedRef.current = true
    void initialize()
    return () => {
      mountedRef.current = false
    }
  }, [initialize])

  useEffect(() => {
    selectedConversationRef.current = selectedConversationId
  }, [selectedConversationId])

  const openConversation = useCallback(async (conversationId: string) => {
    setSelectedConversationId(conversationId)
    setComposeOpen(false)
    setDraft("")
    setSendError(null)
    setLoadError(null)
    setLoadingMessages(true)
    try {
      const rows = await loadInstitutionMessages(conversationId)
      if (!mountedRef.current || selectedConversationRef.current !== conversationId) return
      setMessages(rows.map((message) => ({ ...message, delivery: "confirmed" })))
      await markInstitutionConversationRead(conversationId)
      setConversations((current) => current.map((conversation) =>
        conversation.conversation_id === conversationId
          ? { ...conversation, unread_count: 0 }
          : conversation,
      ))
    } catch (error) {
      if (!mountedRef.current) return
      const message = errorMessage(error, es ? "No se pudo cargar la conversación." : "Unable to load this conversation.")
      if (/access|permission|denied|membership/i.test(message)) setState("unauthorized")
      else setLoadError(message)
      setMessages([])
    } finally {
      if (mountedRef.current) setLoadingMessages(false)
    }
  }, [es])

  useEffect(() => {
    if (!selectedConversationId || state !== "ready") {
      setMessages([])
      return
    }
    selectedConversationRef.current = selectedConversationId
    void openConversation(selectedConversationId)
  }, [openConversation, selectedConversationId, state])

  useEffect(() => {
    if (!composeOpen || !context) return
    const timeout = window.setTimeout(() => {
      setMembersLoading(true)
      setMembersError(null)
      void searchInstitutionMessengerMembers(context.institution_id, memberQuery)
        .then((rows) => {
          if (mountedRef.current) setMembers(rows)
        })
        .catch((error) => {
          if (mountedRef.current) setMembersError(errorMessage(error, es ? "No se pudo buscar el equipo." : "Unable to search the institution team."))
        })
        .finally(() => {
          if (mountedRef.current) setMembersLoading(false)
        })
    }, 240)
    return () => window.clearTimeout(timeout)
  }, [composeOpen, context, memberQuery, es])

  const startDirectConversation = useCallback(async (userId: string) => {
    if (!context) return
    setMembersError(null)
    try {
      const conversationId = await getOrCreateDirectInstitutionConversation(context.institution_id, userId)
      const rows = await refreshConversations(context.institution_id)
      if (rows === null) return
      setOpen(true)
      setComposeOpen(false)
      selectedConversationRef.current = conversationId
      setSelectedConversationId(conversationId)
    } catch (error) {
      setMembersError(errorMessage(error, es ? "No se pudo abrir la conversación." : "Unable to open the conversation."))
    }
  }, [context, es, refreshConversations])

  useEffect(() => {
    function handleOpen(event: Event) {
      setOpen(true)
      const customEvent = event as CustomEvent<OpenMessengerDetail>
      if (customEvent.detail?.userId) void startDirectConversation(customEvent.detail.userId)
    }
    window.addEventListener("kleio:open-institution-messenger", handleOpen)

    const requestedUser = new URLSearchParams(window.location.search).get("messageUser")
    if (requestedUser) {
      setOpen(true)
      void startDirectConversation(requestedUser)
    }

    return () => window.removeEventListener("kleio:open-institution-messenger", handleOpen)
  }, [startDirectConversation])

  useEffect(() => {
    if (!account.user.id || conversations.length === 0 || state !== "ready") {
      setRealtimeState("disconnected")
      return
    }

    const supabase = getSupabaseBrowserClient()
    let channel = supabase.channel(`institution-inbox:${account.user.id}:${Date.now()}`)

    for (const conversation of conversations) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "institution_messages",
          filter: `conversation_id=eq.${conversation.conversation_id}`,
        },
        (payload) => {
          const incoming = payload.new as InstitutionMessage
          const activeConversationId = selectedConversationRef.current
          if (incoming.conversation_id === activeConversationId) {
            setMessages((current) => mergeMessage(current, { ...incoming, delivery: "confirmed" }))
            if (incoming.sender_user_id !== account.user.id) {
              void markInstitutionConversationRead(incoming.conversation_id)
                .then(() => refreshConversations())
                .catch(() => refreshConversations())
              return
            }
          }
          void refreshConversations()
        },
      )
    }

    channel.subscribe((status) => {
      if (!mountedRef.current) return
      if (status === "SUBSCRIBED") setRealtimeState("connected")
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setRealtimeState("reconnecting")
      else if (status === "CLOSED") setRealtimeState("disconnected")
      else setRealtimeState("connecting")
    })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [account.user.id, conversations, refreshConversations, state])

  async function submitMessage(existing?: DisplayMessage) {
    if (!selectedConversation || sending) return
    const body = (existing?.body ?? draft).trim()
    if (!body) return

    const nonce = existing?.client_nonce ?? crypto.randomUUID()
    const optimisticId = existing?.id ?? `optimistic-${nonce}`
    const optimistic: DisplayMessage = {
      id: optimisticId,
      conversation_id: selectedConversation.conversation_id,
      sender_user_id: account.user.id,
      body,
      client_nonce: nonce,
      created_at: existing?.created_at ?? new Date().toISOString(),
      delivery: "sending",
    }

    setMessages((current) => mergeMessage(current.filter((message) => message.id !== optimisticId), optimistic))
    setDraft("")
    setSending(true)
    setSendError(null)

    try {
      const confirmed = await sendInstitutionMessage(selectedConversation.conversation_id, body, nonce)
      setMessages((current) => mergeMessage(current, { ...confirmed, delivery: "confirmed" }))
      await refreshConversations()
    } catch (error) {
      setMessages((current) => current.map((message) =>
        message.client_nonce === nonce ? { ...message, delivery: "failed" } : message,
      ))
      setSendError(errorMessage(error, es ? "El mensaje no se envió. Puedes reintentar." : "The message was not sent. You can retry."))
    } finally {
      setSending(false)
    }
  }

  function selectConversation(conversationId: string) {
    selectedConversationRef.current = conversationId
    setSelectedConversationId(conversationId)
    setComposeOpen(false)
    setDraft("")
    setSendError(null)
  }

  if (account.profile.role === "artist") return null

  return (
    <div className="fixed bottom-4 right-5 z-50 max-lg:right-3">
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="group flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/95 px-3 py-2 text-left shadow-[0_18px_48px_rgba(82,64,130,0.14)] backdrop-blur transition-colors hover:bg-[#F7F4FF]" aria-label={es ? "Abrir mensajería institucional" : "Open institution messenger"}>
          <span className="relative grid size-8 place-items-center rounded-full bg-[#F7F4FF] text-[#5B4B8A]"><MessageCircle className="size-4" />{unreadTotal > 0 && <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[#5B4B8A] px-1 text-[0.55rem] font-semibold text-white">{unreadTotal > 99 ? "99+" : unreadTotal}</span>}</span>
          <span className="hidden sm:block"><span className="block text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{es ? "Interno" : "Internal"}</span><span className="block text-xs font-semibold text-[#292631]">{es ? "Mensajería del equipo" : "Team messenger"}</span></span>
        </button>
      )}

      {open && (
        <section className="flex max-h-[min(720px,calc(100vh-2rem))] w-[440px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-[1.4rem] border border-[#E7E1F7] bg-white shadow-[0_24px_72px_rgba(82,64,130,0.18)]" aria-label={es ? "Mensajería interna de la institución" : "Internal institution messenger"}>
          <header className="border-b border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Mensajería interna" : "Internal messenger"}</p><h2 className="mt-0.5 truncate font-serif text-base font-semibold text-[#292631]">{context?.institution_name ?? (es ? "Equipo institucional" : "Institution team")}</h2><p className="mt-1 flex items-center gap-1.5 text-[0.68rem] text-[#7F7890]"><LockKeyhole className="size-3" />{es ? "Solo miembros institucionales autorizados" : "Authorized institution members only"}</p></div>
              <div className="flex gap-1"><button type="button" onClick={() => { setComposeOpen(true); setMemberQuery(""); setMembers([]) }} disabled={state !== "ready"} aria-label={es ? "Nuevo mensaje" : "New message"} className="grid size-8 place-items-center rounded-full border border-[#D8D0F2] bg-white text-[#5B4B8A] transition-colors hover:bg-[#F1ECFB] disabled:opacity-40"><Plus className="size-4" /></button><button type="button" onClick={() => setOpen(false)} aria-label={es ? "Cerrar mensajería" : "Close messenger"} className="grid size-8 place-items-center rounded-full border border-[#D8D0F2] bg-white text-[#7F7890] transition-colors hover:text-[#292631]"><X className="size-4" /></button></div>
            </div>
            {realtimeState !== "connected" && state === "ready" && conversations.length > 0 && <p className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[0.65rem] font-medium text-amber-800"><WifiOff className="size-3" />{realtimeState === "reconnecting" || realtimeState === "connecting" ? (es ? "Reconectando mensajes en tiempo real…" : "Reconnecting real-time messages…") : (es ? "Tiempo real desconectado. Los mensajes guardados siguen disponibles." : "Real time is disconnected. Saved messages remain available.")}</p>}
          </header>

          {state === "loading" && <div className="grid min-h-72 place-items-center p-8 text-center"><div><Loader2 className="mx-auto size-5 animate-spin text-[#5B4B8A]" /><p className="mt-2 text-xs text-[#7F7890]">{es ? "Cargando conversaciones auténticas…" : "Loading authenticated conversations…"}</p></div></div>}

          {(state === "no-membership" || state === "unauthorized") && <div className="grid min-h-72 place-items-center p-8 text-center"><div><AlertCircle className="mx-auto size-6 text-[#8A6F3D]" /><h3 className="mt-3 text-sm font-semibold text-[#292631]">{state === "no-membership" ? (es ? "Sin membresía institucional activa" : "No active institution membership") : (es ? "Acceso a la conversación retirado" : "Conversation access removed")}</h3><p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{es ? "La mensajería solo está disponible para miembros activos del espacio institucional." : "Messaging is available only to active members of the institution workspace."}</p><button type="button" onClick={() => void initialize()} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A]"><RefreshCw className="size-3.5" />{es ? "Volver a comprobar" : "Check again"}</button></div></div>}

          {state === "error" && <div className="grid min-h-72 place-items-center p-8 text-center"><div><AlertCircle className="mx-auto size-6 text-red-600" /><p className="mt-2 text-xs text-[#7F7890]">{loadError}</p><button type="button" onClick={() => void initialize()} className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A]"><RefreshCw className="size-3.5" />{es ? "Reintentar" : "Retry"}</button></div></div>}

          {state === "ready" && (
            <div className="grid min-h-0 flex-1 grid-cols-[10rem_minmax(0,1fr)] max-sm:grid-cols-[8.5rem_minmax(0,1fr)]">
              <aside className="min-h-0 overflow-y-auto border-r border-[#E7E1F7] bg-[#FDFBFF] p-2">
                {composeOpen ? (
                  <div>
                    <button type="button" onClick={() => setComposeOpen(false)} className="mb-2 text-[0.65rem] font-semibold text-[#5B4B8A]">← {es ? "Conversaciones" : "Conversations"}</button>
                    <label className="relative block"><Search className="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-[#9B94AA]" /><input value={memberQuery} onChange={(event) => setMemberQuery(event.target.value)} autoFocus placeholder={es ? "Buscar equipo" : "Search team"} aria-label={es ? "Buscar miembros institucionales" : "Search institution members"} className="h-9 w-full rounded-xl border border-[#E7E1F7] bg-white pl-8 pr-2 text-xs outline-none focus:border-[#A997E8]" /></label>
                    {membersLoading && <p className="mt-3 flex items-center gap-1.5 text-[0.65rem] text-[#7F7890]"><Loader2 className="size-3 animate-spin" />{es ? "Buscando…" : "Searching…"}</p>}
                    {membersError && <p className="mt-3 text-[0.65rem] text-red-600">{membersError}</p>}
                    {!membersLoading && !membersError && members.length === 0 && <p className="mt-3 text-[0.65rem] leading-relaxed text-[#7F7890]">{memberQuery ? (es ? "No hay miembros coincidentes." : "No matching institution members.") : (es ? "No hay otros miembros activos disponibles." : "No other active members are available.")}</p>}
                    <ul className="mt-2 space-y-1">{members.map((member) => <li key={member.user_id}><button type="button" onClick={() => void startDirectConversation(member.user_id)} className="flex w-full items-center gap-2 rounded-xl border border-transparent px-2 py-2 text-left hover:border-[#E7E1F7] hover:bg-white"><InitialAvatar name={member.display_name} className="size-7 text-[0.6rem]" /><span className="min-w-0"><span className="block truncate text-xs font-semibold text-[#292631]">{member.display_name}</span><span className="block truncate text-[0.6rem] text-[#7F7890]">{member.institution_role}</span></span></button></li>)}</ul>
                  </div>
                ) : (
                  <>
                    {conversations.length === 0 && <div className="px-2 py-4 text-center"><UserRound className="mx-auto size-5 text-[#A997E8]" /><p className="mt-2 text-[0.65rem] leading-relaxed text-[#7F7890]">{es ? "Aún no hay conversaciones. Inicia una con un colega." : "No conversations yet. Start one with a colleague."}</p><button type="button" onClick={() => setComposeOpen(true)} className="mt-3 rounded-lg bg-[#5B4B8A] px-2.5 py-1.5 text-[0.65rem] font-semibold text-white">{es ? "Nuevo mensaje" : "New message"}</button></div>}
                    {conversations.map((conversation) => { const active = conversation.conversation_id === selectedConversationId; return <button key={conversation.conversation_id} type="button" onClick={() => selectConversation(conversation.conversation_id)} className={cn("mb-1 w-full rounded-2xl border px-2.5 py-2 text-left transition-colors", active ? "border-[#D8D0F2] bg-white shadow-sm" : "border-transparent hover:bg-white/80")}><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-[#292631]">{conversation.counterpart_name || conversation.conversation_title}</span>{conversation.unread_count > 0 && <span className="rounded-full bg-[#5B4B8A] px-1.5 py-0.5 text-[0.55rem] font-semibold text-white">{conversation.unread_count}</span>}</span><span className="mt-1 line-clamp-2 block text-[0.65rem] leading-snug text-[#7F7890]">{conversation.latest_message_body ?? (es ? "Nueva conversación" : "New conversation")}</span><span className="mt-1 block text-[0.58rem] text-[#A997E8]">{formatTimestamp(conversation.latest_message_at, locale)}</span></button>})}
                  </>
                )}
              </aside>

              <div className="flex min-h-0 flex-col">
                {!selectedConversation && !composeOpen ? <div className="grid min-h-72 flex-1 place-items-center p-6 text-center"><div><MessageCircle className="mx-auto size-6 text-[#A997E8]" /><p className="mt-2 text-xs text-[#7F7890]">{es ? "Selecciona una conversación o inicia un mensaje nuevo." : "Select a conversation or start a new message."}</p></div></div> : composeOpen ? <div className="grid min-h-72 flex-1 place-items-center p-6 text-center"><div><Search className="mx-auto size-6 text-[#A997E8]" /><p className="mt-2 text-xs text-[#7F7890]">{es ? "Busca un miembro activo de esta institución." : "Search for an active member of this institution."}</p></div></div> : selectedConversation && <>
                  <div className="border-b border-[#E7E1F7] px-4 py-3"><h3 className="truncate text-sm font-semibold text-[#292631]">{selectedConversation.counterpart_name || selectedConversation.conversation_title}</h3><p className="mt-0.5 text-[0.68rem] text-[#7F7890]">{selectedConversation.counterpart_role} · {es ? "conversación directa" : "direct conversation"}</p></div>
                  <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                    {loadingMessages && <li className="flex items-center justify-center gap-2 py-8 text-xs text-[#7F7890]"><Loader2 className="size-4 animate-spin" />{es ? "Cargando mensajes…" : "Loading messages…"}</li>}
                    {!loadingMessages && messages.length === 0 && <li className="py-8 text-center text-xs text-[#7F7890]">{es ? "Esta conversación todavía no tiene mensajes." : "This conversation does not have messages yet."}</li>}
                    {!loadingMessages && messages.map((message) => { const self = message.sender_user_id === account.user.id; return <li key={message.id} className={cn("flex gap-2", self && "justify-end")}>{!self && <InitialAvatar name={selectedConversation.counterpart_name} className="mt-1 size-7 text-[0.6rem]" />}<div className={cn("max-w-[86%] rounded-2xl border px-3 py-2", self ? "border-[#D8D0F2] bg-[#F7F4FF]" : "border-border bg-background", message.delivery === "failed" && "border-red-200 bg-red-50")}><div className="flex flex-wrap items-center gap-x-2 gap-y-0.5"><p className="text-xs font-semibold text-foreground">{self ? (es ? "Tú" : "You") : selectedConversation.counterpart_name}</p><p className="text-[0.6rem] text-muted-foreground">{formatTimestamp(message.created_at, locale)}</p></div><p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">{message.body}</p>{message.delivery === "sending" && <p className="mt-1 text-[0.6rem] font-medium text-[#A997E8]">{es ? "Enviando…" : "Sending…"}</p>}{message.delivery === "failed" && <button type="button" onClick={() => void submitMessage(message)} className="mt-1 inline-flex items-center gap-1 text-[0.6rem] font-semibold text-red-700"><RefreshCw className="size-3" />{es ? "Reintentar" : "Retry"}</button>}</div></li> })}
                  </ul>
                  <div className="border-t border-[#E7E1F7] p-3">
                    {loadError && <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[0.68rem] font-medium text-red-700">{loadError}</p>}
                    {sendError && <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[0.68rem] font-medium text-red-700">{sendError}</p>}
                    <p className="mb-2 text-[0.62rem] leading-relaxed text-[#7F7890]">{es ? "Mensajes persistentes, visibles solo para participantes autorizados de esta institución." : "Persistent messages visible only to authorized participants in this institution."}</p>
                    <div className="flex items-end gap-2"><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitMessage() } }} rows={2} maxLength={4000} placeholder={es ? "Escribe un mensaje interno…" : "Write an internal message…"} aria-label={es ? "Mensaje interno" : "Internal message"} className="min-h-16 flex-1 resize-none rounded-2xl border border-[#E7E1F7] bg-[#FDFBFF] px-3 py-2 text-xs text-[#292631] outline-none transition-colors placeholder:text-[#9B94AA] focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/15" /><button type="button" onClick={() => void submitMessage()} disabled={!draft.trim() || sending} className="grid size-10 place-items-center rounded-2xl bg-[#5B4B8A] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45" aria-label={es ? "Enviar mensaje" : "Send message"}>{sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}</button></div>
                  </div>
                </>}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
