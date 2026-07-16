"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  DollarSign,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Sparkles,
  UsersRound,
  X,
} from "lucide-react"
import { navSections } from "@/lib/kleio-nav"
import { artistNavLabelKeys, institutionNavLabelKeys } from "@/lib/kleio-nav-i18n"
import { cn } from "@/lib/utils"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useDemoSignOut } from "@/components/kleio/auth-gate"

type WorkspaceVariant = "institution" | "artist"

type MobileNavItem = {
  href: string
  label: string
  labelEs?: string
  icon: typeof LayoutDashboard
  comingSoon?: boolean
}

const artistItems: MobileNavItem[] = [
  { href: "/artist-dashboard/", label: "Overview", labelEs: "Resumen", icon: LayoutDashboard },
  { href: "/artist-dashboard/passport/", label: "Creative Passport", labelEs: "Pasaporte Creativo", icon: Sparkles },
  { href: "/artist-dashboard/opportunities/", label: "Opportunities", labelEs: "Oportunidades", icon: Briefcase },
  { href: "/artist-dashboard/applications/", label: "Applications", labelEs: "Aplicaciones", icon: FileText },
  { href: "/artist-dashboard/portfolio/", label: "Portfolio", labelEs: "Portafolio", icon: FolderOpen },
  { href: "/artist-dashboard/funding/", label: "Funding", labelEs: "Financiamiento", icon: DollarSign },
  { href: "/artist-dashboard/collaborators/", label: "Artist Matches", labelEs: "Coincidencias", icon: UsersRound, comingSoon: true },
  { href: "/artist-dashboard/calendar/", label: "Calendar", labelEs: "Calendario", icon: CalendarDays },
  { href: "/artist-dashboard/messages/", label: "Messages", labelEs: "Mensajes", icon: MessageSquare },
  { href: "/artist-dashboard/insights/", label: "Insights", labelEs: "Análisis", icon: BarChart3 },
  { href: "/artist-dashboard/settings/", label: "Settings", labelEs: "Configuración", icon: Settings },
]

function routeIsActive(pathname: string, href: string) {
  if (href === "/dashboard/" || href === "/artist-dashboard/") return pathname === href || `${pathname}/` === href
  return pathname === href || pathname.startsWith(href)
}

export function WorkspaceMobileNav({ variant }: { variant: WorkspaceVariant }) {
  const pathname = usePathname()
  const signOut = useDemoSignOut()
  const { t, locale } = useKleioLocale()
  const [open, setOpen] = useState(false)
  const es = locale === "es"

  const items = useMemo<MobileNavItem[]>(() => {
    if (variant === "artist") return artistItems
    return navSections.flatMap((section) =>
      section.items.map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon,
      })),
    )
  }, [variant])

  function itemLabel(item: MobileNavItem) {
    if (variant === "artist") {
      if (item.href === "/artist-dashboard/collaborators/") return es ? "Coincidencias de artistas" : "Artist Matches"
      return t(artistNavLabelKeys[item.href] ?? (es ? item.labelEs ?? item.label : item.label))
    }
    if (item.href === "/artists/") return es ? "Registros de artistas" : "Artist Records"
    if (item.href === "/review-room/") return es ? "Sala de revisión" : "Review Room"
    return t(institutionNavLabelKeys[item.href] ?? item.label)
  }

  const currentItem = [...items]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => routeIsActive(pathname, item.href))
  const currentLabel = currentItem ? itemLabel(currentItem) : es ? "Espacio KLEIO" : "KLEIO Workspace"

  return (
    <>
      <header className="relative z-40 flex min-h-16 items-center gap-3 border-b border-[#E7E1F7] bg-white/95 px-4 backdrop-blur lg:hidden">
        <KleioWordmarkLink imageClassName="h-5 w-auto" />
        <div className="min-w-0 flex-1 border-l border-[#E7E1F7] pl-3">
          <p className="truncate text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">
            {variant === "artist" ? (es ? "Espacio del artista" : "Artist workspace") : (es ? "Espacio institucional" : "Institution workspace")}
          </p>
          <p className="truncate text-sm font-semibold text-[#292631]">{currentLabel}</p>
        </div>
        <KleioLocaleToggle />
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={`${variant}-mobile-navigation`}
          aria-label={open ? (es ? "Cerrar navegación" : "Close navigation") : (es ? "Abrir navegación" : "Open navigation")}
          className="grid size-10 place-items-center rounded-xl border border-[#E7E1F7] bg-white text-[#5B4B8A] shadow-sm transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]"
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 top-16 z-50 bg-[#292631]/20 backdrop-blur-sm lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            onClick={() => setOpen(false)}
            aria-label={es ? "Cerrar navegación" : "Close navigation"}
          />
          <nav
            id={`${variant}-mobile-navigation`}
            aria-label={es ? "Navegación del espacio" : "Workspace navigation"}
            className="relative ml-auto flex h-full w-[min(88vw,22rem)] flex-col border-l border-[#E7E1F7] bg-white shadow-2xl"
          >
            <div className="border-b border-[#E7E1F7] px-5 py-4">
              <p className="font-serif text-lg font-semibold text-[#292631]">{es ? "Navegación" : "Workspace navigation"}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">
                {es ? "Abre cualquier sección sin perder el contexto actual." : "Open any section without losing your current workspace context."}
              </p>
            </div>

            <ul className="flex-1 space-y-1 overflow-y-auto p-3">
              {items.map((item) => {
                const active = routeIsActive(pathname, item.href)
                const Icon = item.icon
                const label = itemLabel(item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active ? "bg-[#F7F4FF] text-[#5B4B8A]" : "text-[#5A5468] hover:bg-[#F7F4FF]/70 hover:text-[#292631]",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{label}</span>
                      {item.comingSoon && (
                        <span className="rounded-full bg-[#F1ECFB] px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-[#7F7890]">
                          {es ? "Pronto" : "Soon"}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-[#E7E1F7] p-3">
              <button
                type="button"
                onClick={signOut}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#6F6882] transition-colors hover:bg-[#F7F4FF] hover:text-[#292631]"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {es ? "Salir de la vista previa" : "Exit preview"}
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  )
}
