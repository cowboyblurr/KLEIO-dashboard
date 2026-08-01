"use client"

/* eslint-disable @next/next/no-img-element -- private profile images use short-lived signed URLs */

import { useEffect, useState } from "react"
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
  UploadCloud,
  UserRound,
  UsersRound,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { artistNavLabelKeys } from "@/lib/kleio-nav-i18n"
import { loadArtistPassport } from "@/lib/kleio-live-data"
import { loadArtistProfilePresentation } from "@/lib/kleio-profile-presentation"
import { disciplineLabel } from "@/lib/kleio-artist-taxonomy"
import { AccountSignOutButton } from "@/components/kleio/account-sign-out-button"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; activeMatch?: string; comingSoon?: boolean }
type NavSection = { heading: string; headingEs: string; items: NavItem[] }
type LiveArtistIdentity = { name: string; discipline: string; imageUrl: string | null; positionX: number; positionY: number }

const navSections: NavSection[] = [
  {
    heading: "Core Artist Flow",
    headingEs: "Flujo principal",
    items: [
      { href: "/artist-dashboard/", label: "Overview", icon: LayoutDashboard },
      { href: "/artist-dashboard/passport/", label: "Creative Passport", icon: Sparkles, activeMatch: "/artist-dashboard/passport" },
      { href: "/artist-dashboard/profile/", label: "Artist Profile", icon: UserRound, activeMatch: "/artist-dashboard/profile" },
      { href: "/artist-dashboard/opportunities/", label: "Opportunities", icon: Briefcase, activeMatch: "/artist-dashboard/opportunities" },
      { href: "/artist-dashboard/applications/", label: "Applications", icon: FileText, activeMatch: "/artist-dashboard/applications" },
      { href: "/artist-dashboard/portfolio/", label: "Portfolio", icon: FolderOpen, activeMatch: "/artist-dashboard/portfolio" },
      { href: "/artist-dashboard/import/", label: "Import Studio", icon: UploadCloud, activeMatch: "/artist-dashboard/import" },
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
  const { isLive } = useKleioMode()
  const demoArtist = getArtistById(DEMO_ARTIST_ID)
  const [liveArtist, setLiveArtist] = useState<LiveArtistIdentity | null>(null)
  const { t, locale } = useKleioLocale()

  useEffect(() => {
    let active = true
    if (!isLive) {
      setLiveArtist(null)
      return () => { active = false }
    }
    void Promise.all([loadArtistPassport(), loadArtistProfilePresentation()])
      .then(([passport, presentation]) => {
        if (!active || !passport) return
        setLiveArtist({
          name: passport.professional_name || "KLEIO Artist",
          discipline: passport.disciplines[0] ? disciplineLabel(passport.disciplines[0], locale) : (locale === "es" ? "Artista" : "Artist"),
          imageUrl: presentation.profile_image_url,
          positionX: presentation.profile_image_position_x,
          positionY: presentation.profile_image_position_y,
        })
      })
      .catch(() => { if (active) setLiveArtist(null) })
    return () => { active = false }
  }, [isLive, locale])

  const artist = isLive ? liveArtist : demoArtist ? { name: demoArtist.name, discipline: demoArtist.discipline, imageUrl: null, positionX: 50, positionY: 50 } : null
  const mobileItems = navSections.flatMap((section) => section.items)

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 border-b border-[#E7E1F7] bg-white px-3 md:hidden">
        <KleioWordmarkLink href="/" className="shrink-0 rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-border" />
        <nav aria-label="Artist workspace" className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {mobileItems.map((item) => { const active = item.activeMatch ? pathname.startsWith(item.activeMatch) : pathname === item.href || `${pathname}/` === item.href; const Icon = item.icon; return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} aria-label={item.label} className={cn("grid size-10 shrink-0 place-items-center rounded-lg", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-accent/60")}><Icon className="size-4" /></Link> })}
        </nav>
        <AccountSignOutButton compact className="border-[#E7E1F7] bg-white shadow-sm" />
      </div>
      <aside className="hidden h-full w-[208px] shrink-0 flex-col border-r border-[#E7E1F7] bg-white md:flex">
        <div className="flex items-center justify-between px-5 pb-4 pt-5"><KleioWordmarkLink href="/" className="rounded-md bg-white px-2 py-1 shadow-sm ring-1 ring-border" /></div>
        <nav className="flex-1 overflow-y-auto px-2.5 pb-3">
          {navSections.map((section) => (
            <div key={section.heading} className="mb-4">
              <p className="px-2.5 pb-1.5 text-[0.61rem] font-semibold uppercase tracking-[0.15em] text-muted-foreground/80">{locale === "es" ? section.headingEs : section.heading}</p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.activeMatch ? pathname.startsWith(item.activeMatch) : pathname === item.href || `${pathname}/` === item.href
                  const Icon = item.icon
                  const label = item.href === "/artist-dashboard/collaborators/"
                    ? (locale === "es" ? "Coincidencias de artistas" : "Artist Matches")
                    : item.href === "/artist-dashboard/profile/"
                      ? (locale === "es" ? "Perfil de artista" : "Artist Profile")
                      : item.href === "/artist-dashboard/import/"
                        ? (locale === "es" ? "Estudio de importación" : "Import Studio")
                        : t(artistNavLabelKeys[item.href] ?? item.label)
                  return <li key={item.label}><Link href={item.href} onClick={isLive ? undefined : openPageGuide} aria-current={active ? "page" : undefined} className={cn("group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.82rem] font-medium transition-colors", active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-foreground/70 hover:bg-accent/60 hover:text-foreground")}><Icon className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} /><span className="flex-1">{label}</span>{item.comingSoon && <span className="rounded-full bg-[#F7F4FF] px-1.5 py-0.5 text-[0.52rem] font-semibold uppercase tracking-wide text-[#7F7890]">{locale === "es" ? "Pronto" : "Soon"}</span>}</Link></li>
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="border-t border-[#E7E1F7] p-3">
          <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3"><p className="font-serif text-[0.82rem] font-semibold text-[#292631]">{t("nav.artist.tagline.title")}</p><p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">{t("nav.artist.tagline.body")}</p><div className="mt-2 h-0.5 w-8 rounded-full bg-[#A997E8]" /></div>
          {artist && <Link href="/artist-dashboard/profile/" className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#E7E1F7] bg-white p-2.5 transition-colors hover:bg-[#FDFBFF]">{artist.imageUrl ? <img src={artist.imageUrl} alt="" className="size-8 rounded-full object-cover" style={{ objectPosition: `${artist.positionX}% ${artist.positionY}%` }} /> : <InitialAvatar name={artist.name} className="size-8 text-[0.68rem]" />}<div className="min-w-0 flex-1"><p className="truncate text-[0.82rem] font-medium text-foreground">{artist.name}</p><p className="truncate text-[0.68rem] text-muted-foreground">{artist.discipline}</p><p className="mt-0.5 text-[0.6rem] font-semibold text-[#5B4B8A]">{locale === "es" ? "Ver perfil" : "View profile"}</p></div></Link>}
          <AccountSignOutButton className="mt-2 justify-start border-transparent bg-transparent px-2.5 hover:border-[#E7E1F7]" />
        </div>
      </aside>
    </>
  )
}
