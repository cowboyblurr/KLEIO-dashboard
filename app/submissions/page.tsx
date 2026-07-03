import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { analytics } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { SearchFilterBar } from "@/components/kleio/search-filter-bar"
import { StatusPill } from "@/components/kleio/pills"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

export default function Page() {
  return (
    <DashboardShell>
      <main className="h-full overflow-y-auto px-6 py-6">
        <div className="mx-auto max-w-[1180px] space-y-5">
          <WorkspacePageHeader
            eyebrow="Submission database"
            title="Submissions"
            description="Search, filter, and compare submissions without losing context across files, forms, or review notes."
            primaryCta={{ label: "Open Review Queue", href: "/review-queue/" }}
            secondaryCta={{ label: "Search Artists", href: "/artists/" }}
          />

          <section className="rounded-2xl border bg-white p-5" style={cardStyle}>
            <SearchFilterBar
              placeholder="Search artists, programs, reviewers, status..."
              filterChips={["All Programs", "All Statuses", "Material Readiness", "Review Stage"]}
            />
            <p className="mt-3 text-sm" style={{ color: mutedColor }}>
              Showing <span className="font-medium" style={{ color: inkColor }}>{analytics.totalApplications}</span> submissions across {analytics.activePrograms} active programs.
            </p>
          </section>

          <section className="overflow-x-auto rounded-2xl border bg-white" style={cardStyle}>
            <table className="w-full min-w-[900px] border-collapse text-sm">
              <thead>
                <tr className="border-b text-left text-xs font-medium uppercase tracking-wide" style={{ borderColor: lavenderSoftLine, color: mutedColor }}>
                  <th className="px-5 py-3">Artist</th>
                  <th className="px-3 py-3">Program</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Materials</th>
                  <th className="px-3 py-3">Reviewer</th>
                  <th className="px-3 py-3">Updated</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b" style={{ borderColor: lavenderSoftLine }}>
                    <td className="px-5 py-3">
                      <p className="font-medium" style={{ color: inkColor }}>{submission.artist}</p>
                      <p className="text-xs" style={{ color: mutedColor }}>{submission.location}</p>
                    </td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.program}</td>
                    <td className="px-3 py-3">
                      <StatusPill status={submission.status} />
                    </td>
                    <td className="px-3 py-3">
                      <DemoStatusChip
                        label={submission.completeness >= 100 ? "Complete" : `${submission.completeness}% ready`}
                        tone={submission.completeness >= 100 ? "success" : "warning"}
                      />
                    </td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.reviewer}</td>
                    <td className="px-3 py-3" style={{ color: mutedColor }}>{submission.submitted}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/artists/${submission.artistId}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                          Review
                        </Link>
                        <Link href={`/artist/${submission.artistId}/`} className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: mutedColor }}>
                          Public
                        </Link>
                      </div>
                    </td>
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
