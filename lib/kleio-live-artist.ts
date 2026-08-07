import type { ArtistAnalytics } from "@/lib/kleio-artist-analytics"
import type {
  Artist,
  ArtistDashboardApplicationStatus,
  ArtistDashboardProfile,
} from "@/lib/kleio-data"
import { calculatePassportCompletion } from "@/lib/kleio-passport-completion"
import { getSupabaseBrowserClient, isKleioEmailConfirmed } from "@/lib/kleio-supabase"

type ArtistProfileRow = {
  professional_name: string | null
  location: string | null
  bio: string | null
  artist_statement: string | null
  practice_description: string | null
  website_url: string | null
  instagram_url: string | null
  disciplines: string[] | null
  mediums: string[] | null
  education: string | null
  exhibition_history: string | null
  awards: string | null
  cv_file_path: string | null
}

type CvSourceRow = {
  storage_path: string | null
}

type ApplicationRow = {
  status: string
  submitted_at: string | null
  updated_at: string
  open_calls:
    | { title: string | null; deadline_at: string | null; notification_date: string | null }
    | Array<{ title: string | null; deadline_at: string | null; notification_date: string | null }>
    | null
}

export type LiveArtistWorkspace = {
  artist: Artist
  profile: ArtistDashboardProfile
  analytics: ArtistAnalytics
}

function applicationStatus(value: string): ArtistDashboardApplicationStatus {
  if (value === "submitted") return "Submitted"
  if (value === "in_review") return "Under Review"
  if (value === "needs_follow_up") return "Waiting"
  if (value === "shortlisted" || value === "finalist") return "Interview"
  if (value === "accepted") return "Awarded"
  if (value === "declined" || value === "withdrawn") return "Declined"
  return "Draft"
}

function callFor(row: ApplicationRow) {
  return Array.isArray(row.open_calls) ? row.open_calls[0] ?? null : row.open_calls
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date)
}

function isActive(status: ArtistDashboardApplicationStatus) {
  return !["Awarded", "Declined"].includes(status)
}

function emptyStatusCounts(): ArtistAnalytics["applicationStatusCounts"] {
  return {
    Draft: 0,
    Submitted: 0,
    "Under Review": 0,
    Waiting: 0,
    Interview: 0,
    Awarded: 0,
    Declined: 0,
  }
}

export async function loadLiveArtistWorkspace(): Promise<LiveArtistWorkspace> {
  const supabase = getSupabaseBrowserClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  const user = userData.user
  if (!user || !isKleioEmailConfirmed(user)) throw new Error("Email not confirmed.")

  const [
    { data: profileData, error: profileError },
    { data: artistData, error: artistError },
    { data: worksData, error: worksError },
    { data: applicationData, error: applicationsError },
    { data: cvSourceData, error: cvSourceError },
  ] = await Promise.all([
    supabase.from("profiles").select("display_name, email, onboarding_completed").eq("id", user.id).single(),
    supabase.from("artist_profiles").select("professional_name, location, bio, artist_statement, practice_description, website_url, instagram_url, disciplines, mediums, education, exhibition_history, awards, cv_file_path").eq("user_id", user.id).maybeSingle(),
    supabase.from("portfolio_works").select("id, title, year, medium, dimensions, image_path").eq("artist_user_id", user.id).order("sort_order", { ascending: true }),
    supabase.from("applications").select("status, submitted_at, updated_at, open_calls(title, deadline_at, notification_date)").eq("artist_user_id", user.id).order("updated_at", { ascending: false }),
    supabase.from("artist_import_sources")
      .select("storage_path")
      .eq("artist_user_id", user.id)
      .eq("media_kind", "document")
      .is("deleted_at", null)
      .or("artist_selected_document_type.eq.artist_cv,classification.eq.artist_cv")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (profileError) throw profileError
  if (artistError) throw artistError
  if (worksError) throw worksError
  if (applicationsError) throw applicationsError
  if (cvSourceError) throw cvSourceError
  if (!profileData) throw new Error("This account does not have a KLEIO profile yet.")
  if (!artistData) throw new Error("Your Creative Passport is not complete yet.")

  const artistRow = artistData as ArtistProfileRow
  const cvSource = cvSourceData as CvSourceRow | null
  const rows = (applicationData ?? []) as ApplicationRow[]
  const works = (worksData ?? []) as Array<{ id: string; title: string; year: string | number | null; medium: string | null; dimensions: string | null; image_path: string | null }>
  const effectiveCvPath = artistRow.cv_file_path?.trim() || cvSource?.storage_path?.trim() || ""
  const displayName = artistRow.professional_name?.trim() || profileData.display_name?.trim() || user.email?.split("@")[0] || "KLEIO Artist"
  const disciplines = artistRow.disciplines ?? []
  const mediums = artistRow.mediums ?? []
  const completionWorks = works.map((work) => ({
    title: work.title,
    year: work.year == null ? "" : String(work.year),
    medium: work.medium,
    dimensions: work.dimensions,
    image_path: work.image_path,
  }))
  const completion = calculatePassportCompletion({
    ...artistRow,
    cv_file_path: effectiveCvPath,
  }, completionWorks)
  const completeness = completion.percentage
  const mappedApplications = rows.map((row) => {
    const call = callFor(row)
    return {
      program: call?.title?.trim() || "Application",
      status: applicationStatus(row.status),
      dueDate: formatDate(call?.deadline_at ?? null),
      updated: formatDate(row.updated_at),
    }
  })
  const statusCounts = emptyStatusCounts()
  mappedApplications.forEach((application) => {
    statusCounts[application.status] += 1
  })
  const activeApplications = mappedApplications.filter((application) => isActive(application.status)).length
  const pendingDecisions = mappedApplications.filter((application) => ["Submitted", "Under Review", "Waiting", "Interview"].includes(application.status)).length
  const nextDeadline = rows
    .map((row) => callFor(row)?.deadline_at ?? null)
    .filter((value): value is string => Boolean(value))
    .filter((value) => new Date(`${value}T23:59:59Z`).getTime() >= Date.now())
    .sort()[0] ?? null
  const dueSoon = rows.filter((row) => {
    const deadline = callFor(row)?.deadline_at
    if (!deadline) return false
    const days = Math.ceil((new Date(`${deadline}T23:59:59Z`).getTime() - Date.now()) / 86_400_000)
    return days >= 0 && days <= 14
  }).length
  const materials = completion.categories
    .filter((item) => item.tier !== "optional")
    .map((item) => ({
      label: item.label,
      progress: item.weight ? Math.round((item.earned / item.weight) * 100) : 0,
      status: item.complete ? "complete" as const : "attention" as const,
    }))
  const readyCount = materials.filter((item) => item.status === "complete").length

  const artist: Artist = {
    id: user.id,
    name: displayName,
    location: artistRow.location?.trim() || "Location not added",
    discipline: disciplines.join(", ") || "Discipline not added",
    medium: mediums.join(", ") || "Medium not added",
    bio: artistRow.bio ?? "",
    statement: artistRow.artist_statement ?? "",
    tags: [...disciplines, ...mediums],
    portfolioImage: works.find((work) => work.image_path)?.image_path ?? "",
    cvStatus: effectiveCvPath ? "Complete" : "Incomplete",
    documentStatus: artistRow.bio && artistRow.artist_statement ? "Complete" : "Incomplete",
    referencesStatus: "Pending",
    passportCompleteness: completeness,
    works: works.map((work) => ({
      id: work.id,
      title: work.title,
      year: work.year ? String(work.year) : "",
      medium: work.medium ?? "",
      dimensions: work.dimensions ?? undefined,
      image: work.image_path ?? "",
    })),
    website: artistRow.website_url ?? undefined,
    instagram: artistRow.instagram_url ?? undefined,
    contactEmail: profileData.email ?? user.email ?? undefined,
  }

  const dashboardProfile: ArtistDashboardProfile = {
    name: displayName,
    role: disciplines.join(" · ") || "Artist",
    location: artist.location,
    hero: {
      title: `Welcome back, ${displayName.split(" ")[0]}`,
      subtitle: completeness < 100
        ? "Your Creative Passport is connected to this account. Complete the remaining materials to improve application readiness."
        : "Your Creative Passport is ready to reuse across applications and opportunity workflows.",
      visualTheme: "soft-botanical",
      accentColor: "lavender",
    },
    stats: {
      activeApplications,
      dueSoon,
      upcomingDeadlines: nextDeadline ? 1 : 0,
      nextDeadline: nextDeadline ?? "No active deadline",
      pendingDecisions,
      overdueDecisions: 0,
      potentialFunding: 0,
      opportunityCount: 0,
    },
    applications: mappedApplications,
    timeline: rows
      .filter((row) => callFor(row)?.notification_date)
      .map((row) => ({
        program: callFor(row)?.title || "Application",
        expected: `Expected ${formatDate(callFor(row)?.notification_date ?? null)}`,
        status: applicationStatus(row.status),
        tone: "steady" as const,
      })),
    collaboratorMatches: [],
    nextActions: completeness < 100
      ? [{ program: "Creative Passport", task: "Complete missing profile materials", due: "Next", tone: "due" }]
      : mappedApplications.length
        ? [{ program: "Applications", task: "Review current application status", due: "This week", tone: "soon" }]
        : [{ program: "Opportunities", task: "Review open calls when you are ready", due: "Next", tone: "soon" }],
    passportCompleteness: materials,
    quietInsights: [
      `${readyCount} of ${materials.length} readiness items are complete.`,
      works.length ? `${works.length} portfolio ${works.length === 1 ? "work is" : "works are"} connected to this account.` : "Add portfolio works to strengthen application readiness.",
      completion.optionalImprovements.length ? `${completion.optionalImprovements.length} optional enhancement${completion.optionalImprovements.length === 1 ? " is" : "s are"} available without blocking readiness.` : "Optional Passport enhancements are complete.",
    ],
    fundingReadiness: { estimatedFit: 0, completeness, timelineConfidence: nextDeadline ? 100 : 0 },
  }

  const analytics: ArtistAnalytics = {
    activeApplications,
    dueSoon,
    upcomingDeadlines: nextDeadline ? 1 : 0,
    nextDeadline,
    pendingDecisions,
    overdueDecisions: 0,
    potentialFunding: 0,
    opportunityCount: 0,
    passportCompletenessPct: completeness,
    materialsReadyCount: readyCount,
    materialsTotalCount: materials.length,
    selectedWorksCount: works.length,
    applicationStatusCounts: statusCounts,
    applicationCompletionRate: mappedApplications.length ? Math.round((mappedApplications.filter((application) => application.status !== "Draft").length / mappedApplications.length) * 100) : 0,
    fundingReadiness: { estimatedFit: null, completeness, timelineConfidence: nextDeadline ? 100 : 0 },
    nextActionsCount: dashboardProfile.nextActions.length,
    collaboratorMatchCount: 0,
  }

  return { artist, profile: dashboardProfile, analytics }
}
