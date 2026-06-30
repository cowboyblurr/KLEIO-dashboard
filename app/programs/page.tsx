import Link from "next/link"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { DemoPageShell } from "@/components/kleio/demo-page-shell"
import { analytics, getProgramStats } from "@/lib/kleio-analytics"
import { programs } from "@/lib/kleio-data"

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

export default function Page() {
  return (
    <DashboardShell>
      <DemoPageShell
        title="Programs"
        description="Create and manage open calls, residencies, and grant cycles — with deadlines, eligibility, and review workflows in one place."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/programs/new/"
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Open Call
          </Link>
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground">
            {analytics.activePrograms} active programs · {analytics.upcomingDeadlineProgramCount} upcoming deadlines
          </span>
        </div>

        <div className="space-y-4">
          {programs.map((program) => {
            const stats = getProgramStats(program.id)
            return (
              <section key={program.id} className="rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">{program.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{program.description}</p>
                  </div>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
                    {program.status}
                  </span>
                </div>
                <div className="grid gap-4 px-5 py-4 md:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Deadline" value={formatDate(program.deadline)} />
                  <Metric label="Review period" value={`${formatDate(program.reviewStart)} – ${formatDate(program.decisionDate)}`} />
                  <Metric label="Submissions" value={stats.submissionCount} />
                  <Metric label="Incomplete" value={stats.incompleteCount} />
                </div>
                <div className="border-t border-border px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Assigned reviewers
                  </p>
                  <p className="mt-2 text-sm text-foreground">
                    {stats.assignedReviewers.map((person) => person.name).join(" · ") || "None assigned"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Current stage: {program.status} · {stats.needsAttentionCount} need attention
                  </p>
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
