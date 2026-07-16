"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, FileText, MessageCircle, RefreshCw, Save, Send } from "lucide-react"
import {
  getPersistenceMode,
  listApplicationMessages,
  listInstitutionApplications,
  saveReview,
  sendApplicationMessage,
  type ApplicationRecord,
  type ApplicationStatus,
  type MessageRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import { listSelectedApplicationWorks } from "@/lib/kleio-review-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const STATUS_OPTIONS: ApplicationStatus[] = ["submitted", "in_review", "needs_follow_up", "shortlisted", "finalist", "accepted", "declined", "withdrawn"]

function statusLabel(status: ApplicationStatus, es: boolean) {
  const labels: Record<ApplicationStatus, string> = es
    ? { draft: "Borrador", submitted: "Enviada", in_review: "En revisión", needs_follow_up: "Requiere seguimiento", shortlisted: "Lista corta", finalist: "Finalista", accepted: "Aceptada", declined: "Rechazada", withdrawn: "Retirada" }
    : { draft: "Draft", submitted: "Submitted", in_review: "In review", needs_follow_up: "Needs follow-up", shortlisted: "Shortlisted", finalist: "Finalist", accepted: "Accepted", declined: "Declined", withdrawn: "Withdrawn" }
  return labels[status]
}

export function ConnectedInstitutionApplicationsView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [messages, setMessages] = useState<MessageRecord[]>([])
  const [score, setScore] = useState("")
  const [recommendation, setRecommendation] = useState("Discuss")
  const [reviewStatus, setReviewStatus] = useState("in_progress")
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("in_review")
  const [notes, setNotes] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const next = await listInstitutionApplications()
      const requestedCall = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("call") : null
      const filtered = requestedCall ? next.filter((application) => application.call_id === requestedCall) : next
      setApplications(filtered)
      setSelectedId((current) => current && filtered.some((application) => application.id === current) ? current : filtered[0]?.id ?? "")
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudieron cargar las postulaciones." : "Unable to load applications."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const selected = applications.find((application) => application.id === selectedId) ?? null

  useEffect(() => {
    if (!selected) {
      setWorks([])
      setMessages([])
      return
    }

    setScore(selected.review?.score == null ? "" : String(selected.review.score))
    setRecommendation(selected.review?.recommendation || "Discuss")
    setReviewStatus(selected.review?.review_status || "in_progress")
    setApplicationStatus(selected.status === "draft" ? "submitted" : selected.status)
    setNotes(selected.review?.internal_notes || "")
    setSuccess("")
    setError("")

    void Promise.all([listSelectedApplicationWorks(selected), listApplicationMessages(selected.id)])
      .then(([nextWorks, nextMessages]) => { setWorks(nextWorks); setMessages(nextMessages) })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Unable to load application details."))
  }, [selectedId])

  const metrics = useMemo(() => ({
    total: applications.length,
    inReview: applications.filter((application) => application.status === "in_review").length,
    shortlisted: applications.filter((application) => application.status === "shortlisted").length,
    needsFollowUp: applications.filter((application) => application.status === "needs_follow_up").length,
  }), [applications])

  async function persistReview() {
    if (!selected) return
    const numericScore = score.trim() ? Number(score) : null
    if (numericScore != null && (!Number.isFinite(numericScore) || numericScore < 0 || numericScore > 100)) {
      setError(es ? "La puntuación debe estar entre 0 y 100." : "Score must be between 0 and 100.")
      return
    }

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      await saveReview({
        applicationId: selected.id,
        score: numericScore,
        recommendation,
        internalNotes: notes,
        reviewStatus,
        applicationStatus,
      })
      setSuccess(es ? "Revisión, notas internas y estado guardados." : "Review, internal notes, and application status saved.")
      await load()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la revisión." : "Unable to save the review."))
    } finally {
      setSaving(false)
    }
  }

  async function sendMessage() {
    if (!selected || !messageBody.trim()) return
    setSending(true)
    setError("")
    try {
      const message = await sendApplicationMessage({ application: selected, body: messageBody })
      setMessages((current) => [...current, message])
      setMessageBody("")
      setSuccess(es ? "Mensaje guardado en la conversación de esta postulación." : "Message saved to this application's conversation.")
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : (es ? "No se pudo enviar el mensaje." : "Unable to send the message."))
    } finally {
      setSending(false)
    }
  }

  const profile = selected?.profile_snapshot as Record<string, unknown> | undefined

  return (
    <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Revisión institucional conectada" : "Connected institution review"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Postulantes y decisiones" : "Applicants and decisions"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Las notas internas permanecen separadas de la conversación visible para el artista." : "Internal notes remain separate from the artist-visible conversation."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/programs/connected/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Convocatorias" : "Open calls"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[[es ? "Total" : "Applicants", metrics.total], [es ? "En revisión" : "In review", metrics.inReview], [es ? "Lista corta" : "Shortlisted", metrics.shortlisted], [es ? "Seguimiento" : "Follow-up", metrics.needsFollowUp]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-border bg-card p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-2 font-serif text-2xl font-semibold">{value}</p></div>)}</section>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.12_150)]">{success}</p>}

        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando postulaciones…" : "Loading applications…"}</div> : applications.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="font-serif text-xl font-semibold">{es ? "Aún no hay postulaciones" : "No applications yet"}</h2><p className="mt-2 text-sm text-muted-foreground">{es ? "Las postulaciones enviadas aparecerán bajo su convocatoria correcta." : "Submitted applications will appear under their correct call."}</p></div> : <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-2">{applications.map((application) => <button key={application.id} type="button" onClick={() => setSelectedId(application.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${application.id === selectedId ? "border-[#A997E8] bg-[#F7F4FF]" : "border-border bg-card hover:bg-accent/30"}`}><div className="flex items-start justify-between gap-2"><p className="font-serif text-lg font-semibold">{application.artist_name}</p><span className="rounded-full bg-white px-2 py-1 text-[0.6rem] font-semibold text-[#5B4B8A]">{statusLabel(application.status, es)}</span></div><p className="mt-1 text-xs text-muted-foreground">{application.call?.title}</p><p className="mt-3 text-[0.65rem] text-muted-foreground">{es ? "Actualizada" : "Updated"}: {new Date(application.updated_at).toLocaleString()}</p></button>)}</aside>

          {selected && <div className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{selected.call?.title}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{selected.artist_name}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.artist_email}</p></div><span className="rounded-full bg-[#F7F4FF] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]">{statusLabel(selected.status, es)}</span></div><div className="mt-5 grid gap-4 lg:grid-cols-2"><div><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{es ? "Pasaporte reutilizable" : "Reusable Creative Passport"}</h3><dl className="mt-3 space-y-3 text-sm"><ProfileRow label={es ? "Nombre profesional" : "Professional name"} value={String(profile?.professional_name ?? selected.artist_name)} /><ProfileRow label={es ? "Ubicación" : "Location"} value={String(profile?.location ?? "—")} /><ProfileRow label={es ? "Bio" : "Biography"} value={String(profile?.bio ?? "—")} /><ProfileRow label={es ? "Declaración" : "Statement"} value={String(profile?.artist_statement ?? "—")} /></dl></div><div><h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{es ? "Respuestas específicas" : "Application-specific answers"}</h3><div className="mt-3 space-y-3">{Object.entries(selected.answers).map(([key, value]) => <div key={key} className="rounded-xl border border-border bg-background p-3"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{selected.call?.custom_questions.find((question) => question.id === key)?.label ?? key}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{value || "—"}</p></div>)}</div></div></div></section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Obras seleccionadas" : "Selected portfolio works"}</h3><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{works.length ? works.map((work) => <article key={work.id} className="rounded-xl border border-border bg-background p-3"><div className="grid aspect-[4/3] place-items-center rounded-lg bg-muted"><FileText className="size-7 text-muted-foreground" /></div><p className="mt-3 text-sm font-semibold">{work.title}</p><p className="mt-1 text-xs text-muted-foreground">{work.year} · {work.medium}</p><p className="mt-2 text-xs leading-relaxed text-muted-foreground">{work.description}</p></article>) : <p className="text-sm text-muted-foreground">{es ? "No hay obras seleccionadas." : "No selected works."}</p>}</div></section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Revisión interna" : "Internal review"}</h3><p className="mt-1 text-xs text-muted-foreground">{es ? "Esta sección no es visible para el artista." : "This section is not visible to the artist."}</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Puntuación (0–100)" : "Score (0–100)"}</span><input type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /></label><label><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Recomendación" : "Recommendation"}</span><select value={recommendation} onChange={(event) => setRecommendation(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"><option>Advance</option><option>Discuss</option><option>Decline</option></select></label><label><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Estado de revisión" : "Review status"}</span><select value={reviewStatus} onChange={(event) => setReviewStatus(event.target.value)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none"><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="complete">Complete</option><option value="needs_discussion">Needs discussion</option></select></label><label><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Estado de postulación" : "Application status"}</span><select value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value as ApplicationStatus)} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none">{STATUS_OPTIONS.map((status) => <option key={status} value={status}>{statusLabel(status, es)}</option>)}</select></label></div><label className="mt-4 block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Notas internas" : "Internal notes"}</span><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={6} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label><button type="button" disabled={saving} onClick={() => void persistReview()} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Save className="size-4" />{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar revisión" : "Save review")}</button></section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center gap-2"><MessageCircle className="size-5 text-primary" /><h3 className="font-serif text-xl font-semibold">{es ? "Conversación con artista" : "Artist conversation"}</h3></div><div className="mt-4 space-y-3">{messages.length ? messages.map((message) => <div key={message.id} className={`rounded-xl border p-3 ${message.sender_role === "institution" ? "ml-8 border-[#E7E1F7] bg-[#F7F4FF]" : "mr-8 border-border bg-background"}`}><p className="text-xs font-semibold">{message.sender_role === "institution" ? (es ? "Institución" : "Institution") : (es ? "Artista" : "Artist")}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p><p className="mt-2 text-[0.62rem] text-muted-foreground">{new Date(message.created_at).toLocaleString()}</p></div>) : <p className="text-sm text-muted-foreground">{es ? "Aún no hay mensajes." : "No messages yet."}</p>}</div><label className="mt-4 block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Mensaje al postulante" : "Message applicant"}</span><textarea value={messageBody} onChange={(event) => setMessageBody(event.target.value)} rows={4} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label><button type="button" disabled={sending || !messageBody.trim()} onClick={() => void sendMessage()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Send className="size-4" />{sending ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar mensaje" : "Send message")}</button><p className="mt-2 text-[0.65rem] text-muted-foreground">{es ? "Este flujo guarda mensajes dentro de KLEIO; no afirma envío de correo externo." : "This flow stores messages inside KLEIO; it does not claim external email delivery."}</p></section>
          </div>}
        </div>}
      </div>
    </main>
  )
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap leading-relaxed">{value}</dd></div>
}
