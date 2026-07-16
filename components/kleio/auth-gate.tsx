"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  getDashboardForRole,
  getPublicHomeHref,
  loginDemoUser,
  type KleioDemoSession,
} from "@/lib/kleio-demo-auth"
import { getKleioAuthMode, resolveKleioSession, signInKleio, signOutKleio } from "@/lib/kleio-auth"
import { clearKleioMode, setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type DemoRole = "artist" | "institution" | "collaborator"
type AuthGateProps = { requiredRole?: DemoRole; children: React.ReactNode }

function roleLabel(role: DemoRole, es: boolean) {
  if (!es) return role === "institution" ? "Institution" : role === "artist" ? "Artist" : "Reviewer"
  return role === "institution" ? "Institución" : role === "artist" ? "Artista" : "Revisor"
}

function RoleAccessButtons({ onSelect, mode, locale }: { onSelect: (role: DemoRole, mode: KleioMode) => void; mode: KleioMode; locale: string }) {
  const es = locale === "es"
  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => onSelect("institution", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/15">{roleLabel("institution", es)}</button>
      <button type="button" onClick={() => onSelect("artist", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{roleLabel("artist", es)}</button>
      <button type="button" onClick={() => onSelect("collaborator", mode)} className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{roleLabel("collaborator", es)}</button>
    </div>
  )
}

function dashboardLabelKey(role: DemoRole) { if (role === "artist") return "auth.dashboard.artist"; if (role === "collaborator") return "auth.dashboard.collaborator"; return "auth.dashboard.institution" }
function switchLabelKey(role: DemoRole) { if (role === "artist") return "auth.switchTo.artist"; if (role === "collaborator") return "auth.switchTo.collaborator"; return "auth.switchTo.institution" }
function wrongRoleDescriptionKey(sessionRole: DemoRole, requiredRole: DemoRole) { if (sessionRole === "artist") return requiredRole === "collaborator" ? "auth.wrongRole.artistToCollaborator" : "auth.wrongRole.artistToInstitution"; if (sessionRole === "collaborator") return requiredRole === "artist" ? "auth.wrongRole.collaboratorToArtist" : "auth.wrongRole.collaboratorToInstitution"; return requiredRole === "collaborator" ? "auth.wrongRole.institutionToCollaborator" : "auth.wrongRole.institutionToArtist" }
function loggedOutHeadingKey(requiredRole?: DemoRole) { if (requiredRole === "artist") return "auth.artist.heading"; if (requiredRole === "institution") return "auth.institution.heading"; if (requiredRole === "collaborator") return "auth.collaborator.heading"; return "auth.generic.heading" }
function loggedOutDescriptionKey(requiredRole?: DemoRole) { if (requiredRole === "artist") return "auth.artist.description"; if (requiredRole === "institution") return "auth.institution.description"; if (requiredRole === "collaborator") return "auth.collaborator.description"; return "auth.generic.description" }

function previewGuideState() { persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: true, activeScenarioId: null, activeStepId: null, completedScenarioId: null }) }
function demoGuideState(role: DemoRole) { persistDemoGuideState({ isOpen: true, isMinimized: false, dismissed: false, activeScenarioId: role === "institution" ? "review-and-shortlist" : null, activeStepId: role === "institution" ? "review-and-shortlist-1" : null, completedScenarioId: null }) }

function AuthWall({ requiredRole, session, onRefresh }: { requiredRole?: DemoRole; session: KleioDemoSession | null; onRefresh: () => Promise<void> }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const authMode = getKleioAuthMode()
  const [email, setEmail] = useState(authMode === "preview" ? (requiredRole === "artist" ? "artist@kleio.demo" : requiredRole === "collaborator" ? "reviewer@kleio.demo" : "institution@kleio.demo") : "")
  const [password, setPassword] = useState(authMode === "preview" ? "kleio2026" : "")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  function routeForSession(role: DemoRole) {
    if (requiredRole === role && pathname) { router.push(pathname); return }
    router.push(getDashboardForRole(role))
  }

  async function enter(role: DemoRole, mode: KleioMode) {
    setError("")
    setKleioMode(mode)
    loginDemoUser(role)
    if (mode === "demo") demoGuideState(role)
    else previewGuideState()
    await onRefresh()
    routeForSession(role)
  }

  async function handleAccountLogin() {
    if (!email.trim() || !password) {
      setError(es ? "Ingresa el correo y la contraseña." : "Enter an email and password.")
      return
    }

    setError("")
    setIsSubmitting(true)
    setKleioMode("preview")
    previewGuideState()

    try {
      const result = await signInKleio(email, password)
      if (!result.session) throw new Error("No session was returned.")
      await onRefresh()
      routeForSession(result.session.role)
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : (es ? "No se pudo iniciar sesión." : "Unable to sign in."))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function switchToRole(role: DemoRole) {
    loginDemoUser(role)
    await onRefresh()
    router.push(getDashboardForRole(role))
  }

  async function signOutAndReturn() {
    await signOutKleio()
    clearKleioMode()
    await onRefresh()
    router.push(getPublicHomeHref())
  }

  const wrongRole = session && requiredRole && session.role !== requiredRole
  const loggedOutHeading = t(loggedOutHeadingKey(requiredRole))
  const loggedOutDescription = t(loggedOutDescriptionKey(requiredRole))
  const wrongRoleDescription = session && requiredRole ? t(wrongRoleDescriptionKey(session.role, requiredRole)) : ""
  const connected = authMode === "supabase"

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-7 shadow-sm">
        <div className="mb-6 flex justify-center"><KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority /></div>
        {wrongRole ? <>
          <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{t("auth.switchRole")}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{wrongRoleDescription}</p>
          <div className="mt-6 space-y-2">
            <button type="button" onClick={() => router.push(getDashboardForRole(session.role))} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{t("auth.goToDashboard", { dashboard: t(dashboardLabelKey(session.role)) })}</button>
            {session.source === "supabase" ? (
              <button type="button" onClick={() => void signOutAndReturn()} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cerrar sesión y usar otra cuenta" : "Sign out and use another account"}</button>
            ) : (
              <button type="button" onClick={() => void switchToRole(requiredRole!)} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t(switchLabelKey(requiredRole!))}</button>
            )}
            <Link href={getPublicHomeHref()} className="inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("auth.returnToKleio")}</Link>
          </div>
        </> : <>
          <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{loggedOutHeading}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{loggedOutDescription}</p>
          <section className="mt-6 rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{connected ? (es ? "Cuenta conectada" : "Connected account access") : (es ? "Acceso a vista previa" : "Product preview access")}</p>
              <span className={`rounded-full px-2 py-1 text-[0.62rem] font-semibold ${connected ? "bg-[oklch(0.94_0.04_150)] text-[oklch(0.38_0.11_150)]" : "bg-[#F7F4FF] text-[#5B4B8A]"}`}>{connected ? "Supabase" : (es ? "Datos locales" : "Local data")}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{connected ? (es ? "La sesión y los registros se cargan desde el proyecto Supabase configurado." : "Sessions and workflow records load from the configured Supabase project.") : (es ? "Supabase no está configurado en esta compilación. Los cambios permanecen en este navegador." : "Supabase is not configured in this build. Changes remain in this browser.")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr]"><input aria-label={es ? "Correo" : "Email"} value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleAccountLogin()} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder="name@example.com" /><input aria-label={es ? "Contraseña" : "Password"} value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && void handleAccountLogin()} type="password" className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder={es ? "Contraseña" : "Password"} /></div>
            {error && <p className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_55)]">{error}</p>}
            <button type="button" onClick={() => void handleAccountLogin()} disabled={isSubmitting} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-55">{isSubmitting ? (es ? "Conectando…" : "Connecting…") : (es ? "Iniciar sesión" : "Sign in")}</button>
          </section>
          <details className="group mt-3 rounded-2xl border border-[#E7E1F7] bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5B4B8A] marker:hidden"><span>{es ? "Atajos del recorrido sintético" : "Synthetic walkthrough shortcuts"}</span><span className="transition-transform group-open:rotate-90">›</span></summary><p className="mt-2 text-xs leading-relaxed text-[#7F7890]">{es ? "Estos accesos abren datos sintéticos y no cambian el rol de una cuenta Supabase." : "These shortcuts open synthetic records and do not change a Supabase account's role."}</p><div className="mt-3 grid gap-3 sm:grid-cols-2"><section className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Recorrido demo" : "Demo walkthrough"}</p><p className="mt-1 text-xs text-muted-foreground">{es ? "Registros de muestra con guía." : "Guided sample records."}</p><div className="mt-3"><RoleAccessButtons onSelect={enter} mode="demo" locale={locale} /></div></section><section className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Vista previa" : "Product preview"}</p><p className="mt-1 text-xs text-muted-foreground">{es ? "Datos locales persistentes en este navegador." : "Browser-local persistent data."}</p><div className="mt-3"><RoleAccessButtons onSelect={enter} mode="preview" locale={locale} /></div></section></div></details>
          <Link href={getPublicHomeHref()} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t("auth.returnToKleio")}</Link>
        </>}
      </div>
    </div>
  )
}

export function AuthGate({ requiredRole, children }: AuthGateProps) {
  const [session, setSession] = useState<KleioDemoSession | null | undefined>(undefined)
  const [loadError, setLoadError] = useState("")
  const { t } = useKleioLocale()

  async function refreshSession() {
    try {
      setLoadError("")
      setSession(await resolveKleioSession())
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the current account.")
      setSession(null)
    }
  }

  useEffect(() => { void refreshSession() }, [])

  if (session === undefined) return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-6"><div className="max-w-sm"><KleioAssistObject mode="reviewing" title={t("assist.object.complete.title")} description={t("assist.object.complete.description")} size="sm" compact /></div></div>
  if (loadError && !session) return <div><div className="mx-auto mt-6 max-w-xl rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm text-[oklch(0.42_0.12_45)]">{loadError}</div><AuthWall requiredRole={requiredRole} session={null} onRefresh={refreshSession} /></div>
  if (!session) return <AuthWall requiredRole={requiredRole} session={null} onRefresh={refreshSession} />
  if (requiredRole && session.role !== requiredRole) return <AuthWall requiredRole={requiredRole} session={session} onRefresh={refreshSession} />
  return <>{children}</>
}

export function useDemoSignOut() {
  const router = useRouter()
  return () => {
    void signOutKleio().finally(() => {
      clearKleioMode()
      router.push("/")
    })
  }
}
