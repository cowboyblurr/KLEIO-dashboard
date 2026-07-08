import { allSubmissions, artists, collaborators, messageThreads, programs } from "@/lib/kleio-data"

export type KleioSearchResult = {
  id: string
  title: string
  subtitle: string
  href: string
  category: "Page" | "Applicant" | "Artist" | "Program" | "Reviewer" | "Message" | "Report"
  keywords: string
}

const pageResults: KleioSearchResult[] = [
  { id: "page-dashboard", title: "Dashboard", subtitle: "Overview, priorities, review readiness", href: "/dashboard/", category: "Page", keywords: "dashboard overview priority readiness institution workspace" },
  { id: "page-programs", title: "Programs & Open Calls", subtitle: "Create calls, materials, rubrics, committees", href: "/programs/", category: "Program", keywords: "programs open calls call setup materials rubric committee" },
  { id: "page-new-program", title: "Create Open Call", subtitle: "Build a call, materials, rubric, committee, publish", href: "/programs/new/", category: "Program", keywords: "new program create open call publish materials rubric" },
  { id: "page-submissions", title: "Submissions", subtitle: "Applicant records, materials, review status", href: "/submissions/", category: "Applicant", keywords: "submissions applications applicant materials review status" },
  { id: "page-artists", title: "Artists", subtitle: "Creative Passports and artist records", href: "/artists/", category: "Artist", keywords: "artists creative passport records directory" },
  { id: "page-review-queue", title: "Review Queue", subtitle: "Cleanup, reviewer follow-up, ready records", href: "/review-queue/", category: "Page", keywords: "review queue cleanup missing materials reviewer follow up ready" },
  { id: "page-review-room", title: "Review Room", subtitle: "Committee discussion and decision context", href: "/review-room/", category: "Page", keywords: "review room committee discussion decision shortlist" },
  { id: "page-shortlist", title: "Shortlist", subtitle: "Candidates, final comparison, committee movement", href: "/shortlist/", category: "Page", keywords: "shortlist candidates decision final comparison" },
  { id: "page-reports", title: "Reports", subtitle: "Program report draft and decision history", href: "/reports/", category: "Report", keywords: "reports report draft export decision history analytics" },
  { id: "page-activity", title: "Decision History", subtitle: "Activity log, decisions, messages, reviewer movement", href: "/activity-log/", category: "Report", keywords: "activity log decision history audit trail" },
  { id: "page-messages", title: "Messages", subtitle: "Applicant, reviewer, and committee threads", href: "/messages/", category: "Message", keywords: "messages inbox thread request materials reminder" },
]

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim()
}

function scoreResult(result: KleioSearchResult, query: string) {
  const q = normalize(query)
  if (!q) return 1
  const haystack = normalize(`${result.title} ${result.subtitle} ${result.category} ${result.keywords}`)
  if (normalize(result.title) === q) return 100
  if (normalize(result.title).startsWith(q)) return 80
  if (haystack.includes(q)) return 55
  const terms = q.split(" ").filter(Boolean)
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 12 : 0), 0)
}

export function getGlobalSearchResults(query: string, limit = 9): KleioSearchResult[] {
  const applicantResults: KleioSearchResult[] = allSubmissions.slice(0, 18).map((submission) => ({
    id: `submission-${submission.id}`,
    title: submission.artist,
    subtitle: `${submission.projectTitle} · ${submission.status} · ${submission.program}`,
    href: "/review-queue/",
    category: "Applicant",
    keywords: `${submission.artist} ${submission.projectTitle} ${submission.program} ${submission.status} ${submission.priority} ${submission.location} ${submission.medium} ${submission.discipline} ${submission.missingMaterials?.join(" ") ?? ""}`,
  }))

  const artistResults: KleioSearchResult[] = artists.slice(0, 8).map((artist) => ({
    id: `artist-${artist.id}`,
    title: artist.name,
    subtitle: `${artist.discipline} · ${artist.medium} · ${artist.location}`,
    href: `/artists/${artist.id}/`,
    category: "Artist",
    keywords: `${artist.name} ${artist.location} ${artist.discipline} ${artist.medium} ${artist.tags.join(" ")}`,
  }))

  const programResults: KleioSearchResult[] = programs.map((program) => ({
    id: `program-${program.id}`,
    title: program.title,
    subtitle: `${program.category} · ${program.status} · Deadline ${program.deadline}`,
    href: "/programs/",
    category: "Program",
    keywords: `${program.title} ${program.category} ${program.status} ${program.description} ${program.requiredMaterials.join(" ")} ${program.rubric.join(" ")}`,
  }))

  const reviewerResults: KleioSearchResult[] = collaborators.map((person) => ({
    id: `reviewer-${person.id}`,
    title: person.name,
    subtitle: `${person.role} · ${person.reviewsCompleted}/${person.reviewsAssigned} reviews · ${person.inviteStatus}`,
    href: "/committee/",
    category: "Reviewer",
    keywords: `${person.name} ${person.role} ${person.email} ${person.organization} ${person.inviteStatus} ${person.permissions.join(" ")}`,
  }))

  const messageResults: KleioSearchResult[] = messageThreads.map((thread) => ({
    id: `message-${thread.id}`,
    title: thread.subject,
    subtitle: `${thread.counterpart} · ${thread.channel} · ${thread.preview}`,
    href: `/messages/?thread=${thread.id}`,
    category: "Message",
    keywords: `${thread.subject} ${thread.counterpart} ${thread.channel} ${thread.preview}`,
  }))

  const allResults = [...pageResults, ...applicantResults, ...artistResults, ...programResults, ...reviewerResults, ...messageResults]
  return allResults
    .map((result) => ({ result, score: scoreResult(result, query) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
    .slice(0, limit)
    .map(({ result }) => result)
}

export function getSubmissionSearchSuggestions(query: string, limit = 6): string[] {
  const values = allSubmissions.flatMap((submission) => [submission.artist, submission.projectTitle, submission.program, submission.status, submission.medium, submission.priority])
  return uniqueMatches(values, query, limit)
}

export function getArtistSearchSuggestions(query: string, limit = 6): string[] {
  const values = artists.flatMap((artist) => [artist.name, artist.location, artist.medium, artist.discipline, ...artist.tags])
  return uniqueMatches(values, query, limit)
}

function uniqueMatches(values: string[], query: string, limit: number) {
  const q = normalize(query)
  const seen = new Set<string>()
  const matches = values
    .filter(Boolean)
    .filter((value) => {
      const normalized = normalize(value)
      return !q || normalized.includes(q)
    })
    .filter((value) => {
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  return matches.slice(0, limit)
}
