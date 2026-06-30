import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { analytics } from "@/lib/kleio-analytics"
import { allSubmissions } from "@/lib/kleio-data"
import { StatusPill, PriorityPill } from "@/components/kleio/pills"

export default function Page() {
  return (
    <DashboardShell>
      <DemoPageShell
        title="Submissions"
        description="Browse every application across your programs with rich filtering, completeness tracking, and bulk actions."
      >
        <div className="mb-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{analytics.totalApplications}</span>{" "}
            submissions across {analytics.activePrograms} active programs.
          </p>
        </div>

        <section className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3">Artist</th>
                <th className="px-3 py-3">Project</th>
                <th className="px-3 py-3">Program</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {allSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b border-border/70">
                  <td className="px-5 py-3">
                    <p className="font-medium text-foreground">{submission.artist}</p>
                    <p className="text-xs text-muted-foreground">{submission.location}</p>
                  </td>
                  <td className="px-3 py-3 text-foreground">{submission.projectTitle}</td>
                  <td className="px-3 py-3 text-muted-foreground">{submission.program}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={submission.status} />
                  </td>
                  <td className="px-3 py-3">
                    <PriorityPill priority={submission.priority} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </DemoPageShell>
    </DashboardShell>
  )
}
