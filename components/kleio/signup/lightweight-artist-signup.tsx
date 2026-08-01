"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { SignupShell, SignupStepCard } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { getKleioAuthErrorMessage, resendKleioSignupConfirmation } from "@/lib/kleio-auth"
import { setKleioMode } from "@/lib/kleio-mode"
import { isKleioPasswordStrong, KLEIO_PASSWORD_MIN_LENGTH } from "@/lib/kleio-password-security"
import { getKleioReturnRoute, readKleioReturnIntent } from "@/lib/kleio-return-intent"
import { ensureLightweightArtistWorkspace, signUpLightweightArtistAccount } from "@/lib/kleio-lightweight-artist-signup"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const inputClassName = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-muted/50"

function PasswordField({ label, value, onChange, confirmation = false }: { label: string; value: string; onChange: (value: string) => void; confirmation?: boolean }) {
  const id = useId()
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <span>{label} *</span>
      <span className="relative">
        <input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} required minLength={KLEIO_PASSWORD_MIN_LENGTH} autoComplete={confirmation ? "new-password" : "new-password"} className={`${inputClassName} pr-11`} />
        <button type="button" onClick={() => setVisible((current) => !current)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50" aria-label={visible ? "Hide password" : "Show password"}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
      </span>
    </label>
  )
}

export function LightweightArtistSignup() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [checking, setChecking] = useState(true)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [confirmationStatus, setConfirmationStatus] = useState("")
  const [error, setError] = useState("")

  function routeAfterAccountReady() {
    clearDemoSession()
    setKleioMode("live")
    const intent = readKleioReturnIntent()
    router.replace(intent ? getKleioReturnRoute(intent) : "/artist-dashboard/")
  }

  useEffect(() => {
    let active = true
    void ensureLightweightArtistWorkspace()
      .then((workspace) => {
        if (!active || !workspace) return
        void trackKleioProductEvent("confirmation_completed", { surface: "artist_signup", metadata: { role: "artist" } })
        routeAfterAccountReady()
      })
      .catch((reason) => { if (active) setError(getKleioAuthErrorMessage(reason, es ? "es" : "en")) })
      .finally(() => { if (active) setChecking(false) })
    void trackKleioProductEvent("signup_started", { surface: "artist_signup", metadata: { role: "artist" } })
    return () => { active = false }
  // The signup route is intentionally checked only once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return
    setError("")
    void trackKleioProductEvent("signup_submitted", { surface: "artist_signup", metadata: { role: "artist" } })

    if (!displayName.trim() || !email.trim() || !isKleioPasswordStrong(password) || password !== confirmPassword || !accepted) {
      setError(es ? "Completa los campos, acepta el aviso y usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo." : "Complete the fields, accept the notice, and use at least 12 characters with uppercase, lowercase, a number, and a symbol.")
      void trackKleioProductEvent("signup_validation_failed", { surface: "artist_signup", metadata: { reason: "required_fields" } })
      return
    }

    setSubmitting(true)
    try {
      const result = await signUpLightweightArtistAccount({
        displayName: displayName.trim(),
        email,
        password,
        acceptedAt: new Date().toISOString(),
      })
      void trackKleioProductEvent("account_created", { surface: "artist_signup", metadata: { role: "artist" } })
      if (result.confirmationRequired) {
        setConfirmationEmail(email.trim().toLowerCase())
        void trackKleioProductEvent("confirmation_required", { surface: "artist_signup", metadata: { role: "artist" } })
        return
      }
      await ensureLightweightArtistWorkspace()
      routeAfterAccountReady()
    } catch (reason) {
      setError(getKleioAuthErrorMessage(reason, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  async function resendConfirmation() {
    if (!confirmationEmail || resending) return
    setResending(true)
    setConfirmationStatus("")
    try {
      await resendKleioSignupConfirmation(confirmationEmail, "artist")
      setConfirmationStatus(es ? "Enviamos un enlace nuevo. Revisa tu correo y la carpeta de no deseados." : "A new link was sent. Check your inbox and spam folder.")
    } catch (reason) {
      setConfirmationStatus(getKleioAuthErrorMessage(reason, es ? "es" : "en"))
    } finally {
      setResending(false)
    }
  }

  const intent = typeof window === "undefined" ? null : readKleioReturnIntent()
  const title = es ? "Crea tu cuenta de artista" : "Create your artist account"
  const subtitle = intent
    ? (es ? "Guarda esta oportunidad y vuelve a ella después de confirmar tu correo." : "Save this opportunity context and return to it after confirming your email.")
    : (es ? "Empieza con una cuenta ligera. Tu ubicación, disciplina y materiales pueden esperar." : "Start with a lightweight account. Your location, discipline, and materials can wait.")

  if (checking) {
    return <SignupShell title={title} subtitle={subtitle}><div className="mx-auto flex max-w-md items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />{es ? "Comprobando tu cuenta…" : "Checking your account…"}</div></SignupShell>
  }

  if (confirmationEmail) {
    return (
      <SignupShell title={title} subtitle={subtitle}>
        <div className="mx-auto max-w-lg rounded-2xl border border-[#D9D0F2] bg-card p-7 shadow-sm" aria-live="polite">
          <CheckCircle2 className="size-9 text-emerald-600" />
          <h2 className="mt-4 font-serif text-2xl font-semibold">{es ? "Confirma tu correo" : "Confirm your email"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{es ? `Enviamos un enlace a ${confirmationEmail}. Al volver, KLEIO abrirá tu espacio y restaurará la oportunidad que estabas explorando.` : `We sent a link to ${confirmationEmail}. When you return, KLEIO will open your workspace and restore the opportunity you were exploring.`}</p>
          {confirmationStatus && <p role="status" className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">{confirmationStatus}</p>}
          <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void resendConfirmation()} disabled={resending} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{resending && <Loader2 className="mr-2 size-4 animate-spin" />}{resending ? (es ? "Enviando…" : "Sending…") : (es ? "Reenviar enlace" : "Resend link")}</button><button type="button" onClick={() => setConfirmationEmail("")} className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium">{es ? "Corregir correo" : "Correct email"}</button></div>
        </div>
      </SignupShell>
    )
  }

  return (
    <SignupShell title={title} subtitle={subtitle}>
      <form onSubmit={handleSubmit} noValidate>
        <SignupStepCard>
          {intent && <div className="mb-5 rounded-2xl border border-[#D9D0F2] bg-[#F8F5FF] px-4 py-3 text-sm leading-6 text-[#5B4B8A]">{es ? "Tu selección está guardada en este navegador durante 72 horas. Después de confirmar tu correo volverás a la oportunidad exacta." : "Your selection is saved in this browser for 72 hours. After confirming your email, you will return to the exact opportunity."}</div>}
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>{es ? "Nombre profesional" : "Professional or display name"} *</span><input className={inputClassName} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required autoComplete="name" /></label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground"><span>{es ? "Correo" : "Email"} *</span><input className={inputClassName} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            <PasswordField label={es ? "Contraseña" : "Password"} value={password} onChange={setPassword} />
            <PasswordField label={es ? "Confirmar contraseña" : "Confirm password"} value={confirmPassword} onChange={setConfirmPassword} confirmation />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">{es ? "La contraseña debe tener al menos 12 caracteres e incluir mayúscula, minúscula, número y símbolo. KLEIO también bloquea contraseñas encontradas en filtraciones conocidas." : "Use at least 12 characters with uppercase, lowercase, a number, and a symbol. KLEIO also blocks passwords found in known data breaches."}</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{es ? "La ubicación, disciplina, biografía, portafolio y preferencias se añaden progresivamente solo cuando sean útiles." : "Location, discipline, biography, portfolio, and preferences are added progressively only when they become useful."}</p>
          <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-xs leading-5 text-muted-foreground"><input type="checkbox" className="mt-0.5 size-4" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>{es ? "Acepto crear una cuenta KLEIO y entiendo que mi perfil, borradores privados y materiales aprobados se almacenarán para ofrecer las funciones que elija. Nada se publica automáticamente." : "I agree to create a KLEIO account and understand that my profile, private drafts, and approved materials will be stored to provide the features I choose. Nothing is published automatically."}</span></label>
          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs leading-5 text-muted-foreground"><p>{es ? "Tu Creative Passport empieza vacío y permanece privado hasta que decidas compartir información." : "Your Creative Passport starts empty and remains private until you choose to share information."}</p><Link href="/#login" className="mt-2 inline-flex font-semibold text-primary hover:underline">{es ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</Link></div>
            <button type="submit" disabled={submitting} className="inline-flex h-11 min-w-44 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50">{submitting && <Loader2 className="mr-2 size-4 animate-spin" />}{submitting ? (es ? "Creando…" : "Creating…") : (es ? "Crear cuenta" : "Create free account")}</button>
          </div>
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
