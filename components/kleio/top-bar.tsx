"use client"

import Link from "next/link"
import { Bell, Bookmark, ChevronDown, LogOut, Plus, SlidersHorizontal, Search } from "lucide-react"
import { analytics } from "@/lib/kleio-analytics"
import { useDemoSignOut } from "@/components/kleio/auth-gate"

export function TopBar() {
  const signOut = useDemoSignOut()
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl xl:px-7">
      <div className="relative flex-1 max-w-3xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search artists, projects, programs, or submissions…"
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          aria-label="Search"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/submissions/"
          className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          Filter Submissions
        </Link>

        <Link
          href="/shortlist/"
          aria-label="Open shortlist"
          className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bookmark className="size-4" />
        </Link>

        <Link
          href="/messages/"
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground ring-2 ring-background">
            {analytics.messageBadgeCount}
          </span>
        </Link>

        <div className="ml-1 flex items-center overflow-hidden rounded-xl shadow-sm">
          <Link
            href="/programs/new/"
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            Create Open Call
          </Link>
          <Link
            href="/programs/"
            aria-label="More program options"
            className="grid h-10 w-9 place-items-center border-l border-primary-foreground/20 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ChevronDown className="size-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="ml-1 flex h-10 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </div>
    </header>
  )
}
