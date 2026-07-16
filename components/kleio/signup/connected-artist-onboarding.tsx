"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import {
  SignupField,
  SignupProgress,
  SignupReviewRow,
  SignupShell,
  SignupStepCard,
  SignupStepControls,
  SignupTextArea,
} from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { getKleioAuthMode, signUpKleio } from "@/lib/kleio-auth"
import { getPersistenceMode, saveArtistProfile, savePortfolioWork } from "@/lib/kleio-live-data"

const STEPS = ["Account & profile", "Creative Passport", "Review"]

const initialForm = {
  email: "",
  password: "",
  professionalName: "",
  location: "",
  disciplines: "",
  mediums: "",
  website: "",
  bio: "",
  statement: "",
  practice: "",
  education: "",
  exhibitions: "",
  awards: "",
  languages: "English",
  featuredWorks: "Threshold Archive\nSoft Index\nRooms for Remembering",
}

export function ConnectedArtistOnboarding() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const mode = getPersistenceMode()
  const authMode = getKleioAuthMode()

  const workTitles = useMemo(
    () => form.featuredWorks.split(/\n|,/).map((value) => value.trim()).filter(Boolean).slice(0, 6),
    [form.featuredWorks],
  )

  function update(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!form.email.trim() || !form.password || !form.professionalName.trim() || !form.location.trim()) return es ? "Completa correo, contraseña, nombre profesional y ubicación." : "Complete email, password, professional name, and location."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return es ? "Ingresa un correo válido." : "Enter a valid email address."
      if (form.password.length < 8) return es ? "La contraseña debe tener al menos 8 caracteres." : "Use at least 8 characters for the password."
    }
    if (step === 1) {
      if (!form.bio.trim() || !form.statement.trim() || !form.disciplines.trim() || !form.mediums.trim()) return es ? "Completa bio, declaración, disciplinas y medios." : "Complete the bio, statement, disciplines, and mediums."
      if (workTitles.length < 3) return es ? "Agrega al menos tres obras, una por línea." : "Add at least three works, one per line."
    }
    return ""
  }

  function next() {
    const validation = validateCurrentStep()
    if (validation) { setError(validation); return }
    setError("")
    setStep((current) => Math.min(STEPS.length - 1, current + 1))
  }

  async function submit() {
    const validation = validateCurrentStep()
    if (validation) { setError(validation); return }

    setError("")
    setIsSubmitting(true)
    try {
      const auth = await signUpKleio({
        email: form.email,
        password: form.password,
        role: "artist",
        displayName: form.professionalName,
      })

      if (auth.needsEmailConfirmation || !auth.session) {
        setConfirmationRequired(true)
        return
      }

      await saveArtistProfile({
        professional_name: form.professionalName.trim(),
        location: form.location.trim(),
        bio: form.bio.trim(),
        artist_statement: form.statement.trim(),
        practice_description: form.practice.trim(),
        website_url: form.website.trim(),
        instagram_url: "",
        disciplines: form.disciplines.split(",").map((value) => value.trim()).filter(Boolean),
        mediums: form.mediums.split(",").map((value) => value.trim()).filter(Boolean),
        languages: form.languages.split(",").map((value) => value.trim()).filter(Boolean),
        education: form.education.trim(),
        exhibition_history: form.exhibitions.trim(),
        awards: form.awards.trim(),
        cv_file_path: null,
        profile_completion: 88,
      })

      await Promise.all(workTitles.slice(0, 3).map((title, index) => savePortfolioWork({
        title,
        year: "2026",
        medium: form.mediums.split(",")[0]?.trim() || "Mixed media",
        dimensions: "Variable",
        description: "Added during KLEIO Creative Passport onboarding. Edit this record from the portfolio workspace.",
        series: "Creative Passport selection",
        tags: form.disciplines.split(",").map((value) => value.trim()).filter(Boolean).slice(0, 4),
        image_path: null,
        sort_order: index,
      })))

      router.push(getDashboardForRole("artist"))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (es ? "No se pudo crear la cuenta." : "Unable to create the account."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmationRequired) {
    return (
      <SignupShell title={es ? "Confirma tu correo" : "Confirm your email"} subtitle={es ? "Supabase creó la cuenta, pero requiere confirmación antes de abrir una sesión." : "Supabase created the account, but email confirmation is required before a session can begin."}>
        <SignupStepCard>
          <div className="flex gap-3 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">{es ? "Revisa tu bandeja de entrada" : "Check your inbox"}</p><p className="mt-1 text-sm leading-relaxed">{es ? "Después de confirmar, inicia sesión y completa el Pasaporte Creativo. KLEIO no te muestra como conectado antes de la confirmación." : "After confirming, sign in and complete the Creative Passport. KLEIO does not present you as signed in before confirmation."}</p></div></div>
        </SignupStepCard>
      </SignupShell>
    )
  }

  return (
    <SignupShell
      title={es ? "Crear cuenta de artista" : "Create an artist account"}
      subtitle={es ? "Crea una cuenta, prepara un Pasaporte Creativo reutilizable y añade tres obras para el test-run." : "Create an account, prepare a reusable Creative Passport, and add three works for the test run."}
      stepLabel={`${step + 1}/${STEPS.length} · ${STEPS[step]}`}
    >
      <SignupProgress currentStep={step} totalSteps={STEPS.length} label={STEPS[step]} />
      <div className="mb-4 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
      <SignupStepCard>
        {step === 0 && <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">{es ? "Cuenta y perfil básico" : "Account and profile basics"}</h2>
          <SignupField label={es ? "Correo" : "Email"} type="email" value={form.email} onChange={(value) => update("email", value)} />
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{authMode === "supabase" ? (es ? "Se envía directamente a Supabase Auth; no se guarda en el perfil." : "Sent directly to Supabase Auth; never stored in the profile.") : (es ? "Solo vista previa local; no es autenticación de producción." : "Local preview only; this is not production authentication.")}</p></label>
          <SignupField label={es ? "Nombre profesional" : "Professional name"} value={form.professionalName} onChange={(value) => update("professionalName", value)} />
          <SignupField label={es ? "Ubicación" : "Location"} value={form.location} onChange={(value) => update("location", value)} />
          <SignupField label={es ? "Sitio web" : "Website"} type="url" value={form.website} onChange={(value) => update("website", value)} />
        </div>}

        {step === 1 && <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">{es ? "Pasaporte Creativo" : "Creative Passport"}</h2>
          <SignupField label={es ? "Disciplinas (separadas por comas)" : "Disciplines (comma separated)"} value={form.disciplines} onChange={(value) => update("disciplines", value)} />
          <SignupField label={es ? "Medios (separados por comas)" : "Mediums (comma separated)"} value={form.mediums} onChange={(value) => update("mediums", value)} />
          <SignupTextArea label={es ? "Bio corta" : "Short biography"} value={form.bio} onChange={(value) => update("bio", value)} />
          <SignupTextArea label={es ? "Declaración artística" : "Artist statement"} value={form.statement} onChange={(value) => update("statement", value)} rows={5} />
          <SignupTextArea label={es ? "Descripción de práctica" : "Practice description"} value={form.practice} onChange={(value) => update("practice", value)} />
          <SignupField label={es ? "Idiomas" : "Languages"} value={form.languages} onChange={(value) => update("languages", value)} />
          <SignupTextArea label={es ? "Educación" : "Education"} value={form.education} onChange={(value) => update("education", value)} rows={3} />
          <SignupTextArea label={es ? "Exposiciones" : "Exhibition history"} value={form.exhibitions} onChange={(value) => update("exhibitions", value)} rows={3} />
          <SignupTextArea label={es ? "Premios y becas" : "Awards and grants"} value={form.awards} onChange={(value) => update("awards", value)} rows={3} />
          <SignupTextArea label={es ? "Obras destacadas — una por línea" : "Featured works — one per line"} value={form.featuredWorks} onChange={(value) => update("featuredWorks", value)} rows={4} />
        </div>}

        {step === 2 && <div className="space-y-1">
          <SignupReviewRow label={es ? "Correo" : "Email"} value={form.email} />
          <SignupReviewRow label={es ? "Nombre profesional" : "Professional name"} value={form.professionalName} />
          <SignupReviewRow label={es ? "Ubicación" : "Location"} value={form.location} />
          <SignupReviewRow label={es ? "Disciplinas" : "Disciplines"} value={form.disciplines} />
          <SignupReviewRow label={es ? "Medios" : "Mediums"} value={form.mediums} />
          <SignupReviewRow label={es ? "Bio" : "Biography"} value={form.bio} />
          <SignupReviewRow label={es ? "Declaración" : "Statement"} value={form.statement} />
          <SignupReviewRow label={es ? "Obras" : "Works"} value={workTitles.join(", ")} />
        </div>}

        {error && <p className="mt-4 rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-3 py-2 text-xs font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {isSubmitting ? <div className="mt-6 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-sm text-[#5B4B8A]">{es ? "Creando cuenta y guardando el Pasaporte…" : "Creating the account and saving the Passport…"}</div> : <SignupStepControls step={step} totalSteps={STEPS.length} onBack={() => { setError(""); setStep((current) => Math.max(0, current - 1)) }} onNext={next} onSubmit={() => void submit()} submitLabel={es ? "Crear Pasaporte" : "Create Passport"} />}
      </SignupStepCard>
    </SignupShell>
  )
}
