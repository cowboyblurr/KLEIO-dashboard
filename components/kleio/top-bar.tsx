"use client"

import { Bell, Bookmark, ChevronDown, Plus, SlidersHorizontal, Search } from "lucide-react"

export function TopBar() {
  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b border-border bg-background/80 px-4 py-3.5 backdrop-blur-md sm:px-6">
      <div className="relative min-w-[14rem] flex-1 basis-72 lg:max-w-2xl">
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

      <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          <span className="hidden sm:inline">Filters</span>
        </button>

        <button
          type="button"
          aria-label="Bookmarks"
          className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bookmark className="size-4" />
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bell className="size-4" />
          <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground ring-2 ring-background">
            6
          </span>
        </button>

        <div className="ml-1 flex items-center overflow-hidden rounded-xl shadow-sm">
          <button
            type="button"
            className="flex h-10 items-center gap-2 bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Submission</span>
          </button>
          <button
            type="button"
            aria-label="More submission options"
            className="grid h-10 w-9 place-items-center border-l border-primary-foreground/20 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
