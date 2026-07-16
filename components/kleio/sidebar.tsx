"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections } from "@/lib/kleio-nav"
import { institutionNavLabelKeys, institutionSectionKeys } from "@/lib/kleio-nav-i18n"
import { collaborators, institution } from "@/lib/kleio-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"

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
  if (href === "/artists/") return locale === "es" ? "Registros de artistas" : "Artist Records"
  if (href === "/review-room/") return locale === "es" ? "Sala de revisión" : "Review Room"
  return t(institutionNavLabelKeys[href] ?? label)
}

function routeIsActive(pathname: string, href: string) {
  if (href === "/dashboard/") return pathname === href || `${pathname}/` === href
  return pathname === href || pathname.startsWith(href)
}

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const [collapsed, setCollapsed] = useState(false)
  const programDirector = collaborators.find((person) => person.role === "Program Director") ?? collaborators[0]
  const es = locale === "es"

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200",
        collapsed ? "w-20" : "w-64",
        className,
      )}
    >
      <div className={cn("flex items-center pb-5 pt-6", collapsed ? "justify-center gap-2 px-2" : "justify-between px-6")}>
        <KleioWordmarkLink
          className={cn("rounded-md bg-white py-1.5 shadow-sm ring-1 ring-border", collapsed ? "px-1.5" : "px-2.5")}
          imageClassName={collapsed ? "h-5 w-7 object-contain" : "h-6 w-auto"}
        />
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="grid size-8 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={collapsed ? (es ? "Expandir barra lateral" : "Expand sidebar") : (es ? "Contraer barra lateral" : "Collapse sidebar")}
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen className="size-4" aria-hidden="true" /> : <PanelLeftClose className="size-4" aria-hidden="true" />}
        </button>
      </div>

      <nav className={cn("flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")} aria-label={es ? "Navegación institucional" : "Institution workspace navigation"}>
        {navSections.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className={cn("pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80", collapsed ? "sr-only" : "px-3")}>
              {sectionLabel(section.heading, locale, t)}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = routeIsActive(pathname, item.href)
                const Icon = item.icon
                const label = itemLabel(item.href, item.label, locale, t)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={openPageGuide}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? label : undefined}
                      className={cn(
                        "group flex min-h-10 items-center rounded-lg text-sm font-medium transition-colors",
                        collapsed ? "justify-center px-2" : "gap-3 px-3",
                        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground/70 hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} aria-hidden="true" />
                      <span className={collapsed ? "sr-only" : "flex-1"}>{label}</span>
                      {!collapsed && item.badge != null && (
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums", active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{item.badge}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className={cn("border-t border-border", collapsed ? "p-2" : "p-3")}>
        <Link
          href="/settings/"
          title={collapsed ? (es ? "Configuración de cuenta" : "Account settings") : undefined}
          className={cn("flex min-h-11 items-center rounded-lg text-left transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", collapsed ? "justify-center px-1" : "gap-3 px-2 py-2")}
        >
          <InitialAvatar name={programDirector.name} className="size-9 shrink-0 text-xs" />
          <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
            <span className="block truncate text-sm font-medium text-foreground">{programDirector.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{programDirector.role}</span>
          </span>
          {!collapsed && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}
        </Link>

        <Link
          href="/institution/kleio-arthouse/"
          title={collapsed ? (es ? "Abrir perfil institucional" : "Open institution profile") : undefined}
          className={cn("mt-1 flex min-h-11 items-center rounded-lg border border-border bg-card text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", collapsed ? "justify-center px-1" : "gap-3 px-2 py-2")}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-[0.6rem] font-bold tracking-wide text-primary-foreground">{institution.initials}</span>
          <span className={collapsed ? "sr-only" : "min-w-0 flex-1"}>
            <span className="block truncate text-sm font-medium text-foreground">{institution.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{institution.location}</span>
          </span>
          {!collapsed && <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />}
        </Link>
      </div>
    </aside>
  )
}
