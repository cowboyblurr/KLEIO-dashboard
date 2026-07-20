"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { analytics } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { getSubmissionSearchSuggestions } from "@/lib/kleio-search"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { StatusPill } from "@/components/kleio/pills"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { LiveInstitutionSubmissions } from "@/components/kleio/live-institution-workspace"

function filterChips(es: boolean) {
  return es ? ["Todos los programas", "Todos los estados", "Preparación de materiales", "Etapa de revisión"] : ["All Programs", "All Statuses", "Material Readiness", "Review Stage"]
}

export default function SubmissionsPage() {
  const { t, locale } = useKleioLocale()
  const { isLive } = useKleioMode()
  const es = locale === "es"
  const [query, setQuery] = useState("")
  const suggestions = useMemo(() => getSubmissionSearchSuggestions(query, 7), [query])
  const filteredSubmissions = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized || normalized === "material" || normalized === "review" || normalized.includes("program") || normalized.includes("estado")) return allSubmissions
    return allSubmissions.filter((submission) => [submission.artist, submission.location, submission.program, submission.projectTitle, submission.status, submission.medium, submission.priority, submission.reviewer, submission.missingMaterials?.join(" ") ?? ""].join(" ").toLowerCase().includes(normalized))
  }, [query])

  if (isLive) {
    return <DashboardShell><LiveInstitutionSubmissions mode="submissions" /></DashboardShell>
  }

  return (
    <DashboardShell>
      <main className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto min-w-[760px] max-w-[1180px] space-y-5">
          <WorkspacePageHeader eyebrow={t("institution.workspace.submissions.eyebrow")} title={t("institution.workspace.submissions.title")} description={t("institution.workspace.submissions.description")} primaryCta={{ label: t("institution.workspace.submissions.cta.openReviewQueue"), href: "/review-queue/" }} secondaryCta={{ label: t("institution.workspace.submissions.cta.searchArtists"), href: "/artists/" }} />

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <SearchFilterBar placeholder={t("institution.workspace.submissions.searchPlaceholder")} value={query} onChange={setQuery} suggestions={suggestions} filterChips={filterChips(es)} />
            <p className="mt-3 text-sm" style={{ color: mutedColor }}>{es ? `Mostrando ${filteredSubmissions.length} de ${analytics.totalApplications} postulaciones en ${analytics.activePrograms} programas.` : `Showing ${filteredSubmissions.length} of ${analytics.totalApplications} submissions across ${analytics.activePrograms} programs.`}</p>
          </section>

          <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead><tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}><th className="px-5 py-3">{t("institution.workspace.submissions.column.artist")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.program")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.status")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.materials")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.reviewer")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.updated")}</th><th className="px-3 py-3">{t("institution.workspace.submissions.column.actions")}</th></tr></thead>
              <tbody>{filteredSubmissions.map((submission) => <tr key={submission.id} className="border-b transition-colors hover:bg-[#F7F4FF]/55" style={{ borderColor: lavenderSoftLine }}><td className="px-5 py-3"><Link href={`/artists/${submission.artistId}/`} className="font-medium transition-colors hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/35" style={{ color: inkColor }}>{submission.artist}</Link><p className="text-xs" style={{ color: mutedColor }}>{submission.location}</p></td><td className="px-3 py-3"><Link href={`/programs/${submission.programId}/`} className="font-medium transition-colors hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/35" style={{ color: mutedColor }}>{submission.program}</Link><p className="mt-0.5 text-xs" style={{ color: mutedColor }}>{submission.projectTitle}</p></td><td className="px-3 py-3"><StatusPill status={submission.status} /></td><td className="px-3 py-3"><DemoStatusChip label={submission.completeness >= 100 ? t("institution.workspace.submissions.materialsComplete") : t("institution.workspace.submissions.materialsReady", { pct: submission.completeness })} tone={submission.completeness >= 100 ? "success" : "warning"} /></td><td className="px-3 py-3" style={{ color: mutedColor }}>{submission.reviewer}</td><td className="px-3 py-3" style={{ color: mutedColor }}>{submission.submitted}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-2"><Link href={`/submissions/${submission.id}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{t("institution.workspace.submissions.action.review")}</Link><Link href={`/artist/${submission.artistId}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: mutedColor }}>{t("institution.workspace.submissions.action.public")}</Link></div></td></tr>)}</tbody>
            </table>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
