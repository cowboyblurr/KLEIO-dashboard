"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, FileText, RefreshCw, Save, Send, XCircle } from "lucide-react"
import {
  getPersistenceMode,
  listArtistApplications,
  listPortfolioWorks,
  listPublishedCalls,
  saveApplication,
  type ApplicationRecord,
  type OpenCallRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function materialReady(material: string, works: PortfolioWorkRecord[]) {
  const normalized = material.toLowerCase()
  if (normalized.includes("portfolio") || normalized.includes("work")) return works.length >= 3
  if (normalized.includes("bio") || normalized.includes("statement") || normalized.includes("cv")) return true
  return false
}

export function ConnectedArtistCallsView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [calls, setCalls] = useState<OpenCallRecord[]>([])
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [applications, setApplications] = useState<ApplicationRecord[]>([])
  const [selectedCallId, setSelectedCallId] = useState("")
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const mode = getPersistenceMode()

  async function load() {
    setLoading(true)
    setError("")
    try {
      const [nextCalls, nextWorks, nextApplications] = await Promise.all([listPublishedCalls(), listPortfolioWorks(), listArtistApplications()])
      setCalls(nextCalls)
      setWorks(nextWorks)
      setApplications(nextApplications)
      const requested = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("call") : null
      const firstId = requested && nextCalls.some((call) => call.id === requested) ? requested : nextCalls[0]?.id ?? ""
      setSelectedCallId((current) => current && nextCalls.some((call) => call.id === current) ? current : firstId)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : (es ? "No se pudieron cargar las convocatorias." : "Unable to load open calls."))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const selectedCall = calls.find((call) => call.id === selectedCallId) ?? null
  const existingApplication = applications.find((application) => application.call_id === selectedCallId) ?? null

  useEffect(() => {
    if (!selectedCall) return
    const existing = applications.find((application) => application.call_id === selectedCall.id)
    setSelectedWorkIds(existing?.selected_work_ids ?? works.slice(0, 3).map((work) => work.id))
    setAnswers(existing?.answers ?? Object.fromEntries(selectedCall.custom_questions.map((question) => [question.id, ""])))
    setSuccess("")
    setError("")
  }, [selectedCallId, applications.length, works.length])

  const missingMaterials = useMemo(() => selectedCall?.required_materials.filter((material) => !materialReady(material, works)) ?? [], [selectedCall, works])
  const unansweredRequired = useMemo(() => selectedCall?.custom_questions.filter((question) => question.required && !answers[question.id]?.trim()) ?? [], [selectedCall, answers])

  function toggleWork(id: string) {
    setSelectedWorkIds((current) => current.includes(id) ? current.filter((workId) => workId !== id) : [...current, id])
  }

  async function persist(status: "draft" | "submitted") {
    if (!selectedCall) return
    if (status === "submitted") {
      if (selectedWorkIds.length === 0) { setError(es ? "Selecciona al menos una obra." : "Select at least one portfolio work."); return }
      if (unansweredRequired.length) { setError(es ? "Completa todas las preguntas obligatorias." : "Complete every required question."); return }
    }

    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const application = await saveApplication({ callId: selectedCall.id, status, answers, selectedWorkIds })
      setApplications((current) => [...current.filter((entry) => entry.id !== application.id), application])
      setSuccess(status === "submitted" ? (es ? "Postulación enviada y vinculada a esta convocatoria." : "Application submitted and linked to this call.") : (es ? "Borrador guardado. Puedes volver y continuar." : "Draft saved. You can return and continue."))
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la postulación." : "Unable to save the application."))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Convocatorias conectadas" : "Connected open calls"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Descubrir y postular" : "Discover and apply"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Selecciona una convocatoria publicada, revisa los materiales del Pasaporte y guarda o envía una postulación vinculada." : "Select a published call, review Passport materials, and save or submit a linked application."}</p></div><div className="flex gap-2"><button type="button" onClick={() => void load()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold hover:bg-accent/50"><RefreshCw className="size-4" />{es ? "Actualizar" : "Refresh"}</button><Link href="/artist-dashboard/applications/connected/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">{es ? "Mis postulaciones" : "My applications"}</Link></div></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {success && <p className="rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] px-4 py-3 text-sm font-medium text-[oklch(0.4_0.12_150)]">{success}</p>}

        {loading ? <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{es ? "Cargando convocatorias…" : "Loading calls…"}</div> : calls.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center"><h2 className="font-serif text-xl font-semibold">{es ? "No hay convocatorias abiertas" : "No open calls"}</h2><p className="mt-2 text-sm text-muted-foreground">{es ? "Las convocatorias publicadas aparecerán aquí." : "Published calls will appear here."}</p></div> : <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="space-y-3">
            {calls.map((call) => {
              const application = applications.find((entry) => entry.call_id === call.id)
              const active = call.id === selectedCallId
              return <button key={call.id} type="button" onClick={() => setSelectedCallId(call.id)} className={`w-full rounded-2xl border p-4 text-left transition-colors ${active ? "border-[#A997E8] bg-[#F7F4FF]" : "border-border bg-card hover:bg-accent/30"}`}><div className="flex items-start justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{call.opportunity_type}</p>{application && <span className="rounded-full bg-white px-2 py-1 text-[0.6rem] font-semibold text-[#5B4B8A]">{application.status}</span>}</div><h2 className="mt-2 font-serif text-lg font-semibold">{call.title}</h2><p className="mt-1 text-xs text-muted-foreground">{call.institution_name || (es ? "Institución participante" : "Participating institution")}</p><p className="mt-3 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{call.summary}</p><p className="mt-3 text-xs font-semibold text-foreground">{es ? "Fecha límite" : "Deadline"}: {call.deadline_at || "—"}</p></button>
            })}
          </aside>

          {selectedCall && <section className="space-y-5">
            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{selectedCall.opportunity_type}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{selectedCall.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selectedCall.institution_name} · {selectedCall.location} · {selectedCall.participation_format}</p></div>{existingApplication && <span className="rounded-full bg-[#F7F4FF] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]">{es ? "Estado" : "Status"}: {existingApplication.status}</span>}</div><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{selectedCall.description}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info label={es ? "Apertura" : "Opens"} value={selectedCall.opens_at || "—"} /><Info label={es ? "Fecha límite" : "Deadline"} value={selectedCall.deadline_at || "—"} /><Info label={es ? "Notificación" : "Notification"} value={selectedCall.notification_date || "—"} /></div></article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Revisión de materiales" : "Materials check"}</h3><p className="mt-1 text-sm text-muted-foreground">{es ? "KLEIO compara los requisitos con los registros disponibles en el Pasaporte." : "KLEIO compares requirements with available Passport records."}</p><div className="mt-4 grid gap-2 sm:grid-cols-2">{selectedCall.required_materials.map((material) => { const ready = materialReady(material, works); return <div key={material} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm">{ready ? <CheckCircle2 className="size-4 text-[oklch(0.45_0.12_150)]" /> : <XCircle className="size-4 text-[oklch(0.5_0.12_45)]" />}<span>{material}</span></div> })}</div>{missingMaterials.length > 0 && <p className="mt-3 text-xs text-[oklch(0.45_0.12_45)]">{es ? "Requiere atención" : "Needs attention"}: {missingMaterials.join(", ")}</p>}</article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Seleccionar obras" : "Select portfolio works"}</h3><p className="mt-1 text-sm text-muted-foreground">{es ? "Estas obras quedan vinculadas a esta postulación específica." : "These works remain linked to this specific application."}</p><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{works.map((work) => { const selected = selectedWorkIds.includes(work.id); return <button key={work.id} type="button" onClick={() => toggleWork(work.id)} className={`rounded-xl border p-3 text-left transition-colors ${selected ? "border-[#A997E8] bg-[#F7F4FF]" : "border-border bg-background hover:bg-accent/30"}`}><div className="mb-3 grid aspect-[4/3] place-items-center rounded-lg bg-muted"><FileText className="size-7 text-muted-foreground" /></div><p className="text-sm font-semibold">{work.title}</p><p className="mt-1 text-xs text-muted-foreground">{work.year} · {work.medium}</p><p className="mt-2 text-[0.65rem] font-semibold text-[#5B4B8A]">{selected ? (es ? "Seleccionada" : "Selected") : (es ? "Seleccionar" : "Select")}</p></button> })}</div></article>

            <article className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h3 className="font-serif text-xl font-semibold">{es ? "Preguntas de postulación" : "Application questions"}</h3><div className="mt-4 space-y-4">{selectedCall.custom_questions.map((question) => <label key={question.id} className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{question.label}{question.required ? " *" : ""}</span><textarea value={answers[question.id] ?? ""} onChange={(event) => setAnswers((current) => ({ ...current, [question.id]: event.target.value }))} rows={question.type === "long" ? 6 : 2} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label>)}</div></article>

            <div className="flex flex-wrap gap-3"><button type="button" disabled={saving} onClick={() => void persist("draft")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold hover:bg-accent/50 disabled:opacity-50"><Save className="size-4" />{saving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar borrador" : "Save draft")}</button><button type="button" disabled={saving} onClick={() => void persist("submitted")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"><Send className="size-4" />{saving ? (es ? "Enviando…" : "Submitting…") : (es ? "Revisar y enviar" : "Review and submit")}</button></div>
          </section>}
        </div>}
      </div>
    </main>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>
}
