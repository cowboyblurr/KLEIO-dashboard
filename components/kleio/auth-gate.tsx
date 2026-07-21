"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  clearDemoSession,
  getDashboardForRole,
  getDemoSession,
  getPublicHomeHref,
  type KleioDemoSession,
} from "@/lib/kleio-demo-auth"
import {
  getSupabaseBrowserClient,
  loadKleioAccount,
  signOutKleioAccount,
  type KleioAccount,
  type KleioAccountRole,
} from "@/lib/kleio-supabase"
import { clearKleioMode, getKleioMode } from "@/lib/kleio-mode"
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

function accountRole(account: KleioAccount | null): WorkspaceRole | null {
  return account?.profile.role ?? null
}

function AuthWall({ requiredRole, auth, onRefresh }: { requiredRole?: WorkspaceRole; auth: ResolvedAuth; onRefresh: () => Promise<void> }) {
  const router = useRouter()
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const activeRole = accountRole(auth.account) ?? auth.demoSession?.role ?? null

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
              {auth.account ? <button type="button" onClick={() => void handleRealSignOut()} className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Cerrar sesión" : "Sign out"}</button> : <Link href="/demo/" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{es ? "Volver al recorrido guiado" : "Return to guided demo"}</Link>}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{es ? "Inicia sesión en KLEIO" : "Sign in to KLEIO"}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">{es ? "Continúa a tu espacio de artista, institución o revisor." : "Continue to your artist, institution, or reviewer workspace."}</p>

            <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.035] p-4">
              <RealLoginForm onSuccess={handleAuthenticatedLogin} />
            </section>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link href="/demo/" className="inline-flex h-10 items-center justify-center rounded-xl border border-[#D8D0F2] bg-[#F7F4FF] px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-white">{es ? "Recorrido guiado" : "Take the Guided Tour"}</Link>
              <Link href={getPublicHomeHref()} className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50">{t("auth.returnToKleio")}</Link>
            </div>
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
    if (getKleioMode() !== "live") {
      setAuth({ account: null, demoSession: getDemoSession() })
      return
    }
    const account = await loadKleioAccount().catch(() => null)
    setAuth({ account, demoSession: null })
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
