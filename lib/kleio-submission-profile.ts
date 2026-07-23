import { artists, submissions, type Artist, type ArtistDashboardHero, type Submission } from "@/lib/kleio-data"
import type { KleioSyntheticArtistProfile } from "@/lib/kleio-profile-data"

const visualThemes: ArtistDashboardHero["visualTheme"][] = [
  "studio-portrait",
  "archive-field",
  "paper-forms",
  "light-installation",
  "soft-botanical",
]

const accentColors: ArtistDashboardHero["accentColor"][] = ["lavender", "blue", "green", "peach"]

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function syntheticBio(submission: Submission, artist?: Artist) {
  if (artist?.bio) return artist.bio
  return `${submission.artist} is a synthetic demo artist based in ${submission.location}, working across ${submission.medium.toLowerCase()} and research-led visual practice. This fully developed KLEIO profile demonstrates how artist-approved biography, selected work, professional context, and application-ready materials can remain connected across opportunities and institutional review.`
}

function syntheticHistory(submission: Submission, artist?: Artist) {
  if (artist?.exhibitions?.length) {
    return artist.exhibitions.slice(0, 5).map((entry) => `${entry.venue} · ${entry.year} · ${entry.type}`)
  }
  return [
    `${submission.program} · ${submission.programCycle} · Open Call`,
    `Studio research presentation · 2025 · Synthetic demo record`,
    `Regional group exhibition · 2024 · Synthetic demo record`,
  ]
}

function selectedWorks(submission: Submission, artist?: Artist): KleioSyntheticArtistProfile["selectedWorks"] {
  if (artist?.works?.length) {
    return artist.works.slice(0, 6).map((work) => ({
      title: work.title,
      year: work.year,
      medium: work.medium,
      details: work.dimensions ?? work.medium,
      image: work.image,
    }))
  }

  const primaryImage = submission.image && submission.image !== "/placeholder.svg" ? submission.image : ""
  return [
    {
      title: submission.projectTitle,
      year: submission.programCycle,
      medium: submission.medium,
      details: `Featured project submitted to ${submission.program}`,
      image: primaryImage,
    },
    {
      title: `${submission.projectTitle} — Study I`,
      year: "2025",
      medium: `${submission.medium} study`,
      details: "Synthetic supporting work · Guided demo",
      image: "",
    },
    {
      title: `${submission.projectTitle} — Field Note`,
      year: "2024",
      medium: "Research material",
      details: "Synthetic supporting work · Guided demo",
      image: "",
    },
  ]
}

function availabilityFor(submission: Submission): KleioSyntheticArtistProfile["availability"] {
  return {
    residencies: submission.program.toLowerCase().includes("residency") ? "Open" : "Selective",
    exhibitions: submission.program.toLowerCase().includes("exhibition") ? "Open" : "Selective",
    commissions: "Selective",
    collaborations: "Open",
  }
}

export const submissionArtistUsernames = Array.from(new Set(submissions.map((submission) => submission.artistId)))

export function getSubmissionArtistProfile(username: string): KleioSyntheticArtistProfile | undefined {
  const submission = submissions.find((entry) => entry.artistId === username)
  if (!submission) return undefined

  const artist = artists.find((entry) => entry.id === username)
  const index = Math.max(0, submissionArtistUsernames.indexOf(username))
  const visualTheme: ArtistDashboardHero["visualTheme"] =
    artist?.dashboardHero?.visualTheme ?? visualThemes[index % visualThemes.length] ?? "studio-portrait"
  const accentColor: ArtistDashboardHero["accentColor"] =
    artist?.dashboardHero?.accentColor ?? accentColors[index % accentColors.length] ?? "lavender"
  const heroImage = artist?.portfolioImage && artist.portfolioImage !== "/placeholder.svg"
    ? artist.portfolioImage
    : submission.image && submission.image !== "/placeholder.svg"
      ? submission.image
      : ""

  const practiceTags = unique([
    ...(artist?.tags ?? []),
    submission.medium,
    submission.discipline,
    "Research-led",
    "Application-ready",
  ]).slice(0, 8)

  const themes = unique([
    ...(artist?.themes ?? []),
    submission.projectTitle,
    submission.medium,
    "Place",
    "Memory",
    "Material practice",
  ]).slice(0, 8)

  const dashboardHero: ArtistDashboardHero = artist?.dashboardHero ?? {
    title: "Creative Passport",
    subtitle: "Artist-approved work, professional context, and reusable application materials in one profile.",
    visualTheme,
    accentColor,
  }

  return {
    username: submission.artistId,
    displayName: submission.artist,
    role: submission.discipline,
    location: submission.location,
    nativeOnKleio: true,
    profileBadge: "Creative Passport · Synthetic demo",
    portrait: "",
    heroImage,
    visualTheme,
    accentColor,
    website: artist?.website ?? `${submission.artistId}.demo`,
    instagram: artist?.instagram ?? `@${submission.artistId.replaceAll("-", ".")}.demo`,
    email: artist?.contactEmail ?? `studio@${submission.artistId}.demo`,
    practiceTags,
    shortBio: syntheticBio(submission, artist),
    artistStatement: artist?.statement || submission.statement,
    selectedWorks: selectedWorks(submission, artist),
    materialsReady: {
      bio: true,
      artistStatement: true,
      cvResume: artist ? artist.cvStatus === "Complete" : submission.completeness >= 80,
      portfolio: artist ? artist.documentStatus === "Complete" : submission.completeness >= 75,
      workSamples: true,
      references: artist ? artist.referencesStatus === "Complete" : submission.completeness >= 90,
    },
    themes,
    availability: artist?.availability
      ? {
          residencies: artist.availability.some((item) => item.label.toLowerCase().includes("residenc") && item.status !== "Closed") ? "Open" : "Selective",
          exhibitions: artist.availability.some((item) => item.label.toLowerCase().includes("exhibition") && item.status !== "Closed") ? "Open" : "Selective",
          commissions: artist.availability.some((item) => item.label.toLowerCase().includes("commission") && item.status !== "Closed") ? "Open" : "Selective",
          collaborations: "Selective",
        }
      : availabilityFor(submission),
    history: syntheticHistory(submission, artist),
    dashboardHero,
  }
}
