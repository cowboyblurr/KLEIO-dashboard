"use client"

import Link from "next/link"
import { collaboratorAnalytics } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function channelLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = { Applicant: "Postulante", Reviewer: "Revisor", Committee: "Comité", Institution: "Institución" }
  return labels[value] ?? value
}

export function CollaboratorMessagesPageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  const analytics = collaboratorAnalytics
  const threads = analytics.scopedMessageThreads
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow={t("collaborator.messages.eyebrow")} title={t("collaborator.messages.title")} description={t("collaborator.messages.description")} />
        <div className="grid gap-4 sm:grid-cols-2"><WorkspaceMetricCard label={t("collaborator.messages.metric.scopedThreads")} value={analytics.scopedMessageCount} /><WorkspaceMetricCard label={t("collaborator.messages.metric.unread")} value={analytics.unreadScopedMessageCount} /></div>
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]"><section className="rounded-2xl border bg-white" style={cardStyle}><div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}><h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>{t("collaborator.messages.inbox")}</h2></div>{threads.length === 0 ? <p className="px-5 py-8 text-sm" style={{ color: mutedColor }}>{t("collaborator.messages.empty")}</p> : <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>{threads.map((thread) => <li key={thread.id} className="px-5 py-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium" style={{ color: inkColor }}>{thread.subject}</p><p className="mt-1 text-sm" style={{ color: mutedColor }}>{thread.preview}</p><p className="mt-2 text-xs" style={{ color: mutedColor }}>{channelLabel(thread.channel, es)} · {thread.counterpart} · {thread.updatedAt}</p></div>{thread.unread && <DemoStatusChip label={t("collaborator.messages.unread")} tone="warning" translate={false} />}</div></li>)}</ul>}</section><div className="space-y-4"><WorkflowCard title={t("collaborator.messages.reminders.title")} body={t("collaborator.messages.reminders.body")} /><WorkflowCard title={t("collaborator.messages.contact.title")} body={t("collaborator.messages.contact.body")}><p className="text-xs" style={{ color: mutedColor }}>{t("collaborator.messages.contact.note")}</p></WorkflowCard><WorkflowCard title={t("collaborator.messages.context.title")} body={analytics.assignedProgramsCount === 1 ? t("collaborator.messages.context.bodyOne", { reviews: analytics.assignedReviews, programs: analytics.assignedProgramsCount }) : t("collaborator.messages.context.bodyOther", { reviews: analytics.assignedReviews, programs: analytics.assignedProgramsCount })}><Link href="/collaborator-dashboard/assignments/" className="text-xs font-medium" style={{ color: lavenderDeep }}>{t("collaborator.messages.cta.viewAssignments")}</Link></WorkflowCard></div></div>
      </div>
    </main>
  )
}
