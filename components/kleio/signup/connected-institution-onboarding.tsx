"use client"

import { useState } from "react"
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
import { getPersistenceMode, saveInstitution } from "@/lib/kleio-live-data"

const STEPS = ["Account & institution", "Review workflow", "Review"]

const initialForm = {
  email: "",
  password: "",
  contactName: "",
  institutionName: "",
  organizationType: "",
  location: "",
  website: "",
  description: "",
  programTypes: "Residency, Open Call",
  reviewCriteria: "Conceptual strength, Program fit, Feasibility",
  reviewStages: "Intake, Review, Shortlist, Final decision",
  applicationContact: "",
}

export function ConnectedInstitutionOnboarding() {
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

  function update(key: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function validateCurrentStep() {
    if (step === 0) {
      if (!form.email.trim() || !form.password || !form.contactName.trim() || !form.institutionName.trim() || !form.organizationType.trim() || !form.location.trim()) return es ? "Completa los campos de cuenta e institución requeridos." : "Complete the required account and institution fields."
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return es ? "Ingresa un correo válido." : "Enter a valid email address."
      if (form.password.length < 8) return es ? "La contraseña debe tener al menos 8 caracteres." : "Use at least 8 characters for the password."
    }
    if (step === 1 && (!form.programTypes.trim() || !form.reviewCriteria.trim() || !form.reviewStages.trim())) return es ? "Define tipos de programa, criterios y etapas de revisión." : "Define program types, review criteria, and review stages."
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
        role: "institution",
        displayName: form.contactName,
      })

      if (auth.needsEmailConfirmation || !auth.session) {
        setConfirmationRequired(true)
        return
      }

      await saveInstitution({
        name: form.institutionName.trim(),
        organization_type: form.organizationType.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        website_url: form.website.trim(),
        contact_name: form.contactName.trim(),
        contact_email: (form.applicationContact || form.email).trim().toLowerCase(),
        logo_path: null,
      })

      router.push(getDashboardForRole("institution"))
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : (es ? "No se pudo crear el espacio institucional." : "Unable to create the institution workspace."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (confirmationRequired) {
    return (
      <SignupShell title={es ? "Confirma tu correo" : "Confirm your email"} subtitle={es ? "Supabase creó la cuenta institucional, pero requiere confirmación antes de abrir una sesión." : "Supabase created the institution account, but email confirmation is required before a session can begin."}>
        <SignupStepCard>
          <div className="flex gap-3 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="mt-0.5 size-5 shrink-0" /><div><p className="font-semibold">{es ? "Revisa tu bandeja de entrada" : "Check your inbox"}</p><p className="mt-1 text-sm leading-relaxed">{es ? "Después de confirmar, inicia sesión para completar el perfil institucional y crear la primera convocatoria." : "After confirming, sign in to complete the institution profile and create the first open call."}</p></div></div>
        </SignupStepCard>
      </SignupShell>
    )
  }

  return (
    <SignupShell
      title={es ? "Crear cuenta institucional" : "Create an institution account"}
      subtitle={es ? "Configura una identidad institucional real, el marco de revisión y el acceso para crear convocatorias." : "Set up a real institution identity, review framework, and access for creating open calls."}
      stepLabel={`${step + 1}/${STEPS.length} · ${STEPS[step]}`}
    >
      <SignupProgress currentStep={step} totalSteps={STEPS.length} label={STEPS[step]} />
      <div className="mb-4 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
      <SignupStepCard>
        {step === 0 && <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">{es ? "Cuenta e institución" : "Account and institution"}</h2>
          <SignupField label={es ? "Correo de cuenta" : "Account email"} type="email" value={form.email} onChange={(value) => update("email", value)} />
          <label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{authMode === "supabase" ? (es ? "Se envía directamente a Supabase Auth." : "Sent directly to Supabase Auth.") : (es ? "Solo vista previa local; no es autenticación de producción." : "Local preview only; this is not production authentication.")}</p></label>
          <SignupField label={es ? "Nombre de contacto" : "Contact name"} value={form.contactName} onChange={(value) => update("contactName", value)} />
          <SignupField label={es ? "Nombre de institución" : "Institution name"} value={form.institutionName} onChange={(value) => update("institutionName", value)} />
          <SignupField label={es ? "Tipo de organización" : "Organization type"} value={form.organizationType} onChange={(value) => update("organizationType", value)} placeholder={es ? "Museo, residencia, galería…" : "Museum, residency, gallery…"} />
          <SignupField label={es ? "Ubicación" : "Location"} value={form.location} onChange={(value) => update("location", value)} />
          <SignupField label={es ? "Sitio web" : "Website"} type="url" value={form.website} onChange={(value) => update("website", value)} />
          <SignupTextArea label={es ? "Descripción pública" : "Public description"} value={form.description} onChange={(value) => update("description", value)} rows={4} />
          <SignupField label={es ? "Correo de postulaciones" : "Application contact email"} type="email" value={form.applicationContact} onChange={(value) => update("applicationContact", value)} placeholder={form.email || "applications@example.org"} />
        </div>}

        {step === 1 && <div className="space-y-4">
          <h2 className="font-serif text-lg font-semibold">{es ? "Marco de revisión" : "Review framework"}</h2>
          <SignupField label={es ? "Tipos de programa" : "Program types"} value={form.programTypes} onChange={(value) => update("programTypes", value)} />
          <SignupTextArea label={es ? "Criterios predeterminados" : "Default review criteria"} value={form.reviewCriteria} onChange={(value) => update("reviewCriteria", value)} rows={3} />
          <SignupTextArea label={es ? "Etapas de revisión" : "Review stages"} value={form.reviewStages} onChange={(value) => update("reviewStages", value)} rows={3} />
          <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-xs leading-relaxed text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{es ? "Importante: " : "Important: "}</span>{es ? "Las instituciones sintéticas no se presentan como verificadas. Los criterios se pueden editar en cada convocatoria." : "Synthetic institutions are not presented as verified. Criteria remain editable for each call."}</div>
        </div>}

        {step === 2 && <div className="space-y-1">
          <SignupReviewRow label={es ? "Correo" : "Email"} value={form.email} />
          <SignupReviewRow label={es ? "Contacto" : "Contact"} value={form.contactName} />
          <SignupReviewRow label={es ? "Institución" : "Institution"} value={form.institutionName} />
          <SignupReviewRow label={es ? "Tipo" : "Type"} value={form.organizationType} />
          <SignupReviewRow label={es ? "Ubicación" : "Location"} value={form.location} />
          <SignupReviewRow label={es ? "Tipos de programa" : "Program types"} value={form.programTypes} />
          <SignupReviewRow label={es ? "Criterios" : "Criteria"} value={form.reviewCriteria} />
          <SignupReviewRow label={es ? "Etapas" : "Stages"} value={form.reviewStages} />
        </div>}

        {error && <p className="mt-4 rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-3 py-2 text-xs font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
        {isSubmitting ? <div className="mt-6 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-sm text-[#5B4B8A]">{es ? "Creando cuenta y guardando la institución…" : "Creating the account and saving the institution…"}</div> : <SignupStepControls step={step} totalSteps={STEPS.length} onBack={() => { setError(""); setStep((current) => Math.max(0, current - 1)) }} onNext={next} onSubmit={() => void submit()} submitLabel={es ? "Crear espacio institucional" : "Create institution workspace"} />}
      </SignupStepCard>
    </SignupShell>
  )
}
