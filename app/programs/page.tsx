"use client"

import type { CSSProperties } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { analytics, getProgramStats } from "@/lib/kleio-analytics"
import { programs } from "@/lib/kleio-data"
import workflowMotion from "@/components/kleio/workflow-motion.module.css"

function formatDate(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

function workflowDelay(index: number): CSSProperties {
  return { "--workflow-delay": `${index * 95}ms` } as CSSProperties
}

function statusLabel(status: string, es: boolean) {
  if (!es) return status
  const labels: Record<string, string> = {
    Draft: "Borrador",
    Active: "Activo",
    "In Review": "En revisión",
    Shortlisted: "Lista corta",
    Complete: "Completo",
    Closed: "Cerrado",
  }
  return labels[status] ?? status
}

export default function Page() {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const workflowSteps = es
    ? [
        ["01", "Configurar convocatoria", "/programs/new/"],
        ["02", "Recibir postulantes", "/review-queue/"],
        ["03", "Resolver incompletos", "/review-queue/"],
        ["04", "Revisar con comité", "/review-room/"],
        ["05", "Preparar informe", "/reports/"],
      ]
    : [
        ["01", "Set up call", "/programs/new/"],
        ["02", "Receive applicants", "/review-queue/"],
        ["03", "Resolve incomplete files", "/review-queue/"],
        ["04", "Committee review", "/review-room/"],
        ["05", "Prepare report", "/reports/"],
      ]

  return (
    <DashboardShell>
      <DemoPageShell
        title={es ? "Programas y convocatorias" : "Programs & Open Calls"}
        description={es ? "Configura convocatorias, materiales requeridos, fechas de revisión y asignaciones antes de que las postulaciones avancen por el ciclo." : "Set up open calls, required materials, review dates, and reviewer assignments before submissions move through the cycle."}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Link href="/programs/new/" className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Crear convocatoria" : "Create Open Call"}</Link>
          <Link href="/review-queue/" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Cola de revisión" : "Review Queue"}</Link>
          <Link href="/review-room/" className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Sala de revisión" : "Review Room"}</Link>
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground">{analytics.activePrograms} {es ? "programas activos" : "active programs"} · {analytics.upcomingDeadlineProgramCount} {es ? "fechas próximas" : "upcoming deadlines"}</span>
        </div>

        <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Flujo de revisión" : "Review workflow"}</p>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {workflowSteps.map(([number, label, href], index) => (
              <Link key={label} href={href} className={`${workflowMotion.step} rounded-xl border border-[#E7E1F7] bg-white p-3 text-sm font-semibold text-[#292631] transition-colors hover:bg-white/70`} style={workflowDelay(index)}>
                <span className="mr-2 text-xs text-[#A997E8]">{number}</span>{label}
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-4">
          {programs.map((program) => {
            const stats = getProgramStats(program.id)
            return (
              <section key={program.id} className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">
                      <Link href={`/programs/${program.id}/`} className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25">
                        {program.title}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">{statusLabel(program.status, es)}</span>
                </div>
                <div className="grid gap-4 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric label={es ? "Fecha límite" : "Deadline"} value={formatDate(program.deadline, locale)} />
                  <Metric label={es ? "Periodo de revisión" : "Review period"} value={`${formatDate(program.reviewStart, locale)} – ${formatDate(program.decisionDate, locale)}`} />
                  <Metric label={es ? "Postulaciones" : "Submissions"} value={stats.submissionCount} />
                  <Metric label={es ? "Incompletas" : "Incomplete"} value={stats.incompleteCount} />
                </div>
                <div className="border-t border-border px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{es ? "Revisores asignados" : "Assigned reviewers"}</p>
                  <p className="mt-2 text-sm text-foreground">{stats.assignedReviewers.map((person) => person.name).join(" · ") || (es ? "Sin asignar" : "None assigned")}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{es ? "Etapa actual" : "Current stage"}: {statusLabel(program.status, es)} · {stats.needsAttentionCount} {es ? "requieren atención" : "need attention"}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href={`/programs/${program.id}/`} className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Ver programa" : "View program"}</Link>
                    <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">{es ? "Ver postulantes" : "View applicants"}</Link>
                    <Link href="/review-room/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Abrir sala de revisión" : "Open review room"}</Link>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </DemoPageShell>
    </DashboardShell>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  )
}
