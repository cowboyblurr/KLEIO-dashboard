import {
  artistDashboardProfile,
  DEMO_ARTIST_ID,
  type ArtistDashboardApplicationStatus,
} from "@/lib/kleio-data"
import {
  artistApplicationRows,
  artistOpportunityDirectory,
  getArtistOpportunityFundingTotal,
} from "@/lib/kleio-opportunities"

import { getArtistProfileByUsername } from "@/lib/kleio-profile-data"
import type { KleioLocale } from "@/lib/kleio-i18n"
import { formatMessage } from "@/lib/kleio-i18n"

export const ARTIST_DEMO_DATE = "2026-08-10"

const MS_PER_DAY = 1000 * 60 * 60 * 24

type ApplicationStatusCounts = Record<ArtistDashboardApplicationStatus, number>

export type ArtistAnalytics = {
  activeApplications: number
  dueSoon: number
  upcomingDeadlines: number
  nextDeadline: string | null
  pendingDecisions: number
  overdueDecisions: number
  potentialFunding: number
  opportunityCount: number
  passportCompletenessPct: number
  materialsReadyCount: number
  materialsTotalCount: number
  selectedWorksCount: number
  applicationStatusCounts: ApplicationStatusCounts
  applicationCompletionRate: number
  fundingReadiness: {
    estimatedFit: number | null
    completeness: number
    timelineConfidence: number
  }
  nextActionsCount: number
  collaboratorMatchCount: number
}

const CLOSED_APPLICATION_STATUSES: ArtistDashboardApplicationStatus[] = ["Awarded", "Declined"]

const ACTIVE_APPLICATION_STATUSES: ArtistDashboardApplicationStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Waiting",
  "Interview",
]

const PENDING_DECISION_STATUSES: ArtistDashboardApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Waiting",
  "Interview",
]

const COMPLETED_APPLICATION_STATUSES: ArtistDashboardApplicationStatus[] = [
  "Submitted",
  "Under Review",
  "Waiting",
  "Interview",
  "Awarded",
  "Declined",
]

function toUtcNoonMs(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
}

function parseDemoDate(value?: string | null): Date | null {
  if (!value) return null
  if (value === "—" || value.toLowerCase() === "no active deadline") return null

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

  const demo = new Date(`${ARTIST_DEMO_DATE}T12:00:00Z`)
  return Math.round((toUtcNoonMs(date) - toUtcNoonMs(demo)) / MS_PER_DAY)
}

export function clampPct(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(100, Math.round(value)))
}

export function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return clampPct((numerator / denominator) * 100)
}

function average(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value))
  if (!valid.length) return null
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length)
}

function isActiveApplicationStatus(status: ArtistDashboardApplicationStatus) {
  return ACTIVE_APPLICATION_STATUSES.includes(status)
}

function isPendingDecisionStatus(status: ArtistDashboardApplicationStatus) {
  return PENDING_DECISION_STATUSES.includes(status)
}

function toIntlLocale(locale: KleioLocale) {
  return locale === "es" ? "es-MX" : "en-US"
}

export function formatArtistCurrency(value: number, locale: KleioLocale) {
  return new Intl.NumberFormat(toIntlLocale(locale), {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatArtistPct(value: number | null, locale: KleioLocale) {
  if (value == null) return formatMessage(locale, "status.preparedForScoring")
  return `${value}%`
}

export function formatDemoDateDisplay(
  value: string | null | undefined,
  locale: KleioLocale,
) {
  const date = parseDemoDate(value)
  if (!date) return value ?? "—"
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

export function formatArtistNextDeadline(isoDate: string | null, locale: KleioLocale) {
  if (!isoDate) return formatMessage(locale, "analytics.deadline.noActive")
  return formatDemoDateDisplay(isoDate, locale)
}

export type ArtistDeadlineUrgency = "thisWeek" | "dueSoon" | "upcoming"

export function formatArtistDeadlineUrgency(urgency: ArtistDeadlineUrgency, locale: KleioLocale) {
  const keyMap: Record<ArtistDeadlineUrgency, string> = {
    thisWeek: "analytics.urgency.thisWeek",
    dueSoon: "analytics.urgency.dueSoon",
    upcoming: "analytics.urgency.upcoming",
  }
  return formatMessage(locale, keyMap[urgency])
}

export function getArtistMaterialReadiness(profile: { materialsReady: Record<string, boolean> }) {
  const values = Object.values(profile.materialsReady)
  const ready = values.filter(Boolean).length
  return {
    ready,
    total: values.length,
    pct: pct(ready, values.length),
  }
}

export type ArtistDeadlineEntry = {
  title: string
  dateIso: string
  type: ArtistDashboardApplicationStatus
  urgency: ArtistDeadlineUrgency
  days: number
}

export function isApplicationTimelineReady(application: {
  dueDate: string
  deadlinePressure?: "low" | "medium" | "high"
  missingMaterialCount?: number
}) {
  const days = daysFromDemo(application.dueDate)
  const isOverdue = days != null && days < 0
  const hasUrgentPressure = application.deadlinePressure === "high"
  const hasMissingMaterials = (application.missingMaterialCount ?? 0) > 0

  return !isOverdue && !hasUrgentPressure && !hasMissingMaterials
}

export function getArtistDeadlineEntries(): ArtistDeadlineEntry[] {
  const activeApplicationsRows = artistApplicationRows.filter((application) =>
    isActiveApplicationStatus(application.status),
  )

  return activeApplicationsRows
    .map((application) => {
      const days = daysFromDemo(application.dueDate)
      if (days == null || days < 0) return null

      const urgency: ArtistDeadlineUrgency =
        days <= 7 ? "thisWeek" : days <= 14 ? "dueSoon" : "upcoming"

      return {
        title: application.program,
        dateIso: application.dueDate,
        type: application.status,
        urgency,
        days,
      }
    })
    .filter((entry): entry is ArtistDeadlineEntry => entry != null)
    .sort((a, b) => a.days - b.days)
}

export function getArtistAnalytics({
  artistId: _artistId = DEMO_ARTIST_ID,
  username = "amina-el-badri",
}: {
  artistId?: string
  username?: string
} = {}): ArtistAnalytics {
  const applications = artistApplicationRows

  const activeApplicationsRows = applications.filter((application) =>
    isActiveApplicationStatus(application.status),
  )

  const activeApplications = activeApplicationsRows.length

  const dueSoon = activeApplicationsRows.filter((application) => {
    const days = daysFromDemo(application.dueDate)
    return days != null && days >= 0 && days <= 14
  }).length

  const upcomingDeadlines = activeApplicationsRows.filter((application) => {
    const days = daysFromDemo(application.dueDate)
    return days != null && days >= 0
  }).length

  const nextDeadlineDate = activeApplicationsRows
    .map((application) => parseDemoDate(application.dueDate))
    .filter((date): date is Date => Boolean(date))
    .filter((date) => daysFromDemo(date.toISOString().slice(0, 10))! >= 0)
    .sort((a, b) => a.getTime() - b.getTime())[0]

  const nextDeadline = nextDeadlineDate
    ? nextDeadlineDate.toISOString().slice(0, 10)
    : null

  const pendingDecisions = applications.filter((application) =>
    isPendingDecisionStatus(application.status),
  ).length

  const overdueTimelineCount = artistDashboardProfile.timeline.filter(
    (entry) => entry.tone === "overdue",
  ).length

  const overdueApplicationCount = activeApplicationsRows.filter((application) => {
    const days = daysFromDemo(application.dueDate)
    return days != null && days < 0
  }).length

  const overdueDecisions = Math.max(overdueTimelineCount, overdueApplicationCount)

  const potentialFunding = getArtistOpportunityFundingTotal()

  const opportunityCount = artistOpportunityDirectory.length

  const publicProfile = getArtistProfileByUsername(username)
  const materialValues = publicProfile ? Object.values(publicProfile.materialsReady) : []

  const materialsReadyCount = materialValues.filter(Boolean).length
  const materialsTotalCount = materialValues.length

  const passportCompletenessPct = pct(materialsReadyCount, materialsTotalCount)

  const selectedWorksCount = publicProfile?.selectedWorks.length ?? 0

  const applicationStatusCounts = applications.reduce<ApplicationStatusCounts>(
    (acc, application) => {
      acc[application.status] = (acc[application.status] ?? 0) + 1
      return acc
    },
    {
      Draft: 0,
      Submitted: 0,
      "Under Review": 0,
      Waiting: 0,
      Interview: 0,
      Awarded: 0,
      Declined: 0,
    },
  )

  const completedApplications = applications.filter((application) =>
    COMPLETED_APPLICATION_STATUSES.includes(application.status),
  ).length

  const applicationCompletionRate = pct(completedApplications, applications.length)

  const estimatedFit = average(
    activeApplicationsRows
      .map((application) => application.fitScore)
      .filter((value): value is number => typeof value === "number"),
  )

  const completeness = passportCompletenessPct

  const timelineReadyCount = activeApplicationsRows.filter((application) =>
    isApplicationTimelineReady(application),
  ).length

  const timelineConfidence = pct(timelineReadyCount, activeApplicationsRows.length)

  const nextActionsCount = artistDashboardProfile.nextActions.length

  const collaboratorMatchCount = artistDashboardProfile.collaboratorMatches.length

  return {
    activeApplications,
    dueSoon,
    upcomingDeadlines,
    nextDeadline,
    pendingDecisions,
    overdueDecisions,
    potentialFunding,
    opportunityCount,
    passportCompletenessPct,
    materialsReadyCount,
    materialsTotalCount,
    selectedWorksCount,
    applicationStatusCounts,
    applicationCompletionRate,
    fundingReadiness: {
      estimatedFit,
      completeness,
      timelineConfidence,
    },
    nextActionsCount,
    collaboratorMatchCount,
  }
}

export const artistAnalytics = getArtistAnalytics()
