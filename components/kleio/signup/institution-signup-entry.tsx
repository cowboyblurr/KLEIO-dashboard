"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { SignupShell, SignupStepCard } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { googleAuthenticationAvailabilityMessage, isGoogleAuthenticationConfigured } from "@/lib/kleio-google-capabilities"
import { startKleioGoogleAuthentication } from "@/lib/kleio-google-auth"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"
import { loadKleioAccount } from "@/lib/kleio-supabase"

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.37l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.54l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.95c1.47 0 2.8.5 3.84 1.5l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
    </svg>
  )
}

export function InstitutionSignupEntry() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const googleConfigured = isGoogleAuthenticationConfigured()
  const [checking, setChecking] = useState(true)
  const [useExistingForm, setUseExistingForm] = useState(!googleConfigured)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void loadKleioAccount()
      .then((account) => {
        if (!active) return
        if (account) setUseExistingForm(true)
      })
      .catch(() => undefined)
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  async function continueWithGoogle() {
    if (googleBusy) return
    setGoogleBusy(true)
    setError("")
    void trackKleioProductEvent("signup_submitted", {
      surface: "institution_signup",
      metadata: { role: "institution", provider: "google" },
    })
    try {
      await startKleioGoogleAuthentication("institution")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not open Google sign-in.")
      setGoogleBusy(false)
    }
  }

  if (checking) {
    return <SignupShell title={es ? "Crea tu cuenta institucional" : "Create your institution account"} subtitle={es ? "Comprobando tu sesión…" : "Checking your account…"}><div role="status" className="mx-auto flex max-w-md items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin" />{es ? "Comprobando acceso…" : "Checking access…"}</div></SignupShell>
  }

  if (useExistingForm) return <LiveSignup role="institution" />

  return (
    <SignupShell
      title={es ? "Crea tu cuenta institucional" : "Create your institution account"}
      subtitle={es ? "Empieza con tu identidad y después configura el espacio de tu organización." : "Start with your identity, then configure your organization workspace."}
    >
      <SignupStepCard>
        <button type="button" onClick={() => void continueWithGoogle()} disabled={googleBusy || !googleConfigured} className="inline-flex min-h-11 w-full items-center justify-center gap-3 rounded-xl border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#292631] shadow-sm transition hover:bg-[#FBFAFE] disabled:cursor-not-allowed disabled:opacity-50">
          {googleBusy ? <Loader2 className="size-5 animate-spin" /> : <GoogleMark />}
          {googleBusy ? (es ? "Abriendo Google…" : "Opening Google…") : (es ? "Continuar con Google" : "Continue with Google")}
        </button>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">{googleAuthenticationAvailabilityMessage(es ? "es" : "en")}</p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">{es ? "Este paso confirma tu identidad solamente. No concede acceso a Gmail ni a Google Drive. Esos permisos se solicitan por separado únicamente cuando eliges usarlos." : "This step confirms identity only. It does not grant Gmail or Google Drive access. Those permissions are requested separately only when you choose to use them."}</p>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="my-6 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-border" /><span className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "o" : "or"}</span><span className="h-px flex-1 bg-border" /></div>
        <button type="button" onClick={() => setUseExistingForm(true)} className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">{es ? "Crear cuenta con correo" : "Create account with email"}</button>
        <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">{es ? "Si ya existe una cuenta KLEIO con el mismo correo verificado, Google puede conectarse a esa cuenta; KLEIO nunca cambia el tipo de espacio de una cuenta existente." : "If a KLEIO account already exists with the same verified email, Google can connect to that account; KLEIO never changes an established account's workspace type."}</p>
      </SignupStepCard>
    </SignupShell>
  )
}
