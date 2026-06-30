import {
  allSubmissions,
  programs,
  reviews,
  collaborators,
  demoMessages,
  notes,
  institution,
  activityLog,
  demoScenarios,
  type Submission,
  type SubmissionStatus,
  type DemoMessage,
  type Note,
  type ReviewStatus,
} from "@/lib/kleio-data"

/** Fixed demo anchor — all date-relative metrics derive from this, not the real clock. */
export const DEMO_DATE = "2026-08-10"

const demoDateMs = new Date(`${DEMO_DATE}T12:00:00Z`).getTime()

const EXCLUDED_QUEUE_STATUSES: SubmissionStatus[] = ["Withdrawn", "Accepted", "Declined"]

const DISPLAY_STATUS_ORDER: SubmissionStatus[] = [
  "In Review",
  "Shortlisted",
  "Interview",
  "Pending Vote",
  "Pending Info",
  "Incomplete",
  "Withdrawn",
]

const STATUS_COLORS: Record<SubmissionStatus, string> = {
  "In Review": "oklch(0.55 0.2 287)",
  Shortlisted: "oklch(0.72 0.13 150)",
  Interview: "oklch(0.66 0.13 235)",
  "Pending Vote": "oklch(0.74 0.15 60)",
  "Pending Info": "oklch(0.78 0.13 78)",
  Incomplete: "oklch(0.86 0.045 290)",
  Withdrawn: "oklch(0.62 0.2 18)",
  Accepted: "oklch(0.58 0.16 150)",
  Declined: "oklch(0.55 0.04 290)",
}

function daysFromDemo(isoDate: string) {
  const dateMs = new Date(`${isoDate}T12:00:00Z`).getTime()
  return (dateMs - demoDateMs) / (1000 * 60 * 60 * 24)
}

function isWithinDays(isoDate: string, days: number) {
  const diff = daysFromDemo(isoDate)
  return diff >= 0 && diff <= days
}

function pct(count: number, total: number) {
  if (!total) return "0%"
  return `${((count / total) * 100).toFixed(1)}%`
}

function monthLabel(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(new Date(`${isoDate}T12:00:00Z`))
    .replace(" ", " '")
}

export function isIncompleteSubmission(submission: Submission) {
  return (
    submission.completeness < 100 ||
    (submission.missingMaterials?.length ?? 0) > 0 ||
    submission.status === "Incomplete" ||
    submission.status === "Pending Info"
  )
}

export function isNeedsAttention(submission: Submission) {
  return (
    (submission.missingMaterials?.length ?? 0) > 0 ||
    submission.status === "Pending Info" ||
    submission.status === "Incomplete"
  )
}

export function isReviewQueueSubmission(submission: Submission) {
  return !EXCLUDED_QUEUE_STATUSES.includes(submission.status)
}

function countByStatus(status: SubmissionStatus) {
  return allSubmissions.filter((s) => s.status === status).length
}

const totalApplications = allSubmissions.length
const previousApplications = institution.previousCycleApplicationCount
const totalDelta = Math.round(((totalApplications - previousApplications) / previousApplications) * 100)

const inReviewCount = countByStatus("In Review")
const shortlistedCount = countByStatus("Shortlisted")
const pendingVoteCount = countByStatus("Pending Vote")
const incompleteCount = allSubmissions.filter(isIncompleteSubmission).length
const deadlinesThisWeekCount = programs.filter((p) => isWithinDays(p.deadline, 7)).length
const upcomingDeadlinePrograms = programs.filter((p) => isWithinDays(p.deadline, 14))
const upcomingDeadlineProgramCount = upcomingDeadlinePrograms.length
const needsAttention = allSubmissions.filter(isNeedsAttention)
const reviewQueue = allSubmissions.filter(isReviewQueueSubmission)

/** Submissions needing action before a program deadline within the next 14 days. */
export function isUpcomingDeadlineQueueSubmission(submission: Submission) {
  const program = programs.find((p) => p.id === submission.programId)
  if (!program || !isWithinDays(program.deadline, 14)) return false
  if (!isReviewQueueSubmission(submission)) return false
  return isNeedsAttention(submission) || submission.status === "Pending Vote"
}

const upcomingDeadlinesSubmissions = reviewQueue.filter(isUpcomingDeadlineQueueSubmission)
const upcomingDeadlinesCount = upcomingDeadlinesSubmissions.length

const pendingReviewerActions = reviews.filter(
  (r) => r.status === "Pending" || r.status === "In Progress" || r.status === "Not Started",
)

export function isPendingMessage(message: DemoMessage) {
  return message.status === "pending" || message.status === "drafted"
}

export function getPendingMessages() {
  return demoMessages.filter(isPendingMessage)
}

export function isSubmissionMessagePending(submissionId: string) {
  return demoMessages.some((message) => message.submissionId === submissionId && isPendingMessage(message))
}

const pendingMessages = getPendingMessages()
const messageBadgeCount = pendingMessages.length

export type ReviewerProgress = {
  reviewerId: string
  name: string
  role: string
  assigned: number
  completed: number
  rate: number
}

export function getReviewerProgress(): ReviewerProgress[] {
  return collaborators
    .filter((c) => c.role === "Reviewer" || c.role === "Guest Juror" || c.role === "Curator")
    .map((collaborator) => {
      const assignedReviews = reviews.filter((r) => r.reviewerId === collaborator.id)
      const completed = assignedReviews.filter((r) => r.status === "Complete" || r.status === "Completed").length
      const assigned = assignedReviews.length || collaborator.reviewsAssigned
      const completedCount = assignedReviews.length ? completed : collaborator.reviewsCompleted
      return {
        reviewerId: collaborator.id,
        name: collaborator.name,
        role: collaborator.role,
        assigned,
        completed: completedCount,
        rate: assigned ? completedCount / assigned : 0,
      }
    })
}

export type NormalizedReviewStatus = "Complete" | "In Progress" | "Pending"

export type SubmissionReviewDetail = {
  reviewerId: string
  reviewerName: string
  status: NormalizedReviewStatus
  recommendation?: string
  score: number | null
  note: string
}

export type SubmissionReviewerProgressSummary = {
  completed: number
  total: number
  pending: number
  inProgress: number
  reviews: SubmissionReviewDetail[]
}

function normalizeReviewStatus(status: ReviewStatus): NormalizedReviewStatus {
  if (status === "Complete" || status === "Completed") return "Complete"
  if (status === "In Progress" || status === "Started" || status === "Requested Info") return "In Progress"
  return "Pending"
}

export function getSubmissionReviewerProgress(submissionId: string): SubmissionReviewerProgressSummary {
  const submission = allSubmissions.find((s) => s.id === submissionId)
  const submissionReviews = reviews.filter((r) => r.submissionId === submissionId)

  if (submissionReviews.length) {
    const reviewDetails: SubmissionReviewDetail[] = submissionReviews.map((review) => {
      const collaborator = collaborators.find((person) => person.id === review.reviewerId)
      return {
        reviewerId: review.reviewerId,
        reviewerName: collaborator?.name ?? "Reviewer",
        status: normalizeReviewStatus(review.status),
        recommendation: review.recommendation,
        score: review.score,
        note: review.note,
      }
    })

    return {
      completed: reviewDetails.filter((review) => review.status === "Complete").length,
      total: reviewDetails.length,
      pending: reviewDetails.filter((review) => review.status === "Pending").length,
      inProgress: reviewDetails.filter((review) => review.status === "In Progress").length,
      reviews: reviewDetails,
    }
  }

  if (submission?.reviewerIds?.length) {
    const reviewDetails: SubmissionReviewDetail[] = submission.reviewerIds.map((reviewerId) => {
      const collaborator = collaborators.find((person) => person.id === reviewerId)
      return {
        reviewerId,
        reviewerName: collaborator?.name ?? submission.reviewer,
        status: "Pending" as const,
        score: null,
        note: "",
      }
    })
    const fallback = submission.reviewerProgress ?? { completed: 0, total: reviewDetails.length }
    const completed = Math.min(fallback.completed, reviewDetails.length)

    return {
      completed,
      total: reviewDetails.length,
      pending: reviewDetails.length - completed,
      inProgress: 0,
      reviews: reviewDetails.map((review, index) => ({
        ...review,
        status: index < completed ? "Complete" : "Pending",
      })),
    }
  }

  return { completed: 0, total: 0, pending: 0, inProgress: 0, reviews: [] }
}

function formatNoteDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

export function getSubmissionNotes(submissionId: string): Note[] {
  return notes
    .filter((entry) => entry.submissionId === submissionId && entry.visibility === "internal")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getLatestSubmissionNote(submissionId: string) {
  const note = getSubmissionNotes(submissionId)[0]
  if (!note) return null

  const author = collaborators.find((person) => person.id === note.authorId)
  return {
    body: note.note,
    author: author?.name ?? "Program Team",
    date: formatNoteDate(note.createdAt),
  }
}

export type SubmissionActivityEntry = {
  id: string
  actor: string
  action: string
  date: string
}

export function getSubmissionActivity(submissionId: string): SubmissionActivityEntry[] {
  const fromLog = activityLog.filter((entry) => entry.submissionId === submissionId)
  if (fromLog.length) {
    return fromLog.map((entry) => ({
      id: entry.id,
      actor: entry.actor,
      action: entry.action,
      date: entry.date,
    }))
  }

  const submission = allSubmissions.find((entry) => entry.id === submissionId)
  return submission?.activity ?? []
}

export function getDemoMessageForThread(linkedMessageId?: string) {
  if (!linkedMessageId) return undefined
  return demoMessages.find((message) => message.id === linkedMessageId)
}

export type ProgramStats = {
  programId: string
  submissionCount: number
  incompleteCount: number
  needsAttentionCount: number
  assignedReviewers: { id: string; name: string; role: string }[]
}

export function getProgramStats(programId: string): ProgramStats {
  const programSubmissions = allSubmissions.filter((submission) => submission.programId === programId)
  const program = programs.find((entry) => entry.id === programId)
  const assignedReviewers = collaborators
    .filter(
      (person) =>
        person.assignedProgramIds.includes(programId) ||
        (program?.committeeIds.includes(person.id) ?? false),
    )
    .map((person) => ({ id: person.id, name: person.name, role: person.role }))

  return {
    programId,
    submissionCount: programSubmissions.length,
    incompleteCount: programSubmissions.filter(isIncompleteSubmission).length,
    needsAttentionCount: programSubmissions.filter(isNeedsAttention).length,
    assignedReviewers,
  }
}

export function getDisciplineDistribution() {
  const counts = allSubmissions.reduce<Record<string, number>>((acc, submission) => {
    acc[submission.medium] = (acc[submission.medium] ?? 0) + 1
    return acc
  }, {})

  return Object.entries(counts)
    .map(([medium, count]) => ({
      medium,
      count,
      pct: pct(count, totalApplications),
    }))
    .sort((a, b) => b.count - a.count)
}

export type ShortlistGroup = {
  id: string
  label: string
  statuses: SubmissionStatus[]
  submissions: Submission[]
}

export function getShortlistGroups(): ShortlistGroup[] {
  return [
    {
      id: "shortlisted",
      label: "Shortlisted",
      statuses: ["Shortlisted"],
      submissions: allSubmissions.filter((submission) => submission.status === "Shortlisted"),
    },
    {
      id: "finalist",
      label: "Finalist / Interview",
      statuses: ["Interview", "Pending Vote"],
      submissions: allSubmissions.filter(
        (submission) => submission.status === "Interview" || submission.status === "Pending Vote",
      ),
    },
    {
      id: "accepted",
      label: "Accepted",
      statuses: ["Accepted"],
      submissions: allSubmissions.filter((submission) => submission.status === "Accepted"),
    },
    {
      id: "declined",
      label: "Declined",
      statuses: ["Declined"],
      submissions: allSubmissions.filter((submission) => submission.status === "Declined"),
    },
  ]
}

export { demoScenarios }

export function getPrimaryUserFirstName() {
  return institution.primaryUser.split(" ")[0] ?? institution.primaryUser
}

export function getQueueForTab(tabId: string): Submission[] {
  switch (tabId) {
    case "attention":
      return needsAttention
    case "deadlines":
      return upcomingDeadlinesSubmissions
    default:
      return reviewQueue
  }
}

const countsByMonthKey = allSubmissions.reduce<Record<string, number>>((acc, submission) => {
  const key = submission.submittedAt.slice(0, 7)
  acc[key] = (acc[key] ?? 0) + 1
  return acc
}, {})

const applicationsOverTime = Object.keys(countsByMonthKey)
  .sort()
  .map((monthKey) => ({
    month: monthLabel(`${monthKey}-01`),
    applications: countsByMonthKey[monthKey] ?? 0,
  }))

const applicationsOverTimeTotal = applicationsOverTime.reduce((sum, row) => sum + row.applications, 0)

const statusBreakdown = DISPLAY_STATUS_ORDER.map((label) => {
  const count = countByStatus(label)
  return {
    label,
    pct: pct(count, totalApplications),
    count,
    color: STATUS_COLORS[label],
  }
})

const statusBreakdownTotal = statusBreakdown.reduce((sum, entry) => sum + entry.count, 0)

export const analytics = {
  totalApplications,
  previousApplications,
  totalDelta,
  inReviewCount,
  shortlistedCount,
  pendingVoteCount,
  incompleteCount,
  deadlinesThisWeekCount,
  upcomingDeadlinesCount,
  upcomingDeadlineProgramCount,
  needsAttentionCount: needsAttention.length,
  reviewQueueCount: reviewQueue.length,
  pendingReviewerActionsCount: pendingReviewerActions.length,
  messageBadgeCount,
  pendingMessagesCount: messageBadgeCount,
  unreadMessageCount: messageBadgeCount,
  activePrograms: programs.filter((p) => p.status === "Open" || p.status === "In Review").length,
  reviewerCompletionRate: `${Math.round(
    (getReviewerProgress().reduce((sum, r) => sum + r.completed, 0) /
      Math.max(getReviewerProgress().reduce((sum, r) => sum + r.assigned, 0), 1)) *
      100,
  )}%`,
  reviewQueue,
  needsAttention,
  upcomingDeadlinesSubmissions,
  upcomingDeadlinePrograms,
  pendingMessages,
}

export const kpis = [
  {
    label: "Total Applications",
    value: totalApplications.toLocaleString(),
    delta: `${totalDelta >= 0 ? "+" : ""}${totalDelta}% from previous cycle`,
    trend: totalDelta >= 0 ? ("up" as const) : ("neutral" as const),
    icon: "clipboard",
  },
  {
    label: "In Review",
    value: inReviewCount.toLocaleString(),
    delta: `${pct(inReviewCount, totalApplications)} of total`,
    trend: "neutral" as const,
    icon: "eye",
  },
  {
    label: "Shortlisted",
    value: shortlistedCount.toLocaleString(),
    delta: `${pct(shortlistedCount, totalApplications)} of total`,
    trend: "neutral" as const,
    icon: "bookmark",
  },
  {
    label: "Pending Committee Vote",
    value: pendingVoteCount.toLocaleString(),
    delta: `${pct(pendingVoteCount, totalApplications)} of total`,
    trend: "neutral" as const,
    icon: "users",
  },
  {
    label: "Deadlines This Week",
    value: deadlinesThisWeekCount.toLocaleString(),
    delta: `${deadlinesThisWeekCount} program${deadlinesThisWeekCount === 1 ? "" : "s"}`,
    trend: "neutral" as const,
    icon: "calendar",
  },
  {
    label: "Incomplete Applications",
    value: incompleteCount.toLocaleString(),
    delta: `${pct(incompleteCount, totalApplications)} of total`,
    trend: "neutral" as const,
    icon: "file",
  },
]

export const reviewQueueTabs = [
  { id: "priority", label: "Priority Review Queue", count: analytics.reviewQueueCount },
  { id: "attention", label: "Needs Attention", count: analytics.needsAttentionCount },
  { id: "deadlines", label: "Upcoming Deadlines", count: analytics.upcomingDeadlinesCount },
]

export { applicationsOverTime, statusBreakdown }

export const kleioAssistInsights = [
  {
    id: "attention",
    label: "Deadline triage",
    body: `${analytics.needsAttentionCount} submission${analytics.needsAttentionCount === 1 ? "" : "s"} need attention before the next review deadline.`,
  },
  {
    id: "reviewers",
    label: "Committee bottleneck",
    body: `${analytics.pendingReviewerActionsCount} reviewer action${analytics.pendingReviewerActionsCount === 1 ? "" : "s"} ${analytics.pendingReviewerActionsCount === 1 ? "is" : "are"} still pending across active programs.`,
  },
  {
    id: "shortlist",
    label: "Shortlist signal",
    body: `${analytics.shortlistedCount} candidate${analytics.shortlistedCount === 1 ? "" : "s"} ${analytics.shortlistedCount === 1 ? "is" : "are"} currently shortlisted for final review.`,
  },
]

/** Internal integrity checks — not rendered in UI. */
export const analyticsIntegrity = {
  statusBreakdownTotal,
  statusBreakdownMatchesTotal: statusBreakdownTotal === totalApplications,
  applicationsOverTimeTotal,
  applicationsOverTimeMatchesTotal: applicationsOverTimeTotal === totalApplications,
  reviewQueueMatchesBadge: analytics.reviewQueueCount === reviewQueue.length,
  needsAttentionMatchesTab: analytics.needsAttentionCount === needsAttention.length,
  incompleteMatchesKpi: analytics.incompleteCount === incompleteCount,
  upcomingDeadlinesMatchesTab:
    analytics.upcomingDeadlinesCount === upcomingDeadlinesSubmissions.length,
  messagesBadgeMatchesPending: analytics.messageBadgeCount === pendingMessages.length,
  allChecksPass:
    statusBreakdownTotal === totalApplications &&
    applicationsOverTimeTotal === totalApplications &&
    analytics.reviewQueueCount === reviewQueue.length &&
    analytics.needsAttentionCount === needsAttention.length &&
    analytics.upcomingDeadlinesCount === upcomingDeadlinesSubmissions.length &&
    analytics.incompleteCount === incompleteCount &&
    analytics.messageBadgeCount === pendingMessages.length,
}
