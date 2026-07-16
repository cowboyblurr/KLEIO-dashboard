"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { SignupField, SignupProgress, SignupReviewRow, SignupShell, SignupStepCard, SignupStepControls, SignupTextArea } from "@/components/kleio/signup/signup-shell"
import { EntityAutocomplete } from "@/components/kleio/forms/entity-autocomplete"
import { ControlledMultiSelect } from "@/components/kleio/forms/controlled-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { getKleioAuthMode, signUpKleio } from "@/lib/kleio-auth"
import { getPersistenceMode, saveArtistProfile, savePortfolioWork } from "@/lib/kleio-live-data"
import { saveArtistLocationData } from "@/lib/kleio-normalized-data"
import { DISCIPLINES, LANGUAGES, MEDIUMS, optionLabel } from "@/lib/kleio-form-options"
import type { NormalizedEntityValue } from "@/lib/kleio-entity-search"

const STEPS = ["Account & profile", "Creative Passport", "Review"]
const initialForm = { email: "", password: "", professionalName: "", website: "", bio: "", statement: "", practice: "", education: "", exhibitions: "", awards: "", featuredWorks: "Threshold Archive\nSoft Index\nRooms for Remembering" }

export function ConnectedArtistOnboarding() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [location, setLocation] = useState<NormalizedEntityValue | null>(null)
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [mediums, setMediums] = useState<string[]>([])
  const [languages, setLanguages] = useState<string[]>(["english"])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const mode = getPersistenceMode()
  const authMode = getKleioAuthMode()
  const workTitles = useMemo(() => form.featuredWorks.split(/\n|,/).map((value) => value.trim()).filter(Boolean).slice(0, 6), [form.featuredWorks])
  const update = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  function validation() {
    if (step === 0 && (!form.email.trim() || !form.password || !form.professionalName.trim())) return es ? "Completa correo, contraseña y nombre profesional." : "Complete email, password, and professional name."
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return es ? "Ingresa un correo válido." : "Enter a valid email address."
    if (form.password && form.password.length < 8) return es ? "La contraseña debe tener al menos 8 caracteres." : "Use at least 8 characters for the password."
    if (step === 1 && (!form.bio.trim() || !form.statement.trim() || !disciplines.length || !mediums.length)) return es ? "Completa bio, declaración, disciplinas y medios." : "Complete the biography, statement, disciplines, and mediums."
    if (step === 1 && workTitles.length < 3) return es ? "Agrega al menos tres obras, una por línea." : "Add at least three works, one per line."
    return ""
  }
  function next() { const message = validation(); if (message) return setError(message); setError(""); setStep((current) => Math.min(STEPS.length - 1, current + 1)) }

  async function submit() {
    const message = validation(); if (message) return setError(message)
    setError(""); setIsSubmitting(true)
    try {
      const auth = await signUpKleio({ email: form.email, password: form.password, role: "artist", displayName: form.professionalName })
      if (auth.needsEmailConfirmation || !auth.session) { setConfirmationRequired(true); return }
      await saveArtistProfile({
        professional_name: form.professionalName.trim(),
        location: location?.formattedAddress || location?.displayName || "",
        bio: form.bio.trim(), artist_statement: form.statement.trim(), practice_description: form.practice.trim(),
        website_url: form.website.trim(), instagram_url: "", disciplines, mediums, languages,
        education: form.education.trim(), exhibition_history: form.exhibitions.trim(), awards: form.awards.trim(),
        cv_file_path: null, profile_completion: location ? 82 : 76,
      })
      await saveArtistLocationData(auth.session.user.id, location)
      await Promise.all(workTitles.slice(0, 3).map((title, index) => savePortfolioWork({ title, year: "2026", medium: optionLabel(MEDIUMS, mediums[0] || "mixed_media"), dimensions: "Variable", description: "Added during KLEIO Creative Passport onboarding. Edit this record from the portfolio workspace.", series: "Creative Passport selection", tags: disciplines.slice(0, 4), image_path: null, sort_order: index })))
      router.push(getDashboardForRole("artist"))
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : (es ? "No se pudo crear la cuenta." : "Unable to create the account.")) }
    finally { setIsSubmitting(false) }
  }

  if (confirmationRequired) return <SignupShell title={es ? "Confirma tu correo" : "Confirm your email"} subtitle={es ? "Confirma el correo antes de continuar." : "Confirm the email before continuing."}><SignupStepCard><div className="flex gap-3 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="mt-0.5 size-5" /><p>{es ? "Revisa tu bandeja de entrada." : "Check your inbox."}</p></div></SignupStepCard></SignupShell>

  return <SignupShell title={es ? "Crear cuenta de artista" : "Create an artist account"} subtitle={es ? "Crea la cuenta con lo esencial y completa el Pasaporte desde tu panel." : "Create the account with essentials and complete the Passport from your dashboard."} stepLabel={`${step + 1}/${STEPS.length} · ${STEPS[step]}`}>
    <SignupProgress currentStep={step} totalSteps={STEPS.length} label={STEPS[step]} />
    <div className="mb-4 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-xs text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
    <SignupStepCard>
      {step === 0 && <div className="space-y-4"><h2 className="font-serif text-lg font-semibold">{es ? "Cuenta y perfil básico" : "Account and profile basics"}</h2><SignupField label={es ? "Correo" : "Email"} type="email" value={form.email} onChange={(value) => update("email", value)} /><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{authMode === "supabase" ? (es ? "Se envía directamente a Supabase Auth." : "Sent directly to Supabase Auth.") : (es ? "Vista previa local." : "Local preview only.")}</p></label><SignupField label={es ? "Nombre profesional" : "Professional name"} value={form.professionalName} onChange={(value) => update("professionalName", value)} /><EntityAutocomplete label={es ? "Ubicación pública" : "Public location"} purpose="city" value={location} onChange={setLocation} locale={es ? "es" : "en"} helper={es ? "Opcional al crear la cuenta; puedes completarla después." : "Optional at account creation; you can complete it later."} /><SignupField label={es ? "Sitio web" : "Website"} type="url" value={form.website} onChange={(value) => update("website", value)} /></div>}
      {step === 1 && <div className="space-y-4"><h2 className="font-serif text-lg font-semibold">{es ? "Pasaporte Creativo" : "Creative Passport"}</h2><ControlledMultiSelect label={es ? "Disciplinas" : "Disciplines"} values={disciplines} onChange={setDisciplines} options={DISCIPLINES} locale={es ? "es" : "en"} required /><ControlledMultiSelect label={es ? "Medios" : "Mediums"} values={mediums} onChange={setMediums} options={MEDIUMS} locale={es ? "es" : "en"} required /><ControlledMultiSelect label={es ? "Idiomas" : "Languages"} values={languages} onChange={setLanguages} options={LANGUAGES} locale={es ? "es" : "en"} /><SignupTextArea label={es ? "Bio corta" : "Short biography"} value={form.bio} onChange={(value) => update("bio", value)} /><SignupTextArea label={es ? "Declaración artística" : "Artist statement"} value={form.statement} onChange={(value) => update("statement", value)} rows={5} /><SignupTextArea label={es ? "Descripción de práctica" : "Practice description"} value={form.practice} onChange={(value) => update("practice", value)} /><SignupTextArea label={es ? "Educación" : "Education"} value={form.education} onChange={(value) => update("education", value)} rows={3} /><SignupTextArea label={es ? "Exposiciones" : "Exhibition history"} value={form.exhibitions} onChange={(value) => update("exhibitions", value)} rows={3} /><SignupTextArea label={es ? "Premios y becas" : "Awards and grants"} value={form.awards} onChange={(value) => update("awards", value)} rows={3} /><SignupTextArea label={es ? "Obras destacadas — una por línea" : "Featured works — one per line"} value={form.featuredWorks} onChange={(value) => update("featuredWorks", value)} rows={4} /></div>}
      {step === 2 && <div className="space-y-1"><SignupReviewRow label={es ? "Correo" : "Email"} value={form.email} /><SignupReviewRow label={es ? "Nombre" : "Professional name"} value={form.professionalName} /><SignupReviewRow label={es ? "Ubicación" : "Location"} value={location?.formattedAddress || location?.displayName} /><SignupReviewRow label={es ? "Disciplinas" : "Disciplines"} value={disciplines.map((value) => optionLabel(DISCIPLINES, value)).join(", ")} /><SignupReviewRow label={es ? "Medios" : "Mediums"} value={mediums.map((value) => optionLabel(MEDIUMS, value)).join(", ")} /><SignupReviewRow label={es ? "Obras" : "Works"} value={workTitles.join(", ")} /></div>}
      {error && <p className="mt-4 rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-3 py-2 text-xs font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
      {isSubmitting ? <div className="mt-6 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-sm text-[#5B4B8A]">{es ? "Creando cuenta…" : "Creating account…"}</div> : <SignupStepControls step={step} totalSteps={STEPS.length} onBack={() => { setError(""); setStep((current) => Math.max(0, current - 1)) }} onNext={next} onSubmit={() => void submit()} submitLabel={es ? "Crear Pasaporte" : "Create Passport"} />}
    </SignupStepCard>
  </SignupShell>
}
