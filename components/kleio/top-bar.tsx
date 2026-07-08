"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Bookmark, ChevronDown, LogOut, Mail, Plus, Search, Send, SlidersHorizontal, Vote, X } from "lucide-react"
import { analytics, getDemoMessageForThread, isSubmissionMessagePending } from "@/lib/kleio-analytics"
import { messageThreads, type MessageThread } from "@/lib/kleio-data"
import { getGlobalSearchResults } from "@/lib/kleio-search"
import { useDemoSignOut } from "@/components/kleio/auth-gate"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoSafeAction } from "@/components/kleio/demo-safe-action"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

function getPrimaryAction(pathname: string, locale: string, isPreview: boolean) {
  const es = locale === "es"
  if (pathname.startsWith("/submissions")) return { label: es ? "Filtrar postulaciones" : "Filter Submissions", href: "/submissions/", icon: SlidersHorizontal }
  if (pathname.startsWith("/review-queue")) return { label: es ? "Asignar revisores" : "Assign Reviewers", href: "/committee/", icon: Plus }
  if (pathname.startsWith("/shortlist")) return { label: es ? "Preparar informe" : "Prepare Report", href: "/reports/", icon: Plus }
  if (pathname.startsWith("/reports")) return { label: es ? "Exportar informe" : isPreview ? "Export Report" : "Export Demo Report", href: null, icon: Plus }
  if (pathname.startsWith("/templates")) return { label: es ? "Crear plantilla" : "Create Template", href: null, icon: Plus }
  if (pathname.startsWith("/programs")) return { label: es ? "Nuevo programa" : "New Program", href: "/programs/new/", icon: Plus }
  return { label: es ? "Crear convocatoria" : "Create Open Call", href: "/programs/new/", icon: Plus }
}

function taskForThread(thread: MessageThread) {
  if (thread.channel === "Reviewer") return { title: "Reviewer follow-up", action: "Send reminder", icon: Send }
  if (thread.channel === "Committee") return { title: "Committee decision note", action: "Open decision thread", icon: Vote }
  if (thread.preview.toLowerCase().includes("missing") || thread.preview.toLowerCase().includes("need")) return { title: "Missing material request", action: "Request material", icon: Mail }
  return { title: "Applicant message", action: "Reply", icon: Mail }
}

export function TopBar() {
  const signOut = useDemoSignOut()
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const { isPreview } = useKleioMode()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const primaryAction = getPrimaryAction(pathname, locale, isPreview)
  const PrimaryIcon = primaryAction.icon
  const demoMessage = isPreview ? locale === "es" ? "Acción de vista previa. El backend de producción todavía no está conectado." : "Preview action. Production backend export is not connected yet." : locale === "es" ? "Acción de demostración. Este prototipo no modifica datos reales." : "Demo action. This prototype does not change live data."

  const notificationThreads = useMemo(() => messageThreads.filter((thread) => thread.unread || isSubmissionMessagePending(thread.submissionId)).slice(0, 3), [])
  const searchResults = useMemo(() => getGlobalSearchResults(searchQuery, searchQuery.trim() ? 9 : 6), [searchQuery])
  const searchPlaceholder = isPreview ? locale === "es" ? "Buscar en KLEIO Workspace…" : "Search KLEIO Workspace…" : locale === "es" ? "Buscar en el demo institucional…" : "Search the institution demo…"

  function openResult(href: string) {
    setSearchOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl xl:px-7">
      <div className="relative flex-1 max-w-3xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onFocus={() => setSearchOpen(true)}
          onChange={(event) => { setSearchQuery(event.target.value); setSearchOpen(true) }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setSearchOpen(false)
            if (event.key === "Enter" && searchResults[0]) openResult(searchResults[0].href)
          }}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          aria-label={t("institution.topBar.searchPlaceholder")}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">↵</kbd>

        {searchOpen && (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{searchQuery.trim() ? "Search results" : "Suggested workspace paths"}</p>
                <p className="text-xs text-muted-foreground">Applicants, artists, programs, reviewers, messages, and reports.</p>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground" aria-label="Close search"><X className="size-4" /></button>
            </div>
            <div className="max-h-[25rem] overflow-y-auto p-2">
              {searchResults.length > 0 ? searchResults.map((result) => (
                <button key={result.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => openResult(result.href)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/40">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-[0.65rem] font-semibold uppercase text-primary">{result.category.slice(0, 2)}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-foreground">{result.title}</span><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground">{result.category}</span></span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{result.subtitle}</span></span>
                </button>
              )) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">No results yet. Try “Amina,” “Report,” “Review Queue,” or “missing materials.”</p>}
            </div>
          </div>
        )}
      </div>

      <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />
      {isPreview && <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:inline-flex">Workspace Preview</span>}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link href="/submissions/" className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50 lg:flex"><SlidersHorizontal className="size-4 text-muted-foreground" />{t("institution.topBar.filterSubmissions")}</Link>
        <Link href="/shortlist/" aria-label={t("institution.shortlist.title")} className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"><Bookmark className="size-4" /></Link>

        <div className="relative">
          <button type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen} aria-label={locale === "es" ? "Ver tareas pendientes" : "View pending tasks"} className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"><Bell className="size-4" /><span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground ring-2 ring-background">{notificationThreads.length}</span></button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[24rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold text-foreground">{notificationThreads.length} actions need attention</p><p className="text-xs text-muted-foreground">Each item opens the exact thread or workflow.</p></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label="Close notifications" className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"><X className="size-4" /></button></div>
              <div className="max-h-[22rem] overflow-y-auto p-2">{notificationThreads.map((thread) => { const linkedMessage = getDemoMessageForThread(thread.linkedMessageId); const task = taskForThread(thread); const TaskIcon = task.icon; return <Link key={thread.id} href={`/messages/?thread=${thread.id}`} onClick={() => setNotificationsOpen(false)} className="block rounded-xl px-3 py-3 transition-colors hover:bg-accent/40"><div className="flex items-start gap-3"><InitialAvatar name={thread.counterpart} className="size-9 text-xs" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-foreground">{thread.counterpart}</span><span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-primary">{linkedMessage?.status ?? thread.channel}</span></span><span className="mt-0.5 block text-xs font-semibold text-foreground/80">{task.title}</span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{thread.preview}</span><span className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-[0.65rem] font-semibold text-primary-foreground"><TaskIcon className="size-3" />{task.action}</span></span></div></Link> })}</div>
              <div className="border-t border-border p-3"><Link href="/messages/" onClick={() => setNotificationsOpen(false)} className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Open full message center</Link></div>
            </div>
          )}
        </div>

        <div className="ml-1 flex items-center overflow-visible rounded-xl shadow-sm">
          {primaryAction.href ? <Link href={primaryAction.href} className="flex h-10 items-center gap-2 rounded-l-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><PrimaryIcon className="size-4" />{primaryAction.label}</Link> : <DemoSafeAction message={demoMessage} className="flex h-10 items-center gap-2 rounded-l-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><PrimaryIcon className="size-4" />{primaryAction.label}</DemoSafeAction>}
          <button type="button" onClick={signOut} className="flex h-10 items-center gap-2 rounded-r-xl border-l border-primary/20 bg-primary px-3 text-primary-foreground transition-colors hover:bg-primary/90" aria-label={t("institution.topBar.signOut")}><LogOut className="size-4" /><ChevronDown className="size-3.5 opacity-80" /></button>
        </div>
      </div>
    </header>
  )
}
