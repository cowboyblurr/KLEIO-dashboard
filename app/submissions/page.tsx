"use client"

import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { analytics } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { StatusPill } from "@/components/kleio/pills"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

export default function SubmissionsPage() {
  const { t } = useKleioLocale()

  return (
    <DashboardShell>
      <main className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto min-w-[760px] max-w-[1180px] space-y-5">
          <WorkspacePageHeader
            eyebrow={t("institution.workspace.submissions.eyebrow")}
            title={t("institution.workspace.submissions.title")}
            description={t("institution.workspace.submissions.description")}
            primaryCta={{ label: t("institution.workspace.submissions.cta.openReviewQueue"), href: "/review-queue/" }}
            secondaryCta={{ label: t("institution.workspace.submissions.cta.searchArtists"), href: "/artists/" }}
          />

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <SearchFilterBar placeholder={t("institution.workspace.submissions.searchPlaceholder")} filterChips={["All Programs", "All Statuses", "Material Readiness", "Review Stage"]} />
            <p className="mt-3 text-sm" style={{ color: mutedColor }}>
              {t("institution.workspace.submissions.showingCount", { count: analytics.totalApplications, programs: analytics.activePrograms })}
            </p>
          </section>

          <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                  <th className="px-5 py-3">{t("institution.workspace.submissions.column.artist")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.program")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.status")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.materials")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.reviewer")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.updated")}</th>
                  <th className="px-3 py-3">{t("institution.workspace.submissions.column.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {allSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                    <td className="px-5 py-3"><p className="font-medium" style={{ color: inkColor }}>{submission.artist}</p><p className="text-xs" style={{ color: mutedColor }}>{submission.location}</p></td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.program}</td>
                    <td className="px-3 py-3"><StatusPill status={submission.status} /></td>
                    <td className="px-3 py-3"><DemoStatusChip label={submission.completeness >= 100 ? t("institution.workspace.submissions.materialsComplete") : t("institution.workspace.submissions.materialsReady", { pct: submission.completeness })} tone={submission.completeness >= 100 ? "success" : "warning"} /></td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.reviewer}</td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.submitted}</td>
                    <td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link href={`/artists/${submission.artistId}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{t("institution.workspace.submissions.action.review")}</Link><Link href={`/artist/${submission.artistId}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: mutedColor }}>{t("institution.workspace.submissions.action.public")}</Link></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
