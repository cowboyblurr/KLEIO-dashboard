import { collaborators, programs } from "@/lib/kleio-data"

import { formatMessage, type KleioLocale } from "@/lib/kleio-i18n"

export type ReviewTeamRole =
  | "Reviewer"
  | "Guest Juror"
  | "Committee Member"
  | "Curator"
  | "Grant Administrator"
  | "Viewer"

export type ReviewAccessScope =
  | "Assigned submissions only"
  | "Assigned program only"
  | "Guidelines only"
  | "Committee context"

export type ReviewPermission =
  | "view-assigned-submissions"
  | "view-guidelines"
  | "score"
  | "leave-notes"
  | "vote"
  | "message-institution"
  | "view-shortlist"

export type ReviewInviteTiming = "Prepare invite now" | "Invite after workspace setup"

export type ReviewInviteStatus = "Prepared" | "Deferred"

export type ReviewTeamMember = {
  id: string
  name: string
  email: string
  role: ReviewTeamRole
  assignedProgramId: string
  assignedProgramTitle: string
  accessScope: ReviewAccessScope
  permissions: ReviewPermission[]
  inviteTiming: ReviewInviteTiming
  inviteStatus: ReviewInviteStatus
}

export type ReviewTeamStats = {
  totalCollaborators: number
  preparedInvites: number
  deferredInvites: number
  reviewers: number
  guestJurors: number
  committeeMembers: number
  curators: number
  grantAdministrators: number
  viewers: number
  assignedProgramCount: number
  limitedReviewSeats: number
  canScoreCount: number
  canVoteCount: number
  canMessageCount: number
  validEmailCount: number
  setupCompletenessPct: number
  roleBreakdown: Record<ReviewTeamRole, number>
  accessBreakdown: Record<ReviewAccessScope, number>
}

export const REVIEW_TEAM_ROLES: ReviewTeamRole[] = [
  "Reviewer",
  "Guest Juror",
  "Committee Member",
  "Curator",
  "Grant Administrator",
  "Viewer",
]

export const REVIEW_ACCESS_SCOPES: ReviewAccessScope[] = [
  "Assigned submissions only",
  "Assigned program only",
  "Guidelines only",
  "Committee context",
]

export const REVIEW_ROLE_PERMISSION_PRESETS: Record<ReviewTeamRole, ReviewPermission[]> = {
  Reviewer: [
    "view-assigned-submissions",
    "view-guidelines",
    "score",
    "leave-notes",
    "message-institution",
  ],
  "Guest Juror": [
    "view-assigned-submissions",
    "view-guidelines",
    "score",
    "leave-notes",
    "vote",
    "message-institution",
  ],
  "Committee Member": [
    "view-assigned-submissions",
    "view-guidelines",
    "leave-notes",
    "vote",
    "view-shortlist",
    "message-institution",
  ],
  Curator: [
    "view-assigned-submissions",
    "view-guidelines",
    "score",
    "leave-notes",
    "view-shortlist",
    "message-institution",
  ],
  "Grant Administrator": [
    "view-assigned-submissions",
    "view-guidelines",
    "leave-notes",
    "message-institution",
  ],
  Viewer: ["view-guidelines"],
}

const LIMITED_ACCESS_SCOPES: ReviewAccessScope[] = [
  "Assigned submissions only",
  "Assigned program only",
  "Guidelines only",
  "Committee context",
]

function findCollaborator(id: string) {
  return collaborators.find((entry) => entry.id === id)
}

function findProgram(id: string) {
  return programs.find((entry) => entry.id === id)
}

function buildDefaultMember(
  collaboratorId: string,
  role: ReviewTeamRole,
  programId: string,
  accessScope: ReviewAccessScope,
): ReviewTeamMember {
  const collaborator = findCollaborator(collaboratorId)
  const program = findProgram(programId)

  return {
    id: collaboratorId,
    name: collaborator?.name ?? "",
    email: collaborator?.email ?? "",
    role,
    assignedProgramId: programId,
    assignedProgramTitle: program?.title ?? "",
    accessScope,
    permissions: REVIEW_ROLE_PERMISSION_PRESETS[role],
    inviteTiming: "Prepare invite now",
    inviteStatus: "Prepared",
  }
}

export function getDefaultReviewTeam(): ReviewTeamMember[] {
  return [
    buildDefaultMember("celeste-rowan", "Guest Juror", "residency-2026", "Committee context"),
    buildDefaultMember("theo-malik", "Curator", "public-forms-2026", "Assigned program only"),
    buildDefaultMember("lina-park", "Grant Administrator", "archive-fellowship-2026", "Assigned submissions only"),
  ]
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return clampPct((numerator / denominator) * 100)
}

export function calculateReviewTeamStats(members: ReviewTeamMember[]): ReviewTeamStats {
  const totalCollaborators = members.length

  const preparedInvites = members.filter((member) => member.inviteStatus === "Prepared").length
  const deferredInvites = members.filter((member) => member.inviteStatus === "Deferred").length

  const reviewers = members.filter((member) => member.role === "Reviewer").length
  const guestJurors = members.filter((member) => member.role === "Guest Juror").length
  const committeeMembers = members.filter((member) => member.role === "Committee Member").length
  const curators = members.filter((member) => member.role === "Curator").length
  const grantAdministrators = members.filter((member) => member.role === "Grant Administrator").length
  const viewers = members.filter((member) => member.role === "Viewer").length

  const assignedProgramCount = new Set(
    members.map((member) => member.assignedProgramId).filter(Boolean),
  ).size

  const limitedReviewSeats = members.filter((member) =>
    LIMITED_ACCESS_SCOPES.includes(member.accessScope),
  ).length

  const canScoreCount = members.filter((member) => member.permissions.includes("score")).length
  const canVoteCount = members.filter((member) => member.permissions.includes("vote")).length
  const canMessageCount = members.filter((member) =>
    member.permissions.includes("message-institution"),
  ).length

  const validEmailCount = members.filter((member) => isValidEmail(member.email)).length

  const requiredFieldCount = members.length * 5
  const completedFieldCount = members.reduce((sum, member) => {
    return (
      sum +
      (member.name.trim() ? 1 : 0) +
      (isValidEmail(member.email) ? 1 : 0) +
      (member.role ? 1 : 0) +
      (member.assignedProgramId ? 1 : 0) +
      (member.accessScope ? 1 : 0)
    )
  }, 0)

  const setupCompletenessPct = members.length === 0 ? 0 : pct(completedFieldCount, requiredFieldCount)

  const roleBreakdown = REVIEW_TEAM_ROLES.reduce(
    (acc, role) => {
      acc[role] = members.filter((member) => member.role === role).length
      return acc
    },
    {} as Record<ReviewTeamRole, number>,
  )

  const accessBreakdown = REVIEW_ACCESS_SCOPES.reduce(
    (acc, scope) => {
      acc[scope] = members.filter((member) => member.accessScope === scope).length
      return acc
    },
    {} as Record<ReviewAccessScope, number>,
  )

  return {
    totalCollaborators,
    preparedInvites,
    deferredInvites,
    reviewers,
    guestJurors,
    committeeMembers,
    curators,
    grantAdministrators,
    viewers,
    assignedProgramCount,
    limitedReviewSeats,
    canScoreCount,
    canVoteCount,
    canMessageCount,
    validEmailCount,
    setupCompletenessPct,
    roleBreakdown,
    accessBreakdown,
  }
}

export function getReviewTeamIntegrity(members: ReviewTeamMember[]) {
  const stats = calculateReviewTeamStats(members)

  const roleSum =
    stats.reviewers +
    stats.guestJurors +
    stats.committeeMembers +
    stats.curators +
    stats.grantAdministrators +
    stats.viewers

  const accessSum = Object.values(stats.accessBreakdown).reduce((sum, count) => sum + count, 0)
  const uniqueIdCount = new Set(members.map((member) => member.id)).size

  const checks = {
    totalMatchesMembers: stats.totalCollaborators === members.length,
    preparedPlusDeferredMatchesTotal:
      stats.preparedInvites + stats.deferredInvites === stats.totalCollaborators,
    roleCountsMatchTotal: roleSum === stats.totalCollaborators,
    accessCountsMatchTotal: accessSum === stats.totalCollaborators,
    limitedSeatsNotGreaterThanTotal: stats.limitedReviewSeats <= stats.totalCollaborators,
    validEmailsNotGreaterThanTotal: stats.validEmailCount <= stats.totalCollaborators,
    setupCompletenessWithinBounds:
      stats.setupCompletenessPct >= 0 && stats.setupCompletenessPct <= 100,
    idsAreUnique: uniqueIdCount === members.length,
  }

  return {
    ...checks,
    allChecksPass: Object.values(checks).every(Boolean),
  }
}

export const REVIEW_TEAM_STORAGE_KEY = "kleio-institution-review-team"

function isBrowser() {
  return typeof window !== "undefined"
}

export function saveReviewTeamDemoState(members: ReviewTeamMember[]) {
  if (!isBrowser()) return
  window.localStorage.setItem(REVIEW_TEAM_STORAGE_KEY, JSON.stringify(members))
}

export function readReviewTeamDemoState(): ReviewTeamMember[] {
  if (!isBrowser()) return getDefaultReviewTeam()

  const raw = window.localStorage.getItem(REVIEW_TEAM_STORAGE_KEY)
  if (!raw) return getDefaultReviewTeam()

  try {
    const parsed = JSON.parse(raw) as ReviewTeamMember[]
    if (!Array.isArray(parsed)) return getDefaultReviewTeam()
    return parsed
  } catch {
    return getDefaultReviewTeam()
  }
}

export function formatReviewTeamRole(role: ReviewTeamRole, locale: KleioLocale) {
  const keyMap: Record<ReviewTeamRole, string> = {
    Reviewer: "reviewTeam.role.reviewer",
    "Guest Juror": "reviewTeam.role.guestJuror",
    "Committee Member": "reviewTeam.role.committeeMember",
    Curator: "reviewTeam.role.curator",
    "Grant Administrator": "reviewTeam.role.grantAdministrator",
    Viewer: "reviewTeam.role.viewer",
  }
  return formatMessage(locale, keyMap[role])
}

export function formatReviewAccessScope(scope: ReviewAccessScope, locale: KleioLocale) {
  const keyMap: Record<ReviewAccessScope, string> = {
    "Assigned submissions only": "reviewTeam.access.assignedSubmissionsOnly",
    "Assigned program only": "reviewTeam.access.assignedProgramOnly",
    "Guidelines only": "reviewTeam.access.guidelinesOnly",
    "Committee context": "reviewTeam.access.committeeContext",
  }
  return formatMessage(locale, keyMap[scope])
}

export function formatReviewInviteTiming(timing: ReviewInviteTiming, locale: KleioLocale) {
  const keyMap: Record<ReviewInviteTiming, string> = {
    "Prepare invite now": "reviewTeam.inviteTiming.prepareNow",
    "Invite after workspace setup": "reviewTeam.inviteTiming.afterSetup",
  }
  return formatMessage(locale, keyMap[timing])
}

export function formatReviewInviteStatus(status: ReviewInviteStatus, locale: KleioLocale) {
  const keyMap: Record<ReviewInviteStatus, string> = {
    Prepared: "reviewTeam.inviteStatus.preparedInvite",
    Deferred: "reviewTeam.inviteStatus.deferredInvite",
  }
  return formatMessage(locale, keyMap[status])
}

export function formatReviewPermission(permission: ReviewPermission, locale: KleioLocale) {
  const keyMap: Record<ReviewPermission, string> = {
    "view-assigned-submissions": "reviewTeam.permission.viewAssignedSubmissions",
    "view-guidelines": "reviewTeam.permission.viewGuidelines",
    score: "reviewTeam.permission.score",
    "leave-notes": "reviewTeam.permission.leaveNotes",
    vote: "reviewTeam.permission.vote",
    "message-institution": "reviewTeam.permission.messageInstitution",
    "view-shortlist": "reviewTeam.permission.viewShortlist",
  }
  return formatMessage(locale, keyMap[permission])
}
