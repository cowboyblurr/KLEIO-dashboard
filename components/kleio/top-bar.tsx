"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Bookmark, ChevronDown, LogOut, Plus, Search, SlidersHorizontal, X } from "lucide-react"
import { analytics, getDemoMessageForThread, isSubmissionMessagePending } from "@/lib/kleio-analytics"
import { messageThreads } from "@/lib/kleio-data"
import { useDemoSignOut } from "@/components/kleio/auth-gate"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoSafeAction } from "@/components/kleio/demo-safe-action"
import { InitialAvatar } from "@/components/kleio/initial-avatar"

function getPrimaryAction(pathname: string, locale: string) {
  const es = locale === "es"
  if (pathname.startsWith("/submissions")) return { label: es ? "Filtrar postulaciones" : "Filter Submissions", href: "/submissions/", icon: SlidersHorizontal }
  if (pathname.startsWith("/review-queue")) return { label: es ? "Asignar revisores" : "Assign Reviewers", href: "/committee/", icon: Plus }
  if (pathname.startsWith("/shortlist")) return { label: es ? "Preparar informe" : "Prepare Report", href: "/reports/", icon: Plus }
  if (pathname.startsWith("/reports")) return { label: es ? "Exportar informe demo" : "Export Demo Report", href: null, icon: Plus }
  if (pathname.startsWith("/templates")) return { label: es ? "Crear plantilla" : "Create Template", href: null, icon: Plus }
  if (pathname.startsWith("/programs")) return { label: es ? "Nuevo programa" : "New Program", href: "/programs/new/", icon: Plus }
  return { label: es ? "Crear convocatoria" : "Create Open Call", href: "/programs/new/", icon: Plus }
}

export function TopBar() {
  const signOut = useDemoSignOut()
  const pathname = usePathname()
  const { t, locale } = useKleioLocale()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const primaryAction = getPrimaryAction(pathname, locale)
  const PrimaryIcon = primaryAction.icon
  const demoMessage =
    locale === "es"
      ? "Acción de demostración. Este prototipo no modifica datos reales."
      : "Demo action. This prototype does not change live data."

  const notificationThreads = useMemo(
    () =>
      messageThreads
        .filter((thread) => thread.unread || isSubmissionMessagePending(thread.submissionId))
        .slice(0, 3),
    [],
  )

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-border bg-background/85 px-5 py-3 backdrop-blur-xl xl:px-7">
      <div className="relative flex-1 max-w-3xl">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder={locale === "es" ? "Buscar en el demo institucional…" : "Search the institution demo…"}
          className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-16 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
          aria-label={t("institution.topBar.searchPlaceholder")}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[0.7rem] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </div>

      <DemoEnvironmentBadge compact className="hidden xl:inline-flex" />

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Link
          href="/submissions/"
          className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent/50 lg:flex"
        >
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {t("institution.topBar.filterSubmissions")}
        </Link>

        <Link
          href="/shortlist/"
          aria-label={t("institution.shortlist.title")}
          className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
        >
          <Bookmark className="size-4" />
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setNotificationsOpen((open) => !open)}
            aria-expanded={notificationsOpen}
            aria-label={locale === "es" ? "Ver notificaciones" : "View notifications"}
            className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:bg-accent/50 hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[0.65rem] font-semibold text-primary-foreground ring-2 ring-background">
              {analytics.messageBadgeCount}
            </span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(40,30,70,0.14)]">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{locale === "es" ? "Notificaciones" : "Notifications"}</p>
                  <p className="text-xs text-muted-foreground">
                    {locale === "es" ? "Mensajes y acciones pendientes" : "Pending messages and review actions"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                  className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="max-h-[21rem] overflow-y-auto p-2">
                {notificationThreads.map((thread) => {
                  const linkedMessage = getDemoMessageForThread(thread.linkedMessageId)
                  return (
                    <Link
                      key={thread.id}
                      href={`/messages/?thread=${thread.id}`}
                      onClick={() => setNotificationsOpen(false)}
                      className="flex items-start gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/40"
                    >
                      <InitialAvatar name={thread.counterpart} className="size-9 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-foreground">{thread.counterpart}</span>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[0.58rem] font-semibold uppercase tracking-wide text-primary">
                            {linkedMessage?.status ?? thread.channel}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-foreground/80">{thread.subject}</span>
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{thread.preview}</span>
                      </span>
                    </Link>
                  )
                })}
              </div>

              <div className="border-t border-border p-3">
                <Link
                  href="/messages/"
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-flex h-9 w-full items-center justify-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {locale === "es" ? "Abrir todos los mensajes" : "Open all messages"}
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="ml-1 flex items-center overflow-visible rounded-xl shadow-sm">
          {primaryAction.href ? (
            <Link
              href={primaryAction.href}
              className="flex h-10 items-center gap-2 rounded-l-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PrimaryIcon className="size-4" />
              {primaryAction.label}
            </Link>
          ) : (
            <DemoSafeAction
              message={demoMessage}
              className="flex h-10 items-center gap-2 rounded-l-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <PrimaryIcon className="size-4" />
              {primaryAction.label}
            </DemoSafeAction>
          )}
          <button
            type="button"
            onClick={signOut}
            className="flex h-10 items-center gap-2 rounded-r-xl border-l border-primary/20 bg-primary px-3 text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label={t("institution.topBar.signOut")}
          >
            <LogOut className="size-4" />
            <ChevronDown className="size-3.5 opacity-80" />
          </button>
        </div>
      </div>
    </header>
  )
}
