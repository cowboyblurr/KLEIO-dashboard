import Link from "next/link"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"

const steps = [
  { step: 1, title: "Select program", body: "Choose the open call, grant, residency, or exhibition to report on." },
  { step: 2, title: "Review activity", body: "Pull reviewer progress, submission counts, and status movement." },
  { step: 3, title: "Shortlist & decisions", body: "Include shortlist outcomes, committee votes, and decision records." },
  { step: 4, title: "Export record", body: "Prepare a preserved institutional record for your team." },
]

export function ReportsNewPageView() {
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Report builder"
          title="Prepare Report"
          description="Start a structured report from program activity, review progress, shortlist decisions, and institutional notes."
          prototypeNote="This page shows the future report preparation workflow. Export and generated report controls are not active in this static demo."
          primaryCta={{ label: "Back to Reports", href: "/reports/" }}
          secondaryCta={{ label: "View Shortlist", href: "/shortlist/" }}
        />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-3">
            {steps.map((item) => (
              <section key={item.step} className="flex gap-4 rounded-2xl border bg-white p-5" style={cardStyle}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F1ECFB] text-sm font-bold" style={{ color: "#5B4B8A" }}>
                  {item.step}
                </span>
                <div>
                  <h2 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{item.title}</h2>
                  <p className="mt-1 text-sm" style={{ color: mutedColor }}>{item.body}</p>
                </div>
              </section>
            ))}
          </div>

          <WorkflowCard title="Preview report card" body="Lumen Residency · 76 submissions · 12 reviewers · 3 shortlist groups">
            <div className="space-y-2 text-sm" style={{ color: mutedColor }}>
              <p>Status breakdown included</p>
              <p>Reviewer progress attached</p>
              <p>Decision record draft ready</p>
            </div>
            <Link href="/activity-log/" className="mt-3 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
              View activity log →
            </Link>
          </WorkflowCard>
        </div>
      </div>
    </main>
  )
}
