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
    <section className="rounded-2xl border border-[#E7E1F7] bg-white p-3 shadow-[0_12px_36px_rgba(82,64,130,0.05)]">
      <div className="grid gap-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon
          const selected = item.id === active

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 transition-colors",
                selected
                  ? "border-[#CFC4EF] bg-[#F7F4FF] text-[#292631]"
                  : "border-transparent text-[#625C70] hover:border-[#E7E1F7] hover:bg-[#FDFBFF]",
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-[#5B4B8A] shadow-sm ring-1 ring-[#E7E1F7]">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[#7F7890]">{item.description}</span>
              </span>
            </Link>
          )
        })}
      </div>

      {showKleioAssistStatus && (
        <div className="mt-3 flex items-start gap-3 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-3 py-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F1ECFB] text-[#5B4B8A]">
            <Sparkles className="size-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#292631]">KLEIO Assist</p>
            <p className="mt-0.5 text-xs leading-relaxed text-[#7F7890]">
              KLEIO Assist is a review-first drafting layer. It is not active in this connected screen yet, and KLEIO does not automatically rewrite, publish, or replace your saved information.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
