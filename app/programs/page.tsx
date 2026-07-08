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
        title="Programs & Open Calls"
        description="Here is the institutional starting point: create opportunities, define materials, assign reviewers, and route applicants into review."
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/programs/new/"
            className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Create Open Call
          </Link>
          <Link
            href="/review-queue/"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50"
          >
            Review Queue
          </Link>
          <Link
            href="/review-room/"
            className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent/50"
          >
            Review Room
          </Link>
          <span className="inline-flex h-10 items-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground">
            {analytics.activePrograms} active programs · {analytics.upcomingDeadlineProgramCount} upcoming deadlines
          </span>
        </div>

        <section className="mb-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Conversion path</p>
          <div className="mt-3 grid gap-2 md:grid-cols-5">
            {[
              ["01", "Create call", "/programs/new/"],
              ["02", "Collect applicants", "/review-queue/"],
              ["03", "Resolve incomplete", "/review-queue/"],
              ["04", "Review room", "/review-room/"],
              ["05", "Report", "/reports/"],
            ].map(([number, label, href]) => (
              <Link key={label} href={href} className="rounded-xl border border-[#E7E1F7] bg-white p-3 text-sm font-semibold text-[#292631] transition-colors hover:bg-white/70">
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
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link href="/programs/new/" className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">
                      View call setup
                    </Link>
                    <Link href="/review-queue/" className="inline-flex h-9 items-center rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent/50">
                      View applicants
                    </Link>
                    <Link href="/review-room/" className="inline-flex h-9 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                      Open review room
                    </Link>
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
