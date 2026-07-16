"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import { SignupField, SignupProgress, SignupReviewRow, SignupShell, SignupStepCard, SignupStepControls, SignupTextArea } from "@/components/kleio/signup/signup-shell"
import { EntityAutocomplete } from "@/components/kleio/forms/entity-autocomplete"
import { ControlledMultiSelect, ControlledSelect } from "@/components/kleio/forms/controlled-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { getKleioAuthMode, signUpKleio } from "@/lib/kleio-auth"
import { getPersistenceMode, saveInstitution } from "@/lib/kleio-live-data"
import { saveInstitutionEntityData } from "@/lib/kleio-normalized-data"
import { INSTITUTION_TYPES, OPPORTUNITY_TYPES, optionLabel } from "@/lib/kleio-form-options"
import { normalizeManualEntity, type NormalizedEntityValue } from "@/lib/kleio-entity-search"

const STEPS = ["Account & institution", "Review preferences", "Review"]
const initialForm = { email: "", password: "", contactName: "", organizationType: "", website: "", description: "", applicationContact: "", reviewCriteria: "Conceptual strength\nProgram fit\nFeasibility" }

export function ConnectedInstitutionOnboarding() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(initialForm)
  const [institution, setInstitution] = useState<NormalizedEntityValue | null>(null)
  const [headquarters, setHeadquarters] = useState<NormalizedEntityValue | null>(null)
  const [programTypes, setProgramTypes] = useState<string[]>(["residency", "open_call"])
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const mode = getPersistenceMode()
  const authMode = getKleioAuthMode()
  const update = (key: keyof typeof initialForm, value: string) => setForm((current) => ({ ...current, [key]: value }))

  function validation() {
    if (step === 0 && (!form.email.trim() || !form.password || !form.contactName.trim() || !institution?.displayName || !form.organizationType)) return es ? "Completa los campos requeridos de cuenta e institución." : "Complete the required account and institution fields."
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return es ? "Ingresa un correo válido." : "Enter a valid email address."
    if (form.password && form.password.length < 8) return es ? "La contraseña debe tener al menos 8 caracteres." : "Use at least 8 characters for the password."
    return ""
  }

  function next() { const message = validation(); if (message) return setError(message); setError(""); setStep((current) => Math.min(STEPS.length - 1, current + 1)) }

  async function submit() {
    const message = validation(); if (message) return setError(message)
    setError(""); setIsSubmitting(true)
    try {
      const auth = await signUpKleio({ email: form.email, password: form.password, role: "institution", displayName: form.contactName })
      if (auth.needsEmailConfirmation || !auth.session) { setConfirmationRequired(true); return }
      const locationLabel = headquarters?.formattedAddress || headquarters?.displayName || institution?.formattedAddress || ""
      const saved = await saveInstitution({
        name: institution?.organizationName || institution?.displayName || "",
        organization_type: form.organizationType,
        description: form.description.trim(),
        location: locationLabel,
        website_url: form.website.trim(),
        contact_name: form.contactName.trim(),
        contact_email: (form.applicationContact || form.email).trim().toLowerCase(),
        logo_path: null,
      })
      const normalized = { ...(institution ?? normalizeManualEntity(saved.name, "institution")), ...(headquarters ? { formattedAddress: headquarters.formattedAddress || headquarters.displayName, city: headquarters.city, county: headquarters.county, stateOrRegion: headquarters.stateOrRegion, postalCode: headquarters.postalCode, country: headquarters.country, countryCode: headquarters.countryCode, latitude: headquarters.latitude, longitude: headquarters.longitude } : {}) }
      await saveInstitutionEntityData(saved.id, normalized, form.organizationType)
      router.push(getDashboardForRole("institution"))
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : (es ? "No se pudo crear el espacio institucional." : "Unable to create the institution workspace.")) }
    finally { setIsSubmitting(false) }
  }

  if (confirmationRequired) return <SignupShell title={es ? "Confirma tu correo" : "Confirm your email"} subtitle={es ? "Confirma el correo y luego continúa con el perfil institucional." : "Confirm the email, then continue the institution profile."}><SignupStepCard><div className="flex gap-3 rounded-xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]"><CheckCircle2 className="mt-0.5 size-5" /><p>{es ? "Revisa tu bandeja de entrada." : "Check your inbox."}</p></div></SignupStepCard></SignupShell>

  return <SignupShell title={es ? "Crear cuenta institucional" : "Create an institution account"} subtitle={es ? "Crea la cuenta con los datos mínimos; el resto puede completarse desde el panel." : "Create the account with essential information; complete the rest from the dashboard."} stepLabel={`${step + 1}/${STEPS.length} · ${STEPS[step]}`}>
    <SignupProgress currentStep={step} totalSteps={STEPS.length} label={STEPS[step]} />
    <div className="mb-4 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-xs text-[#6F6882]"><span className="font-semibold text-[#5B4B8A]">{mode.label}: </span>{mode.detail}</div>
    <SignupStepCard>
      {step === 0 && <div className="space-y-4"><h2 className="font-serif text-lg font-semibold">{es ? "Cuenta e institución" : "Account and institution"}</h2><SignupField label={es ? "Correo" : "Account email"} type="email" value={form.email} onChange={(value) => update("email", value)} /><label className="block"><span className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</span><input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} autoComplete="new-password" className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary/40" /><p className="mt-1 text-[0.65rem] text-muted-foreground">{authMode === "supabase" ? (es ? "Se envía directamente a Supabase Auth." : "Sent directly to Supabase Auth.") : (es ? "Vista previa local." : "Local preview only.")}</p></label><SignupField label={es ? "Nombre de contacto" : "Contact name"} value={form.contactName} onChange={(value) => update("contactName", value)} /><EntityAutocomplete label={es ? "Institución" : "Institution name"} purpose="institution" value={institution} onChange={setInstitution} locale={es ? "es" : "en"} required /><ControlledSelect label={es ? "Tipo de organización" : "Organization type"} value={form.organizationType} onChange={(value) => update("organizationType", value)} options={INSTITUTION_TYPES} locale={es ? "es" : "en"} required /><EntityAutocomplete label={es ? "Sede principal" : "Headquarters"} purpose="venue" value={headquarters} onChange={setHeadquarters} locale={es ? "es" : "en"} helper={es ? "La selección no prueba propiedad ni representación." : "Selection does not establish ownership or representation."} /><SignupField label={es ? "Sitio web" : "Website"} type="url" value={form.website} onChange={(value) => update("website", value)} /><SignupTextArea label={es ? "Descripción pública" : "Public description"} value={form.description} onChange={(value) => update("description", value)} rows={4} /><SignupField label={es ? "Correo de postulaciones" : "Application contact email"} type="email" value={form.applicationContact} onChange={(value) => update("applicationContact", value)} placeholder={form.email || "applications@example.org"} /></div>}
      {step === 1 && <div className="space-y-4"><h2 className="font-serif text-lg font-semibold">{es ? "Preferencias de revisión" : "Review preferences"}</h2><p className="text-sm text-muted-foreground">{es ? "Estas opciones son recomendadas y podrán editarse después." : "These are recommended settings and can be edited later."}</p><ControlledMultiSelect label={es ? "Tipos de programa" : "Program types"} values={programTypes} onChange={setProgramTypes} options={OPPORTUNITY_TYPES} locale={es ? "es" : "en"} /><SignupTextArea label={es ? "Criterios predeterminados" : "Default review criteria"} value={form.reviewCriteria} onChange={(value) => update("reviewCriteria", value)} rows={4} /></div>}
      {step === 2 && <div className="space-y-1"><SignupReviewRow label={es ? "Correo" : "Email"} value={form.email} /><SignupReviewRow label={es ? "Contacto" : "Contact"} value={form.contactName} /><SignupReviewRow label={es ? "Institución" : "Institution"} value={institution?.displayName} /><SignupReviewRow label={es ? "Tipo" : "Type"} value={optionLabel(INSTITUTION_TYPES, form.organizationType, es ? "es" : "en")} /><SignupReviewRow label={es ? "Sede" : "Headquarters"} value={headquarters?.formattedAddress || headquarters?.displayName} /><SignupReviewRow label={es ? "Programas" : "Programs"} value={programTypes.map((value) => optionLabel(OPPORTUNITY_TYPES, value, es ? "es" : "en")).join(", ")} />{institution?.sourceMode === "kleio_existing" && <p className="mt-4 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3 text-xs text-[#5B4B8A]">{es ? "Esta institución ya aparece en KLEIO. La cuenta no se conectará automáticamente; la membresía o reclamación requiere verificación." : "This institution already appears on KLEIO. The account will not be connected automatically; membership or claiming still requires verification."}</p>}</div>}
      {error && <p className="mt-4 rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-3 py-2 text-xs font-medium text-[oklch(0.42_0.12_45)]">{error}</p>}
      {isSubmitting ? <div className="mt-6 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 text-sm text-[#5B4B8A]">{es ? "Creando cuenta…" : "Creating account…"}</div> : <SignupStepControls step={step} totalSteps={STEPS.length} onBack={() => { setError(""); setStep((current) => Math.max(0, current - 1)) }} onNext={next} onSubmit={() => void submit()} submitLabel={es ? "Crear espacio" : "Create workspace"} />}
    </SignupStepCard>
  </SignupShell>
}
