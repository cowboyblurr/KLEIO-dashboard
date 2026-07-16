"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Save, Send } from "lucide-react"
import { getPersistenceMode, saveOpenCall, type OpenCallStatus } from "@/lib/kleio-live-data"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const initialForm = {
  title: "",
  opportunityType: "Residency",
  summary: "",
  description: "",
  location: "",
  participationFormat: "In person",
  opensAt: "",
  deadlineAt: "",
  notificationDate: "",
  programStartDate: "",
  programEndDate: "",
  geography: "International",
  careerStage: "All career stages",
  eligibilityNotes: "",
  requiredMaterials: "Artist bio\nArtist statement\nCV\nPortfolio\nProject proposal",
  customQuestions: "Describe the project you would develop.\nWhy is this opportunity relevant to your practice now?",
  reviewStages: "Intake\nReview\nShortlist\nFinal decision",
  reviewCriteria: "Conceptual strength\nProgram fit\nFeasibility",
  ratingScale: "5",
}

type SavedState = { id: string; title: string; status: OpenCallStatus } | null

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label>
}

function TextArea({ label, value, onChange, rows = 4, required = false, hint }: { label: string; value: string; onChange: (value: string) => void; rows?: number; required?: boolean; hint?: string }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} required={required} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />{hint && <span className="mt-1 block text-[0.65rem] text-muted-foreground">{hint}</span>}</label>
}

function splitLines(value: string) {
  return value.split(/\n|,/).map((entry) => entry.trim()).filter(Boolean)
}

export function ConnectedOpenCallPageView() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState<SavedState>(null)
  const mode = getPersistenceMode()

  const requiredMaterials = useMemo(() => splitLines(form.requiredMaterials), [form.requiredMaterials])
  const questions = useMemo(() => splitLines(form.customQuestions), [form.customQuestions])

  function update(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validate(status: OpenCallStatus) {
    if (!form.title.trim() || !form.summary.trim() || !form.description.trim()) return es ? "Completa título, resumen y descripción." : "Complete the title, summary, and description."
    if (status === "open" && (!form.opensAt || !form.deadlineAt)) return es ? "Una convocatoria abierta necesita fecha de apertura y cierre." : "An open call needs opening and deadline dates."
    if (form.opensAt && form.deadlineAt && form.deadlineAt < form.opensAt) return es ? "La fecha límite no puede ser anterior a la apertura." : "The deadline cannot be before the opening date."
    if (form.programStartDate && form.programEndDate && form.programEndDate < form.programStartDate) return es ? "La fecha final del programa no puede ser anterior al inicio." : "The program end date cannot be before its start date."
    if (!requiredMaterials.length) return es ? "Añade al menos un material requerido." : "Add at least one required material."
    if (!questions.length) return es ? "Añade al menos una pregunta de postulación." : "Add at least one application question."
    return ""
  }

  async function save(status: OpenCallStatus) {
    const validation = validate(status)
    if (validation) { setError(validation); return }
    setError("")
    setIsSaving(true)
    try {
      const record = await saveOpenCall({
        id: saved?.id,
        title: form.title.trim(),
        opportunity_type: form.opportunityType.trim(),
        summary: form.summary.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        participation_format: form.participationFormat.trim(),
        opens_at: form.opensAt || null,
        deadline_at: form.deadlineAt || null,
        notification_date: form.notificationDate || null,
        program_start_date: form.programStartDate || null,
        program_end_date: form.programEndDate || null,
        eligibility: { geography: form.geography.trim(), careerStage: form.careerStage.trim(), notes: form.eligibilityNotes.trim() },
        required_materials: requiredMaterials,
        review_configuration: {
          stages: splitLines(form.reviewStages),
          criteria: splitLines(form.reviewCriteria),
          ratingScale: Math.max(1, Math.min(10, Number(form.ratingScale) || 5)),
          recommendationOptions: ["Advance", "Discuss", "Decline"],
        },
        custom_questions: questions.map((label, index) => ({ id: `question-${index + 1}`, label, required: true, type: "long" })),
        status,
      })
      setSaved({ id: record.id, title: record.title, status: record.status })
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la convocatoria." : "Unable to save the open call."))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Flujo institucional conectado" : "Connected institution workflow"}</p><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{es ? "Crear convocatoria" : "Create open call"}</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{es ? "Guarda un borrador o publica una convocatoria vinculada a la institución activa." : "Save a draft or publish an open call linked to the active institution."}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${mode.mode === "supabase" ? "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}>{mode.label}</span></header>

        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-xs leading-relaxed text-[#6F6882]">{mode.detail}</div>

        {saved && <section className="rounded-2xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">{saved.status === "open" ? (es ? "Convocatoria publicada" : "Open call published") : (es ? "Borrador guardado" : "Draft saved")}: {saved.title}</p><p className="mt-1 text-xs">{saved.status === "open" ? (es ? "Ahora puede aparecer para artistas y recibir postulaciones conectadas." : "It can now appear for artists and receive connected applications.") : (es ? "Puedes continuar editando este mismo registro." : "You can continue editing this same record.")}</p><div className="mt-3 flex flex-wrap gap-2"><Link href="/programs/connected/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground">{es ? "Ver convocatorias" : "View calls"}</Link><Link href="/applications/connected/" className="inline-flex h-9 items-center rounded-xl border border-[oklch(0.85_0.07_150)] bg-white px-3 text-xs font-semibold">{es ? "Ver postulantes" : "View applicants"}</Link></div></div></div></section>}

        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Información básica" : "Basic information"}</h2><Field label={es ? "Título" : "Call title"} value={form.title} onChange={(value) => update("title", value)} required /><Field label={es ? "Tipo de oportunidad" : "Opportunity type"} value={form.opportunityType} onChange={(value) => update("opportunityType", value)} /><TextArea label={es ? "Resumen" : "Short summary"} value={form.summary} onChange={(value) => update("summary", value)} required rows={3} /><TextArea label={es ? "Descripción completa" : "Full description"} value={form.description} onChange={(value) => update("description", value)} required rows={7} /><Field label={es ? "Ubicación" : "Location"} value={form.location} onChange={(value) => update("location", value)} /><Field label={es ? "Formato de participación" : "Participation format"} value={form.participationFormat} onChange={(value) => update("participationFormat", value)} /></section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Fechas" : "Timeline"}</h2><div className="grid gap-3 sm:grid-cols-2"><Field type="date" label={es ? "Apertura" : "Opens"} value={form.opensAt} onChange={(value) => update("opensAt", value)} /><Field type="date" label={es ? "Fecha límite" : "Deadline"} value={form.deadlineAt} onChange={(value) => update("deadlineAt", value)} /><Field type="date" label={es ? "Notificación" : "Notification date"} value={form.notificationDate} onChange={(value) => update("notificationDate", value)} /><span /><Field type="date" label={es ? "Inicio del programa" : "Program start"} value={form.programStartDate} onChange={(value) => update("programStartDate", value)} /><Field type="date" label={es ? "Fin del programa" : "Program end"} value={form.programEndDate} onChange={(value) => update("programEndDate", value)} /></div><h2 className="pt-3 font-serif text-xl font-semibold">{es ? "Elegibilidad" : "Eligibility"}</h2><Field label={es ? "Geografía" : "Geographic eligibility"} value={form.geography} onChange={(value) => update("geography", value)} /><Field label={es ? "Etapa profesional" : "Career stage"} value={form.careerStage} onChange={(value) => update("careerStage", value)} /><TextArea label={es ? "Notas adicionales" : "Additional eligibility notes"} value={form.eligibilityNotes} onChange={(value) => update("eligibilityNotes", value)} rows={4} /></section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Materiales y preguntas" : "Materials and questions"}</h2><TextArea label={es ? "Materiales requeridos" : "Required materials"} value={form.requiredMaterials} onChange={(value) => update("requiredMaterials", value)} rows={7} hint={es ? "Uno por línea." : "One per line."} /><TextArea label={es ? "Preguntas de postulación" : "Application questions"} value={form.customQuestions} onChange={(value) => update("customQuestions", value)} rows={7} hint={es ? "Una por línea; se guardan como obligatorias para este test-run." : "One per line; saved as required for this test run."} /></section>

          <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Configuración de revisión" : "Review configuration"}</h2><TextArea label={es ? "Etapas" : "Review stages"} value={form.reviewStages} onChange={(value) => update("reviewStages", value)} rows={5} hint={es ? "Una por línea." : "One per line."} /><TextArea label={es ? "Criterios" : "Scoring criteria"} value={form.reviewCriteria} onChange={(value) => update("reviewCriteria", value)} rows={5} hint={es ? "Una por línea." : "One per line."} /><Field type="number" label={es ? "Escala máxima" : "Maximum rating"} value={form.ratingScale} onChange={(value) => update("ratingScale", value)} /></section>
        </div>

        {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        <div className="flex flex-wrap gap-3"><button type="button" disabled={isSaving} onClick={() => void save("draft")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold transition-colors hover:bg-accent/50 disabled:opacity-50"><Save className="size-4" />{isSaving ? (es ? "Guardando…" : "Saving…") : (es ? "Guardar borrador" : "Save draft")}</button><button type="button" disabled={isSaving} onClick={() => void save("open")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"><Send className="size-4" />{isSaving ? (es ? "Publicando…" : "Publishing…") : (es ? "Publicar convocatoria" : "Publish open call")}</button><Link href="/programs/connected/" className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-muted-foreground hover:text-foreground">{es ? "Cancelar" : "Cancel"}</Link></div>
      </div>
    </main>
  )
}
