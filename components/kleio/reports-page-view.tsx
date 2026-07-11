"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { analytics, getReviewerProgress, getShortlistGroups, statusBreakdown } from "@/lib/kleio-analytics"
import { activityLog, programs } from "@/lib/kleio-data"
import { activityTargetHref, programHref, reviewerAnchorHref } from "@/lib/kleio-entity-routes"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

type ExportAssistPhase = "idle" | "preparing" | "complete"

function reviewerCompletionPct(): number {
  const progress = getReviewerProgress()
  const completed = progress.reduce((sum, r) => sum + r.completed, 0)
  const assigned = progress.reduce((sum, r) => sum + r.assigned, 0)
  return Math.round((completed / Math.max(assigned, 1)) * 100)
}

function ReportSectionCard({ number, title, body, href }: { number: string; title: string; body: string; href: string }) {
  return (
    <Link href={href} className="block rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-sm transition-colors hover:bg-[#F7F4FF]">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{number}</p>
      <h3 className="mt-1 font-serif text-base font-semibold text-[#292631]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[#7F7890]">{body}</p>
    </Link>
  )
}

function statusLabel(label: string, es: boolean) {
  if (!es) return label
  const labels: Record<string, string> = {
    "In Review": "En revisión",
    Shortlisted: "Lista corta",
    Incomplete: "Incompleto",
    Submitted: "Enviado",
    "Pending Vote": "Voto pendiente",
    Interview: "Entrevista",
    Draft: "Borrador",
    Complete: "Completo",
  }
  return labels[label] ?? label
}

export function ReportsPageView() {
  const { t, locale } = useKleioLocale()
  const { isPreview } = useKleioMode()
  const es = locale === "es"
  const [exportPhase, setExportPhase] = useState<ExportAssistPhase>("idle")
  const [previewOpen, setPreviewOpen] = useState(true)
  const exportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reviewerProgress = getReviewerProgress()
  const shortlistOutcomes = getShortlistGroups()
  const primaryProgram = programs[0]
  const decisionHistory = activityLog.filter((entry) => entry.type === "decision" || entry.type === "review" || entry.type === "message").slice(0, 6)
  const reviewerPct = reviewerCompletionPct()

  useEffect(() => {
    return () => {
      if (exportTimeoutRef.current) clearTimeout(exportTimeoutRef.current)
    }
  }, [])

  function handleExportReport() {
    if (exportPhase !== "idle") return
    setPreviewOpen(true)
    setExportPhase("preparing")
    exportTimeoutRef.current = setTimeout(() => setExportPhase("complete"), 950)
  }

  return (
    <DemoPageShell title={t("institution.workspace.reports.title")} description={es ? "Prepara un registro institucional claro a partir de la convocatoria, el avance de revisión, la lista corta y el historial de decisiones." : "Prepare a clear institutional record from the open call, reviewer progress, shortlist movement, and decision history."}>
      <section className="mb-4 overflow-hidden rounded-3xl border border-[#E7E1F7] bg-white shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
        <div className="grid gap-0 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
          <div className="bg-[#F7F4FF] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A997E8]">{es ? "Borrador de informe" : "Program Report Draft"}</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight text-[#292631]"><Link href={programHref(primaryProgram.id)} className="transition-colors hover:text-[#5B4B8A]">{primaryProgram.title}</Link></h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#6F6882]">
              {es ? "Este borrador reúne contexto del programa, estado de postulantes, avance de revisores, movimiento de lista corta e historial de decisiones en un solo registro institucional preparado." : "This report draft gathers program context, applicant status, reviewer completion, shortlist movement, and decision history into one prepared institutional record."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={() => setPreviewOpen(true)} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">{es ? "Vista previa del informe" : "Preview Report"}</button>
              <button type="button" onClick={handleExportReport} disabled={exportPhase !== "idle"} className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75 disabled:opacity-60">{es ? "Exportar informe" : isPreview ? "Export Report" : t("institution.workspace.reports.cta.exportReport")}</button>
              <Link href="/activity-log/" className="inline-flex h-10 items-center rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-white/75">{es ? "Ver historial de decisiones" : "View Decision History"}</Link>
            </div>
          </div>

          <div className="grid gap-3 p-6 sm:grid-cols-2">
            <Metric label={es ? "Postulaciones" : "Applications"} value={analytics.totalApplications} href="/submissions/" />
            <Metric label={es ? "Lista corta" : "Shortlisted"} value={analytics.shortlistedCount} href="/shortlist/" />
            <Metric label={es ? "Avance de revisores" : "Reviewer completion"} value={`${reviewerPct}%`} href="/committee/#reviewer-progress" />
            <Metric label={es ? "Registros de decisión" : "Decision records"} value={decisionHistory.length} href="/activity-log/" />
          </div>
        </div>
      </section>

      {exportPhase === "preparing" && <div className="mb-4 max-w-xl"><KleioAssistObject mode="preparing" title={t("assist.object.reports.title")} description={es ? "Preparando el paquete de informe desde el contexto del programa, el avance de revisores, la lista corta y el historial de decisiones." : "Preparing the report package from program context, reviewer progress, shortlist outcomes, and decision history."} size="sm" compact progress={reviewerPct} /></div>}

      {exportPhase === "complete" && (
        <section className="mb-4 max-w-2xl rounded-2xl border border-[oklch(0.85_0.07_150)] bg-[oklch(0.96_0.04_150)] p-4 text-[oklch(0.4_0.12_150)]">
          <p className="text-sm font-semibold">{es ? "Paquete de informe preparado." : "Report package prepared."}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-85">{es ? `Qué pasó: KLEIO preparó un borrador con ${analytics.totalApplications} postulaciones en ${programs.length} ciclo${programs.length === 1 ? "" : "s"} de programa. Dónde quedó: esta vista previa permanece dentro de Informes. Siguiente paso: revisa el historial de decisiones o exporta cuando el almacenamiento de producción esté conectado.` : `What happened: KLEIO prepared a report draft from ${analytics.totalApplications} applications across ${programs.length} program cycle${programs.length === 1 ? "" : "s"}. Where it went: this preview remains inside Reports. Next step: review the decision history or export when production storage is connected.`}</p>
        </section>
      )}

      <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{es ? "Flujo del informe" : "Report workflow"}</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <ReportSectionCard number="01" title={es ? "Resumen del programa" : "Program summary"} body={es ? "Detalles de la convocatoria, fechas, materiales, rúbrica y cobertura del comité quedan como contexto inicial." : "Call details, dates, materials, rubric, and committee coverage are captured as the opening context."} href={programHref(primaryProgram.id)} />
          <ReportSectionCard number="02" title={es ? "Línea de decisiones" : "Decision timeline"} body={es ? "Actualizaciones de revisores, mensajes, cambios de estado, lista corta y votos permanecen unidos al registro." : "Reviewer updates, messages, status changes, shortlist movement, and votes remain attached to the record."} href="/activity-log/" />
          <ReportSectionCard number="03" title={es ? "Paquete de exportación" : "Export package"} body={es ? "La institución puede preparar un informe para dirección, archivo o financiadores sin reconstruir manualmente toda la revisión." : "The institution can prepare a board, archive, or funder-facing report without rebuilding the review story manually."} href="/reports/" />
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
        {previewOpen && (
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">{es ? "Vista previa del informe" : "Report Preview"}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{es ? "Una lectura clara de lo que la institución conservaría de este ciclo de revisión." : "A readable draft view of what the institution would preserve from this review cycle."}</p>
            </div>
            <div className="space-y-4 p-5">
              <ReportBlock title={es ? "1. Resumen del programa" : "1. Program summary"} body={es ? `${primaryProgram.title} está en estado “${statusLabel(primaryProgram.status, es)}” con ${analytics.totalApplications} postulaciones en el espacio. Materiales requeridos, rúbrica, fechas y cobertura del comité quedan conservados para referencia.` : `${primaryProgram.title} is currently ${primaryProgram.status.toLowerCase()} with ${analytics.totalApplications} applications in the workspace. Required materials, rubric, deadlines, and committee coverage are preserved for reference.`} href={programHref(primaryProgram.id)} />
              <ReportBlock title={es ? "2. Avance de revisores" : "2. Reviewer completion"} body={es ? `El avance de revisores está al ${reviewerPct}%. El informe conserva quién fue asignado, quién entregó su revisión y qué registros aún requieren atención.` : `Reviewer progress is ${reviewerPct}% complete. The report preserves who was assigned, who submitted, and which records still need attention.`} href="/committee/#reviewer-progress" />
              <ReportBlock title={es ? "3. Resultado de lista corta" : "3. Shortlist outcome"} body={es ? `${analytics.shortlistedCount} postulantes están en lista corta, con ${analytics.pendingVoteCount} voto${analytics.pendingVoteCount === 1 ? "" : "s"} pendiente${analytics.pendingVoteCount === 1 ? "" : "s"} todavía visible${analytics.pendingVoteCount === 1 ? "" : "s"} para seguimiento del comité.` : `${analytics.shortlistedCount} applicants are currently shortlisted, with ${analytics.pendingVoteCount} pending vote item${analytics.pendingVoteCount === 1 ? "" : "s"} still visible for committee follow-up.`} href="/shortlist/" />
              <ReportBlock title={es ? "4. Historial de decisiones" : "4. Decision history"} body={es ? "El movimiento de decisiones se toma del historial de actividad para que futuros equipos entiendan por qué una postulación avanzó, se detuvo o necesitó más información." : "Decision movement is pulled from activity history so future teams can understand why applicants moved forward, stalled, or required more information."} href="/activity-log/" />
            </div>
          </section>
        )}

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{es ? "Historial de decisiones" : "Decision History"}</h2><p className="mt-1 text-xs text-muted-foreground">{es ? "Decisiones recientes, movimiento de revisores y cambios generados por mensajes." : "Recent decisions, reviewer movement, and message-driven changes."}</p></div>
            <ul className="divide-y divide-border">{decisionHistory.map((entry) => { const href = activityTargetHref(entry.type, entry.submissionId, entry.target); return <li key={entry.id} className="px-5 py-3 text-sm transition-colors hover:bg-accent/30"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-foreground"><span className="font-medium">{entry.actor}</span> <Link href={href} className="text-muted-foreground transition-colors hover:text-primary">{entry.action}</Link></span><span className="text-xs text-muted-foreground">{entry.date}</span></div><p className="mt-1 text-xs"><Link href={href} className="text-muted-foreground transition-colors hover:text-primary">{entry.target}</Link></p></li> })}</ul>
          </section>

          <section className="rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-5 py-4"><h2 className="font-serif text-lg font-semibold text-foreground">{es ? "Avance de revisores" : "Reviewer Completion"}</h2></div>
            <ul className="divide-y divide-border">{reviewerProgress.map((reviewer) => <li key={reviewer.reviewerId} className="flex items-center justify-between px-5 py-3 text-sm transition-colors hover:bg-accent/30"><Link href={reviewerAnchorHref(reviewer.reviewerId)} className="text-foreground transition-colors hover:text-primary">{reviewer.name}</Link><Link href={reviewerAnchorHref(reviewer.reviewerId)} className="font-medium text-foreground tabular-nums transition-colors hover:text-primary">{reviewer.completed}/{reviewer.assigned}</Link></li>)}</ul>
          </section>
        </div>
      </div>

      <details className="mt-4 rounded-2xl border border-border bg-card shadow-sm">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-foreground">{es ? "Ver datos usados para el informe" : "View report data sources"}</summary>
        <div className="grid gap-4 border-t border-border p-5 xl:grid-cols-3">
          <section className="rounded-2xl border border-border bg-background shadow-sm"><div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">{es ? "Desglose por estado" : "Status breakdown"}</h3></div><ul className="divide-y divide-border">{statusBreakdown.map((entry) => <li key={entry.label} className="flex items-center justify-between px-4 py-3 text-sm"><Link href="/submissions/" className="transition-colors hover:text-primary">{statusLabel(entry.label, es)}</Link><Link href="/submissions/" className="font-medium tabular-nums transition-colors hover:text-primary">{entry.count} <span className="text-muted-foreground">({entry.pct})</span></Link></li>)}</ul></section>
          <section className="rounded-2xl border border-border bg-background shadow-sm"><div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">{es ? "Resultados de lista corta" : "Shortlist outcomes"}</h3></div><ul className="divide-y divide-border">{shortlistOutcomes.map((group) => <li key={group.id} className="flex items-center justify-between px-4 py-3 text-sm"><Link href="/shortlist/" className="transition-colors hover:text-primary">{group.label}</Link><Link href="/shortlist/" className="font-medium tabular-nums transition-colors hover:text-primary">{group.submissions.length}</Link></li>)}</ul></section>
          <section className="rounded-2xl border border-border bg-background shadow-sm"><div className="border-b border-border px-4 py-3"><h3 className="font-serif text-base font-semibold text-foreground">{es ? "Ciclos de programa" : "Program cycles"}</h3></div><ul className="divide-y divide-border">{programs.map((program) => <li key={program.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm"><Link href={programHref(program.id)} className="transition-colors hover:text-primary">{program.title}</Link><Link href={programHref(program.id)} className="shrink-0 text-muted-foreground transition-colors hover:text-primary">{statusLabel(program.status, es)}</Link></li>)}</ul></section>
        </div>
      </details>
    </DemoPageShell>
  )
}

function Metric({ label, value, href }: { label: string; value: string | number; href: string }) {
  return <Link href={href} className="block rounded-2xl border border-[#E7E1F7] bg-white p-4 transition-colors hover:bg-[#F7F4FF]"><p className="text-xs font-medium text-[#7F7890]">{label}</p><p className="mt-1 font-serif text-2xl font-semibold text-[#292631]">{value}</p></Link>
}

function ReportBlock({ title, body, href }: { title: string; body: string; href: string }) {
  return <Link href={href} className="block rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-accent/40"><h3 className="font-serif text-base font-semibold text-foreground">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p></Link>
}
