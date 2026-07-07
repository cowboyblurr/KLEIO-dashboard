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
      title: es ? "Siguiente mejor paso" : "Next best step",
      body: es
        ? "Confirma que cada convocatoria tenga fechas, materiales requeridos y revisores claros antes de que lleguen postulaciones."
        : "Confirm each call has clear dates, required materials, and reviewer coverage before submissions arrive.",
      href: "/review-queue/",
      cta: es ? "Ver revisión" : "View review flow",
    }
  }

  if (path.startsWith("/submissions")) {
    return {
      title: es ? "Por qué importa" : "Why this matters",
      body: es
        ? "Las postulaciones deben poder encontrarse, compararse y revisarse sin volver a buscar entre correos, PDFs y hojas de cálculo."
        : "Submissions need to be findable, comparable, and reviewable without returning to email threads, PDFs, and spreadsheets.",
      href: "/review-queue/",
      cta: es ? "Abrir cola" : "Open queue",
    }
  }

  if (path.startsWith("/artists")) {
    return {
      title: es ? "Por qué importa" : "Why this matters",
      body: es
        ? "Los registros de artistas mantienen materiales, historial y contexto conectados entre ciclos de revisión."
        : "Artist records keep materials, history, and context connected across review cycles.",
      href: "/submissions/",
      cta: es ? "Ver postulaciones" : "View submissions",
    }
  }

  if (path.startsWith("/review-queue")) {
    return {
      title: es ? "Siguiente mejor paso" : "Next best step",
      body: es
        ? "Empieza por materiales incompletos y revisores pendientes para que el comité pueda evaluar con información limpia."
        : "Start with incomplete materials and pending reviewers so the committee can evaluate with clean information.",
      href: "/committee/",
      cta: es ? "Ver comité" : "View committee",
    }
  }

  if (path.startsWith("/committee")) {
    return {
      title: es ? "Por qué importa" : "Why this matters",
      body: es
        ? "Los revisores invitados deben ver solo su trabajo asignado, con guías claras y sin acceso innecesario al espacio completo."
        : "Invited reviewers should see only assigned work, with clear guidelines and without unnecessary access to the full workspace.",
      href: "/collaborator-dashboard/",
      cta: es ? "Vista de revisor" : "Preview reviewer seat",
    }
  }

  if (path.startsWith("/shortlist")) {
    return {
      title: es ? "Siguiente mejor paso" : "Next best step",
      body: es
        ? "Conserva notas, contexto de comité y estado final para que la decisión no se pierda después de la reunión."
        : "Keep notes, committee context, and final status attached so the decision is not lost after the meeting.",
      href: "/reports/",
      cta: es ? "Preparar informe" : "Prepare report",
    }
  }

  if (path.startsWith("/reports")) {
    return {
      title: es ? "Por qué importa" : "Why this matters",
      body: es
        ? "Los informes ayudan a explicar qué pasó en el ciclo de revisión sin reconstruirlo manualmente al final."
        : "Reports help explain what happened in the review cycle without rebuilding the story manually at the end.",
      href: "/activity-log/",
      cta: es ? "Ver historial" : "View history",
    }
  }

  if (path.startsWith("/activity-log")) {
    return {
      title: es ? "Por qué importa" : "Why this matters",
      body: es
        ? "El historial conserva cambios de estado, mensajes y movimientos de revisión para que el equipo pueda rastrear decisiones."
        : "The history preserves status changes, messages, and review movement so the team can trace decisions.",
      href: "/reports/",
      cta: es ? "Ver informes" : "View reports",
    }
  }

  return null
}

export function DemoPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { locale } = useKleioLocale()
  const guidance = guidanceForPath(pathname, locale)
  const target = targetForPath(pathname)

  return (
    <main data-kleio-guide-target={target} className="flex h-full min-h-0 flex-col overflow-y-auto px-5 py-6 xl:px-7 xl:py-7">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-foreground xl:text-3xl">
            {title}
          </h1>
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
              <Link href={guidance.href} className="inline-flex h-9 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
                {guidance.cta}
              </Link>
            )}
          </div>
        </section>
      )}

      {children}
    </main>
  )
}

export function DemoStatRow({
  label,
  value,
  href,
}: {
  label: string
  value: string | number
  href?: string
}) {
  const content = (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </Link>
    )
  }

  return content
}
