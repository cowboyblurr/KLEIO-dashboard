"use client"

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
  MessageSquare,
  Settings,
  Sparkles,
  UsersRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { artistNavLabelKeys } from "@/lib/kleio-nav-i18n"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; activeMatch?: string; comingSoon?: boolean }
type NavSection = { heading: string; headingEs: string; items: NavItem[] }

const navSections: NavSection[] = [
  {
    heading: "Core Artist Flow",
    headingEs: "Flujo principal",
    items: [
      { href: "/artist-dashboard/", label: "Overview", icon: LayoutDashboard },
      { href: "/artist-dashboard/passport/", label: "Creative Passport", icon: Sparkles, activeMatch: "/artist-dashboard/passport" },
      { href: "/artist-dashboard/opportunities/", label: "Opportunities", icon: Briefcase, activeMatch: "/artist-dashboard/opportunities" },
      { href: "/artist-dashboard/applications/", label: "Applications", icon: FileText, activeMatch: "/artist-dashboard/applications" },
      { href: "/artist-dashboard/portfolio/", label: "Portfolio", icon: FolderOpen, activeMatch: "/artist-dashboard/portfolio" },
      { href: "/artist-dashboard/funding/", label: "Funding", icon: DollarSign, activeMatch: "/artist-dashboard/funding" },
    ],
  },
  {
    heading: "Preview / More",
    headingEs: "Vista previa / Más",
    items: [
      { href: "/artist-dashboard/collaborators/", label: "Artist Matches", icon: UsersRound, activeMatch: "/artist-dashboard/collaborators", comingSoon: true },
      { href: "/artist-dashboard/calendar/", label: "Calendar", icon: CalendarDays, activeMatch: "/artist-dashboard/calendar" },
      { href: "/artist-dashboard/messages/", label: "Messages", icon: MessageSquare, activeMatch: "/artist-dashboard/messages" },
      { href: "/artist-dashboard/insights/", label: "Insights", icon: BarChart3, activeMatch: "/artist-dashboard/insights" },
      { href: "/artist-dashboard/settings/", label: "Settings", icon: Settings, activeMatch: "/artist-dashboard/settings" },
    ],
  },
]

function openPageGuide() {
  persistDemoGuideState({ isOpen: true, isMinimized: false, dismissed: false, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
}

export function ArtistSidebar() {
  const pathname = usePathname()
  const artist = getArtistById(DEMO_ARTIST_ID)
  const { t, locale } = useKleioLocale()

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#E7E1F7] bg-white">
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <KleioWordmarkLink href="/" className="rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {locale === "es" ? section.headingEs : section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.activeMatch ? pathname.startsWith(item.activeMatch) : pathname === item.href || `${pathname}/` === item.href
                const Icon = item.icon
                const label = item.href === "/artist-dashboard/collaborators/" ? (locale === "es" ? "Coincidencias de artistas" : "Artist Matches") : t(artistNavLabelKeys[item.href] ?? item.label)

                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={openPageGuide}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground/70 hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1">{label}</span>
                      {item.comingSoon && <span className="rounded-full bg-[#F7F4FF] px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-[#7F7890]">{locale === "es" ? "Pronto" : "Soon"}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#E7E1F7] p-4">
        <div className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4">
          <p className="font-serif text-sm font-semibold text-[#292631]">{t("nav.artist.tagline.title")}</p>
          <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{t("nav.artist.tagline.body")}</p>
          <div className="mt-3 h-0.5 w-10 rounded-full bg-[#A997E8]" />
        </div>
        {artist && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#E7E1F7] bg-white p-3">
            <InitialAvatar name={artist.name} className="size-9 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{artist.name}</p>
              <p className="truncate text-xs text-muted-foreground">{artist.discipline}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
