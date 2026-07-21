"use client"

import { useEffect, useId, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { EntityAutocomplete } from "@/components/kleio/signup/entity-autocomplete"
import { SignupShell, SignupStepCard, SignupTextArea } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession, getDashboardForRole } from "@/lib/kleio-demo-auth"
import type { KleioEntitySuggestion } from "@/lib/kleio-entity-search"
import {
  clearPendingKleioOnboarding,
  completeKleioOnboarding,
  resumePendingKleioOnboarding,
  savePendingKleioOnboarding,
  signUpKleioAccount,
  subscribeToKleioAuth,
  type ArtistOnboardingPayload,
  type InstitutionOnboardingPayload,
} from "@/lib/kleio-live-onboarding"
import { setKleioMode } from "@/lib/kleio-mode"
import { getKleioAuthErrorMessage, resendKleioSignupConfirmation } from "@/lib/kleio-auth"

const inputClassName = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10"

const INSTITUTION_TYPES = [
  ["museum", "Museum", "Museo"],
  ["gallery", "Gallery", "Galería"],
  ["arts_nonprofit", "Arts nonprofit", "Organización artística sin fines de lucro"],
  ["foundation", "Foundation", "Fundación"],
  ["residency", "Residency", "Residencia"],
  ["university_college", "University or college", "Universidad o colegio"],
  ["cultural_organization", "Cultural organization", "Organización cultural"],
  ["government_arts_agency", "Government arts agency", "Agencia pública de artes"],
  ["independent_curatorial_organization", "Independent curatorial organization", "Organización curatorial independiente"],
  ["festival_biennial", "Festival or biennial", "Festival o bienal"],
  ["artist_run_organization", "Artist-run organization", "Organización dirigida por artistas"],
  ["other", "Other", "Otro"],
] as const

function Field({ label, value, onChange, type = "text", placeholder, required, autoComplete }: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "url"
  placeholder?: string
  required?: boolean
  autoComplete?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        className={inputClassName}
      />
    </div>
  )
}

function PasswordField({ label, value, onChange, placeholder, es }: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  es: boolean
}) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{label} *</label>
      <div className="relative">
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} required minLength={8} autoComplete="new-password" className={`${inputClassName} pr-11`} />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label={visible ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
      </div>
    </div>
  )
}

function InstitutionTypeField({ value, onChange, es }: { value: string; onChange: (value: string) => void; es: boolean }) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Tipo de institución" : "Institution type"} *</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required className={inputClassName}>
        <option value="">{es ? "Selecciona un tipo" : "Select a type"}</option>
        {INSTITUTION_TYPES.map(([key, en, spanish]) => <option key={key} value={key}>{es ? spanish : en}</option>)}
      </select>
    </div>
  )
}

export function LiveSignup({ role }: { role: "artist" | "institution" }) {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [submitting, setSubmitting] = useState(false)
  const [resuming, setResuming] = useState(true)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [confirmationStatus, setConfirmationStatus] = useState("")
  const [error, setError] = useState("")

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [location, setLocation] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<KleioEntitySuggestion | null>(null)
  const [website, setWebsite] = useState("")

  const [discipline, setDiscipline] = useState("")
  const [shortBio, setShortBio] = useState("")
  const [artistStatement, setArtistStatement] = useState("")
  const [mediums, setMediums] = useState("")

  const [institutionName, setInstitutionName] = useState("")
  const [selectedInstitution, setSelectedInstitution] = useState<KleioEntitySuggestion | null>(null)
  const [institutionType, setInstitutionType] = useState("")
  const [publicDescription, setPublicDescription] = useState("")
  const [missionStatement, setMissionStatement] = useState("")

  const title = role === "artist"
    ? (es ? "Crea tu cuenta y Pasaporte Creativo" : "Create your account and Creative Passport")
    : (es ? "Crea tu cuenta institucional" : "Create your institution account")
  const subtitle = role === "artist"
    ? (es ? "Guarda un perfil reutilizable y mantén el control de tus materiales." : "Save a reusable profile while keeping control of your materials.")
    : (es ? "Prepara un espacio seguro para convocatorias, revisión y colaboración." : "Prepare a secure workspace for calls, review, and collaboration.")

  const requiredReady = useMemo(() => {
    const common = displayName.trim() && email.trim() && password.length >= 8 && password === confirmPassword && location.trim()
    if (role === "artist") return Boolean(common && discipline.trim())
    return Boolean(common && institutionName.trim() && institutionType.trim())
  }, [confirmPassword, discipline, displayName, email, institutionName, institutionType, location, password, role])

  function routeToWorkspace() {
    clearDemoSession()
    setKleioMode("live")
    router.replace(getDashboardForRole(role))
  }

  useEffect(() => {
    let cancelled = false

    async function resume() {
      try {
        const completed = await resumePendingKleioOnboarding(role)
        if (!cancelled && completed) routeToWorkspace()
      } catch (resumeError) {
        if (!cancelled) setError(getKleioAuthErrorMessage(resumeError, es ? "es" : "en"))
      } finally {
        if (!cancelled) setResuming(false)
      }
    }

    void resume()
    const subscription = subscribeToKleioAuth((_event, session) => {
      if (session) void resume()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  // The role and locale are stable enough for this route; re-subscribing during data entry would interrupt recovery.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  function buildPayload(): ArtistOnboardingPayload | InstitutionOnboardingPayload {
    if (role === "artist") {
      return { role, email, displayName, location, selectedLocation, discipline, website, shortBio, artistStatement, mediums }
    }

    return { role, email, displayName, institutionName, selectedInstitution, institutionType, location, selectedLocation, website, publicDescription, missionStatement }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError("")

    if (!requiredReady) {
      setError(es ? "Completa los campos obligatorios y confirma una contraseña de al menos 8 caracteres." : "Complete the required fields and confirm a password of at least 8 characters.")
      return
    }

    const payload = buildPayload()
    setSubmitting(true)
    savePendingKleioOnboarding(payload)

    try {
      const signup = await signUpKleioAccount({ email, password, displayName, role })
      if (signup.confirmationRequired) {
        setConfirmationEmail(email.trim().toLowerCase())
        return
      }
      await completeKleioOnboarding(signup.userId, payload)
      routeToWorkspace()
    } catch (submitError) {
      clearPendingKleioOnboarding()
      setError(getKleioAuthErrorMessage(submitError, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  async function resendConfirmation() {
    if (resending || !confirmationEmail) return
    setConfirmationStatus("")
    setResending(true)
    try {
      await resendKleioSignupConfirmation(confirmationEmail, role)
      setConfirmationStatus(es ? "Enviamos un enlace nuevo. Revisa tu correo y la carpeta de no deseados." : "A new link was sent. Check your inbox and spam folder.")
    } catch (resendError) {
      setConfirmationStatus(getKleioAuthErrorMessage(resendError, es ? "es" : "en"))
    } finally {
      setResending(false)
    }
  }

  if (resuming) {
    return (
      <SignupShell title={title} subtitle={subtitle}>
        <div className="mx-auto flex max-w-md items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="mr-2 size-4 animate-spin text-primary" />
          {es ? "Comprobando el estado de tu cuenta…" : "Checking your account status…"}
        </div>
      </SignupShell>
    )
  }

  if (confirmationEmail) {
    return (
      <SignupShell title={title} subtitle={subtitle}>
        <div className="mx-auto max-w-lg rounded-2xl border border-[#D9D0F2] bg-card p-7 shadow-sm" aria-live="polite">
          <CheckCircle2 className="size-9 text-emerald-600" />
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">{es ? "Confirma tu correo" : "Confirm your email"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {es
              ? `Enviamos un enlace a ${confirmationEmail}. Ábrelo para confirmar tu cuenta; KLEIO terminará de guardar tu perfil al regresar.`
              : `We sent a link to ${confirmationEmail}. Open it to confirm your account; KLEIO will finish saving your profile when you return.`}
          </p>
          {confirmationStatus && <p role="status" className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">{confirmationStatus}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void resendConfirmation()} disabled={resending} className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{resending && <Loader2 className="mr-2 size-4 animate-spin" />}{resending ? (es ? "Enviando…" : "Sending…") : (es ? "Reenviar enlace" : "Resend link")}</button>
            <button type="button" onClick={() => { setConfirmationEmail(""); setConfirmationStatus("") }} className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground hover:bg-accent/50">
              {es ? "Corregir correo o volver" : "Correct email or go back"}
            </button>
          </div>
        </div>
      </SignupShell>
    )
  }

  return (
    <SignupShell title={title} subtitle={subtitle}>
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-[#43386B]"><ShieldCheck className="size-4" />{es ? "Registro real y persistente" : "Real, persistent registration"}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#6F6882]">{es ? "La cuenta y el perfil se guardan en Supabase. Los resultados de ubicación se revisan antes de guardarse." : "Your account and profile are saved in Supabase. Location results are reviewed before they are saved."}</p>
        </div>
        <Link href="/demo/" className="shrink-0 rounded-xl border border-[#D8D0F2] bg-white px-3 py-2 text-xs font-semibold text-[#5B4B8A] hover:bg-white/70">
          {es ? "Prefiero explorar el demo" : "Explore the guided demo instead"}
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <SignupStepCard>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={role === "artist" ? (es ? "Nombre profesional" : "Professional name") : (es ? "Tu nombre" : "Your name")} value={displayName} onChange={setDisplayName} required autoComplete="name" />
            <Field label={es ? "Correo" : "Email"} value={email} onChange={setEmail} type="email" required autoComplete="email" />
            <PasswordField label={es ? "Contraseña" : "Password"} value={password} onChange={setPassword} es={es} placeholder={es ? "Mínimo 8 caracteres" : "At least 8 characters"} />
            <PasswordField label={es ? "Confirmar contraseña" : "Confirm password"} value={confirmPassword} onChange={setConfirmPassword} es={es} />
          </div>
          <p className="mt-2 text-[0.68rem] leading-relaxed text-muted-foreground">{es ? "Usa al menos 8 caracteres. Para mayor seguridad, combina palabras, números o símbolos y evita reutilizar otra contraseña." : "Use at least 8 characters. For stronger security, combine words, numbers, or symbols and avoid reusing another password."}</p>

          <div className="my-6 border-t border-border" />

          {role === "institution" && (
            <div className="mb-5 grid gap-5 sm:grid-cols-2">
              <EntityAutocomplete
                label={es ? "Institución u organización" : "Institution or organization"}
                value={institutionName}
                onChange={setInstitutionName}
                onSelect={(suggestion) => {
                  setSelectedInstitution(suggestion)
                  if (suggestion && !location.trim()) {
                    setLocation(suggestion.locationData.formatted_address)
                    setSelectedLocation(suggestion)
                  }
                }}
                kind="institution"
                locale={es ? "es" : "en"}
                placeholder={es ? "Museo, galería, universidad…" : "Museum, gallery, university…"}
                required
              />
              <InstitutionTypeField value={institutionType} onChange={setInstitutionType} es={es} />
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <EntityAutocomplete
              label={es ? "Ubicación" : "Location"}
              value={location}
              onChange={setLocation}
              onSelect={setSelectedLocation}
              kind="location"
              locale={es ? "es" : "en"}
              placeholder={es ? "Ciudad, región o país" : "City, region, or country"}
              required
            />
            <Field label={es ? "Sitio web" : "Website"} value={website} onChange={setWebsite} placeholder="https://" autoComplete="url" />
          </div>

          {role === "artist" ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label={es ? "Disciplina principal" : "Primary discipline"} value={discipline} onChange={setDiscipline} required placeholder={es ? "Pintura, fotografía…" : "Painting, photography…"} />
                <Field label={es ? "Medios" : "Mediums"} value={mediums} onChange={setMediums} placeholder={es ? "Separados por comas" : "Comma-separated"} />
              </div>
              <SignupTextArea label={es ? "Biografía corta" : "Short bio"} value={shortBio} onChange={setShortBio} rows={3} />
              <SignupTextArea label={es ? "Declaración artística" : "Artist statement"} value={artistStatement} onChange={setArtistStatement} rows={5} />
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              <SignupTextArea label={es ? "Descripción pública" : "Public description"} value={publicDescription} onChange={setPublicDescription} rows={4} />
              <SignupTextArea label={es ? "Misión" : "Mission statement"} value={missionStatement} onChange={setMissionStatement} rows={4} />
            </div>
          )}

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md text-xs leading-relaxed text-muted-foreground">
              <p>{es ? "Los campos sugeridos nunca se vuelven oficiales hasta que eliges un resultado y envías el formulario." : "Suggested fields never become official until you choose a result and submit the form."}</p>
              <Link href="/#login" className="mt-2 inline-flex font-semibold text-primary hover:underline">{es ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</Link>
            </div>
            <button type="submit" disabled={submitting || !requiredReady} className="inline-flex h-11 min-w-40 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {submitting ? (es ? "Creando…" : "Creating…") : role === "artist" ? (es ? "Crear Pasaporte" : "Create Passport") : (es ? "Crear espacio" : "Create workspace")}
            </button>
          </div>
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
