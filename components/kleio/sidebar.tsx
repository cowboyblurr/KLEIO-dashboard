"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections } from "@/lib/kleio-nav"
import { institutionNavLabelKeys, institutionSectionKeys } from "@/lib/kleio-nav-i18n"
import { collaborators, institution } from "@/lib/kleio-data"
import { loadInstitutionProfile } from "@/lib/kleio-live-data"
import { loadKleioAccount } from "@/lib/kleio-supabase"
import { AccountSignOutButton } from "@/components/kleio/account-sign-out-button"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

function openPageGuide() {
  persistDemoGuideState({ isOpen: true, isMinimized: false, dismissed: false, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
}

function sectionLabel(heading: string, locale: string, t: (key: string) => string) {
  if (locale === "es") {
    if (heading === "Core Review Flow") return "Flujo principal"
    if (heading === "Report") return "Informes"
    if (heading === "Admin / More") return "Admin / Más"
  }
  return t(institutionSectionKeys[heading] ?? heading)
}

function itemLabel(href: string, label: string, locale: string, t: (key: string) => string) {
  if (href === "/artists/") return locale === "es" ? "Descubrimiento de artistas" : "Artist Discovery"
  if (href === "/artists/applicants/") return locale === "es" ? "Registros de solicitantes" : "Applicant Records"
  if (href === "/review-room/") return locale === "es" ? "Sala de revisión" : "Review Room"
  return t(institutionNavLabelKeys[href] ?? label)
}

function initialsFor(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 3).map((part) => part[0]?.toUpperCase()).join("") || "KI"
}

type LiveInstitutionIdentity = {
  personName: string
  personRole: string
  institutionName: string
  initials: string
}

export function Sidebar() {
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const { isLive } = useKleioMode()
  const programDirector = collaborators.find((person) => person.role === "Program Director") ?? collaborators[0]
  const [liveIdentity, setLiveIdentity] = useState<LiveInstitutionIdentity | null>(null)
  const es = locale === "es"

  useEffect(() => {
    let active = true
    if (!isLive) {
      setLiveIdentity(null)
      return () => { active = false }
    }
    Promise.all([loadKleioAccount(), loadInstitutionProfile()])
      .then(([account, profile]) => {
        if (!active || !account) return
        const institutionName = profile.display_name || profile.name || "Institution workspace"
        setLiveIdentity({
          personName: profile.contact_name || account.profile.display_name || account.user.email?.split("@")[0] || "Institution member",
          personRole: account.profile.role === "institution" ? (es ? "Propietario institucional" : "Institution owner") : (es ? "Miembro institucional" : "Institution member"),
          institutionName,
          initials: initialsFor(institutionName),
        })
      })
      .catch(() => { if (active) setLiveIdentity(null) })
    return () => { active = false }
  }, [es, isLive])

  const personName = isLive ? liveIdentity?.personName || (es ? "Cuenta institucional" : "Institution account") : programDirector.name
  const personRole = isLive ? liveIdentity?.personRole || (es ? "Miembro institucional" : "Institution member") : programDirector.role
  const institutionName = isLive ? liveIdentity?.institutionName || (es ? "Tu institución" : "Your institution") : institution.name
  const institutionInitials = isLive ? liveIdentity?.initials || "KI" : institution.initials
  const mobileItems = navSections.flatMap((section) => section.items)

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-border bg-sidebar px-3 md:hidden">
        <KleioWordmarkLink href="/" className="shrink-0 rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-border" />
        <nav aria-label="Institution workspace" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {mobileItems.map((item) => { const active = pathname === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={itemLabel(item.href, item.label, locale, t)} className={cn("grid size-10 shrink-0 place-items-center rounded-lg", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/60")}><Icon className="size-4" /></Link> })}
        </nav>
        <AccountSignOutButton compact className="border-border bg-card shadow-sm" />
      </div>
      <aside className="hidden h-full w-[228px] shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center px-5 pb-4 pt-5"><KleioWordmarkLink href="/" className="rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-border" /></div>
        <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
          {navSections.map((section) => (
            <div key={section.heading} className="mb-4">
              <p className="px-2.5 pb-1.5 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">{sectionLabel(section.heading, locale, t)}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = pathname === item.href
                  const Icon = item.icon
                  const label = itemLabel(item.href, item.label, locale, t)
                  return <li key={item.href}><Link href={item.href} onClick={isLive ? undefined : openPageGuide} aria-current={active ? "page" : undefined} className={cn("group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.82rem] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground/70 hover:bg-accent/60 hover:text-foreground")}><Icon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} /><span className="flex-1">{label}</span>{item.badge != null && !isLive && <span className={cn("rounded-full px-1.5 py-0.5 text-[0.6rem] font-semibold tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{item.badge}</span>}</Link></li>
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-2.5">
          <Link href="/settings/" className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/60" aria-label={es ? "Abrir configuración de la cuenta" : "Open account settings"}>
            <InitialAvatar name={personName} className="size-8 text-[0.68rem]" />
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.82rem] font-medium text-foreground">{personName}</span><span className="block truncate text-[0.7rem] text-muted-foreground">{personRole}</span></span>
            <Settings className="size-3.5 text-muted-foreground" />
          </Link>
          <AccountSignOutButton className="mt-0.5 justify-start border-transparent bg-transparent px-2 hover:border-border" />
          <div className="mt-1 flex w-full items-center gap-2.5 rounded-lg border border-border bg-card px-2 py-1.5 text-left">
            <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-[0.56rem] font-bold tracking-wide text-primary-foreground">{institutionInitials}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[0.82rem] font-medium text-foreground">{institutionName}</span><span className="block truncate text-[0.68rem] text-muted-foreground">{isLive ? (es ? "Espacio institucional activo" : "Active institution workspace") : (es ? "Un solo espacio institucional" : "Single institution workspace")}</span></span>
            {!isLive && <span className="rounded-full bg-muted px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase tracking-wide text-muted-foreground">{es ? "Pronto" : "Soon"}</span>}
          </div>
        </div>
      </aside>
    </>
  )
}
