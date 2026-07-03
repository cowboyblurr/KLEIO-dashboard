/**
 * Collaborator analytics must be derived from source demo data.
 * Do not hardcode visible collaborator dashboard KPI values in UI components.
 */

import {
  collaborators,
  programs,
  allSubmissions,
  reviews,
  messageThreads,
  type Collaborator,
  type ReviewStatus,
  type Submission,
} from "@/lib/kleio-data"

/** Fixed demo anchor — keep in sync with institution analytics demo date. */
export const COLLABORATOR_DEMO_DATE = "2026-08-10"

const MS_PER_DAY = 1000 * 60 * 60 * 24

export type NormalizedCollaboratorReviewStatus = "Complete" | "In Progress" | "Pending"

export type CollaboratorAssignmentRow = {
  submission: Submission
  programTitle: string
  programDeadline: string
  reviewStatus: NormalizedCollaboratorReviewStatus
  score: number | null
  recommendation?: string
  daysUntilDeadline: number | null
}

export type CollaboratorAnalytics = {
  collaborator: Collaborator
  assignedProgramsCount: number
  assignedReviews: number
  completedReviews: number
  inProgressReviews: number
  pendingReviews: number
  completionRate: number
  pendingVoteCount: number
  overdueReviews: number
  dueSoonReviews: number
  nextDeadline: string
  assignedSubmissions: CollaboratorAssignmentRow[]
  completedSubmissions: CollaboratorAssignmentRow[]
  pendingSubmissions: CollaboratorAssignmentRow[]
  guidelinePrograms: Array<{
    id: string
    title: string
    category: string
    deadline: string
    rubric: string[]
    requiredMaterials: string[]
  }>
  scopedMessageCount: number
  unreadScopedMessageCount: number
  scopedMessageThreads: typeof messageThreads
  permissions: string[]
}

function toUtcNoonMs(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
}

function parseDemoDate(value?: string | null): Date | null {
  if (!value) return null
  if (value === "—") return null

  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}$/)
  if (isoMatch) {
    const date = new Date(`${value}T12:00:00Z`)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const parsed = new Date(`${value} 12:00:00 UTC`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function daysFromDemo(value?: string | null) {
  const date = parseDemoDate(value)
  if (!date) return null

  const demo = new Date(`${COLLABORATOR_DEMO_DATE}T12:00:00Z`)
  return Math.round((toUtcNoonMs(date) - toUtcNoonMs(demo)) / MS_PER_DAY)
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return clampPct((numerator / denominator) * 100)
}

function normalizeReviewStatus(status?: ReviewStatus): NormalizedCollaboratorReviewStatus {
  if (status === "Complete" || status === "Completed") return "Complete"
  if (status === "In Progress" || status === "Started" || status === "Requested Info") return "In Progress"
  return "Pending"
}

function getAssignedSubmissions(collaborator: Collaborator) {
  const byReviewerId = allSubmissions.filter((submission) =>
    submission.reviewerIds?.includes(collaborator.id),
  )

  const byCollaboratorAssignments = allSubmissions.filter((submission) =>
    collaborator.assignedSubmissionIds.includes(submission.id),
  )

  const map = new Map<string, Submission>()

  for (const submission of [...byReviewerId, ...byCollaboratorAssignments]) {
    map.set(submission.id, submission)
  }

  return Array.from(map.values())
}

function getScopedMessageThreads(collaborator: Collaborator, assignedSubmissions: Submission[]) {
  const assignedIds = new Set(assignedSubmissions.map((submission) => submission.id))

  return messageThreads.filter((thread) => {
    const isReviewerChannel = thread.channel === "Reviewer" || thread.channel === "Committee"
    if (!isReviewerChannel || !assignedIds.has(thread.submissionId)) return false

    const mentionsCollaborator =
      thread.counterpart === collaborator.name ||
      thread.preview.toLowerCase().includes(collaborator.name.toLowerCase()) ||
      thread.messages.some((message) => message.author === collaborator.name)

    return mentionsCollaborator || thread.channel === "Committee"
  })
}

export function getCollaboratorAnalytics(collaboratorId = "celeste-rowan"): CollaboratorAnalytics {
  const collaborator =
    collaborators.find((entry) => entry.id === collaboratorId) ??
    collaborators.find((entry) => entry.id === "celeste-rowan") ??
    collaborators[0]

  const assignedSubmissions = getAssignedSubmissions(collaborator)

  const assignedPrograms = programs.filter(
    (program) =>
      collaborator.assignedProgramIds.includes(program.id) ||
      program.committeeIds.includes(collaborator.id) ||
      assignedSubmissions.some((submission) => submission.programId === program.id),
  )

  const assignmentRows: CollaboratorAssignmentRow[] = assignedSubmissions.map((submission) => {
    const program = programs.find((entry) => entry.id === submission.programId)
    const review = reviews.find(
      (entry) => entry.submissionId === submission.id && entry.reviewerId === collaborator.id,
    )

    const reviewStatus = normalizeReviewStatus(review?.status)
    const daysUntilDeadline = daysFromDemo(program?.deadline)

    return {
      submission,
      programTitle: program?.title ?? submission.program,
      programDeadline: program?.deadline ?? "",
      reviewStatus,
      score: review?.score ?? null,
      recommendation: review?.recommendation,
      daysUntilDeadline,
    }
  })

  const assignedProgramsCount = assignedPrograms.length
  const assignedReviews = assignmentRows.length

  const completedReviews = assignmentRows.filter((row) => row.reviewStatus === "Complete").length
  const inProgressReviews = assignmentRows.filter((row) => row.reviewStatus === "In Progress").length
  const pendingReviews = assignmentRows.filter((row) => row.reviewStatus === "Pending").length

  const completionRate = pct(completedReviews, assignedReviews)

  const pendingVoteCount = assignmentRows.filter(
    (row) => row.submission.status === "Pending Vote",
  ).length

  const overdueReviews = assignmentRows.filter((row) => {
    return (
      row.reviewStatus !== "Complete" &&
      row.daysUntilDeadline != null &&
      row.daysUntilDeadline < 0
    )
  }).length

  const dueSoonReviews = assignmentRows.filter((row) => {
    return (
      row.reviewStatus !== "Complete" &&
      row.daysUntilDeadline != null &&
      row.daysUntilDeadline >= 0 &&
      row.daysUntilDeadline <= 14
    )
  }).length

  const nextDeadlineDate = assignmentRows
    .map((row) => parseDemoDate(row.programDeadline))
    .filter((date): date is Date => Boolean(date))
    .filter((date) => {
      const days = daysFromDemo(date.toISOString().slice(0, 10))
      return days != null && days >= 0
    })
    .sort((a, b) => a.getTime() - b.getTime())[0]

  const nextDeadline = nextDeadlineDate
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(nextDeadlineDate)
    : "No active deadline"

  const completedSubmissions = assignmentRows.filter((row) => row.reviewStatus === "Complete")
  const pendingSubmissions = assignmentRows.filter((row) => row.reviewStatus !== "Complete")

  const guidelinePrograms = assignedPrograms.map((program) => ({
    id: program.id,
    title: program.title,
    category: program.category,
    deadline: program.deadline,
    rubric: program.rubric,
    requiredMaterials: program.requiredMaterials,
  }))

  const scopedMessageThreads = getScopedMessageThreads(collaborator, assignedSubmissions)
  const scopedMessageCount = scopedMessageThreads.length
  const unreadScopedMessageCount = scopedMessageThreads.filter((thread) => thread.unread).length

  return {
    collaborator,
    assignedProgramsCount,
    assignedReviews,
    completedReviews,
    inProgressReviews,
    pendingReviews,
    completionRate,
    pendingVoteCount,
    overdueReviews,
    dueSoonReviews,
    nextDeadline,
    assignedSubmissions: assignmentRows,
    completedSubmissions,
    pendingSubmissions,
    guidelinePrograms,
    scopedMessageCount,
    unreadScopedMessageCount,
    scopedMessageThreads,
    permissions: collaborator.permissions,
  }
}

export const collaboratorAnalytics = getCollaboratorAnalytics()

const demoCollaboratorAnalytics = getCollaboratorAnalytics("celeste-rowan")

const collaboratorIntegrityChecks = {
  assignedReviewsMatchesRows:
    demoCollaboratorAnalytics.assignedReviews === demoCollaboratorAnalytics.assignedSubmissions.length,

  completedPlusPendingPlusInProgressMatchesAssigned:
    demoCollaboratorAnalytics.completedReviews +
      demoCollaboratorAnalytics.pendingReviews +
      demoCollaboratorAnalytics.inProgressReviews ===
    demoCollaboratorAnalytics.assignedReviews,

  completionRateMatchesCompletedOverAssigned:
    demoCollaboratorAnalytics.completionRate ===
    pct(demoCollaboratorAnalytics.completedReviews, demoCollaboratorAnalytics.assignedReviews),

  pendingRowsMatchPendingCount:
    demoCollaboratorAnalytics.pendingSubmissions.length ===
    demoCollaboratorAnalytics.pendingReviews + demoCollaboratorAnalytics.inProgressReviews,

  dueSoonNotGreaterThanPending:
    demoCollaboratorAnalytics.dueSoonReviews <=
    demoCollaboratorAnalytics.pendingReviews + demoCollaboratorAnalytics.inProgressReviews,

  completionRateWithinBounds:
    demoCollaboratorAnalytics.completionRate >= 0 && demoCollaboratorAnalytics.completionRate <= 100,

  assignedProgramsNonNegative: demoCollaboratorAnalytics.assignedProgramsCount >= 0,

  messageCountsValid:
    demoCollaboratorAnalytics.unreadScopedMessageCount <= demoCollaboratorAnalytics.scopedMessageCount,
}

export const collaboratorAnalyticsIntegrity = {
  ...collaboratorIntegrityChecks,
  allChecksPass: Object.values(collaboratorIntegrityChecks).every(Boolean),
}

if (process.env.NODE_ENV === "development" && !collaboratorAnalyticsIntegrity.allChecksPass) {
  console.warn("KLEIO collaborator analytics integrity check failed", collaboratorAnalyticsIntegrity)
}

export function formatCollaboratorDeadline(value: string) {
  const date = parseDemoDate(value)
  if (!date) return value || "—"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function formatDaysUntilDeadline(days: number | null) {
  if (days == null) return "—"
  if (days < 0) return `${Math.abs(days)} days overdue`
  if (days === 0) return "Due today"
  return `${days} days left`
}
