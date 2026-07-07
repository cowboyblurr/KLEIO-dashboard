import { analytics, applicationsOverTime, statusBreakdown } from "@/lib/kleio-analytics"
import { getKleioSourceSummary } from "@/lib/kleio-source"

export type KleioMetricAudit = {
  metric: string
  value: string | number
  sourceCollections: string[]
  calculation: string
  traceable: boolean
}

export function getKleioAnalyticsAudit(): KleioMetricAudit[] {
  return [
    {
      metric: "Total applications",
      value: analytics.totalApplications,
      sourceCollections: ["submissions"],
      calculation: "Count all submission records.",
      traceable: true,
    },
    {
      metric: "Previous cycle applications",
      value: analytics.previousApplications,
      sourceCollections: ["institution"],
      calculation: "Read prior cycle application count from institution cycle metadata.",
      traceable: true,
    },
    {
      metric: "Cycle delta",
      value: `${analytics.totalDelta}%`,
      sourceCollections: ["submissions", "institution"],
      calculation: "Round ((current submissions - previous cycle submissions) / previous cycle submissions) × 100.",
      traceable: true,
    },
    {
      metric: "In review count",
      value: analytics.inReviewCount,
      sourceCollections: ["submissions"],
      calculation: "Count submissions where status equals In Review.",
      traceable: true,
    },
    {
      metric: "Shortlisted count",
      value: analytics.shortlistedCount,
      sourceCollections: ["submissions"],
      calculation: "Count submissions where status equals Shortlisted.",
      traceable: true,
    },
    {
      metric: "Pending vote count",
      value: analytics.pendingVoteCount,
      sourceCollections: ["submissions"],
      calculation: "Count submissions where status equals Pending Vote.",
      traceable: true,
    },
    {
      metric: "Incomplete count",
      value: analytics.incompleteCount,
      sourceCollections: ["submissions"],
      calculation: "Count submissions with completeness under 100, missing materials, Incomplete status, or Pending Info status.",
      traceable: true,
    },
    {
      metric: "Deadlines this week",
      value: analytics.deadlinesThisWeekCount,
      sourceCollections: ["programs"],
      calculation: "Count programs with deadlines within 7 days of the demo anchor date.",
      traceable: true,
    },
    {
      metric: "Upcoming deadline queue items",
      value: analytics.upcomingDeadlinesCount,
      sourceCollections: ["programs", "submissions"],
      calculation: "Find review-queue submissions tied to programs whose deadlines are within 14 days and require attention or vote.",
      traceable: true,
    },
    {
      metric: "Pending reviewer actions",
      value: analytics.pendingReviewerActionsCount,
      sourceCollections: ["reviews"],
      calculation: "Count reviews with Pending, In Progress, or Not Started statuses.",
      traceable: true,
    },
    {
      metric: "Message badge count",
      value: analytics.messageBadgeCount,
      sourceCollections: ["messages"],
      calculation: "Count messages with pending or drafted status.",
      traceable: true,
    },
    {
      metric: "Reviewer completion rate",
      value: analytics.reviewerCompletionRate,
      sourceCollections: ["collaborators", "reviews"],
      calculation: "Calculate completed reviewer assignments divided by total assigned reviewer assignments.",
      traceable: true,
    },
    {
      metric: "Applications over time total",
      value: applicationsOverTime.reduce((sum, row) => sum + row.applications, 0),
      sourceCollections: ["submissions"],
      calculation: "Group submission records by submittedAt month and sum monthly counts.",
      traceable: true,
    },
    {
      metric: "Status breakdown total",
      value: statusBreakdown.reduce((sum, row) => sum + row.count, 0),
      sourceCollections: ["submissions"],
      calculation: "Group submission records by status and calculate count plus percentage of total applications.",
      traceable: true,
    },
  ]
}

export function getKleioInfrastructureAudit() {
  const source = getKleioSourceSummary()
  const metrics = getKleioAnalyticsAudit()
  const traceableMetrics = metrics.filter((metric) => metric.traceable).length

  return {
    source,
    metrics,
    summary: {
      metricCount: metrics.length,
      traceableMetricCount: traceableMetrics,
      traceableMetricRate: metrics.length ? `${Math.round((traceableMetrics / metrics.length) * 100)}%` : "0%",
      sourceBoundary: source.sourceKind === "seed" ? "synthetic seed records" : source.sourceKind,
      productionReady: false,
      nextRequired: ["database persistence", "production authentication", "role-based access control", "opportunity ingestion", "file storage"],
    },
  }
}
