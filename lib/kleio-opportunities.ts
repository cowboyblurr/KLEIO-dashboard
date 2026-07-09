import type { ArtistDashboardApplicationStatus } from "@/lib/kleio-data"

export type DirectoryOpportunity = {
  id: string
  artistId: string
  title: string
  institution: string
  type: "Grant" | "Residency" | "Open Call" | "Fellowship"
  deadline: string
  amount: number | null
  fit: number
  readiness: number
  urgency: "This week" | "Due soon" | "Upcoming"
  effort: "Low" | "Medium" | "High"
  missing: string[]
  why: string
  tags: string[]
  applicationStatus?: ArtistDashboardApplicationStatus
  updated?: string
  note?: string
  deadlinePressure?: "low" | "medium" | "high"
}

export const artistOpportunityDirectory: DirectoryOpportunity[] = [
  {
    id: "lumen-arts-grant",
    artistId: "amina-el-badri",
    title: "Lumen Arts Grant",
    institution: "Lumen Residency",
    type: "Grant",
    deadline: "2026-08-14",
    amount: 25000,
    fit: 84,
    readiness: 76,
    urgency: "This week",
    effort: "Medium",
    missing: ["Budget Template"],
    why: "Strong fit for light-responsive installation work, but the budget still needs review.",
    tags: ["Grant", "Light", "Installation"],
    applicationStatus: "Draft",
    updated: "Aug 9, 2026",
    deadlinePressure: "high",
  },
  {
    id: "caribbean-futures-fund",
    artistId: "amina-el-badri",
    title: "Caribbean Futures Fund",
    institution: "Casa Rivera Arts",
    type: "Grant",
    deadline: "2026-08-20",
    amount: 18000,
    fit: 88,
    readiness: 92,
    urgency: "Due soon",
    effort: "Medium",
    missing: [],
    why: "The passport already includes strong practice language around memory, material culture, and public context.",
    tags: ["Grant", "Memory", "Community"],
    applicationStatus: "Submitted",
    updated: "Aug 8, 2026",
    deadlinePressure: "medium",
  },
  {
    id: "citywide-artist-award",
    artistId: "amina-el-badri",
    title: "Citywide Artist Award",
    institution: "KLEIO Arthouse",
    type: "Open Call",
    deadline: "2026-09-06",
    amount: 12500,
    fit: 81,
    readiness: 73,
    urgency: "Upcoming",
    effort: "High",
    missing: ["Work sample", "Support Materials"],
    why: "Relevant to public-facing installation work, but support materials need to be tightened before submission.",
    tags: ["Open Call", "Public Art", "Installation"],
    applicationStatus: "Under Review",
    updated: "Aug 7, 2026",
    deadlinePressure: "medium",
  },
  {
    id: "global-perspectives-residency",
    artistId: "amina-el-badri",
    title: "Global Perspectives Residency",
    institution: "International Studio Network",
    type: "Residency",
    deadline: "2026-08-18",
    amount: 40000,
    fit: 79,
    readiness: 86,
    urgency: "Due soon",
    effort: "High",
    missing: [],
    why: "Aligned with international residency history and spatial installation practice.",
    tags: ["Residency", "International", "Installation"],
    applicationStatus: "Interview",
    updated: "Aug 5, 2026",
    deadlinePressure: "high",
  },
  {
    id: "harbor-foundation-grant",
    artistId: "amina-el-badri",
    title: "Harbor Foundation Grant",
    institution: "Harbor Foundation",
    type: "Grant",
    deadline: "2026-08-01",
    amount: 15000,
    fit: 72,
    readiness: 80,
    urgency: "This week",
    effort: "Low",
    missing: [],
    why: "A partial fit that may require follow-up because the decision window is overdue.",
    tags: ["Grant", "Follow-up", "Decision"],
    applicationStatus: "Waiting",
    updated: "Jul 30, 2026",
    note: "Overdue",
    deadlinePressure: "low",
  },
  {
    id: "emerging-voices-prize",
    artistId: "amina-el-badri",
    title: "Emerging Voices Prize",
    institution: "Contemporary Arts Fund",
    type: "Fellowship",
    deadline: "2026-06-20",
    amount: 10000,
    fit: 90,
    readiness: 100,
    urgency: "Upcoming",
    effort: "Low",
    missing: [],
    why: "Completed application with strong alignment to emerging contemporary practice.",
    tags: ["Fellowship", "Awarded", "Contemporary"],
    applicationStatus: "Awarded",
    updated: "Jun 20, 2026",
    deadlinePressure: "low",
  },
  {
    id: "material-practice-grant",
    artistId: "amina-el-badri",
    title: "Material Practice Grant",
    institution: "Contemporary Arts Fund",
    type: "Grant",
    deadline: "2026-09-02",
    amount: 5000,
    fit: 87,
    readiness: 92,
    urgency: "Upcoming",
    effort: "Low",
    missing: [],
    why: "Portfolio and statement already cover material experimentation and process language.",
    tags: ["Grant", "Materials", "Process"],
  },
]

export const artistApplicationRows = artistOpportunityDirectory
  .filter((opportunity) => opportunity.applicationStatus)
  .map((opportunity) => ({
    program: opportunity.title,
    status: opportunity.applicationStatus as ArtistDashboardApplicationStatus,
    dueDate: opportunity.deadline,
    updated: opportunity.updated ?? "—",
    note: opportunity.note,
    fundingAmount: opportunity.amount ?? undefined,
    fitScore: opportunity.fit,
    missingMaterialCount: opportunity.missing.length,
    deadlinePressure: opportunity.deadlinePressure,
  }))

export function getArtistOpportunityFundingTotal(opportunities = artistOpportunityDirectory) {
  return opportunities.reduce((sum, opportunity) => sum + (opportunity.amount ?? 0), 0)
}

export function getReadyOpportunityCount(opportunities = artistOpportunityDirectory) {
  return opportunities.filter((opportunity) => opportunity.missing.length === 0).length
}

export function getDueSoonOpportunityCount(opportunities = artistOpportunityDirectory) {
  return opportunities.filter((opportunity) => opportunity.urgency !== "Upcoming").length
}
