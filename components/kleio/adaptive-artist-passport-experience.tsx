"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, FileText, FileUp, FormInput, Loader2, Save, Sparkles } from "lucide-react"
import { LiveArtistPassportEditor } from "@/components/kleio/live-artist-passport-editor"
import { DisciplineMultiSelect, TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { VoiceDictationControl } from "@/components/kleio/forms/voice-dictation-control"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import {
  loadArtistPassport,
  saveArtistPassport,
  uploadArtistAsset,
  type ArtistPassportRecord,
} from "@/lib/kleio-live-data"

type PassportMode = "guided" | "full" | "import"

const MODE_KEY = "kleio:artist:passport-mode:v1"
const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const input = "h-11 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

const blankPassport: ArtistPassportRecord = {
  user_id: "",
  professional_name: "",
  location: "",
  bio: "",
  artist_statement: "",
  practice_description: "",
  website_url: "",
  instagram_url: "",
  disciplines: [],
  mediums: [],
  languages: [],
  education: "",
  exhibition_history: "",
  awards: "",
  cv_file_path: null,
  profile_completion: 0,
}

const suggestedMediums = [
  "Painting",
  "Photography",
  "Clay",
  "Ceramics",
  "Film",
  "Video",
  "Sound",
  "Textile",
  "Installation",
  "Performance",
  "Digital media",
  "Mixed media",
]

function modeFromStorage(): PassportMode {
  if (typeof window === "undefined") return "full"
  const stored = window.localStorage.getItem(MODE_KEY)
  return stored === "guided" || stored === "import" || stored === "full" ? stored : "full"
}

function ModeButton({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean
  icon: typeof Sparkles
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-[190px] flex-1 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#A997E8] bg-[#F7F4FF]" : "border-[#E7E1F7] bg-white hover:border-[#CFC3ED]"}`}
    >
      <span className="flex items-center gap-2 text-sm font-semibold text-[#292631]"><Icon className="size-4 text-[#6A5896]" />{title}{active && <Check className="ml-auto size-4 text-emerald-600" />}</span>
      <span className="mt-1 block text-xs leading-5 text-[#746E80]">{description}</span>
    </button>
  )
}

function savePayload(record: ArtistPassportRecord) {
  return saveArtistPassport({
    ...record,
    disciplines_text: record.disciplines.join(", "),
    mediums_text: record.mediums.join(", "),
    languages_text: record.languages.join(", "),
  })
}

export function AdaptiveArtistPassportExperience() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [mode, setMode] = useState<PassportMode>("full")
  const [record, setRecord] = useState(blankPassport)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [step, setStep] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [cvName, setCvName] = useState("")

  useEffect(() => {
    setMode(modeFromStorage())
    let active = true
    void loadArtistPassport()
      .then((profile) => {
        if (active && profile) setRecord(profile)
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load the Creative Passport.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  function chooseMode(nextMode: PassportMode) {
    setMode(nextMode)
    window.localStorage.setItem(MODE_KEY, nextMode)
    setStatus("")
    setError("")
  }

  function update<Key extends keyof ArtistPassportRecord>(key: Key, value: ArtistPassportRecord[Key]) {
    setRecord((current) => ({ ...current, [key]: value }))
    setStatus("")
  }

  async function persist(message: string) {
    if (!record.professional_name.trim()) {
      setError(es ? "Añade tu nombre profesional antes de guardar." : "Add your professional name before saving.")
      return false
    }
    setSaving(true)
    setError("")
    try {
      const saved = await savePayload(record)
      setRecord(saved)
      setStatus(message)
      return true
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the Creative Passport.")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function continueGuided() {
    const saved = await persist(es ? "Progreso guardado." : "Progress saved.")
    if (saved) setStep((current) => Math.min(current + 1, guidedSteps.length - 1))
  }

  async function uploadCv(file: File | null) {
    if (!file) return
    setUploading(true)
    setError("")
    try {
      if (file.type !== "application/pdf") throw new Error(es ? "Elige un PDF para tu CV." : "Choose a PDF for your CV.")
      if (file.size > 15 * 1024 * 1024) throw new Error(es ? "El CV debe tener 15 MB o menos." : "CV files must be 15 MB or smaller.")
      const path = await uploadArtistAsset(file, "cv")
      setRecord((current) => ({ ...current, cv_file_path: path }))
      setCvName(file.name)
      setStatus(es ? "CV cargado. Guarda para adjuntarlo al Pasaporte." : "CV uploaded. Save to attach it to your Passport.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the CV.")
    } finally {
      setUploading(false)
    }
  }

  const guidedSteps = useMemo(() => [
    { title: es ? "Empecemos con lo esencial" : "Start with the essentials", caption: es ? "Solo necesitamos suficiente información para que tu Pasaporte sea útil. Puedes omitir lo demás." : "Add only enough information to make your Passport useful. Everything else can wait." },
    { title: es ? "¿Cómo describirías tu práctica?" : "How would you describe your practice?", caption: es ? "Selecciona lo que encaje. No tienes que limitar tu trabajo a una sola categoría." : "Choose what fits. You do not have to reduce your work to one category." },
    { title: es ? "¿Con qué trabajas?" : "What do you work with?", caption: es ? "Elige sugerencias o escribe tus propios medios y materiales." : "Choose suggestions or add your own mediums and materials." },
    { title: es ? "Cuéntanos sobre tu práctica" : "Tell us about your practice", caption: es ? "Escribe, pega o habla. La transcripción siempre queda editable antes de guardar." : "Type, paste, or speak. Your transcript remains editable before saving." },
    { title: es ? "Tu base está lista" : "Your foundation is ready", caption: es ? "Puedes seguir con el formulario completo, importar materiales o volver más tarde." : "Continue with the full form, import materials, or return later." },
  ], [es])

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <section className="shrink-0 border-b border-[#E7E1F7] bg-[#FDFCFF] px-4 py-3 sm:px-6" aria-label="Creative Passport entry mode">
        <div className="mx-auto max-w-[1180px]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">{es ? "Cómo quieres trabajar" : "How you want to work"}</p><p className="mt-1 text-xs text-[#746E80]">{es ? "Cambia de modo cuando quieras. Todos editan el mismo Pasaporte." : "Switch whenever you need. Every mode edits the same Passport."}</p></div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            <ModeButton active={mode === "guided"} icon={Sparkles} title={es ? "Guíame paso a paso" : "Guide me step by step"} description={es ? "Preguntas breves, opciones y ayuda por voz." : "Short prompts, choices, and optional voice help."} onClick={() => chooseMode("guided")} />
            <ModeButton active={mode === "full"} icon={FormInput} title={es ? "Déjame completarlo" : "Let me fill it out"} description={es ? "Formulario completo para trabajar rápido." : "The complete form for fast, direct entry."} onClick={() => chooseMode("full")} />
            <ModeButton active={mode === "import"} icon={FileText} title={es ? "Empezar con lo que tengo" : "Start from what I have"} description={es ? "Añade tu sitio, CV o texto existente." : "Add your website, CV, or existing text."} onClick={() => chooseMode("import")} />
          </div>
        </div>
      </section>

      <div className="min-h-0 flex-1">
        {mode === "full" && <LiveArtistPassportEditor />}

        {mode === "guided" && (
          <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl">
              {loading ? <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />{es ? "Cargando tu Pasaporte…" : "Loading your Passport…"}</div> : (
                <section className={card}>
                  <div className="flex items-start justify-between gap-4">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">{es ? `Paso ${step + 1} de ${guidedSteps.length}` : `Step ${step + 1} of ${guidedSteps.length}`}</p><h1 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em]">{guidedSteps[step].title}</h1><p className="mt-2 text-sm leading-6 text-[#746E80]">{guidedSteps[step].caption}</p></div>
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#EEE9F8]" aria-label={`${Math.round(((step + 1) / guidedSteps.length) * 100)}%`}><div className="h-full rounded-full bg-[#8F7AC8] transition-all" style={{ width: `${((step + 1) / guidedSteps.length) * 100}%` }} /></div>
                  </div>

                  <div className="mt-6">
                    {step === 0 && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Nombre profesional" : "Professional name"}</span><input className={input} value={record.professional_name} onChange={(event) => update("professional_name", event.target.value)} autoComplete="name" /></label><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "¿Dónde estás?" : "Where are you based?"}</span><input className={input} value={record.location} onChange={(event) => update("location", event.target.value)} placeholder={es ? "Ciudad, región o país" : "City, region, or country"} /><span className="font-normal leading-5">{es ? "Ayuda a comprobar oportunidades locales. Puedes dejarlo en blanco por ahora." : "Helps check local opportunities. You can leave it blank for now."}</span></label></div>}
                    {step === 1 && <DisciplineMultiSelect values={record.disciplines} onChange={(values) => update("disciplines", values)} locale={locale} />}
                    {step === 2 && <div className="space-y-4"><div><p className="text-xs font-semibold text-[#746E80]">{es ? "Sugerencias comunes" : "Common suggestions"}</p><div className="mt-2 flex flex-wrap gap-2">{suggestedMediums.map((medium) => { const active = record.mediums.includes(medium); return <button key={medium} type="button" aria-pressed={active} onClick={() => update("mediums", active ? record.mediums.filter((item) => item !== medium) : [...record.mediums, medium])} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-[#A997E8] bg-[#F2EDFC] text-[#5B4B8A]" : "border-[#E7E1F7] bg-white text-[#746E80]"}`}>{medium}</button> })}</div></div><TagEntryField values={record.mediums} onChange={(values) => update("mediums", values)} label={es ? "Medios y materiales" : "Mediums and materials"} placeholder={es ? "Escribe uno y presiona Enter" : "Type one and press Enter"} /></div>}
                    {step === 3 && <div className="space-y-5"><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Descripción de tu práctica" : "Practice description"}</span><textarea className={textarea} rows={7} value={record.practice_description} onChange={(event) => update("practice_description", event.target.value)} placeholder={es ? "Mi trabajo explora…" : "My work explores…"} /></label><VoiceDictationControl value={record.practice_description} onChange={(value) => update("practice_description", value)} locale={locale} fieldLabel={es ? "Descripción de práctica" : "Practice description"} /><details className="rounded-xl border border-[#E7E1F7] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">{es ? "También añadir una biografía corta" : "Also add a short biography"}</summary><label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Biografía corta" : "Short biography"}</span><textarea className={textarea} rows={5} value={record.bio} onChange={(event) => update("bio", event.target.value)} /></label><div className="mt-3"><VoiceDictationControl value={record.bio} onChange={(value) => update("bio", value)} locale={locale} fieldLabel={es ? "Biografía corta" : "Short biography"} /></div></details></div>}
                    {step === 4 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><Check className="size-6 text-emerald-700" /><p className="mt-3 font-serif text-xl font-semibold text-emerald-950">{es ? "Tu Pasaporte ya puede crecer contigo." : "Your Passport can now grow with you."}</p><p className="mt-2 text-sm leading-6 text-emerald-900">{es ? "La información guardada aparece también en el formulario completo. Nada se publica automáticamente." : "Saved information also appears in the full form. Nothing is published automatically."}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={primary} onClick={() => chooseMode("full")}>{es ? "Abrir formulario completo" : "Open full form"}<FormInput className="size-4" /></button><button type="button" className={secondary} onClick={() => chooseMode("import")}>{es ? "Añadir materiales" : "Add existing materials"}<FileUp className="size-4" /></button></div></div>}
                  </div>

                  {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                  {status && <p role="status" className="mt-5 text-sm font-medium text-emerald-700">{status}</p>}

                  {step < guidedSteps.length - 1 && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] pt-5"><button type="button" className={secondary} disabled={step === 0 || saving} onClick={() => setStep((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" />{es ? "Atrás" : "Back"}</button><div className="flex flex-wrap gap-2"><button type="button" className="min-h-11 px-3 text-sm font-semibold text-[#746E80]" onClick={() => setStep((current) => Math.min(current + 1, guidedSteps.length - 1))}>{es ? "Omitir por ahora" : "Skip for now"}</button><button type="button" className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void continueGuided()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{es ? "Guardar y continuar" : "Save and continue"}<ChevronRight className="size-4" /></button></div></div>}
                </section>
              )}
            </div>
          </main>
        )}

        {mode === "import" && (
          <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-5">
              <section className={card}>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">{es ? "Empezar con lo que ya tienes" : "Start from what you already have"}</p>
                <h1 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em]">{es ? "Añade tus materiales sin volver a escribir todo." : "Add existing materials without rewriting everything."}</h1>
                <p className="mt-2 text-sm leading-6 text-[#746E80]">{es ? "Estos datos se guardan en el mismo Pasaporte. La extracción automática permanece desactivada hasta que KLEIO pueda mostrar sugerencias para tu revisión." : "These details save to the same Passport. Automatic extraction remains off until KLEIO can present suggestions for your review."}</p>

                {loading ? <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{es ? "Cargando…" : "Loading…"}</p> : <div className="mt-6 space-y-5">
                  <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Nombre profesional" : "Professional name"}</span><input className={input} value={record.professional_name} onChange={(event) => update("professional_name", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Sitio o portafolio" : "Website or portfolio"}</span><input className={input} type="url" value={record.website_url} onChange={(event) => update("website_url", event.target.value)} placeholder="https://" /></label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#CFC3ED] bg-[#FBFAFE] p-4 text-sm font-semibold text-[#5B4B8A]"><FileUp className="size-4" /><span>{uploading ? (es ? "Cargando…" : "Uploading…") : cvName || (record.cv_file_path ? (es ? "Reemplazar CV guardado" : "Replace saved CV") : (es ? "Añadir CV en PDF" : "Add CV as PDF"))}</span><input type="file" accept="application/pdf" className="sr-only" disabled={uploading} onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Pega una biografía existente" : "Paste an existing biography"}</span><textarea className={textarea} rows={6} value={record.bio} onChange={(event) => update("bio", event.target.value)} /></label>
                  <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Pega una declaración artística" : "Paste an existing artist statement"}</span><textarea className={textarea} rows={8} value={record.artist_statement} onChange={(event) => update("artist_statement", event.target.value)} /></label>
                </div>}

                {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                {status && <p role="status" className="mt-5 text-sm font-medium text-emerald-700">{status}</p>}
                <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#E7E1F7] pt-5"><button type="button" className={secondary} onClick={() => chooseMode("full")}>{es ? "Ver todos los campos" : "View all fields"}</button><button type="button" className={primary} disabled={saving || uploading || !record.professional_name.trim()} onClick={() => void persist(es ? "Materiales guardados en tu Pasaporte." : "Materials saved to your Passport.")}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{es ? "Guardar materiales" : "Save materials"}</button></div>
              </section>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}
