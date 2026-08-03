"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, FileText, FormInput, Loader2, Save, Sparkles } from "lucide-react"
import { LiveArtistPassportEditor } from "@/components/kleio/live-artist-passport-editor"
import { ArtistImportReview } from "@/components/kleio/artist-import-review"
import { PassportDraftRecoveryNotice } from "@/components/kleio/passport-draft-recovery-notice"
import { DisciplineMultiSelect, TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { VoiceDictationControl } from "@/components/kleio/forms/voice-dictation-control"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import {
  dismissPassportDraftRecovery,
  isPassportDraftRecoveryDismissed,
} from "@/components/kleio/use-passport-draft-autosave"
import { loadArtistPassport, saveArtistPassport, type ArtistPassportRecord } from "@/lib/kleio-live-data"
import {
  loadRemoteKleioDraft,
  newestKleioDraft,
  readLocalKleioDraft,
  saveLocalKleioDraft,
  saveRemoteKleioDraft,
  type KleioDraftEnvelope,
} from "@/lib/kleio-passport-drafts"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

type PassportMode = "guided" | "full" | "import"
type PassportDraftPayload = ArtistPassportRecord & Record<string, unknown>

const MODE_KEY = "kleio:artist:passport-mode:v1"
const DRAFT_KEY = "creative_passport"
const card = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.05)]"
const input = "h-11 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/10"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"

const blankPassport: ArtistPassportRecord = {
  user_id: "", professional_name: "", location: "", bio: "", artist_statement: "", practice_description: "",
  website_url: "", instagram_url: "", disciplines: [], mediums: [], languages: [], education: "",
  exhibition_history: "", awards: "", cv_file_path: null, profile_completion: 0,
}

const suggestedMediums = ["Painting", "Photography", "Clay", "Ceramics", "Film", "Video", "Sound", "Textile", "Installation", "Performance", "Digital media", "Mixed media"]

function modeFromStorage(): PassportMode {
  if (typeof window === "undefined") return "full"
  const stored = window.localStorage.getItem(MODE_KEY)
  return stored === "guided" || stored === "import" || stored === "full" ? stored : "full"
}

function guidedCopy(es: boolean) {
  return [
    { title: es ? "Empecemos con lo esencial" : "Start with the essentials", caption: es ? "Solo añade lo que resulte útil ahora." : "Add only what is useful now." },
    { title: es ? "¿Cómo describirías tu práctica?" : "How would you describe your practice?", caption: es ? "Elige lo que encaje; no tienes que limitarte a una sola categoría." : "Choose what fits; you do not have to reduce your work to one category." },
    { title: es ? "¿Con qué trabajas?" : "What do you work with?", caption: es ? "Elige sugerencias o añade tus propios medios y materiales." : "Choose suggestions or add your own mediums and materials." },
    { title: es ? "Cuéntanos sobre tu práctica" : "Tell us about your practice", caption: es ? "Escribe, pega o habla. La transcripción siempre es editable." : "Type, paste, or speak. The transcript always remains editable." },
    { title: es ? "Tu base está lista" : "Your foundation is ready", caption: es ? "Continúa, importa materiales o vuelve más tarde." : "Continue, import materials, or return later." },
  ]
}

function ModeButton({ active, icon: Icon, title, description, onClick }: { active: boolean; icon: typeof Sparkles; title: string; description: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} aria-pressed={active} className={`min-w-[190px] flex-1 rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${active ? "border-[#A997E8] bg-[#F7F4FF]" : "border-[#E7E1F7] bg-white hover:border-[#CFC3ED]"}`}><span className="flex items-center gap-2 text-sm font-semibold text-[#292631]"><Icon className="size-4 text-[#6A5896]" />{title}{active && <Check className="ml-auto size-4 text-emerald-600" />}</span><span className="mt-1 block text-xs leading-5 text-[#746E80]">{description}</span></button>
}

function savePayload(record: ArtistPassportRecord) {
  return saveArtistPassport({ ...record, disciplines_text: record.disciplines.join(", "), mediums_text: record.mediums.join(", "), languages_text: record.languages.join(", ") })
}

export function AdaptiveArtistPassportExperience() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const guidedSteps = guidedCopy(es)
  const revisionRef = useRef(0)
  const hydratedRef = useRef(false)
  const lastSerializedRef = useRef("")
  const [mode, setMode] = useState<PassportMode>("full")
  const [record, setRecord] = useState(blankPassport)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const [saveState, setSaveState] = useState<"idle" | "local" | "saving" | "saved" | "offline" | "conflict" | "error">("idle")
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const [recovery, setRecovery] = useState<KleioDraftEnvelope<PassportDraftPayload> | null>(null)

  async function reloadPassport() {
    const profile = await loadArtistPassport()
    if (profile) setRecord(profile)
  }

  useEffect(() => {
    let active = true
    setMode(modeFromStorage())
    Promise.all([
      loadArtistPassport(),
      loadRemoteKleioDraft<PassportDraftPayload>(DRAFT_KEY).catch(() => null),
    ]).then(([profile, remote]) => {
      if (!active) return
      if (profile) setRecord(profile)
      const local = readLocalKleioDraft<PassportDraftPayload>(DRAFT_KEY)
      const newest = newestKleioDraft(local, remote)
      revisionRef.current = remote?.revision ?? 0
      if (
        newest
        && JSON.stringify(newest.payload) !== JSON.stringify(profile ?? blankPassport)
        && !isPassportDraftRecoveryDismissed(newest)
      ) {
        setRecovery(newest)
        setSaveState("idle")
      }
    }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "Unable to load the Creative Passport.") }).finally(() => {
      if (!active) return
      setLoading(false)
      window.setTimeout(() => { hydratedRef.current = true; lastSerializedRef.current = JSON.stringify(record) }, 0)
    })
    return () => { active = false }
  // Initial recovery is intentionally evaluated once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (loading || !hydratedRef.current || mode === "full") return
    const serialized = JSON.stringify(record)
    if (serialized === lastSerializedRef.current) return
    lastSerializedRef.current = serialized
    const local = saveLocalKleioDraft({ draftKey: DRAFT_KEY, draftKind: "creative_passport", payload: record as PassportDraftPayload, revision: revisionRef.current })
    setSaveState("local")
    const timer = window.setTimeout(() => {
      setSaveState(navigator.onLine ? "saving" : "offline")
      if (!navigator.onLine) return
      void saveRemoteKleioDraft({ draftKey: DRAFT_KEY, draftKind: "creative_passport", payload: record as PassportDraftPayload, expectedRevision: revisionRef.current, clientUpdatedAt: local?.clientUpdatedAt })
        .then((saved) => {
          revisionRef.current = saved.revision
          setSaveState("saved")
          void trackKleioProductEvent("autosave_succeeded", { surface: "creative_passport", metadata: { mode } })
        })
        .catch(async (reason) => {
          if (reason instanceof Error && reason.name === "KleioDraftConflictError") {
            setSaveState("conflict")
            const nextRecovery = await loadRemoteKleioDraft<PassportDraftPayload>(DRAFT_KEY)
            setRecovery(nextRecovery && !isPassportDraftRecoveryDismissed(nextRecovery) ? nextRecovery : null)
            void trackKleioProductEvent("conflict_detected", { surface: "creative_passport", metadata: { mode } })
          } else {
            setSaveState("error")
            void trackKleioProductEvent("autosave_failed", { surface: "creative_passport", metadata: { mode, reason: "remote_save" } })
          }
        })
    }, 1100)
    return () => window.clearTimeout(timer)
  }, [loading, mode, record])

  function chooseMode(nextMode: PassportMode) {
    setMode(nextMode)
    window.localStorage.setItem(MODE_KEY, nextMode)
    setStatus("")
    setError("")
    void trackKleioProductEvent("passport_mode_selected", { surface: "creative_passport", metadata: { mode: nextMode } })
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
      setSaveState("saved")
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
    if (saved) {
      void trackKleioProductEvent("guided_step_completed", { surface: "creative_passport", metadata: { step: step + 1 } })
      setStep((current) => Math.min(current + 1, guidedSteps.length - 1))
    }
  }

  function restoreDraft() {
    if (!recovery) return
    dismissPassportDraftRecovery(recovery)
    setRecord(recovery.payload)
    revisionRef.current = recovery.revision
    setRecovery(null)
    setSaveState("local")
    setStatus(es ? "Borrador recuperado. Revísalo antes de guardar el Pasaporte." : "Draft restored. Review it before saving the Passport.")
    void trackKleioProductEvent("draft_restored", { surface: "creative_passport", metadata: { source: recovery.serverUpdatedAt ? "remote" : "local" } })
  }

  function dismissRecovery() {
    if (!recovery) return
    dismissPassportDraftRecovery(recovery)
    setRecovery(null)
  }

  const saveLabel = saveState === "saving" ? "Saving to KLEIO…" : saveState === "saved" ? "Saved to KLEIO" : saveState === "local" ? "Saved locally" : saveState === "offline" ? "Offline — saved locally" : saveState === "conflict" ? "Conflict detected" : saveState === "error" ? "Retry required" : ""

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <section className="shrink-0 border-b border-[#E7E1F7] bg-[#FDFCFF] px-4 py-3 sm:px-6" aria-label="Creative Passport entry mode">
        <div className="mx-auto max-w-[1180px]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">{es ? "Cómo quieres trabajar" : "How you want to work"}</p><p className="mt-1 text-xs text-[#746E80]">{es ? "Todos los modos actualizan el mismo Pasaporte." : "Every mode updates the same Passport."}</p></div>{saveLabel && <p role="status" aria-live="polite" className={`text-xs font-semibold ${saveState === "conflict" || saveState === "error" ? "text-amber-700" : "text-[#746E80]"}`}>{saveLabel}</p>}</div><div className="mt-3 flex gap-2 overflow-x-auto pb-1"><ModeButton active={mode === "guided"} icon={Sparkles} title={es ? "Guíame paso a paso" : "Guide me step by step"} description={es ? "Preguntas breves y ayuda por voz." : "Short prompts and optional voice help."} onClick={() => chooseMode("guided")} /><ModeButton active={mode === "full"} icon={FormInput} title={es ? "Déjame completarlo" : "Let me fill it out"} description={es ? "Formulario completo para entrada directa." : "The complete form for direct entry."} onClick={() => chooseMode("full")} /><ModeButton active={mode === "import"} icon={FileText} title={es ? "Empezar con lo que tengo" : "Start from what I have"} description={es ? "Extrae propuestas de CV y texto." : "Extract proposals from PDFs and text."} onClick={() => chooseMode("import")} /></div></div>
      </section>

      {mode !== "full" && recovery && (
        <div className="shrink-0 px-4 pt-3 sm:px-6">
          <div className="mx-auto max-w-[1180px]">
            <PassportDraftRecoveryNotice
              recovery={recovery}
              onRestore={restoreDraft}
              onDismiss={dismissRecovery}
              locale={locale}
            />
          </div>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {mode === "full" && <LiveArtistPassportEditor />}
        {mode === "import" && <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl"><ArtistImportReview onPassportChanged={() => void reloadPassport()} /></div></main>}
        {mode === "guided" && <main className="h-full overflow-y-auto bg-white px-4 py-6 sm:px-6"><div className="mx-auto max-w-3xl">{loading ? <div className={`${card} flex items-center gap-2 text-sm text-muted-foreground`}><Loader2 className="size-4 animate-spin" />{es ? "Cargando tu Pasaporte…" : "Loading your Passport…"}</div> : <section className={card}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#7F6EB4]">{es ? `Paso ${step + 1} de ${guidedSteps.length}` : `Step ${step + 1} of ${guidedSteps.length}`}</p><h1 className="mt-2 font-serif text-2xl font-semibold">{guidedSteps[step].title}</h1><p className="mt-2 text-sm leading-6 text-[#746E80]">{guidedSteps[step].caption}</p></div><div className="h-1.5 w-28 overflow-hidden rounded-full bg-[#EEE9F8]" aria-label={`${Math.round(((step + 1) / guidedSteps.length) * 100)}% complete`}><div className="h-full rounded-full bg-[#8F7AC8]" style={{ width: `${((step + 1) / guidedSteps.length) * 100}%` }} /></div></div>
          <div className="mt-6">{step === 0 && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Nombre profesional" : "Professional name"}</span><input className={input} value={record.professional_name} onChange={(event) => update("professional_name", event.target.value)} autoComplete="name" /></label><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "¿Dónde estás?" : "Where are you based?"}</span><input className={input} value={record.location} onChange={(event) => update("location", event.target.value)} placeholder={es ? "Ciudad, región o país" : "City, region, or country"} /><span className="font-normal leading-5">{es ? "Se usa solo cuando una oportunidad necesita comprobar ubicación." : "Used when an opportunity needs a location check. You can leave it blank."}</span></label></div>}{step === 1 && <DisciplineMultiSelect values={record.disciplines} onChange={(values) => update("disciplines", values)} locale={locale} />}{step === 2 && <div className="space-y-4"><div className="flex flex-wrap gap-2">{suggestedMediums.map((medium) => { const active = record.mediums.includes(medium); return <button key={medium} type="button" aria-pressed={active} onClick={() => update("mediums", active ? record.mediums.filter((item) => item !== medium) : [...record.mediums, medium])} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active ? "border-[#A997E8] bg-[#F2EDFC] text-[#5B4B8A]" : "border-[#E7E1F7] text-[#746E80]"}`}>{medium}</button> })}</div><TagEntryField values={record.mediums} onChange={(values) => update("mediums", values)} label={es ? "Medios y materiales" : "Mediums and materials"} placeholder={es ? "Escribe uno y presiona Enter" : "Type one and press Enter"} /></div>}{step === 3 && <div className="space-y-5"><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>{es ? "Descripción de tu práctica" : "Practice description"}</span><textarea className={textarea} rows={7} value={record.practice_description} onChange={(event) => update("practice_description", event.target.value)} /></label><VoiceDictationControl value={record.practice_description} onChange={(value) => update("practice_description", value)} locale={locale} fieldLabel={es ? "Descripción de práctica" : "Practice description"} /><details className="rounded-xl border border-[#E7E1F7] p-4"><summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">{es ? "También añadir una biografía" : "Also add a biography"}</summary><textarea className={`${textarea} mt-4`} rows={5} value={record.bio} onChange={(event) => update("bio", event.target.value)} /><div className="mt-3"><VoiceDictationControl value={record.bio} onChange={(value) => update("bio", value)} locale={locale} fieldLabel={es ? "Biografía" : "Biography"} /></div></details></div>}{step === 4 && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5"><Check className="size-6 text-emerald-700" /><p className="mt-3 font-serif text-xl font-semibold text-emerald-950">{es ? "Tu Pasaporte ya puede crecer contigo." : "Your Passport can now grow with you."}</p><p className="mt-2 text-sm text-emerald-900">{es ? "Nada se publica automáticamente." : "Nothing is published automatically."}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={primary} onClick={() => chooseMode("full")}>{es ? "Abrir formulario completo" : "Open full form"}</button><button type="button" className={secondary} onClick={() => chooseMode("import")}>{es ? "Importar materiales" : "Import materials"}</button></div></div>}</div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}{status && <p role="status" className="mt-5 text-sm font-medium text-emerald-700">{status}</p>}{step < guidedSteps.length - 1 && <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E1F7] pt-5"><button type="button" className={secondary} disabled={step === 0 || saving} onClick={() => setStep((current) => Math.max(0, current - 1))}><ChevronLeft className="size-4" />{es ? "Atrás" : "Back"}</button><div className="flex gap-2"><button type="button" className="min-h-11 px-3 text-sm font-semibold text-[#746E80]" onClick={() => { void trackKleioProductEvent("guided_step_skipped", { surface: "creative_passport", metadata: { step: step + 1 } }); setStep((current) => Math.min(current + 1, guidedSteps.length - 1)) }}>{es ? "Omitir" : "Skip for now"}</button><button type="button" className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void continueGuided()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{es ? "Guardar y continuar" : "Save and continue"}<ChevronRight className="size-4" /></button></div></div>}</section>}</div></main>}
      </div>
    </div>
  )
}
