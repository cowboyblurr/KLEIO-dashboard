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
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type DemoRole = "artist" | "institution" | "collaborator"

type AuthGateProps = {
  requiredRole?: DemoRole
  children: React.ReactNode
}

function DemoAuthButtons({
  onInstitution,
  onArtist,
  onCollaborator,
  compact = false,
}: {
  onInstitution: () => void
  onArtist: () => void
  onCollaborator: () => void
  compact?: boolean
}) {
  const { t } = useKleioLocale()

  return (
    <div className={`flex ${compact ? "flex-col" : "flex-wrap"} gap-2`}>
      <button
        type="button"
        onClick={onInstitution}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
      >
        {t("auth.enterInstitutionDemo")}
      </button>
      <button
        type="button"
        onClick={onArtist}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
      >
        {t("auth.enterArtistDemo")}
      </button>
      <button
        type="button"
        onClick={onCollaborator}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
      >
        {t("auth.enterCollaboratorDemo")}
      </button>
    </div>
  )
}

function dashboardLabelKey(role: DemoRole) {
  if (role === "artist") return "auth.dashboard.artist"
  if (role === "collaborator") return "auth.dashboard.collaborator"
  return "auth.dashboard.institution"
}

function switchLabelKey(role: DemoRole) {
  if (role === "artist") return "auth.switchTo.artist"
  if (role === "collaborator") return "auth.switchTo.collaborator"
  return "auth.switchTo.institution"
}

function wrongRoleDescriptionKey(sessionRole: DemoRole, requiredRole: DemoRole) {
  if (sessionRole === "artist") {
    return requiredRole === "collaborator"
      ? "auth.wrongRole.artistToCollaborator"
      : "auth.wrongRole.artistToInstitution"
  }
  if (sessionRole === "collaborator") {
    return requiredRole === "artist"
      ? "auth.wrongRole.collaboratorToArtist"
      : "auth.wrongRole.collaboratorToInstitution"
  }
  return requiredRole === "collaborator"
    ? "auth.wrongRole.institutionToCollaborator"
    : "auth.wrongRole.institutionToArtist"
}

function loggedOutHeadingKey(requiredRole?: DemoRole) {
  if (requiredRole === "artist") return "auth.artist.heading"
  if (requiredRole === "institution") return "auth.institution.heading"
  if (requiredRole === "collaborator") return "auth.collaborator.heading"
  return "auth.generic.heading"
}

function loggedOutDescriptionKey(requiredRole?: DemoRole) {
  if (requiredRole === "artist") return "auth.artist.description"
  if (requiredRole === "institution") return "auth.institution.description"
  if (requiredRole === "collaborator") return "auth.collaborator.description"
  return "auth.generic.description"
}

function AuthWall({
  requiredRole,
  session,
  onRefresh,
}: {
  requiredRole?: DemoRole
  session: KleioDemoSession | null
  onRefresh: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { t } = useKleioLocale()

  function enterDemo(role: DemoRole) {
    loginDemoUser(role)
    onRefresh()
    if (requiredRole === role && pathname) {
      router.push(pathname)
      return
    }
    router.push(getDashboardForRole(role))
  }

  function switchToRole(role: DemoRole) {
    loginDemoUser(role)
    onRefresh()
    router.push(getDashboardForRole(role))
  }

  const wrongRole = session && requiredRole && session.role !== requiredRole

  const loggedOutHeading = t(loggedOutHeadingKey(requiredRole))
  const loggedOutDescription = t(loggedOutDescriptionKey(requiredRole))
  const wrongRoleDescription =
    session && requiredRole
      ? t(wrongRoleDescriptionKey(session.role, requiredRole))
      : ""

  return (
    <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)] px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] p-8 shadow-sm">
        <div className="mb-6 flex justify-center">
          <KleioWordmarkLink href="/" imageClassName="h-7 w-auto" priority />
        </div>

        {wrongRole ? (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">
              {t("auth.switchRole")}
            </h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {wrongRoleDescription}
            </p>
            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => router.push(getDashboardForRole(session.role))}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {t("auth.goToDashboard", { dashboard: t(dashboardLabelKey(session.role)) })}
              </button>
              <button
                type="button"
                onClick={() => switchToRole(requiredRole!)}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
              >
                {t(switchLabelKey(requiredRole!))}
              </button>
              <Link
                href={getPublicHomeHref()}
                className="inline-flex h-10 w-full items-center justify-center rounded-xl px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("auth.returnToKleio")}
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-center font-serif text-2xl font-semibold text-foreground">{loggedOutHeading}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
              {loggedOutDescription}
            </p>
            <div className="mt-6">
              <DemoAuthButtons
                onInstitution={() => enterDemo("institution")}
                onArtist={() => enterDemo("artist")}
                onCollaborator={() => enterDemo("collaborator")}
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
  const { t } = useKleioLocale()

  useEffect(() => {
    setSession(getDemoSession())
  }, [])

  if (session === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[oklch(0.985_0.005_287)]">
        <p className="text-sm text-muted-foreground">{t("auth.loading")}</p>
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
