"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

type Guidance = {
  title: string
  body: string
  href?: string
  cta?: string
}

function targetForPath(pathname: string | null) {
  const path = pathname ?? ""
  if (path.startsWith("/programs")) return "institution-programs"
  if (path.startsWith("/submissions")) return "applicant-context"
  if (path.startsWith("/artists")) return "artist-records"
  if (path.startsWith("/review-queue")) return "review-queue"
  if (path.startsWith("/review-room")) return "review-room"
  if (path.startsWith("/committee")) return "committee-reviewers"
  if (path.startsWith("/shortlist")) return "shortlist"
  if (path.startsWith("/reports")) return "report-preview"
  if (path.startsWith("/activity-log")) return "activity-log"
  if (path.startsWith("/messages")) return "messages"
  return undefined
}

function guidanceForPath(pathname: string | null, locale: string): Guidance | null {
  const es = locale === "es"
  const path = pathname ?? ""

  if (path.startsWith("/programs")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Programas le da a cada convocatoria una estructura clara antes de recibir postulaciones: fechas, materiales, revisores y próximos pasos quedan visibles desde el inicio."
        : "Programs gives each call a clear structure before submissions arrive, so deadlines, materials, reviewers, and next steps stay visible from the beginning.",
      href: "/review-queue/",
      cta: es ? "Ver revisión" : "View review flow",
    }
  }

  if (path.startsWith("/submissions")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Submissions convierte archivos recibidos en registros comparables. El equipo puede encontrar postulantes, revisar materiales y mantener contexto sin volver a correos, PDFs y hojas."
        : "Submissions turns received files into comparable records, so the team can find applicants, review materials, and keep context without returning to emails, PDFs, and spreadsheets.",
      href: "/review-queue/",
      cta: es ? "Abrir cola" : "Open queue",
    }
  }

  if (path.startsWith("/artists")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Artist Records mantiene práctica, materiales e historial conectados. La institución entiende al artista más allá de una sola aplicación o un archivo aislado."
        : "Artist Records keeps practice, materials, and history connected, helping the institution understand the artist beyond one application or isolated file.",
      href: "/submissions/",
      cta: es ? "Ver postulaciones" : "View submissions",
    }
  }

  if (path.startsWith("/review-queue")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Review Queue muestra qué postulaciones están listas, cuáles necesitan materiales y qué revisores siguen pendientes. Es la capa de trabajo antes de la conversación curatorial."
        : "Review Queue shows which submissions are ready, which need materials, and which reviewers are still pending. It is the working layer before curatorial discussion.",
      href: "/review-room/",
      cta: es ? "Abrir sala" : "Open review room",
    }
  }

  if (path.startsWith("/review-room")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Review Room le da al comité un espacio más claro para conversar sobre postulantes con contexto suficiente: qué está listo, qué falta resolver y qué puede avanzar hacia shortlist o informe."
        : "Review Room gives the committee a clearer place to discuss applicants with enough context: what is ready, what still needs resolution, and what can move toward shortlist or report.",
      href: "/shortlist/",
      cta: es ? "Avanzar shortlist" : "Move to shortlist",
    }
  }

  if (path.startsWith("/committee")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Committee hace visible quién está asignado, quién está revisando, quién entregó y qué necesita discusión. La coordinación deja de depender de memoria o seguimiento manual."
        : "Committee makes reviewer coordination visible: who is assigned, who is in review, who has submitted, and what needs discussion. Follow-up no longer depends on memory.",
      href: "/collaborator-dashboard/",
      cta: es ? "Vista de revisor" : "Preview reviewer seat",
    }
  }

  if (path.startsWith("/shortlist")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Shortlist conserva notas, contexto de comité y estado final mientras el grupo se reduce. La razón de avance queda conectada al registro."
        : "Shortlist preserves notes, committee context, and final status as the group narrows, keeping the reason for advancement attached to the record.",
      href: "/reports/",
      cta: es ? "Preparar informe" : "Prepare report",
    }
  }

  if (path.startsWith("/reports")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Reports convierte el ciclo de revisión en memoria institucional: resultados, progreso de revisores, shortlist e historial de decisiones sin reconstruir todo manualmente."
        : "Reports turns the review cycle into institutional memory: outcomes, reviewer progress, shortlist movement, and decision history without rebuilding the story manually.",
      href: "/activity-log/",
      cta: es ? "Ver historial" : "View history",
    }
  }

  if (path.startsWith("/activity-log")) {
    return {
      title: es ? "Por qué esta página importa" : "Why this page matters",
      body: es
        ? "Activity Log conserva qué cambió, cuándo cambió y quién lo movió. Es la memoria operativa detrás de decisiones, mensajes y actualizaciones."
        : "Activity Log preserves what changed, when it changed, and who moved it forward. It is the operating memory behind decisions, messages, and updates.",
      href: "/reports/",
      cta: es ? "Ver informes" : "View reports",
    }
  }

  return null
}

export function DemoPageShell({ title, description, actions, children }: { title: string; description: string; actions?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname()
  const { locale } = useKleioLocale()
  const guidance = guidanceForPath(pathname, locale)
  const target = targetForPath(pathname)

  return (
    <main data-kleio-guide-target={target} className="flex h-full min-h-0 flex-col overflow-auto px-5 py-6 xl:px-7 xl:py-7">
      <div className="min-w-[760px]">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">{title}</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {actions}
            <DemoEnvironmentBadge compact />
          </div>
        </header>

        {guidance && (
          <section data-kleio-guide-target={target ? `${target}-guidance` : undefined} className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] px-4 py-3 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{guidance.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#4A425D]">{guidance.body}</p>
              </div>
              {guidance.href && guidance.cta && (
                <Link href={guidance.href} className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">{guidance.cta}</Link>
              )}
            </div>
          </section>
        )}

        {children}
      </div>
    </main>
  )
}

export function DemoStatRow({ label, value, href }: { label: string; value: string | number; href?: string }) {
  const content = (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )

  if (href) {
    return <Link href={href} className="block transition-opacity hover:opacity-90">{content}</Link>
  }

  return content
}
