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
  type KleioDemoSession,
} from "@/lib/kleio-demo-auth"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

type AuthGateProps = {
  requiredRole?: "artist" | "institution"
  children: React.ReactNode
}

function DemoAuthButtons({
  onInstitution,
  onArtist,
  compact = false,
}: {
  onInstitution: () => void
  onArtist: () => void
  compact?: boolean
}) {
  return (
    <div className={`flex ${compact ? "flex-col" : "flex-wrap"} gap-2`}>
      <button
        type="button"
        onClick={onInstitution}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
      >
        Enter Institution Demo
      </button>
      <button
        type="button"
        onClick={onArtist}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
      >
        Enter Artist Demo
      </button>
    </div>
  )
}

function AuthWall({
  requiredRole,
  session,
  onRefresh,
}: {
  requiredRole?: "artist" | "institution"
  session: KleioDemoSession | null
  onRefresh: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()

  function enterDemo(role: "artist" | "institution") {
    loginDemoUser(role)
    onRefresh()
    if (requiredRole === role && pathname) {
      router.push(pathname)
      return
    }
    router.push(getDashboardForRole(role))
  }

  function switchToRole(role: "artist" | "institution") {
    loginDemoUser(role)
    onRefresh()
    router.push(getDashboardForRole(role))
  }

  const wrongRole = session && requiredRole && session.role !== requiredRole

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <KleioWordmarkLink imageClassName="h-7 w-auto" priority />
        </div>

        {wrongRole ? (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">
              Different demo role
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              This workspace belongs to a different demo role. You are signed in as{" "}
              <span className="font-medium text-foreground">{session.name}</span>.
            </p>
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => router.push(getDashboardForRole(session.role))}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {session.role === "artist" ? "Go to Artist Dashboard" : "Go to Institution Dashboard"}
              </button>
              <button
                type="button"
                onClick={() => switchToRole(requiredRole!)}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
              >
                {requiredRole === "institution" ? "Switch to Institution Demo" : "Switch to Artist Demo"}
              </button>
              <Link
                href={getPublicHomeHref()}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Return to KLEIO
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">Sign in to continue</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              KLEIO workspaces are private. Use the demo login to enter this workspace.
            </p>
            <div className="mt-6">
              <DemoAuthButtons
                onInstitution={() => enterDemo("institution")}
                onArtist={() => enterDemo("artist")}
                compact
              />
            </div>
            <Link
              href={getPublicHomeHref()}
              className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
            >
              Return to KLEIO
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export function AuthGate({ requiredRole, children }: AuthGateProps) {
  const [session, setSession] = useState<KleioDemoSession | null | undefined>(undefined)

  useEffect(() => {
    setSession(getDemoSession())
  }, [])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)]">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </div>
    )
  }

  if (!session) {
    return <AuthWall requiredRole={requiredRole} session={null} onRefresh={() => setSession(getDemoSession())} />
  }

  if (requiredRole && session.role !== requiredRole) {
    return (
      <AuthWall requiredRole={requiredRole} session={session} onRefresh={() => setSession(getDemoSession())} />
    )
  }

  return <>{children}</>
}

export function useDemoSignOut() {
  const router = useRouter()
  return () => {
    clearDemoSession()
    router.push("/")
  }
}
