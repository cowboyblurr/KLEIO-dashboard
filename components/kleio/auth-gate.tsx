"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { getDashboardForRole, getPublicHomeHref, loginDemoUser, type KleioDemoSession } from "@/lib/kleio-demo-auth"
import { getKleioAuthMode, resolveKleioSession, signInKleio, signOutKleio } from "@/lib/kleio-auth"
import { clearKleioMode, setKleioMode, type KleioMode } from "@/lib/kleio-mode"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type DemoRole = "artist" | "institution" | "collaborator"
type AuthGateProps = { requiredRole?: DemoRole; children: React.ReactNode }

function onboardingHref(role: DemoRole) {
  if (role === "artist") return "/signup/artist/"
  if (role === "institution") return "/signup/institution/"
  return "/collaborator-dashboard/"
}

function previewGuideState() { persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: true, activeScenarioId: null, activeStepId: null, completedScenarioId: null }) }
function demoGuideState(role: DemoRole) { persistDemoGuideState({ isOpen: true, isMinimized: false, dismissed: false, activeScenarioId: role === "institution" ? "review-and-shortlist" : null, activeStepId: role === "institution" ? "review-and-shortlist-1" : null, completedScenarioId: null }) }

function AuthWall({ requiredRole, session, onRefresh }: { requiredRole?: DemoRole; session: KleioDemoSession | null; onRefresh: () => Promise<void> }) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const connected = getKleioAuthMode() === "supabase"
  const [email, setEmail] = useState(connected ? "" : requiredRole === "artist" ? "artist@kleio.demo" : requiredRole === "collaborator" ? "reviewer@kleio.demo" : "institution@kleio.demo")
  const [password, setPassword] = useState(connected ? "" : "kleio2026")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  function route(next: KleioDemoSession) {
    if (connected && !next.onboardingCompleted) { router.replace(onboardingHref(next.role)); return }
    if (requiredRole === next.role && pathname) { router.replace(pathname); return }
    router.replace(getDashboardForRole(next.role))
  }

  async function login() {
    if (!email.trim() || !password) { setError(es ? "Ingresa el correo y la contraseña." : "Enter an email and password."); return }
    setSubmitting(true); setError("")
    try { const result = await signInKleio(email, password); if (!result.session) throw new Error("No session was returned."); await onRefresh(); route(result.session) }
    catch (loginError) { setError(loginError instanceof Error ? loginError.message : (es ? "No se pudo iniciar sesión." : "Unable to sign in.")) }
    finally { setSubmitting(false) }
  }

  async function enterPreview(role: DemoRole, mode: KleioMode) {
    if (connected) return
    setKleioMode(mode)
    const next = loginDemoUser(role)
    if (mode === "demo") demoGuideState(role); else previewGuideState()
    await onRefresh(); route(next)
  }

  async function logout() { await signOutKleio(); clearKleioMode(); await onRefresh(); router.replace(getPublicHomeHref()) }
  const wrongRole = session && requiredRole && session.role !== requiredRole

  return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12"><div className="w-full max-w-xl rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-7 shadow-sm"><div className="mb-6 flex justify-center"><KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority /></div>
    {wrongRole ? <><h1 className="text-center font-serif text-2xl font-semibold">{es ? "Esta cuenta usa otro espacio" : "This account uses a different workspace"}</h1><p className="mt-2 text-center text-sm text-muted-foreground">{es ? "El rol conectado no coincide con esta ruta privada." : "The connected role does not match this private route."}</p><div className="mt-6 space-y-2"><button onClick={() => router.replace(getDashboardForRole(session.role))} className="h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground">{es ? "Ir a mi espacio" : "Go to my workspace"}</button><button onClick={() => void logout()} className="h-10 w-full rounded-xl border border-border bg-background text-sm font-medium">{es ? "Cerrar sesión" : "Sign out"}</button></div></> : <><h1 className="text-center font-serif text-2xl font-semibold">{requiredRole === "artist" ? (es ? "Acceso de artista" : "Artist access") : requiredRole === "institution" ? (es ? "Acceso institucional" : "Institution access") : "KLEIO access"}</h1><p className="mt-2 text-center text-sm text-muted-foreground">{connected ? (es ? "Inicia sesión con tu cuenta Supabase." : "Sign in with your Supabase account.") : (es ? "Entorno sintético de vista previa." : "Clearly labeled synthetic preview environment.")}</p><section className="mt-6 rounded-2xl border border-border bg-background p-4"><div className="grid gap-2 sm:grid-cols-[1fr_0.7fr]"><input aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 text-sm" placeholder="name@example.com" /><input aria-label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void login()} className="h-10 rounded-xl border border-border bg-card px-3 text-sm" placeholder={es ? "Contraseña" : "Password"} /></div>{error && <p className="mt-2 text-xs font-medium text-[oklch(0.45_0.14_55)]">{error}</p>}<button onClick={() => void login()} disabled={submitting} className="mt-3 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-55">{submitting ? (es ? "Conectando…" : "Connecting…") : (es ? "Iniciar sesión" : "Sign in")}</button></section>{!connected && <details className="mt-3 rounded-2xl border border-[#E7E1F7] bg-white p-4"><summary className="cursor-pointer text-sm font-semibold text-[#5B4B8A]">{es ? "Atajos sintéticos" : "Synthetic shortcuts"}</summary><div className="mt-3 grid gap-2 sm:grid-cols-2">{(["artist", "institution", "collaborator"] as DemoRole[]).map((role) => <button key={role} onClick={() => void enterPreview(role, "preview")} className="h-9 rounded-xl border border-border text-xs font-semibold">{role}</button>)}</div></details>}<Link href="/" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium">{es ? "Volver a KLEIO" : "Return to KLEIO"}</Link></>}
  </div></div>
}

export function AuthGate({ requiredRole, children }: AuthGateProps) {
  const [session, setSession] = useState<KleioDemoSession | null | undefined>(undefined)
  const [error, setError] = useState("")
  const router = useRouter()
  async function refresh() { try { setError(""); const next = await resolveKleioSession(); setSession(next); if (next?.source === "supabase" && !next.onboardingCompleted) router.replace(onboardingHref(next.role)) } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Unable to load the current account."); setSession(null) } }
  useEffect(() => { void refresh() }, [])
  if (session === undefined) return <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-6"><KleioAssistObject mode="reviewing" title="Loading account" description="Verifying the active session." size="sm" compact /></div>
  if (error && !session) return <div><div className="mx-auto mt-6 max-w-xl rounded-xl border border-[oklch(0.85_0.08_45)] bg-[oklch(0.97_0.03_45)] px-4 py-3 text-sm">{error}</div><AuthWall requiredRole={requiredRole} session={null} onRefresh={refresh} /></div>
  if (!session || (requiredRole && session.role !== requiredRole)) return <AuthWall requiredRole={requiredRole} session={session ?? null} onRefresh={refresh} />
  return <>{children}</>
}

export function useDemoSignOut() { const router = useRouter(); return () => { void signOutKleio().finally(() => { clearKleioMode(); router.replace("/") }) } }
