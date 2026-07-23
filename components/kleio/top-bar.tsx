"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Bookmark, Mail, Plus, Search, Send, SlidersHorizontal, Vote, X } from "lucide-react"
import { getDemoMessageForThread, isSubmissionMessagePending } from "@/lib/kleio-analytics"
import { messageThreads, type MessageThread } from "@/lib/kleio-data"
import { getGlobalSearchResults, type KleioSearchResult } from "@/lib/kleio-search"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoSafeAction } from "@/components/kleio/demo-safe-action"
import { InitialAvatar } from "@/components/kleio/initial-avatar"
import { LiveNotificationsPanel } from "@/components/kleio/live-institution-workspace"

function getPrimaryAction(pathname: string, locale: string) {
  const es = locale === "es"
  if (pathname.startsWith("/submissions")) return { label: es ? "Filtrar postulaciones" : "Filter Submissions", href: "/submissions/", icon: SlidersHorizontal }
  if (pathname.startsWith("/review-queue")) return { label: es ? "Asignar revisores" : "Assign Reviewers", href: "/committee/", icon: Plus }
  if (pathname.startsWith("/shortlist")) return { label: es ? "Preparar informe" : "Prepare Report", href: "/reports/", icon: Plus }
  if (pathname.startsWith("/reports")) return { label: es ? "Exportar informe" : "Export Report", href: "/reports/", icon: Plus }
  if (pathname.startsWith("/templates")) return { label: es ? "Crear plantilla" : "Create Template", href: null, icon: Plus }
  if (pathname.startsWith("/programs")) return { label: es ? "Nuevo programa" : "New Program", href: "/programs/new/", icon: Plus }
  return { label: es ? "Crear convocatoria" : "Create Open Call", href: "/programs/new/", icon: Plus }
}

function taskForThread(thread: MessageThread, locale: string) {
  const es = locale === "es"
  if (thread.channel === "Reviewer") return { title: es ? "Seguimiento de revisor" : "Reviewer follow-up", action: es ? "Enviar recordatorio" : "Send reminder", icon: Send }
  if (thread.channel === "Committee") return { title: es ? "Nota de decisión del comité" : "Committee decision note", action: es ? "Abrir conversación" : "Open decision thread", icon: Vote }
  if (thread.preview.toLowerCase().includes("missing") || thread.preview.toLowerCase().includes("need")) return { title: es ? "Solicitud de material faltante" : "Missing material request", action: es ? "Solicitar material" : "Request material", icon: Mail }
  return { title: es ? "Mensaje de postulante" : "Applicant message", action: es ? "Responder" : "Reply", icon: Mail }
}

function categoryLabel(category: KleioSearchResult["category"], locale: string) {
  if (locale !== "es") return category
  const labels: Record<KleioSearchResult["category"], string> = {
    Page: "Página",
    Applicant: "Postulante",
    Artist: "Artista",
    Program: "Programa",
    Reviewer: "Revisor",
    Message: "Mensaje",
    Report: "Informe",
  }
  return labels[category]
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { t, locale } = useKleioLocale()
  const { isLive, isPreview } = useKleioMode()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const primaryAction = getPrimaryAction(pathname, locale)
  const PrimaryIcon = primaryAction.icon
  const es = locale === "es"
  const demoMessage = isLive
    ? es ? "Esta acción todavía no está disponible." : "This action is not available yet."
    : isPreview
    ? es ? "Esta acción no está disponible en la vista previa." : "This action is not available in the preview."
    : es ? "Acción de demostración. Los datos de muestra no se modificarán." : "Demo action. Sample data will not be changed."

  const notificationThreads = useMemo(() => messageThreads.filter((thread) => thread.unread || isSubmissionMessagePending(thread.submissionId)).slice(0, 3), [])
  const searchResults = useMemo(() => {
    const results = getGlobalSearchResults(searchQuery, searchQuery.trim() ? 9 : 6)
    return isLive ? results.filter((result) => result.id.startsWith("page-")) : results
  }, [isLive, searchQuery])
  const searchPlaceholder = isLive
    ? es ? "Buscar páginas del espacio…" : "Search workspace pages…"
    : isPreview
    ? es ? "Buscar en la vista previa…" : "Search the workspace preview…"
    : es ? "Buscar en el demo institucional…" : "Search the institution demo…"

  function openResult(href: string) {
    setSearchOpen(false)
    setSearchQuery("")
    router.push(href)
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 overflow-x-auto border-b border-border bg-background/85 px-3 py-3 backdrop-blur-xl sm:gap-3 sm:px-5 xl:px-7">
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
                <p className="text-sm font-semibold text-foreground">{searchQuery.trim() ? (es ? "Resultados de búsqueda" : "Search results") : (es ? "Rutas sugeridas del espacio" : "Suggested workspace paths")}</p>
                <p className="text-xs text-muted-foreground">{isLive ? (es ? "Páginas y herramientas disponibles en tu espacio." : "Pages and tools available in your workspace.") : (es ? "Postulantes, artistas, programas, revisores, mensajes e informes de muestra." : "Sample applicants, artists, programs, reviewers, messages, and reports.")}</p>
              </div>
              <button type="button" onClick={() => setSearchOpen(false)} className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground" aria-label={es ? "Cerrar búsqueda" : "Close search"}><X className="size-4" /></button>
            </div>
            <div className="max-h-[25rem] overflow-y-auto p-2">
              {searchResults.length > 0 ? searchResults.map((result) => {
                const translatedCategory = categoryLabel(result.category, locale)
                return (
                  <button key={result.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => openResult(result.href)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/40">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-[0.65rem] font-semibold uppercase text-primary">{translatedCategory.slice(0, 2)}</span>
                    <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-foreground">{result.title}</span><span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-muted-foreground">{translatedCategory}</span></span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{result.subtitle}</span></span>
                  </button>
                )
              }) : <p className="px-3 py-6 text-center text-sm text-muted-foreground">{isLive ? (es ? "No hay páginas que coincidan. Prueba “Postulaciones”, “Cola de revisión” o “Informes”." : "No matching pages. Try “Submissions,” “Review Queue,” or “Reports.”") : (es ? "Sin resultados todavía. Prueba “Amina”, “Informe”, “Cola de revisión” o “materiales faltantes”." : "No results yet. Try “Amina,” “Report,” “Review Queue,” or “missing materials.”")}</p>}
            </div>
          </div>
        )}
      </div>

      {!isLive && <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />}
      {isPreview && <span className="hidden rounded-full border border-border bg-card px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground xl:inline-flex">{es ? "Vista previa" : "Workspace Preview"}</span>}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link href="/submissions/" className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50 lg:flex"><SlidersHorizontal className="size-4 text-muted-foreground" />{t("institution.topBar.filterSubmissions")}</Link>
        <Link href="/shortlist/" aria-label={t("institution.shortlist.title")} className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"><Bookmark className="size-4" /></Link>

        {isLive ? <LiveNotificationsPanel /> : <div className="relative">
          <button type="button" onClick={() => setNotificationsOpen((open) => !open)} aria-expanded={notificationsOpen} aria-label={es ? "Ver tareas pendientes" : "View pending tasks"} className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"><Bell className="size-4" /><span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground ring-2 ring-background">{notificationThreads.length}</span></button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[24rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold text-foreground">{es ? `${notificationThreads.length} acciones requieren atención` : `${notificationThreads.length} actions need attention`}</p><p className="text-xs text-muted-foreground">{es ? "Cada elemento abre la conversación o flujo correspondiente." : "Each item opens the exact thread or workflow."}</p></div><button type="button" onClick={() => setNotificationsOpen(false)} aria-label={es ? "Cerrar tareas" : "Close notifications"} className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"><X className="size-4" /></button></div>
              <div className="max-h-[22rem] overflow-y-auto p-2">{notificationThreads.map((thread) => { const linkedMessage = getDemoMessageForThread(thread.linkedMessageId); const task = taskForThread(thread, locale); const TaskIcon = task.icon; return <Link key={thread.id} href={`/messages/?thread=${thread.id}`} onClick={() => setNotificationsOpen(false)} className="block rounded-xl px-3 py-3 transition-colors hover:bg-accent/40"><div className="flex items-start gap-3"><InitialAvatar name={thread.counterpart} className="size-9 text-xs" /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-foreground">{thread.counterpart}</span><span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-primary">{linkedMessage?.status ?? thread.channel}</span></span><span className="mt-0.5 block text-xs font-semibold text-foreground/80">{task.title}</span><span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{thread.preview}</span><span className="mt-2 inline-flex h-7 items-center gap-1.5 rounded-full bg-primary px-2.5 text-[0.65rem] font-semibold text-primary-foreground"><TaskIcon className="size-3" />{task.action}</span></span></div></Link> })}</div>
              <div className="border-t border-border p-3"><Link href="/messages/" onClick={() => setNotificationsOpen(false)} className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Abrir centro de mensajes" : "Open full message center"}</Link></div>
            </div>
          )}
        </div>}

        {primaryAction.href ? <Link href={primaryAction.href} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"><PrimaryIcon className="size-4" />{primaryAction.label}</Link> : <DemoSafeAction message={demoMessage} className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"><PrimaryIcon className="size-4" />{primaryAction.label}</DemoSafeAction>}
      </div>
    </header>
  )
}
