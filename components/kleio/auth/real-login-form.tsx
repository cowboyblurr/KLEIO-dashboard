"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"
import { getKleioAuthErrorMessage } from "@/lib/kleio-auth"
import { signInKleioAccount, type KleioAccount } from "@/lib/kleio-supabase"
import { cn } from "@/lib/utils"

export function RealLoginForm({
  onSuccess,
  compact = false,
  className,
}: {
  onSuccess: (account: KleioAccount) => void | Promise<void>
  compact?: boolean
  className?: string
}) {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const emailId = useId()
  const passwordId = useId()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !email.trim() || !password) return
    setError("")
    setSubmitting(true)
    try {
      const account = await signInKleioAccount(email, password)
      clearDemoSession()
      setKleioMode("live")
      await onSuccess(account)
    } catch (loginError) {
      setError(getKleioAuthErrorMessage(loginError, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName = cn(
    "w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10",
    compact ? "h-9" : "h-10",
  )

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <div className="flex items-start gap-2.5">
        <span className={cn("grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary", compact ? "size-8" : "size-9")}><ShieldCheck className="size-4" /></span>
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Cuenta autenticada" : "Authenticated account"}</p>
          <p className={cn("mt-1 leading-relaxed text-muted-foreground", compact ? "text-[0.66rem]" : "text-xs")}>
            {es ? "Inicia sesión con tu cuenta persistente de artista o institución." : "Sign in with your persistent artist or institution account."}
          </p>
        </div>
      </div>

      <div className={cn("grid gap-3", compact ? "mt-3" : "mt-4")}>
        <div>
          <label htmlFor={emailId} className="mb-1.5 block text-xs font-medium text-muted-foreground">{es ? "Correo electrónico" : "Email address"}</label>
          <input id={emailId} type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" inputMode="email" className={inputClassName} aria-invalid={Boolean(error)} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label htmlFor={passwordId} className="text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</label>
            <Link href="/auth/forgot-password/" className="text-[0.66rem] font-semibold text-primary hover:underline">{es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}</Link>
          </div>
          <div className="relative">
            <input id={passwordId} type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete="current-password" className={`${inputClassName} pr-11`} aria-invalid={Boolean(error)} />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50 hover:text-foreground" aria-label={showPassword ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      <button type="submit" disabled={submitting || !email.trim() || !password} className={cn("inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50", compact ? "mt-3 h-9 text-xs" : "mt-4 h-10 text-sm")}>
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitting ? (es ? "Verificando…" : "Verifying…") : (es ? "Iniciar sesión" : "Sign in")}
      </button>
    </form>
  )
}
