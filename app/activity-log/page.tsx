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

const filterChips = ["All Activity", "Submissions", "Reviews", "Decisions", "Reports"]

const activityExamples = [
  "Amina El Badri moved to shortlist",
  "Mei Lin Zhang submitted missing portfolio file",
  "Reviewer note added to Caribbean Futures Fund",
  "Report draft prepared for Lumen Residency",
  "Committee vote pending for Sofia Karim",
]

function typeTone(type: string): "default" | "success" | "warning" | "info" {
  if (type === "decision") return "success"
  if (type === "review") return "warning"
  if (type === "submission") return "info"
  return "default"
}

export default function Page() {
  const { t } = useKleioLocale()

  return (
    <DashboardShell>
      <main className="h-full overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <WorkspacePageHeader
            eyebrow={t("institution.workspace.activityLog.eyebrow")}
            title={t("institution.workspace.activityLog.title")}
            description={t("institution.workspace.activityLog.description")}
            primaryCta={{ label: t("institution.workspace.activityLog.cta.prepareReport"), href: "/reports/new/" }}
            secondaryCta={{ label: t("institution.workspace.activityLog.cta.backToDashboard"), href: "/dashboard/" }}
          />

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <SearchFilterBar placeholder={t("institution.workspace.activityLog.searchPlaceholder")} filterChips={filterChips} />
            <p className="mt-3 text-sm" style={{ color: mutedColor }}>
              {t("institution.workspace.activityLog.showingCount", { count: getActivityLogCount() })}
            </p>
          </section>

          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>Recent activity</h2>
              <p className="mt-1 text-xs" style={{ color: mutedColor }}>Linked to submissions, reviewers, and program records</p>
            </div>
            <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
              {activityLog.map((entry) => (
                <li key={entry.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm" style={{ color: inkColor }}>
                      <span className="font-medium">{entry.actor}</span>{" "}
                      <span style={{ color: mutedColor }}>{entry.action}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <DemoStatusChip label={entry.type} tone={typeTone(entry.type)} />
                      <span className="text-xs" style={{ color: mutedColor }}>{entry.date}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>{entry.target}</p>
                  {entry.submissionId && (
                    <Link href={`/artists/${entry.submissionId}/`} className="mt-2 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                      Review profile →
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-[#F7F4FF] p-5" style={{ ...cardStyle, borderColor: lavenderSoftLine }}>
            <p className="text-sm font-medium" style={{ color: inkColor }}>{t("common.foundationWorkflow")}</p>
            <ul className="mt-2 space-y-1 text-sm" style={{ color: mutedColor }}>
              {activityExamples.map((item) => (
                <li key={item}>· {item}</li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
