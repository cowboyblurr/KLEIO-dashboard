"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { EntityAutocomplete } from "@/components/kleio/signup/entity-autocomplete"
import { SignupShell, SignupStepCard, SignupTextArea } from "@/components/kleio/signup/signup-shell"
import { PrimaryTaxonomySelect, TaxonomyMultiSelect } from "@/components/kleio/forms/artist-beta-taxonomy-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession, getDashboardForRole } from "@/lib/kleio-demo-auth"
import type { KleioEntitySuggestion } from "@/lib/kleio-entity-search"
import {
  completeAuthenticatedKleioOnboarding,
  completeKleioOnboarding,
  resumePendingKleioOnboarding,
  savePendingKleioOnboarding,
  signUpKleioAccount,
  subscribeToKleioAuth,
  type ArtistOnboardingPayload,
} from "@/lib/kleio-live-onboarding"
import { setKleioMode } from "@/lib/kleio-mode"
import { getKleioAuthErrorMessage, resendKleioSignupConfirmation } from "@/lib/kleio-auth"
import { loadKleioAccount } from "@/lib/kleio-supabase"
import {
  ARTIST_DISCIPLINE_OPTIONS,
  ARTIST_MEDIUM_MATERIAL_OPTIONS,
} from "@/lib/kleio-artist-taxonomy"

const inputClassName = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:text-muted-foreground"

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  autoComplete,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "email" | "url"
  placeholder?: string
  required?: boolean
  autoComplete?: string
  disabled?: boolean
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <span>{label}{required ? " *" : ""}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        className={inputClassName}
      />
    </label>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  es,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  es: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <span>{label} *</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required
          minLength={8}
          autoComplete="new-password"
          className={`${inputClassName} pr-11`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          aria-label={visible ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

export function LiveArtistSignup() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"

  const [submitting, setSubmitting] = useState(false)
  const [resuming, setResuming] = useState(true)
  const [recoveringExistingAccount, setRecoveringExistingAccount] = useState(false)
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
  const [primaryDiscipline, setPrimaryDiscipline] = useState("")
  const [secondaryDisciplines, setSecondaryDisciplines] = useState<string[]>([])
  const [mediums, setMediums] = useState<string[]>([])
  const [shortBio, setShortBio] = useState("")
  const [artistStatement, setArtistStatement] = useState("")

  const title = recoveringExistingAccount
    ? (es ? "Termina tu Pasaporte Creativo" : "Finish your Creative Passport")
    : (es ? "Crea tu cuenta de artista" : "Create your artist account")
  const subtitle = recoveringExistingAccount
    ? (es
      ? "Tu correo ya está confirmado. Completa los datos que faltan para abrir tu espacio privado."
      : "Your email is confirmed. Complete the missing details to open your private workspace.")
    : (es
      ? "Empieza con la información esencial. Podrás ampliar y actualizar el Pasaporte después."
      : "Start with the essentials. You can expand and update the Passport after signup.")

  const requiredReady = useMemo(() => {
    const credentialsReady = recoveringExistingAccount || (password.length >= 8 && password === confirmPassword)
    return Boolean(displayName.trim() && email.trim() && credentialsReady && location.trim() && primaryDiscipline)
  }, [confirmPassword, displayName, email, location, password, primaryDiscipline, recoveringExistingAccount])

  function routeToWorkspace() {
    clearDemoSession()
    setKleioMode("live")
    router.replace(getDashboardForRole("artist"))
  }

  useEffect(() => {
    let cancelled = false

    async function resume() {
      try {
        const completed = await resumePendingKleioOnboarding("artist")
        if (cancelled) return
        if (completed) {
          routeToWorkspace()
          return
        }

        const account = await loadKleioAccount()
        if (cancelled || !account) return
        if (account.profile.onboarding_completed || account.profile.role !== "artist") {
          clearDemoSession()
          setKleioMode("live")
          router.replace(getDashboardForRole(account.profile.role))
          return
        }

        setRecoveringExistingAccount(true)
        setEmail(account.user.email ?? account.profile.email ?? "")
        setDisplayName(account.profile.display_name ?? "")
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
  // Role and locale are stable for this route; resubscribing during entry would interrupt recovery.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function buildPayload(): ArtistOnboardingPayload {
    const disciplines = [primaryDiscipline, ...secondaryDisciplines.filter((item) => item !== primaryDiscipline)]
    return {
      role: "artist",
      email,
      displayName,
      location,
      selectedLocation,
      discipline: disciplines.join(", "),
      website,
      shortBio,
      artistStatement,
      mediums: mediums.join(", "),
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError("")

    if (!requiredReady) {
      setError(
        recoveringExistingAccount
          ? (es ? "Completa los campos obligatorios para terminar el perfil." : "Complete the required fields to finish your profile.")
          : (es ? "Completa los campos obligatorios y confirma una contraseña de al menos 8 caracteres." : "Complete the required fields and confirm a password of at least 8 characters."),
      )
      return
    }

    const payload = buildPayload()
    setSubmitting(true)
    savePendingKleioOnboarding(payload)

    try {
      if (recoveringExistingAccount) {
        await completeAuthenticatedKleioOnboarding(payload)
        routeToWorkspace()
        return
      }

      const signup = await signUpKleioAccount({
        email,
        password,
        displayName,
        role: "artist",
        payload,
      })
      if (signup.confirmationRequired) {
        setConfirmationEmail(email.trim().toLowerCase())
        return
      }
      await completeKleioOnboarding(signup.userId, payload)
      routeToWorkspace()
    } catch (submitError) {
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
      await resendKleioSignupConfirmation(confirmationEmail, "artist")
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
              ? `Enviamos un enlace a ${confirmationEmail}. Ábrelo para confirmar la cuenta; KLEIO guardará el perfil conectado a ese usuario al regresar.`
              : `We sent a link to ${confirmationEmail}. Open it to confirm the account; KLEIO will save the profile connected to that user when you return.`}
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#E7E1F7] bg-[#F8F5FF] px-3 py-2 text-xs leading-relaxed text-[#625C70]">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
            <p>Your profile photo, CV, portfolio, and private application materials are added only after the confirmed account opens.</p>
          </div>
          {confirmationStatus && <p role="status" className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">{confirmationStatus}</p>}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void resendConfirmation()} disabled={resending} className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {resending && <Loader2 className="mr-2 size-4 animate-spin" />}
              {resending ? (es ? "Enviando…" : "Sending…") : (es ? "Reenviar enlace" : "Resend link")}
            </button>
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
      <form onSubmit={handleSubmit} noValidate>
        <SignupStepCard>
          {recoveringExistingAccount && (
            <div className="mb-5 rounded-2xl border border-[#D9D0F2] bg-[#F8F5FF] px-4 py-3 text-sm leading-relaxed text-[#5B4B8A]" role="status">
              {es
                ? "Encontramos tu cuenta confirmada. No necesitas registrarte otra vez; completa estos datos para terminar el perfil."
                : "We found your confirmed account. You do not need to register again; complete these details to finish the profile."}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={es ? "Nombre profesional" : "Professional name"} value={displayName} onChange={setDisplayName} required autoComplete="name" />
            <TextField label={es ? "Correo" : "Email"} value={email} onChange={setEmail} type="email" required autoComplete="email" disabled={recoveringExistingAccount} />
            {!recoveringExistingAccount && (
              <>
                <PasswordField label={es ? "Contraseña" : "Password"} value={password} onChange={setPassword} es={es} placeholder={es ? "Mínimo 8 caracteres" : "At least 8 characters"} />
                <PasswordField label={es ? "Confirmar contraseña" : "Confirm password"} value={confirmPassword} onChange={setConfirmPassword} es={es} />
              </>
            )}
          </div>

          <div className="my-6 border-t border-border" />

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
            <TextField label={es ? "Sitio web" : "Website"} value={website} onChange={setWebsite} placeholder="https://" autoComplete="url" />
          </div>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <PrimaryTaxonomySelect
              label={es ? "Disciplina principal" : "Primary discipline"}
              value={primaryDiscipline}
              onChange={setPrimaryDiscipline}
              options={ARTIST_DISCIPLINE_OPTIONS}
              locale={es ? "es" : "en"}
              required
              placeholder={es ? "Selecciona una disciplina" : "Select a discipline"}
              helper={es ? "La disciplina principal ayuda a organizar oportunidades y tu perfil." : "Your primary discipline helps organize opportunities and your profile."}
            />
            <TaxonomyMultiSelect
              label={es ? "Disciplinas secundarias" : "Secondary disciplines"}
              values={secondaryDisciplines}
              onChange={setSecondaryDisciplines}
              options={ARTIST_DISCIPLINE_OPTIONS}
              locale={es ? "es" : "en"}
              placeholder={es ? "Busca y selecciona" : "Search and select"}
              helper={es ? "Añade todas las prácticas que describan tu trabajo." : "Add the practices that genuinely describe your work."}
              kind="discipline"
            />
          </div>

          <div className="mt-5">
            <TaxonomyMultiSelect
              label={es ? "Medios y materiales" : "Mediums and materials"}
              values={mediums}
              onChange={setMediums}
              options={ARTIST_MEDIUM_MATERIAL_OPTIONS}
              locale={es ? "es" : "en"}
              placeholder={es ? "Arcilla, película, textil…" : "Clay, film, textile…"}
              helper={es ? "Los medios y materiales se mantienen separados de las disciplinas." : "Mediums and materials remain separate from disciplines."}
              kind="medium"
            />
          </div>

          <div className="mt-5 space-y-5">
            <SignupTextArea label={es ? "Biografía corta" : "Short bio"} value={shortBio} onChange={setShortBio} rows={3} />
            <SignupTextArea label={es ? "Declaración artística" : "Artist statement"} value={artistStatement} onChange={setArtistStatement} rows={5} />
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-lg text-xs leading-relaxed text-muted-foreground">
              <p>{es
                ? "Nada se publica automáticamente. Podrás revisar, ampliar y decidir qué información es pública después de confirmar tu cuenta."
                : "Nothing is published automatically. After confirmation, you can review, expand, and decide what information becomes public."}</p>
              {!recoveringExistingAccount && <Link href="/#login" className="mt-2 inline-flex font-semibold text-primary hover:underline">{es ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</Link>}
            </div>
            <button type="submit" disabled={submitting} className="inline-flex h-11 min-w-44 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {submitting
                ? (es ? "Guardando…" : "Saving…")
                : recoveringExistingAccount
                  ? (es ? "Terminar Pasaporte" : "Finish Passport")
                  : (es ? "Crear cuenta de artista" : "Create artist account")}
            </button>
          </div>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
