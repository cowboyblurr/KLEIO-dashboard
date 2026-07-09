"use client"

import Link from "next/link"
import { artistDashboardProfile } from "@/lib/kleio-data"
import { artistApplicationRows } from "@/lib/kleio-opportunities"
import { artistAnalytics, formatArtistNextDeadline, formatDemoDateDisplay } from "@/lib/kleio-artist-analytics"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import type { ArtistDashboardApplicationStatus } from "@/lib/kleio-data"

function statusTone(status: ArtistDashboardApplicationStatus): "default" | "success" | "warning" | "info" {
  if (status === "Awarded" || status === "Submitted") return "success"
  if (status === "Draft" || status === "Under Review") return "warning"
  if (status === "Interview") return "info"
  return "default"
}

const nextActionByProgram = Object.fromEntries(
  artistDashboardProfile.nextActions.map((action) => [action.program, action.task]),
)

export function ArtistApplicationsPageView() {
  const { locale, t } = useKleioLocale()
  const analytics = artistAnalytics
  const applications = artistApplicationRows

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("artist.workspace.applications.eyebrow")}
          title={t("artist.workspace.applications.title")}
          description={t("artist.workspace.applications.description")}
          primaryCta={{ label: t("artist.workspace.applications.cta.exploreOpportunities"), href: "/artist-dashboard/opportunities/" }}
          secondaryCta={{ label: t("artist.workspace.applications.cta.reviewCalendar"), href: "/artist-dashboard/calendar/" }}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <WorkspaceMetricCard label={t("artist.workspace.passport.metric.activeApplications")} value={analytics.activeApplications} />
          <WorkspaceMetricCard label={t("artist.workspace.applications.metric.draft")} value={analytics.applicationStatusCounts.Draft} />
          <WorkspaceMetricCard label={t("artist.workspace.applications.metric.pendingDecisions")} value={analytics.pendingDecisions} />
        </div>

        <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                <th className="px-5 py-3">{t("artist.workspace.applications.column.program")}</th>
                <th className="px-3 py-3">{t("artist.workspace.applications.column.status")}</th>
                <th className="px-3 py-3">{t("artist.workspace.applications.column.dueDate")}</th>
                <th className="px-3 py-3">{t("artist.workspace.applications.column.updated")}</th>
                <th className="px-3 py-3">{t("artist.workspace.applications.column.nextAction")}</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.program} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                  <td className="px-5 py-3 font-medium" style={{ color: inkColor }}>{app.program}</td>
                  <td className="px-3 py-3"><DemoStatusChip label={app.status} tone={statusTone(app.status)} /></td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{formatDemoDateDisplay(app.dueDate, locale)}</td>
                  <td className="px-3 py-3" style={{ color: mutedColor }}>{app.updated}</td>
                  <td className="px-3 py-3" style={{ color: inkColor }}>{nextActionByProgram[app.program] ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="grid gap-4 md:grid-cols-2">
          <WorkflowCard
            title={t("artist.workspace.applications.nextActions.title")}
            body={t("artist.workspace.applications.nextActions.body", { count: analytics.nextActionsCount })}
          >
            <ul className="space-y-2 text-sm" style={{ color: mutedColor }}>
              {artistDashboardProfile.nextActions.map((action) => (
                <li key={action.program}>{action.program} — {action.task}</li>
              ))}
            </ul>
          </WorkflowCard>
          <WorkflowCard
            title={t("artist.workspace.applications.deadlinePressure.title")}
            body={t("artist.workspace.applications.deadlinePressure.body", {
              count: analytics.dueSoon,
              date: formatArtistNextDeadline(analytics.nextDeadline, locale),
            })}
          >
            <Link href="/artist-dashboard/calendar/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              {t("artist.workspace.applications.cta.openCalendar")}
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
