"use client"

import { useEffect, useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2, Mail, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import {
  getAuthenticatedKleioUser,
  getKleioAuthErrorMessage,
  requestKleioPasswordReset,
  signOutAfterKleioPasswordReset,
  updateKleioPassword,
} from "@/lib/kleio-auth"
import { isKleioPasswordStrong, KLEIO_PASSWORD_MIN_LENGTH } from "@/lib/kleio-password-security"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

const inputClassName = "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10"

export function ForgotPasswordForm() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const emailId = useId()
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !email.trim()) return
    setError("")
    setSubmitting(true)
    try {
      await requestKleioPasswordReset(email)
      setSent(true)
    } catch (requestError) {
      setError(getKleioAuthErrorMessage(requestError, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <section className="rounded-2xl border border-[#D9D0F2] bg-card p-7 shadow-sm" aria-live="polite">
        <CheckCircle2 className="size-9 text-emerald-600" />
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">{es ? "Revisa tu correo" : "Check your email"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {es
            ? "Si existe una cuenta con ese correo, recibirás un enlace seguro para crear una nueva contraseña. Revisa también la carpeta de correo no deseado."
            : "If an account exists for that email, you will receive a secure link to create a new password. Check your spam folder as well."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/#login" className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            {es ? "Volver a iniciar sesión" : "Return to sign in"}
          </Link>
          <button type="button" onClick={() => setSent(false)} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-accent/50">
            {es ? "Usar otro correo" : "Use another email"}
          </button>
        </div>
      </section>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm" noValidate>
      <div className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-4">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-[#5B4B8A]"><Mail className="size-4" /></span>
        <p className="text-xs leading-relaxed text-[#6F6882]">
          {es ? "KLEIO usa un proceso seguro de recuperación y no revelará si un correo pertenece a una cuenta." : "KLEIO uses a secure recovery process and will not reveal whether an email belongs to an account."}
        </p>
      </div>
      <label htmlFor={emailId} className="mt-5 block text-xs font-medium text-muted-foreground">{es ? "Correo electrónico" : "Email address"}</label>
      <input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" inputMode="email" className={`${inputClassName} mt-1.5`} aria-invalid={Boolean(error)} aria-describedby={error ? `${emailId}-error` : undefined} />
      {error && <p id={`${emailId}-error`} role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting || !email.trim()} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitting ? (es ? "Enviando…" : "Sending…") : (es ? "Enviar enlace seguro" : "Send secure reset link")}
      </button>
      <Link href="/#login" className="mt-4 inline-flex text-xs font-medium text-muted-foreground hover:text-foreground">{es ? "Volver al inicio de sesión" : "Back to sign in"}</Link>
    </form>
  )
}

type RecoveryState = "checking" | "ready" | "invalid" | "complete"

export function UpdatePasswordForm() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const passwordId = useId()
  const confirmId = useId()
  const [state, setState] = useState<RecoveryState>("checking")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    const supabase = getSupabaseBrowserClient()

    async function resolveRecoverySession(finalAttempt = false) {
      const user = await getAuthenticatedKleioUser()
      if (!active) return
      if (user) setState("ready")
      else if (finalAttempt) setState("invalid")
    }

    void resolveRecoverySession(false)
    const timer = window.setTimeout(() => void resolveRecoverySession(true), 1600)
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === "PASSWORD_RECOVERY" || session?.user) setState("ready")
    })

    return () => {
      active = false
      window.clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || state !== "ready") return
    setError("")
    if (!isKleioPasswordStrong(password)) {
      setError(es ? "Usa al menos 12 caracteres e incluye mayúscula, minúscula, número y símbolo." : "Use at least 12 characters and include uppercase, lowercase, a number, and a symbol.")
      return
    }
    if (password !== confirmPassword) {
      setError(es ? "Las contraseñas no coinciden." : "The passwords do not match.")
      return
    }

    setSubmitting(true)
    try {
      await updateKleioPassword(password)
      setState("complete")
      await signOutAfterKleioPasswordReset().catch(() => undefined)
      window.setTimeout(() => router.replace("/?password-reset=success#login"), 700)
    } catch (updateError) {
      setError(getKleioAuthErrorMessage(updateError, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  if (state === "checking") {
    return <div className="flex items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm"><Loader2 className="mr-2 size-4 animate-spin text-primary" />{es ? "Verificando el enlace seguro…" : "Verifying the secure link…"}</div>
  }

  if (state === "invalid") {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm" role="alert">
        <h2 className="font-serif text-xl font-semibold text-foreground">{es ? "El enlace no es válido" : "This link is not valid"}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{es ? "El enlace pudo vencer o ya haberse usado. Solicita uno nuevo para continuar." : "The link may have expired or already been used. Request a new one to continue."}</p>
        <Link href="/auth/forgot-password/" className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">{es ? "Solicitar un enlace nuevo" : "Request a new link"}</Link>
      </section>
    )
  }

  if (state === "complete") {
    return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm" aria-live="polite"><CheckCircle2 className="size-8 text-emerald-600" /><h2 className="mt-3 font-serif text-xl font-semibold text-foreground">{es ? "Contraseña actualizada" : "Password updated"}</h2><p className="mt-2 text-sm text-muted-foreground">{es ? "Volviendo al inicio de sesión…" : "Returning to sign in…"}</p></section>
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm" noValidate>
      <div className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-4"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#5B4B8A]" /><p className="text-xs leading-relaxed text-[#6F6882]">{es ? "Crea una contraseña única de al menos 12 caracteres con mayúscula, minúscula, número y símbolo. KLEIO también bloquea contraseñas filtradas." : "Create a unique password with at least 12 characters, including uppercase, lowercase, a number, and a symbol. KLEIO also blocks breached passwords."}</p></div>
      <label htmlFor={passwordId} className="mt-5 block text-xs font-medium text-muted-foreground">{es ? "Nueva contraseña" : "New password"}</label>
      <div className="relative mt-1.5">
        <input id={passwordId} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={KLEIO_PASSWORD_MIN_LENGTH} autoComplete="new-password" className={`${inputClassName} pr-11`} aria-invalid={Boolean(error)} />
        <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label={showPassword ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
      </div>
      <label htmlFor={confirmId} className="mt-4 block text-xs font-medium text-muted-foreground">{es ? "Confirmar contraseña" : "Confirm password"}</label>
      <input id={confirmId} type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={KLEIO_PASSWORD_MIN_LENGTH} autoComplete="new-password" className={`${inputClassName} mt-1.5`} aria-invalid={Boolean(error)} />
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={submitting || !isKleioPasswordStrong(password) || confirmPassword.length < KLEIO_PASSWORD_MIN_LENGTH} className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitting ? (es ? "Actualizando…" : "Updating…") : (es ? "Actualizar contraseña" : "Update password")}
      </button>
    </form>
  )
}
