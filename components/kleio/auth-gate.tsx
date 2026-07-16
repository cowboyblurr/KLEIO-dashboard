"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  clearDemoSession,
  getDashboardForRole,
  getDemoSession,
  getPublicHomeHref,
  loginDemoUser,
  validateDemoCredentials,
  type KleioDemoSession,
} from "@/lib/kleio-demo-auth"
import {
  getSupabaseBrowserClient,
  loadKleioAccount,
  signInKleioAccount,
  signOutKleioAccount,
  type KleioAccount,
  type KleioAccountRole,
} from "@/lib/kleio-supabase"
import { clearKleioMode, setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type WorkspaceRole = "artist" | "institution" | "collaborator"
type AuthGateProps = { requiredRole?: WorkspaceRole; children: React.ReactNode }

type ResolvedAuth = {
  account: KleioAccount | null
  demoSession: KleioDemoSession | null
}

function roleLabel(role: WorkspaceRole, es: boolean) {
  if (!es) return role === "institution" ? "Institution" : role === "artist" ? "Artist" : "Reviewer"
  return role === "institution" ? "Institución" : role === "artist" ? "Artista" : "Revisor"
}

function RoleAccessButtons({ onSelect, mode, locale }: { onSelect: (role: WorkspaceRole, mode: KleioMode) => void; mode: KleioMode; locale: string }) {
  const es = locale === "es"
  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => onSelect("institution", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15">{roleLabel("institution", es)}</button>
      <button type="button" onClick={() => onSelect("artist", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{roleLabel("artist", es)}</button>
      <button type="button" onClick={() => onSelect("collaborator", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{roleLabel("collaborator", es)}</button>
    </div>
  )
}

function previewGuideState() {
  persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: true, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
}

function demoGuideState(role: WorkspaceRole) {
  persistDemoGuideState({
    isOpen: true,
    isMinimized: false,
    dismissed: false,
    activeScenarioId: role === "institution" ? "review-and-shortlist" : null,
    activeStepId: role === "institution" ? "review-and-shortlist-1" : null,
    completedScenarioId: null,
  })
}

function accountRole(account: KleioAccount | null): WorkspaceRole | null {
  return account?.profile.role ?? null
}

function AuthWall({ requiredRole, auth, onRefresh }: { requiredRole?: WorkspaceRole; auth: ResolvedAuth; onRefresh: () => Promise<void> }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const activeRole = accountRole(auth.account) ?? auth.demoSession?.role ?? null
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accountError, setAccountError] = useState("")
  const [accountLoading, setAccountLoading] = useState(false)
  const [previewEmail, setPreviewEmail] = useState(requiredRole === "artist" ? "artist@kleio.demo" : requiredRole === "collaborator" ? "reviewer@kleio.demo" : "institution@kleio.demo")
  const [previewPassword, setPreviewPassword] = useState("kleio2026")
  const [previewError, setPreviewError] = useState("")

  function routeForRole(role: WorkspaceRole) {
    if (requiredRole === role && pathname) {
      router.push(pathname)
      return
    }
    router.push(getDashboardForRole(role))
  }

  async function handleAccountLogin() {
    if (accountLoading) return
    setAccountError("")
    setAccountLoading(true)
    try {
      const account = await signInKleioAccount(email, password)
      clearDemoSession()
      clearKleioMode()
      await onRefresh()
      routeForRole(account.profile.role)
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : (es ? "No se pudo iniciar sesión." : "Unable to sign in."))
    } finally {
      setAccountLoading(false)
    }
  }

  function enterDemo(role: WorkspaceRole, mode: KleioMode) {
    setPreviewError("")
    setKleioMode(mode)
    loginDemoUser(role)
    if (mode === "demo") demoGuideState(role)
    else previewGuideState()
    void onRefresh().then(() => routeForRole(role))
  }

  function handlePreviewLogin() {
    setPreviewError("")
    setKleioMode("preview")
    previewGuideState()
    const nextSession = validateDemoCredentials(previewEmail, previewPassword)
    if (!nextSession) {
      setPreviewError(es ? "Las credenciales de vista previa no coinciden." : "Those preview credentials did not match.")
      return
    }
    void onRefresh().then(() => routeForRole(nextSession.role))
  }

  async function handleRealSignOut() {
    await signOutKleioAccount().catch(() => undefined)
    await onRefresh()
    router.push(getPublicHomeHref())
  }

  const wrongRole = Boolean(activeRole && requiredRole && activeRole !== requiredRole)

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-7 shadow-sm">
        <div className="mb-6 flex justify-center"><KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority /></div>

        {wrongRole && activeRole ? (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{es ? "Este espacio usa otro rol" : "This workspace uses another role"}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{es ? `Tu sesión actual es ${roleLabel(activeRole, es)}.` : `Your current session is ${roleLabel(activeRole, es)}.`}</p>
            <div className="mt-6 space-y-2">
              <button type="button" onClick={() => router.push(getDashboardForRole(activeRole))} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Ir a mi espacio" : "Go to my workspace"}</button>
              {auth.account ? <button type="button" onClick={() => void handleRealSignOut()} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cerrar sesión" : "Sign out"}</button> : requiredRole && <button type="button" onClick={() => enterDemo(requiredRole, "preview")} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cambiar vista previa" : "Switch preview role"}</button>}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{es ? "Accede a KLEIO" : "Access KLEIO"}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{es ? "Usa una cuenta autenticada para el espacio real o abre la vista previa con datos sintéticos." : "Use an authenticated account for the real workspace, or open the synthetic-data preview."}</p>

            <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{es ? "Cuenta autenticada" : "Authenticated workspace"}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{es ? "Esta sesión conecta perfiles, membresías institucionales y mensajería persistente de Supabase." : "This session connects Supabase profiles, institution memberships, and persistent messaging."}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr]">
                <input value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleAccountLogin()} type="email" autoComplete="email" className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder={es ? "Correo electrónico" : "Email address"} />
                <input value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleAccountLogin()} type="password" autoComplete="current-password" className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder={es ? "Contraseña" : "Password"} />
              </div>
              {accountError && <p className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_30)]">{accountError}</p>}
              <button type="button" onClick={() => void handleAccountLogin()} disabled={accountLoading || !email.trim() || !password} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50">{accountLoading ? (es ? "Verificando…" : "Verifying…") : (es ? "Iniciar sesión" : "Sign in")}</button>
            </section>

            <details className="group mt-3 rounded-2xl border border-[#E7E1F7] bg-white p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5B4B8A] marker:hidden"><span>{es ? "Vista previa con datos sintéticos" : "Synthetic-data product preview"}</span><span className="transition-transform group-open:rotate-90">›</span></summary>
              <div className="mt-3">
                <p className="text-xs leading-relaxed text-muted-foreground">{es ? "La vista previa conserva los registros demo existentes y no envía mensajes reales." : "Preview mode preserves the existing demo records and does not send real messages."}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr]"><input value={previewEmail} onChange={(event) => setPreviewEmail(event.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none" /><input value={previewPassword} onChange={(event) => setPreviewPassword(event.target.value)} type="password" className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none" /></div>
                {previewError && <p className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_55)]">{previewError}</p>}
                <button type="button" onClick={handlePreviewLogin} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-primary/30 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15">{es ? "Entrar a la vista previa" : "Enter product preview"}</button>
                <div className="mt-3 grid gap-3 sm:grid-cols-2"><section className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Recorrido demo" : "Demo walkthrough"}</p><div className="mt-3"><RoleAccessButtons onSelect={enterDemo} mode="demo" locale={locale} /></div></section><section className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Vista previa" : "Product preview"}</p><div className="mt-3"><RoleAccessButtons onSelect={enterDemo} mode="preview" locale={locale} /></div></section></div>
              </div>
            </details>

            <Link href={getPublicHomeHref()} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t("auth.returnToKleio")}</Link>
          </>
        )}
      </div>
    </div>
  )
}

export function AuthGate({ requiredRole, children }: AuthGateProps) {
  const [auth, setAuth] = useState<ResolvedAuth | null>(null)
  const { t } = useKleioLocale()

  const refreshAuth = useCallback(async () => {
    const account = await loadKleioAccount().catch(() => null)
    setAuth({ account, demoSession: account ? null : getDemoSession() })
  }, [])

  useEffect(() => {
    let active = true
    void refreshAuth()
    const supabase = getSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void refreshAuth()
      }, 0)
    })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [refreshAuth])

  if (!auth) return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-6"><div className="max-w-sm"><KleioAssistObject mode="reviewing" title={t("assist.object.complete.title")} description={t("assist.object.complete.description")} size="sm" compact /></div></div>

  const role = accountRole(auth.account) ?? auth.demoSession?.role ?? null
  if (!role || (requiredRole && role !== requiredRole)) return <AuthWall requiredRole={requiredRole} auth={auth} onRefresh={refreshAuth} />
  return <>{children}</>
}

export function useDemoSignOut() {
  const router = useRouter()
  return async () => {
    await signOutKleioAccount().catch(() => undefined)
    clearDemoSession()
    clearKleioMode()
    router.push("/")
  }
}

export type { KleioAccountRole }
