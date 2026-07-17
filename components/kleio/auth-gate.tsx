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
  signOutKleioAccount,
  type KleioAccount,
  type KleioAccountRole,
} from "@/lib/kleio-supabase"
import { clearKleioMode, setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { RealLoginForm } from "@/components/kleio/auth/real-login-form"

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
  const [previewEmail, setPreviewEmail] = useState(requiredRole === "artist" ? "artist@kleio.demo" : requiredRole === "collaborator" ? "reviewer@kleio.demo" : "institution@kleio.demo")
  const [previewPassword, setPreviewPassword] = useState("kleio2026")
  const [previewError, setPreviewError] = useState("")

  function routeForRole(role: WorkspaceRole) {
    if (requiredRole === role && pathname) {
      router.replace(pathname)
      return
    }
    router.replace(getDashboardForRole(role))
  }

  async function handleAuthenticatedLogin(account: KleioAccount) {
    await onRefresh()
    routeForRole(account.profile.role)
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
    router.replace(getPublicHomeHref())
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
              <button type="button" onClick={() => router.replace(getDashboardForRole(activeRole))} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Ir a mi espacio" : "Go to my workspace"}</button>
              {auth.account ? <button type="button" onClick={() => void handleRealSignOut()} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cerrar sesión" : "Sign out"}</button> : requiredRole && <button type="button" onClick={() => enterDemo(requiredRole, "preview")} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cambiar vista previa" : "Switch preview role"}</button>}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{es ? "Accede a KLEIO" : "Access KLEIO"}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{es ? "Usa una cuenta autenticada para el espacio real o abre la vista previa con datos sintéticos." : "Use an authenticated account for the real workspace, or open the synthetic-data preview."}</p>

            <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
              <RealLoginForm onSuccess={handleAuthenticatedLogin} />
            </section>

            <details className="group mt-3 rounded-2xl border border-[#E7E1F7] bg-white p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5B4B8A] marker:hidden"><span>{es ? "Vista previa con datos sintéticos" : "Synthetic-data product preview"}</span><span className="transition-transform group-open:rotate-90">›</span></summary>
              <div className="mt-3">
                <p className="text-xs leading-relaxed text-muted-foreground">{es ? "La vista previa conserva los registros demo existentes y no envía mensajes reales." : "Preview mode preserves the existing demo records and does not send real messages."}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr]">
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>{es ? "Correo demo" : "Demo email"}</span><input value={previewEmail} onChange={(event) => setPreviewEmail(event.target.value)} autoComplete="off" className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary/40" /></label>
                  <label className="grid gap-1 text-xs font-medium text-muted-foreground"><span>{es ? "Contraseña demo" : "Demo password"}</span><input value={previewPassword} onChange={(event) => setPreviewPassword(event.target.value)} type="password" autoComplete="off" className="h-10 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-primary/40" /></label>
                </div>
                {previewError && <p role="alert" className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_55)]">{previewError}</p>}
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
    router.replace("/")
  }
}

export type { KleioAccountRole }
