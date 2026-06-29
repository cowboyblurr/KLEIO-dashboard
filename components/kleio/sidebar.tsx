"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { navSections } from "@/lib/kleio-nav"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center justify-between px-6 pt-6 pb-5">
        <Link
          href="/"
          className="relative block h-12 w-36 overflow-hidden rounded-sm bg-white"
          aria-label="KLEIO home"
        >
          <Image
            src="/kleio-logo-white.png"
            alt="KLEIO"
            fill
            sizes="144px"
            className="object-contain object-center"
            priority
          />
        </Link>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label="Collapse sidebar"
        >
          <ChevronDown className="size-4 -rotate-90" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="px-3 pb-2 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground/80">
              {section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href
                const Icon = item.icon
                return (
                  <li key={item.href}>
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
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          active ? "text-primary" : "text-muted-foreground",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge != null && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums",
                            active
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-accent/60"
        >
          <InitialAvatar name="Olivia Carter" className="size-9 text-xs" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              Olivia Carter
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Program Director
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>

        <button
          type="button"
          className="mt-1 flex w-full items-center gap-3 rounded-lg border border-border bg-card px-2 py-2 text-left transition-colors hover:bg-accent/40"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-[0.6rem] font-bold tracking-wide text-primary-foreground">
            ISCP
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              International Studio Program
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Brooklyn, NY, USA
            </span>
          </span>
          <ChevronsUpDown className="size-4 text-muted-foreground" />
        </button>
      </div>
    </aside>
  )
}
