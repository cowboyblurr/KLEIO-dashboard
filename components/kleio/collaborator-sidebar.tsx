"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { collaboratorNavLabelKeys } from "@/lib/kleio-nav-i18n"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const navItems = [
  { href: "/collaborator-dashboard/", label: "Overview", icon: LayoutDashboard },
  { href: "/collaborator-dashboard/assignments/", label: "My Assignments", icon: FileText },
  { href: "/collaborator-dashboard/review-queue/", label: "Review Queue", icon: ListChecks },
  { href: "/collaborator-dashboard/guidelines/", label: "Guidelines", icon: ClipboardList },
  { href: "/collaborator-dashboard/messages/", label: "Messages", icon: MessageSquare },
  { href: "/collaborator-dashboard/submitted/", label: "Submitted Reviews", icon: CheckCircle2 },
]

function institutionLabel(organization: string) {
  return organization === "Independent" ? "KLEIO Arthouse" : organization
}

export function CollaboratorSidebar() {
  const pathname = usePathname()
  const { collaborator } = collaboratorAnalytics
  const { t } = useKleioLocale()

  return (
    <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-[#E7E1F7] bg-white">
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <KleioWordmarkLink href="/collaborator-dashboard/" className="rounded-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-border" />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
          {t("nav.collaborator.workspace")}
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active =
              item.href === "/collaborator-dashboard/"
                ? pathname === item.href || pathname === "/collaborator-dashboard"
                : pathname.startsWith(item.href.replace(/\/$/, ""))
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
                  <span className="flex-1">{t(collaboratorNavLabelKeys[item.href] ?? item.label)}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-[#E7E1F7] px-4 py-4">
        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] p-3">
          <p className="text-xs font-medium text-[#5B4B8A]">{t("nav.collaborator.focusedSeat.title")}</p>
          <p className="mt-1 text-[0.7rem] leading-relaxed text-muted-foreground">
            {t("nav.collaborator.focusedSeat.body")}
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <InitialAvatar name={collaborator.name} className="size-9 text-xs" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{collaborator.name}</p>
            <p className="truncate text-xs text-muted-foreground">{collaborator.role}</p>
            <p className="truncate text-xs text-muted-foreground">{institutionLabel(collaborator.organization)}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
