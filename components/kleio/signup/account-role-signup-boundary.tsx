"use client"

import { useEffect, useState } from "react"
import { ArrowRight, Loader2, LockKeyhole, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { SignupShell } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { clearPendingKleioOnboarding } from "@/lib/kleio-live-onboarding"
import { loadKleioAccount, signOutKleioAccount, type KleioAccount } from "@/lib/kleio-supabase"

type SignupRole = "artist" | "institution"
type BoundaryState = "checking" | "ready" | "conflict" | "error"

function roleLabel(role: KleioAccount["profile"]["role"], es: boolean) {
  if (role === "artist") return es ? "artista" : "artist"
  if (role === "institution") return es ? "institución" : "institution"
  return es ? "revisor" : "reviewer"
}

export function AccountRoleSignupBoundary({ role, children }: { role: SignupRole; children: React.ReactNode }) {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [state, setState] = useState<BoundaryState>("checking")
  const [account, setAccount] = useState<KleioAccount | null>(null)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void loadKleioAccount()
      .then((current) => {
        if (!active) return
        setAccount(current)
        setState(current && current.profile.role !== role ? "conflict" : "ready")
      })
      .catch((reason) => {
        if (!active) return
        setError(reason instanceof Error ? reason.message : "KLEIO could not verify the current session.")
        setState("error")
      })
    return () => { active = false }
  }, [role])

  async function signOutAndContinue() {
    if (switching) return
    setSwitching(true)
    setError("")
    clearPendingKleioOnboarding()
    try {
      await signOutKleioAccount()
      setAccount(null)
      setState("ready")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not sign out safely.")
    } finally {
      setSwitching(false)
    }
  }

  if (state === "ready") return <>{children}</>

  const requestedLabel = role === "institution"
    ? (es ? "espacio institucional" : "institution workspace")
    : (es ? "cuenta de artista" : "artist account")

  if (state === "checking") {
    return (
      <SignupShell title={es ? "Comprobando tu sesión" : "Checking your session"} subtitle={es ? "KLEIO está verificando el tipo de cuenta antes de continuar." : "KLEIO is confirming the account type before continuing."}>
        <div className="mx-auto flex max-w-md items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground shadow-sm" role="status">
          <Loader2 className="mr-2 size-4 animate-spin text-primary" />
          {es ? "Verificando acceso…" : "Verifying access…"}
        </div>
      </SignupShell>
    )
  }

  if (state === "error") {
    return (
      <SignupShell title={es ? "No pudimos verificar tu sesión" : "Your session could not be verified"} subtitle={es ? "Por seguridad, KLEIO no abrirá un flujo de registro hasta confirmar la cuenta activa." : "For safety, KLEIO will not open signup until the active account is confirmed."}>
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-white p-7 shadow-sm" role="alert">
          <p className="text-sm leading-6 text-red-700">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
            {es ? "Volver a comprobar" : "Check again"}
          </button>
        </div>
      </SignupShell>
    )
  }

  const activeRole = account?.profile.role ?? "artist"
  const displayName = account?.profile.display_name?.trim()

  return (
    <SignupShell
      title={es ? "Tu sesión actual usa otro tipo de cuenta" : "Your current session uses another account type"}
      subtitle={es ? `KLEIO no mezclará una cuenta de ${roleLabel(activeRole, es)} con un nuevo ${requestedLabel}.` : `KLEIO will not mix an active ${roleLabel(activeRole, es)} account with a new ${requestedLabel}.`}
    >
      <section className="mx-auto max-w-xl rounded-3xl border border-[#D9D0F2] bg-white p-7 shadow-[0_22px_60px_rgba(70,52,112,0.08)]" aria-labelledby="role-conflict-title">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><LockKeyhole className="size-5" /></span>
        <h2 id="role-conflict-title" className="mt-5 font-serif text-2xl font-semibold text-foreground">
          {es ? "Las cuentas propietarias permanecen separadas durante la beta" : "Owner accounts remain separate during beta"}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {es
            ? `Has iniciado sesión${displayName ? ` como ${displayName}` : ""} con una cuenta de ${roleLabel(activeRole, es)}. Para crear un ${requestedLabel}, cierra esta sesión y regístrate con un correo diferente. Las invitaciones a equipos institucionales se gestionan por separado.`
            : `You are signed in${displayName ? ` as ${displayName}` : ""} with an ${roleLabel(activeRole, es)} account. To create an ${requestedLabel}, sign out and register with a different email. Institution team invitations are handled separately.`}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => router.replace(getDashboardForRole(activeRole))} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">
            {es ? "Volver a mi espacio" : "Return to my workspace"}<ArrowRight className="size-4" />
          </button>
          <button type="button" onClick={() => void signOutAndContinue()} disabled={switching} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground disabled:opacity-50">
            {switching ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            {switching ? (es ? "Cerrando sesión…" : "Signing out…") : (es ? "Cerrar sesión y continuar" : "Sign out and continue")}
          </button>
        </div>
        {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </section>
    </SignupShell>
  )
}
