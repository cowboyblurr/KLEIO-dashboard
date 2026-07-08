"use client"

import { useEffect, useState } from "react"
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

function AuthWall({ requiredRole, session, onRefresh }: { requiredRole?: DemoRole; session: KleioDemoSession | null; onRefresh: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const [email, setEmail] = useState(requiredRole === "artist" ? "artist@kleio.demo" : requiredRole === "collaborator" ? "reviewer@kleio.demo" : "institution@kleio.demo")
  const [password, setPassword] = useState("kleio2026")
  const [error, setError] = useState("")

  function routeForSession(role: DemoRole) {
    if (requiredRole === role && pathname) { router.push(pathname); return }
    router.push(getDashboardForRole(role))
  }

  function enter(role: DemoRole, mode: KleioMode) {
    setError("")
    setKleioMode(mode)
    loginDemoUser(role)
    if (mode === "demo") demoGuideState(role)
    else previewGuideState()
    onRefresh()
    routeForSession(role)
  }

  function handlePreviewLogin() {
    setError("")
    setKleioMode("preview")
    previewGuideState()
    const nextSession = validateDemoCredentials(email, password)
    if (!nextSession) { setError(es ? "Las credenciales de vista previa no coinciden. Prueba institution@kleio.demo con la contraseña kleio2026." : "Those preview credentials did not match. Try institution@kleio.demo with password kleio2026."); return }
    onRefresh()
    routeForSession(nextSession.role)
  }

  function switchToRole(role: DemoRole) { loginDemoUser(role); onRefresh(); router.push(getDashboardForRole(role)) }

  const wrongRole = session && requiredRole && session.role !== requiredRole
  const loggedOutHeading = t(loggedOutHeadingKey(requiredRole))
  const loggedOutDescription = t(loggedOutDescriptionKey(requiredRole))
  const wrongRoleDescription = session && requiredRole ? t(wrongRoleDescriptionKey(session.role, requiredRole)) : ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-7 shadow-sm">
        <div className="mb-6 flex justify-center"><KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority /></div>
        {wrongRole ? <><h1 className="text-center font-serif text-2xl font-semibold text-foreground">{t("auth.switchRole")}</h1><p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{wrongRoleDescription}</p><div className="mt-6 space-y-2"><button type="button" onClick={() => router.push(getDashboardForRole(session.role))} className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{t("auth.goToDashboard", { dashboard: t(dashboardLabelKey(session.role)) })}</button><button type="button" onClick={() => switchToRole(requiredRole!)} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t(switchLabelKey(requiredRole!))}</button><Link href={getPublicHomeHref()} className="inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">{t("auth.returnToKleio")}</Link></div></> : <>
          <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{loggedOutHeading}</h1>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{loggedOutDescription}</p>
          <section className="mt-6 rounded-2xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Acceso a vista previa" : "Product preview access"}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{es ? "Inicia sesión para entrar a una vista más limpia del espacio KLEIO." : "Log in to the cleaner KLEIO workspace preview."}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_0.7fr]"><input value={email} onChange={(event) => setEmail(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handlePreviewLogin()} className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder="institution@kleio.demo" /><input value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={(event) => event.key === "Enter" && handlePreviewLogin()} type="password" className="h-10 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" placeholder={es ? "Contraseña" : "Password"} /></div>
            {error && <p className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_55)]">{error}</p>}
            <button type="button" onClick={handlePreviewLogin} className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Entrar a la vista previa" : "Log in to Product Preview"}</button>
          </section>
          <details className="group mt-3 rounded-2xl border border-[#E7E1F7] bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#5B4B8A] marker:hidden"><span>{es ? "Atajos avanzados por rol" : "Advanced role shortcuts"}</span><span className="transition-transform group-open:rotate-90">›</span></summary><div className="mt-3 grid gap-3 sm:grid-cols-2"><section className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Recorrido demo" : "Demo walkthrough"}</p><p className="mt-1 text-xs text-muted-foreground">{es ? "Registros de muestra con guía." : "Guided sample records."}</p><div className="mt-3"><RoleAccessButtons onSelect={enter} mode="demo" locale={locale} /></div></section><section className="rounded-xl border border-border bg-background p-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Vista previa" : "Product preview"}</p><p className="mt-1 text-xs text-muted-foreground">{es ? "Un espacio de producto más limpio." : "Cleaner workspace mode."}</p><div className="mt-3"><RoleAccessButtons onSelect={enter} mode="preview" locale={locale} /></div></section></div></details>
          <Link href={getPublicHomeHref()} className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t("auth.returnToKleio")}</Link>
        </>}
      </div>
    </div>
  )
}

export function AuthGate({ requiredRole, children }: AuthGateProps) {
  const [session, setSession] = useState<KleioDemoSession | null | undefined>(undefined)
  const { t } = useKleioLocale()
  useEffect(() => { setSession(getDemoSession()) }, [])
  if (session === undefined) return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-6"><div className="max-w-sm"><KleioAssistObject mode="reviewing" title={t("assist.object.complete.title")} description={t("assist.object.complete.description")} size="sm" compact /></div></div>
  if (!session) return <AuthWall requiredRole={requiredRole} session={null} onRefresh={() => setSession(getDemoSession())} />
  if (requiredRole && session.role !== requiredRole) return <AuthWall requiredRole={requiredRole} session={session} onRefresh={() => setSession(getDemoSession())} />
  return <>{children}</>
}

export function useDemoSignOut() {
  const router = useRouter()
  return () => { clearDemoSession(); clearKleioMode(); router.push("/") }
}
