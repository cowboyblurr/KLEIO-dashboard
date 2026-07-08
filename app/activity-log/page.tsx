"use client"

import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { activityLog } from "@/lib/kleio-data"
import { getActivityLogCount } from "@/lib/kleio-analytics"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function filterChips(es: boolean) {
  return es ? ["Toda la actividad", "Postulaciones", "Revisiones", "Decisiones", "Informes"] : ["All Activity", "Submissions", "Reviews", "Decisions", "Reports"]
}

function activityExamples(es: boolean) {
  return es
    ? [
        "Amina El Badri pasó a lista corta",
        "Mei Lin Zhang entregó el archivo de portafolio faltante",
        "Se agregó una nota de revisor a Caribbean Futures Fund",
        "Borrador de informe preparado para Lumen Residency",
        "Voto de comité pendiente para Sofia Karim",
      ]
    : [
        "Amina El Badri moved to shortlist",
        "Mei Lin Zhang submitted missing portfolio file",
        "Reviewer note added to Caribbean Futures Fund",
        "Report draft prepared for Lumen Residency",
        "Committee vote pending for Sofia Karim",
      ]
}

function typeTone(type: string): "default" | "success" | "warning" | "info" {
  if (type === "decision") return "success"
  if (type === "review") return "warning"
  if (type === "submission") return "info"
  return "default"
}

function typeLabel(type: string, es: boolean) {
  if (!es) return type
  const labels: Record<string, string> = { decision: "decisión", review: "revisión", submission: "postulación", message: "mensaje", report: "informe" }
  return labels[type] ?? type
}

function actionLabel(action: string, es: boolean) {
  if (!es) return action
  const labels: Record<string, string> = {
    "moved to shortlist": "pasó a lista corta",
    "submitted missing portfolio file": "entregó el archivo de portafolio faltante",
    "added reviewer note": "agregó una nota de revisión",
    "prepared report draft": "preparó un borrador de informe",
    "pending committee vote": "tiene voto de comité pendiente",
    "requested info": "solicitó información",
    "updated status": "actualizó el estado",
  }
  return labels[action] ?? action
}

export default function Page() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"

  return (
    <DashboardShell>
      <main className="h-full overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <WorkspacePageHeader eyebrow={t("institution.workspace.activityLog.eyebrow")} title={t("institution.workspace.activityLog.title")} description={t("institution.workspace.activityLog.description")} primaryCta={{ label: t("institution.workspace.activityLog.cta.prepareReport"), href: "/reports/new/" }} secondaryCta={{ label: t("institution.workspace.activityLog.cta.backToDashboard"), href: "/dashboard/" }} />

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <SearchFilterBar placeholder={t("institution.workspace.activityLog.searchPlaceholder")} filterChips={filterChips(es)} />
            <p className="mt-3 text-sm" style={{ color: mutedColor }}>{t("institution.workspace.activityLog.showingCount", { count: getActivityLogCount() })}</p>
          </section>

          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>{es ? "Actividad reciente" : "Recent activity"}</h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>{es ? "Conectada a postulaciones, revisores y registros de programa" : "Linked to submissions, reviewers, and program records"}</p>
            </div>
            <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
              {activityLog.map((entry) => (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: inkColor }}><span className="font-medium">{entry.actor}</span>{" "}<span style={{ color: mutedColor }}>{actionLabel(entry.action, es)}</span></p>
                    <div className="flex items-center gap-2"><DemoStatusChip label={typeLabel(entry.type, es)} tone={typeTone(entry.type)} /><span className="text-xs" style={{ color: mutedColor }}>{entry.date}</span></div>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>{entry.target}</p>
                  {entry.submissionId && <Link href={`/artists/${entry.submissionId}/`} className="mt-2 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{es ? "Revisar perfil →" : "Review profile →"}</Link>}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-[#F7F4FF] p-5" style={{ ...cardStyle, borderColor: lavenderSoftLine }}>
            <p className="text-sm font-medium" style={{ color: inkColor }}>{t("common.foundationWorkflow")}</p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: mutedColor }}>{activityExamples(es).map((item) => <li key={item}>· {item}</li>)}</ul>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
