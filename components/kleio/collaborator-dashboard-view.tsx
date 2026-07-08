"use client"

import Link from "next/link"
import {
  collaboratorAnalytics,
  formatCollaboratorDeadline,
  formatCollaboratorNextDeadline,
  formatDaysUntilDeadline,
} from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderSoftLine, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspaceMetricCard } from "@/components/kleio/workspace-metric-card"
import { DemoStatusChip } from "@/components/kleio/demo-status-chip"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function reviewStatusTone(status: string): "default" | "success" | "warning" | "info" {
  if (status === "Complete") return "success"
  if (status === "In Progress") return "info"
  return "warning"
}

function institutionLabel(organization: string) {
  return organization === "Independent" ? "KLEIO Arthouse" : organization
}

function StageCard({ label, value, body }: { label: string; value: number | string; body: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4" style={cardStyle}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold" style={{ color: inkColor }}>{value}</p>
      <p className="mt-1 text-xs leading-relaxed" style={{ color: mutedColor }}>{body}</p>
    </div>
  )
}

export function CollaboratorDashboardView() {
  const { locale, t } = useKleioLocale()
  const analytics = collaboratorAnalytics
  const { collaborator } = analytics

  const formatDaysLocal = (days: number | null) => formatDaysUntilDeadline(days, locale)

  const pendingCount = analytics.pendingSubmissions.length
  const guidelineCount = analytics.guidelinePrograms.length
  const needsDiscussionCount = analytics.dueSoonReviews + analytics.overdueReviews

  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <header className="rounded-2xl border bg-white p-6" style={cardStyle}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]" style={{ color: lavenderDeep }}>
            Reviewer seat
          </p>
          <h1 className="mt-2 font-serif text-2xl font-semibold tracking-tight xl:text-3xl" style={{ color: inkColor }}>
            Your assigned reviews for {institutionLabel(collaborator.organization)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed" style={{ color: mutedColor }}>
            This seat stays intentionally simple. Reviewers see what is assigned, what is in review, what has been submitted, and what needs discussion.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm" style={{ color: mutedColor }}>
            <span className="font-medium" style={{ color: inkColor }}>{collaborator.name}</span>
            <span>·</span>
            <span>{collaborator.role}</span>
            <span>·</span>
            <span>{institutionLabel(collaborator.organization)}</span>
            <span>·</span>
            <span>{t("collaborator.overview.nextDeadline", { date: formatCollaboratorNextDeadline(analytics.nextDeadline, locale) })}</span>
            <span>·</span>
            <span>{t("collaborator.overview.completionRate", { rate: analytics.completionRate })}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {analytics.permissions.map((permission) => (
              <DemoStatusChip key={permission} label={permission} tone="info" />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/collaborator-dashboard/review-queue/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Continue Reviewing
            </Link>
            <Link
              href="/collaborator-dashboard/guidelines/"
              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-[#F7F4FF]"
              style={{ borderColor: "#D8D0F2", color: lavenderDeep }}
            >
              View Guidelines
            </Link>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StageCard label="Assigned" value={analytics.assignedReviews} body="All submissions currently assigned to this reviewer seat." />
          <StageCard label="In Review" value={analytics.pendingReviews} body="Reviews not yet submitted or still actively being read." />
          <StageCard label="Submitted" value={analytics.completedReviews} body="Completed reviews already returned to the committee." />
          <StageCard label="Needs Discussion" value={needsDiscussionCount} body="Due soon, overdue, or likely to need committee context." />
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <WorkspaceMetricCard label={t("collaborator.overview.metric.assignedReviews")} value={analytics.assignedReviews} />
          <WorkspaceMetricCard label={t("collaborator.overview.metric.completed")} value={analytics.completedReviews} />
          <WorkspaceMetricCard label={t("collaborator.overview.metric.pending")} value={analytics.pendingReviews} />
          <WorkspaceMetricCard label={t("collaborator.overview.metric.completionRate")} value={`${analytics.completionRate}%`} />
          <WorkspaceMetricCard label={t("collaborator.overview.metric.nextDeadline")} value={formatCollaboratorNextDeadline(analytics.nextDeadline, locale)} />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border bg-white" style={cardStyle}>
            <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
                  My Review Queue
                </h2>
                <Link href="/collaborator-dashboard/review-queue/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                  Open queue
                </Link>
              </div>
              <p className="mt-1 text-sm" style={{ color: mutedColor }}>
                {pendingCount === 1
                  ? t("collaborator.overview.queue.awaitingOne", { count: pendingCount })
                  : t("collaborator.overview.queue.awaitingOther", { count: pendingCount })}
                {analytics.dueSoonReviews > 0 ? ` ${t("collaborator.overview.queue.dueSoon", { count: analytics.dueSoonReviews })}` : ""}
                {analytics.overdueReviews > 0 ? ` ${t("collaborator.overview.queue.overdue", { count: analytics.overdueReviews })}` : ""}
              </p>
            </div>
            <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
              {analytics.pendingSubmissions.length === 0 ? (
                <li className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                  {t("collaborator.overview.queue.empty")}
                </li>
              ) : (
                analytics.pendingSubmissions.map((row) => (
                  <li key={row.submission.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-medium" style={{ color: inkColor }}>{row.submission.artist}</p>
                      <p className="text-sm" style={{ color: mutedColor }}>{row.submission.projectTitle}</p>
                      <p className="mt-1 text-xs" style={{ color: mutedColor }}>
                        {row.programTitle} · {formatDaysLocal(row.daysUntilDeadline)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <DemoStatusChip label={row.reviewStatus} tone={reviewStatusTone(row.reviewStatus)} />
                      <Link
                        href="/collaborator-dashboard/review-queue/"
                        className="text-xs font-medium" style={{ color: lavenderDeep }}
                      >
                        Open review
                      </Link>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>

          <div className="space-y-4">
            <WorkflowCard
              title={t("collaborator.overview.section.programGuidelines")}
              body={
                guidelineCount === 1
                  ? t("collaborator.overview.guidelines.summaryOne", { count: guidelineCount })
                  : t("collaborator.overview.guidelines.summaryOther", { count: guidelineCount })
              }
            >
              <ul className="space-y-2 text-sm" style={{ color: mutedColor }}>
                {analytics.guidelinePrograms.slice(0, 3).map((program) => (
                  <li key={program.id}>
                    {program.title}
                    <span className="block text-xs">
                      {t("collaborator.deadline.label", { date: formatCollaboratorDeadline(program.deadline, locale) })}
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/collaborator-dashboard/guidelines/" className="mt-3 inline-block text-xs font-medium" style={{ color: lavenderDeep }}>
                {t("collaborator.overview.cta.viewAllGuidelines")}
              </Link>
            </WorkflowCard>

            <WorkflowCard
              title={t("collaborator.overview.section.messages")}
              body={
                analytics.scopedMessageCount > 0
                  ? analytics.scopedMessageCount === 1
                    ? t("collaborator.overview.messages.summaryOne", {
                        count: analytics.scopedMessageCount,
                        unread: analytics.unreadScopedMessageCount,
                      })
                    : t("collaborator.overview.messages.summaryOther", {
                        count: analytics.scopedMessageCount,
                        unread: analytics.unreadScopedMessageCount,
                      })
                  : t("collaborator.overview.messages.empty")
              }
            >
              <Link href="/collaborator-dashboard/messages/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                {t("collaborator.overview.cta.openMessages")}
              </Link>
            </WorkflowCard>
          </div>
        </div>

        <section className="rounded-2xl border bg-white" style={cardStyle}>
          <div className="border-b px-5 py-4" style={{ borderColor: lavenderSoftLine }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor }}>
                Submitted Reviews
              </h2>
              <Link href="/collaborator-dashboard/submitted/" className="text-xs font-medium" style={{ color: lavenderDeep }}>
                View submitted
              </Link>
            </div>
          </div>
          <ul className="divide-y" style={{ borderColor: lavenderSoftLine }}>
            {analytics.completedSubmissions.length === 0 ? (
              <li className="px-5 py-8 text-sm" style={{ color: mutedColor }}>
                {t("collaborator.overview.completed.empty")}
              </li>
            ) : (
              analytics.completedSubmissions.map((row) => (
                <li key={row.submission.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="font-medium" style={{ color: inkColor }}>{row.submission.artist}</p>
                    <p className="text-sm" style={{ color: mutedColor }}>{row.submission.projectTitle}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p style={{ color: inkColor }}>
                      {row.score != null
                        ? t("collaborator.overview.score", { score: row.score })
                        : t("collaborator.overview.recordedWithoutScore")}
                    </p>
                    {row.recommendation && (
                      <p className="text-xs" style={{ color: mutedColor }}>{row.recommendation}</p>
                    )}
                  </div>
                </li>
              ))
            )}
          </ul>
        </section>

        <div className="h-1.5 overflow-hidden rounded-full bg-[#F1ECFB]">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${analytics.completionRate}%` }}
          />
        </div>
      </div>
    </main>
  )
}
