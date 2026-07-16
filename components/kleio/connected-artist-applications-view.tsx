"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, MessageCircle, RefreshCw, Send } from "lucide-react"
import {
  getPersistenceMode,
  listApplicationMessages,
  listArtistApplications,
  markMessageRead,
  sendApplicationMessage,
  type ApplicationRecord,
  type ApplicationStatus,
  type MessageRecord,
} from "@/lib/kleio-live-data"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function statusLabel(status: ApplicationStatus, es: boolean) {
  const labels: Record<ApplicationStatus, string> = es
    ? { draft: "Borrador", submitted: "Enviada", in_review: "En revisión", needs_follow_up: "Requiere seguimiento", shortlisted: "Lista corta", finalist: "Finalista", accepted: "Aceptada", declined: "Rechazada", withdrawn: "Retirada" }
    : { draft: "Draft", submitted: "Submitted", in_review: "In review", needs_follow_up: "Needs follow-up", shortlisted: "Shortlisted", finalist: "Finalist", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn" }
  return labels[status]
}

function statusTone(status: ApplicationStatus) {
  if (["accepted", "shortlisted", "finalist"].includes(status)) return "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]"
  if (["needs_follow_up", "declined"].includes(status)) return "bg-[oklch(0.97_0.03_45)] text-[oklch(0.42_0.12_45)]"
  return "bg-[#F7F4FF] text-[#5B4B8A]"
}

export function ConnectedArtistApplicationsView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [reply, setReply] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()
  const session = getDemoSession()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const next = await listArtistApplications()
      setApplications(next)
      setSelectedId((current) => current && next.some((application) => application.id === current) ? current : next[0]?.id ?? "")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudieron cargar las postulaciones." : "Unable to load applications."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const selected = applications.find((application) => application.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) { setMessages([]); return }
    setSuccess("")
    setError("")
    void listApplicationMessages(selected.id)
      .then(async (nextMessages) => {
        setMessages(nextMessages)
        const unread = nextMessages.filter((message) => message.recipient_user_id === (session?.userId ?? "preview-artist") && !message.read_at)
        await Promise.all(unread.map((message) => markMessageRead(message.id)))
        if (unread.length) setMessages((current) => current.map((message) => unread.some((entry) => entry.id === message.id) ? { ...message, read_at: new Date().toISOString() } : message))
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load messages."))
  }, [selectedId])

  const metrics = useMemo(() => ({
    total: applications.length,
    active: applications.filter((application) => ["submitted", "in_review", "needs_follow_up", "shortlisted", "finalist"].includes(application.status)).length,
    drafts: applications.filter((application) => application.status === "draft").length,
    unread: applications.reduce((total, application) => total + (application.id === selectedId ? messages.filter((message) => message.recipient_user_id === (session?.userId ?? "preview-artist") && !message.read_at).length : 0), 0),
  }), [applications, messages, selectedId, session?.userId])

  async function sendReply() {
    if (!selected || !reply.trim()) return
    setSending(true)
    setError("")
    try {
      const message = await sendApplicationMessage({ application: selected, body: reply })
      setMessages((current) => [...current, message])
      setReply("")
      setSuccess(es ? "Respuesta guardada en la conversación." : "Reply saved to the conversation.")
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : (es ? "No se pudo enviar la respuesta." : "Unable to send the reply."))
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Seguimiento conectado" : "Connected application tracking"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Mis postulaciones" : "My applications"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Consulta borradores, estados institucionales y conversaciones vinculadas a cada convocatoria." : "View drafts, institution-updated statuses, and conversations linked to each call."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/artist-dashboard/calls/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Explorar convocatorias" : "Explore calls"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>

        <section className="grid gap-3 sm:grid-cols-3">{[[es ? "Total" : "Applications", metrics.total], [es ? "Activas" : "Active", metrics.active], [es ? "Borradores" : "Drafts", metrics.drafts]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl font-semibold">{value}</p></div>)}</section>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.12_150)]">{success}</p>}

        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando postulaciones…" : "Loading applications…"}</div> : applications.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="font-serif text-xl font-semibold">{es ? "Aún no hay postulaciones" : "No applications yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{es ? "Empieza una postulación desde una convocatoria abierta." : "Start an application from an open call."}</p><Link href="/artist-dashboard/calls/" className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Ver convocatorias" : "View calls"}</Link></div> : <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-2">{applications.map((application) => <button key={application.id} type="button" onClick={() => setSelectedId(application.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${application.id === selectedId ? "border-[#A997E8] bg-[#F7F4FF]" : "border-border bg-card hover:bg-accent/30"}`}><div className="flex items-start justify-between gap-2"><p className="font-serif text-lg font-semibold">{application.call?.title ?? (es ? "Convocatoria" : "Open call")}</p><span className={`rounded-full px-2 py-1 text-[0.6rem] font-semibold ${statusTone(application.status)}`}>{statusLabel(application.status, es)}</span></div><p className="mt-2 text-xs text-muted-foreground">{application.call?.institution_name}</p><p className="mt-3 text-[0.65rem] text-muted-foreground">{es ? "Actualizada" : "Updated"}: {new Date(application.updated_at).toLocaleString()}</p></button>)}</aside>

          {selected && <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{selected.call?.institution_name}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{selected.call?.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.call?.opportunity_type} · {selected.call?.deadline_at || "—"}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusTone(selected.status)}`}>{statusLabel(selected.status, es)}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><Info label={es ? "Guardada" : "Last saved"} value={new Date(selected.last_saved_at).toLocaleString()} /><Info label={es ? "Enviada" : "Submitted"} value={selected.submitted_at ? new Date(selected.submitted_at).toLocaleString() : (es ? "No enviada" : "Not submitted")} /><Info label={es ? "Obras" : "Selected works"} value={String(selected.selected_work_ids.length)} /></div>{selected.status === "draft" && <Link href={`/artist-dashboard/calls/?call=${encodeURIComponent(selected.call_id)}`} className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Continuar borrador" : "Continue draft"}</Link>}</section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Paquete enviado" : "Application package"}</h3><div className="mt-4 space-y-3">{Object.entries(selected.answers).map(([key, value]) => <div key={key} className="rounded-xl border border-border bg-background p-3"><div className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[oklch(0.45_0.12_150)]" /><div><p className="text-xs font-semibold">{selected.call?.custom_questions.find((question) => question.id === key)?.label ?? key}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{value || "—"}</p></div></div></div>)}</div></section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><h3 className="font-serif text-xl font-semibold">{es ? "Mensajes" : "Messages"}</h3></div><p className="mt-1 text-xs text-muted-foreground">{es ? "La institución puede ver esta conversación; sus notas internas no aparecen aquí." : "The institution can see this conversation; its internal review notes do not appear here."}</p><div className="mt-4 space-y-3">{messages.length ? messages.map((message) => <div key={message.id} className={`rounded-xl border p-3 ${message.sender_role === "artist" ? "ml-8 border-[#E7E1F7] bg-[#F7F4FF]" : "mr-8 border-border bg-background"}`}><p className="text-xs font-semibold">{message.sender_role === "artist" ? (es ? "Tú" : "You") : (es ? "Institución" : "Institution")}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p><p className="mt-2 text-[0.62rem] text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">{es ? "Aún no hay mensajes." : "No messages yet."}</p>}</div><label className="mt-4 block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Responder" : "Reply"}</span><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label><button type="button" disabled={sending || !reply.trim()} onClick={() => void sendReply()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />{sending ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar respuesta" : "Send reply")}</button></section>
          </div>}
        </div>}
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
}
