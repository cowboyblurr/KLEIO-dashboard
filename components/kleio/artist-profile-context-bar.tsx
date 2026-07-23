"use client"

import Link from "next/link"
import { LayoutDashboard, Sparkles, UserRound } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  {
    id: "workspace",
    href: "/artist-dashboard/",
    label: "Artist Workspace",
    description: "Private area for opportunities, applications, tasks, and platform activity.",
    icon: LayoutDashboard,
  },
  {
    id: "passport",
    href: "/artist-dashboard/passport/",
    label: "Creative Passport",
    description: "Reusable source record for your biography, statement, CV, portfolio, and application materials.",
    icon: Sparkles,
  },
  {
    id: "profile",
    href: "/artist-dashboard/profile/",
    label: "Artist Profile",
    description: "Presentation preview generated from information you have saved and approved.",
    icon: UserRound,
  },
] as const

export function ArtistProfileContextBar({
  active,
  showKleioAssistStatus = false,
}: {
  active: (typeof items)[number]["id"]
  showKleioAssistStatus?: boolean
}) {
  return (
    <section className="flex min-w-0 flex-col gap-2 border-b border-[#EEE9F8] pb-3 sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Artist workspace sections" className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1 sm:pb-0">
        {items.map((item) => {
          const Icon = item.icon
          const selected = item.id === active

          return (
            <Link
              key={item.id}
              href={item.href}
              title={item.description}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/60 focus-visible:ring-offset-2",
                selected
                  ? "bg-[#F3EFFB] text-[#4E426F]"
                  : "text-[#746E80] hover:bg-[#FAF8FE] hover:text-[#4E426F]",
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {showKleioAssistStatus && (
        <span
          role="status"
          title="KLEIO Assist will provide optional, editable guidance. It is not active on this screen yet."
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#E9E3F5] bg-[#FBFAFE] px-2.5 py-1 text-[0.65rem] font-medium text-[#8A8296] sm:self-auto"
        >
          <Sparkles className="size-3" aria-hidden="true" />
          <span>KLEIO Assist</span>
          <span aria-hidden="true">·</span>
          <span>Coming soon</span>
        </span>
      )}
    </section>
  )
}
