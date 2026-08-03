"use client"

import { useId, useState, type FormEvent } from "react"
import Link from "next/link"
import { ChevronRight, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"
import { getKleioAuthErrorMessage } from "@/lib/kleio-auth"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"
import { signInKleioAccount, type KleioAccount } from "@/lib/kleio-supabase"
import { cn } from "@/lib/utils"

export function RealLoginForm({
  onSuccess,
  compact = false,
  variant = "default",
  className,
}: {
  onSuccess: (account: KleioAccount) => void | Promise<void>
  compact?: boolean
  variant?: "default" | "landing"
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
  const landing = variant === "landing"
  const analyticsSurface = landing ? "landing_login" : "account_login"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || !email.trim() || !password) return
    setError("")
    setSubmitting(true)
    try {
      const account = await signInKleioAccount(email, password)
      clearDemoSession()
      setKleioMode("live")
      void trackKleioProductEvent("login_completed", {
        surface: analyticsSurface,
        metadata: { role: account.profile.role },
      })
      await onSuccess(account)
    } catch (loginError) {
      setError(getKleioAuthErrorMessage(loginError, es ? "es" : "en"))
      void trackKleioProductEvent("login_failed", {
        surface: analyticsSurface,
        metadata: {
          reason: "login_credentials_rejected",
          error_code: "login_credentials_rejected",
        },
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClassName = cn(
    "w-full border bg-card text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10",
    landing
      ? "h-9 rounded-full border-[#D8D0F2] bg-white/85 px-4 text-[0.72rem] placeholder:text-[#9A93A8] focus:border-[#9E8BD2] focus:ring-[#A997E8]/15"
      : cn("rounded-xl border-border px-3 text-sm", compact ? "h-9" : "h-10"),
  )

  return (
    <form onSubmit={handleSubmit} className={cn(landing && "flex flex-col", className)} noValidate>
      {!landing && (
        <div className="flex items-start gap-2.5">
          <span className={cn("grid shrink-0 place-items-center rounded-xl bg-primary/10 text-primary", compact ? "size-8" : "size-9")}><ShieldCheck className="size-4" /></span>
          <div>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Cuenta" : "Account"}</p>
            <p className={cn("mt-1 leading-relaxed text-muted-foreground", compact ? "text-[0.66rem]" : "text-xs")}>
              {es ? "Inicia sesión para continuar a tu espacio de artista o institución." : "Sign in to continue to your artist or institution workspace."}
            </p>
          </div>
        </div>
      )}

      <div className={cn("grid gap-2.5", landing ? "mt-3" : compact ? "mt-3" : "mt-4")}>
        <div>
          <label htmlFor={emailId} className={landing ? "sr-only" : "mb-1.5 block text-xs font-medium text-muted-foreground"}>{es ? "Correo electrónico" : "Email address"}</label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            placeholder={landing ? (es ? "Correo electrónico" : "Email address") : undefined}
            className={inputClassName}
            aria-invalid={Boolean(error)}
          />
        </div>
        <div>
          {!landing && (
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor={passwordId} className="text-xs font-medium text-muted-foreground">{es ? "Contraseña" : "Password"}</label>
              <Link href="/auth/forgot-password/" className="text-[0.66rem] font-semibold text-primary hover:underline">{es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}</Link>
            </div>
          )}
          <label htmlFor={passwordId} className="sr-only">{es ? "Contraseña" : "Password"}</label>
          <div className="relative">
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
              placeholder={landing ? (es ? "Contraseña" : "Password") : undefined}
              className={`${inputClassName} pr-11`}
              aria-invalid={Boolean(error)}
            />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-[#756B84] hover:bg-[#F2EDFC] hover:text-[#4D435C]" aria-label={showPassword ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
          </div>
        </div>
      </div>

      {landing && (
        <Link href="/auth/forgot-password/" className="mt-2 self-end text-[0.62rem] font-medium text-[#6F6882] transition-colors hover:text-[#514665] hover:underline">
          {es ? "¿Olvidaste tu contraseña?" : "Forgot password?"}
        </Link>
      )}

      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !email.trim() || !password}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all disabled:cursor-not-allowed",
          landing
            ? "mt-3 h-9 self-end rounded-full bg-[#5D506F] px-5 text-[0.7rem] text-white shadow-[0_8px_18px_rgba(69,56,86,0.16)] hover:-translate-y-px hover:bg-[#4B405D] hover:shadow-[0_10px_22px_rgba(69,56,86,0.20)] disabled:translate-y-0 disabled:bg-[#8D8498] disabled:opacity-70 disabled:shadow-none"
            : cn("w-full rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90 disabled:opacity-50", compact ? "mt-3 h-9 text-xs" : "mt-4 h-10 text-sm"),
        )}
      >
        {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
        {submitting ? (es ? "Ingresando…" : "Signing in…") : landing ? (es ? "Ingresar" : "Log in") : (es ? "Iniciar sesión" : "Sign in")}
        {landing && !submitting && <ChevronRight className="ml-1 size-3" />}
      </button>
    </form>
  )
}
