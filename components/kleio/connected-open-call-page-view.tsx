"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Save, Send } from "lucide-react"
import { EntityAutocomplete } from "@/components/kleio/forms/entity-autocomplete"
import { ControlledMultiSelect, ControlledSelect } from "@/components/kleio/forms/controlled-fields"
import { getPersistenceMode, saveOpenCall, type OpenCallStatus } from "@/lib/kleio-live-data"
import { saveOpenCallLocationData } from "@/lib/kleio-normalized-data"
import { CAREER_STAGES, GEOGRAPHIC_SCOPES, OPPORTUNITY_TYPES, PARTICIPATION_FORMATS, REQUIRED_MATERIALS } from "@/lib/kleio-form-options"
import type { NormalizedEntityValue } from "@/lib/kleio-entity-search"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const initialForm = { title: "", opportunityType: "residency", summary: "", description: "", participationFormat: "in_person", opensAt: "", deadlineAt: "", notificationDate: "", programStartDate: "", programEndDate: "", geography: "international", careerStage: "all", eligibilityNotes: "", customQuestions: "Describe the project you would develop.\nWhy is this opportunity relevant to your practice now?", reviewCriteria: "Conceptual strength\nProgram fit\nFeasibility", ratingScale: "5" }
type SavedState = { id: string; title: string; status: OpenCallStatus } | null

function Field({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" /></label> }
function TextArea({ label, value, onChange, rows = 4, required = false, hint }: { label: string; value: string; onChange: (value: string) => void; rows?: number; required?: boolean; hint?: string }) { return <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={rows} required={required} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />{hint && <span className="mt-1 block text-[0.65rem] text-muted-foreground">{hint}</span>}</label> }
function splitLines(value: string) { return value.split(/\n|,/).map((entry) => entry.trim()).filter(Boolean) }

export function ConnectedOpenCallPageView() {
  const { locale } = useKleioLocale(); const es = locale === "es"
  const [form, setForm] = useState(initialForm)
  const [location, setLocation] = useState<NormalizedEntityValue | null>(null)
  const [requiredMaterials, setRequiredMaterials] = useState<string[]>(["artist_bio", "artist_statement", "cv", "portfolio", "project_proposal"])
  const [reviewStages, setReviewStages] = useState<string[]>(["intake", "review", "shortlist", "final_decision"])
  const [error, setError] = useState(""); const [isSaving, setIsSaving] = useState(false); const [saved, setSaved] = useState<SavedState>(null)
  const mode = getPersistenceMode()
  const questions = useMemo(() => splitLines(form.customQuestions), [form.customQuestions])
  const update = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  function validate(status: OpenCallStatus) {
    if (!form.title.trim() || !form.summary.trim() || !form.description.trim()) return es ? "Completa título, resumen y descripción." : "Complete the title, summary, and description."
    if (form.participationFormat !== "online" && !location) return es ? "Selecciona o ingresa una ubicación." : "Select or manually enter a location."
    if (status === "open" && (!form.opensAt || !form.deadlineAt)) return es ? "Una convocatoria abierta necesita fechas de apertura y cierre." : "An open call needs opening and deadline dates."
    if (form.opensAt && form.deadlineAt && form.deadlineAt < form.opensAt) return es ? "La fecha límite no puede ser anterior a la apertura." : "The deadline cannot be before the opening date."
    if (!requiredMaterials.length || !questions.length) return es ? "Añade materiales y al menos una pregunta." : "Add required materials and at least one question."
    return ""
  }

  async function save(status: OpenCallStatus) {
    const message = validate(status); if (message) return setError(message)
    setError(""); setIsSaving(true)
    try {
      const record = await saveOpenCall({
        id: saved?.id, title: form.title.trim(), opportunity_type: form.opportunityType, summary: form.summary.trim(), description: form.description.trim(),
        location: form.participationFormat === "online" ? "Online" : location?.formattedAddress || location?.displayName || "",
        participation_format: form.participationFormat, opens_at: form.opensAt || null, deadline_at: form.deadlineAt || null, notification_date: form.notificationDate || null, program_start_date: form.programStartDate || null, program_end_date: form.programEndDate || null,
        eligibility: { geography: form.geography, careerStage: form.careerStage, notes: form.eligibilityNotes.trim(), location: form.geography === "international" || form.geography === "remote" ? null : location },
        required_materials: requiredMaterials,
        review_configuration: { stages: reviewStages, criteria: splitLines(form.reviewCriteria), ratingScale: Math.max(1, Math.min(10, Number(form.ratingScale) || 5)), recommendationOptions: ["advance", "discuss", "decline", "abstain"] },
        custom_questions: questions.map((label, index) => ({ id: `question-${index + 1}`, label, required: true, type: "long" })), status,
      })
      await saveOpenCallLocationData(record.id, form.participationFormat === "online" ? null : location)
      setSaved({ id: record.id, title: record.title, status: record.status })
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : (es ? "No se pudo guardar la convocatoria." : "Unable to save the open call.")) }
    finally { setIsSaving(false) }
  }

  const stageOptions = [{ value: "intake", label: "Intake" }, { value: "review", label: "Review" }, { value: "shortlist", label: "Shortlist" }, { value: "final_decision", label: "Final decision" }]
  return <main className="min-h-0 overflow-auto px-5 py-6 xl:px-7 xl:py-7"><div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{es ? "Flujo institucional conectado" : "Connected institution workflow"}</p><h1 className="mt-2 font-serif text-3xl font-semibold">{es ? "Crear convocatoria" : "Create open call"}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{es ? "Los valores controlados mantienen consistencia para búsqueda, revisión y reportes." : "Controlled values keep search, review, and reporting consistent."}</p></div><span className="rounded-full bg-[#F7F4FF] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]">{mode.label}</span></header>
    {saved && <section className="rounded-2xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><div className="flex gap-3"><CheckCircle2 className="size-5" /><div><p className="font-semibold">{saved.status === "open" ? (es ? "Convocatoria publicada" : "Open call published") : (es ? "Borrador guardado" : "Draft saved")}: {saved.title}</p><div className="mt-3 flex gap-2"><Link href="/programs/connected/" className="rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">{es ? "Ver convocatorias" : "View calls"}</Link></div></div></div></section>}
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Información básica" : "Basic information"}</h2><Field label={es ? "Título" : "Call title"} value={form.title} onChange={(value) => update("title", value)} required /><ControlledSelect label={es ? "Tipo de oportunidad" : "Opportunity type"} value={form.opportunityType} onChange={(value) => update("opportunityType", value)} options={OPPORTUNITY_TYPES} locale={es ? "es" : "en"} required /><TextArea label={es ? "Resumen" : "Short summary"} value={form.summary} onChange={(value) => update("summary", value)} required rows={3} /><TextArea label={es ? "Descripción" : "Full description"} value={form.description} onChange={(value) => update("description", value)} required rows={7} /><ControlledSelect label={es ? "Formato" : "Participation format"} value={form.participationFormat} onChange={(value) => update("participationFormat", value)} options={PARTICIPATION_FORMATS} locale={es ? "es" : "en"} required />{form.participationFormat !== "online" && <EntityAutocomplete label={es ? "Ubicación o sede" : "Program location or venue"} purpose="venue" value={location} onChange={setLocation} locale={es ? "es" : "en"} required />}</section>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Fechas y elegibilidad" : "Timeline and eligibility"}</h2><div className="grid gap-3 sm:grid-cols-2"><Field type="date" label={es ? "Apertura" : "Opens"} value={form.opensAt} onChange={(value) => update("opensAt", value)} /><Field type="date" label={es ? "Fecha límite" : "Deadline"} value={form.deadlineAt} onChange={(value) => update("deadlineAt", value)} /><Field type="date" label={es ? "Notificación" : "Notification"} value={form.notificationDate} onChange={(value) => update("notificationDate", value)} /><span /><Field type="date" label={es ? "Inicio" : "Program start"} value={form.programStartDate} onChange={(value) => update("programStartDate", value)} /><Field type="date" label={es ? "Fin" : "Program end"} value={form.programEndDate} onChange={(value) => update("programEndDate", value)} /></div><ControlledSelect label={es ? "Alcance geográfico" : "Geographic eligibility"} value={form.geography} onChange={(value) => update("geography", value)} options={GEOGRAPHIC_SCOPES} locale={es ? "es" : "en"} /><ControlledSelect label={es ? "Etapa profesional" : "Career stage"} value={form.careerStage} onChange={(value) => update("careerStage", value)} options={CAREER_STAGES} locale={es ? "es" : "en"} /><TextArea label={es ? "Notas adicionales" : "Additional eligibility notes"} value={form.eligibilityNotes} onChange={(value) => update("eligibilityNotes", value)} /></section>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Materiales y preguntas" : "Materials and questions"}</h2><ControlledMultiSelect label={es ? "Materiales requeridos" : "Required materials"} values={requiredMaterials} onChange={setRequiredMaterials} options={REQUIRED_MATERIALS} locale={es ? "es" : "en"} required /><TextArea label={es ? "Preguntas" : "Application questions"} value={form.customQuestions} onChange={(value) => update("customQuestions", value)} rows={7} hint={es ? "Una por línea." : "One per line."} /></section>
      <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-serif text-xl font-semibold">{es ? "Configuración de revisión" : "Review configuration"}</h2><ControlledMultiSelect label={es ? "Etapas" : "Review stages"} values={reviewStages} onChange={setReviewStages} options={stageOptions} locale={es ? "es" : "en"} allowOther={false} /><TextArea label={es ? "Criterios" : "Scoring criteria"} value={form.reviewCriteria} onChange={(value) => update("reviewCriteria", value)} rows={5} hint={es ? "Uno por línea." : "One per line."} /><Field type="number" label={es ? "Escala máxima" : "Maximum rating"} value={form.ratingScale} onChange={(value) => update("ratingScale", value)} /></section>
    </div>
    {error && <p className="rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
    <div className="flex flex-wrap gap-3"><button type="button" disabled={isSaving} onClick={() => void save("draft")} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 text-sm font-semibold disabled:opacity-50"><Save className="size-4" />{es ? "Guardar borrador" : "Save draft"}</button><button type="button" disabled={isSaving} onClick={() => void save("open")} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"><Send className="size-4" />{es ? "Publicar" : "Publish open call"}</button><Link href="/programs/connected/" className="inline-flex h-11 items-center px-4 text-sm text-muted-foreground">{es ? "Cancelar" : "Cancel"}</Link></div>
  </div></main>
}
