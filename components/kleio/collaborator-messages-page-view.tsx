import Link from "next/link"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"

export function CollaboratorMessagesPageView() {
  const analytics = collaboratorAnalytics
  const threads = analytics.scopedMessageThreads

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow="Assignment messages"
          title="Messages"
          description="Focused reviewer and committee threads related to your assignments."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <WorkspaceMetricCard label="Scoped threads" value={analytics.scopedMessageCount} />
          <WorkspaceMetricCard label="Unread" value={analytics.unreadScopedMessageCount} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>Inbox</h2>
            </div>
            {threads.length === 0 ? (
              <p className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                No collaborator-specific messages in this demo dataset.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
                {threads.map((thread) => (
                  <li key={thread.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium" style={{ color: inkColor }}>{thread.subject}</p>
                        <p className="mt-1 text-sm" style={{ color: mutedColor }}>{thread.preview}</p>
                        <p className="mt-2 text-xs" style={{ color: mutedColor }}>
                          {thread.channel} · {thread.counterpart} · {thread.updatedAt}
                        </p>
                      </div>
                      {thread.unread && <DemoStatusChip label="Unread" tone="warning" />}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-4">
            <WorkflowCard
              title="Reviewer reminders"
              body="Assignment-related reminders appear here when the institution or committee needs your input."
            />

            <WorkflowCard title="Institution contact" body="KLEIO Arthouse Program Team · program@kleioarthouse.demo">
              <p className="text-xs" style={{ color: mutedColor }}>
                For deadline extensions, conflict disclosures, or access issues.
              </p>
            </WorkflowCard>

            <WorkflowCard
              title="Assignment context"
              body={`${analytics.assignedReviews} assigned reviews across ${analytics.assignedProgramsCount} program${analytics.assignedProgramsCount === 1 ? "" : "s"}.`}
            >
              <Link href="/collaborator-dashboard/assignments/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                View assignments →
              </Link>
            </WorkflowCard>
          </div>
        </div>
      </div>
    </main>
  )
}
