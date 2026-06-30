"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Briefcase,
  FileText,
  FolderOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { DEMO_ARTIST_ID, getArtistById } from "@/lib/kleio-data"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { assetPath } from "@/lib/asset-path"

const navItems = [
  { href: "/artist-dashboard/", label: "Overview", icon: LayoutDashboard },
  { href: "/artist-dashboard/", label: "Creative Passport", icon: Sparkles, activeMatch: "/artist-dashboard" },
  { href: "/artist-dashboard/", label: "Portfolio", icon: FolderOpen },
  { href: "/artist-dashboard/", label: "Opportunities", icon: Briefcase },
  { href: "/artist-dashboard/", label: "Applications", icon: FileText },
  { href: "/messages/", label: "Messages", icon: MessageSquare, badge: 1 },
  { href: "/artist-dashboard/", label: "Settings", icon: Settings },
]

export function ArtistSidebar() {
  const pathname = usePathname()
  const artist = getArtistById(DEMO_ARTIST_ID)

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <Link
          href="/artist-dashboard/"
          aria-label="KLEIO artist home"
          className="inline-flex items-center rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border"
        >
          <Image
            src={assetPath("/kleio-wordmark.png")}
            alt="KLEIO"
            width={1024}
            height={189}
            priority
            className="h-6 w-auto"
          />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          Artist Workspace
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = item.activeMatch ? pathname.startsWith(item.activeMatch) : pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-foreground/70 hover:bg-accent/60 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1">{item.label}</span>
                  {item.badge != null && (
                    <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {artist && (
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
            <InitialAvatar name={artist.name} className="size-9 text-xs" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{artist.name}</p>
              <p className="truncate text-xs text-muted-foreground">Creative Passport</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
