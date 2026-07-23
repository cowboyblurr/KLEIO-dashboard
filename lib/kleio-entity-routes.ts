import { programs, submissions } from "@/lib/kleio-data"
import { kleioSyntheticInstitutionProfiles } from "@/lib/kleio-profile-data"

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const opportunityTitleToId: Record<string, string> = {
  "Lumen Arts Grant": "lumen-arts-grant",
  "Caribbean Futures Fund": "caribbean-futures-fund",
  "Citywide Artist Award": "citywide-artist-award",
  "Global Perspectives Residency": "global-perspectives-residency",
  "Harbor Foundation Grant": "harbor-foundation-grant",
  "Emerging Voices Prize": "emerging-voices-prize",
  "Material Practice Grant": "material-practice-grant",
}

const programTitleToId = Object.fromEntries(programs.map((program) => [program.title, program.id]))
const demoSubmissionArtistIds = new Set(submissions.map((submission) => submission.artistId))

const institutionNameToUsername = Object.fromEntries(
  kleioSyntheticInstitutionProfiles.map((institution) => [institution.displayName, institution.username]),
)

export function publicArtistHref(username: string) {
  return `/artist/${username}/`
}

/**
 * Synthetic demo applicants open the polished Creative Passport profile.
 * Unknown/live IDs retain the authenticated institution applicant-record route.
 */
export function internalArtistHref(artistId: string) {
  return demoSubmissionArtistIds.has(artistId) ? publicArtistHref(artistId) : `/artists/${artistId}/`
}

export function submissionHref(submissionId: string) {
  return `/submissions/${submissionId}/`
}

export function programHref(programId: string) {
  return `/programs/${programId}/`
}

export function programHrefByTitle(title: string) {
  const programId = programTitleToId[title]
  return programId ? programHref(programId) : "/programs/"
}

export function opportunityHref(opportunityId: string) {
  return `/artist-dashboard/opportunities/${opportunityId}/`
}

export function opportunityHrefByTitle(title: string) {
  const opportunityId = opportunityTitleToId[title]
  return opportunityId ? opportunityHref(opportunityId) : "/artist-dashboard/opportunities/"
}

export function institutionHref(username: string) {
  return `/institution/${username}/`
}

export function institutionHrefByName(name: string) {
  const username = institutionNameToUsername[name]
  return username ? institutionHref(username) : "/institution/kleio-arthouse/"
}

export function reviewerAnchorHref(reviewerId: string) {
  return `/committee/#reviewer-${slugify(reviewerId)}`
}

export function activityTargetHref(type: string, submissionId?: string, target?: string) {
  if (submissionId) return submissionHref(submissionId)
  if (type === "program") return target ? programHrefByTitle(target) : "/programs/"
  if (type === "review" || type === "decision" || type === "submission" || type === "message") return "/activity-log/"
  if (type === "report") return "/reports/"
  return "/dashboard/"
}
