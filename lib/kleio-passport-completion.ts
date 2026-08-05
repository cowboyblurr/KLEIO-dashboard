export type PassportCompletionProfile = {
  professional_name?: string | null
  location?: string | null
  bio?: string | null
  artist_statement?: string | null
  practice_description?: string | null
  website_url?: string | null
  instagram_url?: string | null
  disciplines?: string[] | null
  mediums?: string[] | null
  education?: string | null
  exhibition_history?: string | null
  awards?: string | null
  cv_file_path?: string | null
}

export type PassportCompletionWork = {
  title?: string | null
  year?: string | null
  medium?: string | null
  dimensions?: string | null
  description?: string | null
  image_path?: string | null
}

export type PassportCompletionCategory = {
  key: string
  label: string
  tier: "critical" | "important" | "optional"
  weight: number
  earned: number
  complete: boolean
  explanation: string
  actionHref: string
}

export type PassportCompletionResult = {
  percentage: number
  rawPercentage: number
  criticalComplete: boolean
  completedCategories: PassportCompletionCategory[]
  criticalMissing: PassportCompletionCategory[]
  importantMissing: PassportCompletionCategory[]
  optionalImprovements: PassportCompletionCategory[]
  categories: PassportCompletionCategory[]
}

function present(value: string | null | undefined) {
  return Boolean(value?.trim())
}

function fraction(...conditions: boolean[]) {
  if (!conditions.length) return 0
  return conditions.filter(Boolean).length / conditions.length
}

function category(input: Omit<PassportCompletionCategory, "earned" | "complete"> & { score: number }): PassportCompletionCategory {
  const score = Math.max(0, Math.min(1, input.score))
  return {
    key: input.key,
    label: input.label,
    tier: input.tier,
    weight: input.weight,
    earned: Math.round(input.weight * score * 100) / 100,
    complete: score >= 1,
    explanation: input.explanation,
    actionHref: input.actionHref,
  }
}

export function calculatePassportCompletion(
  profile: PassportCompletionProfile | null,
  works: PassportCompletionWork[] = [],
): PassportCompletionResult {
  const record = profile ?? {}
  const completeWorks = works.filter((work) => present(work.title))
  const worksWithImages = completeWorks.filter((work) => present(work.image_path))
  const metadataComplete = completeWorks.filter((work) =>
    [work.title, work.year, work.medium, work.dimensions].every(present),
  )
  const contactAvailable = present(record.website_url) || present(record.instagram_url) || present(record.location)
  const narrativeAvailable = present(record.bio) || present(record.artist_statement)

  const categories = [
    category({
      key: "identity",
      label: "Identity and contact",
      tier: "critical",
      weight: 12,
      score: fraction(present(record.professional_name), contactAvailable),
      explanation: "Add a professional name and at least one usable location or public contact route.",
      actionHref: "/artist-dashboard/passport/#identity",
    }),
    category({
      key: "discipline",
      label: "Creative discipline",
      tier: "critical",
      weight: 8,
      score: (record.disciplines?.length ?? 0) > 0 ? 1 : 0,
      explanation: "Choose at least one broad creative discipline.",
      actionHref: "/artist-dashboard/passport/#practice",
    }),
    category({
      key: "narrative",
      label: "Biography or artist statement",
      tier: "critical",
      weight: 12,
      score: narrativeAvailable ? 1 : 0,
      explanation: "Add an approved biography or artist statement.",
      actionHref: "/artist-dashboard/passport/#narrative",
    }),
    category({
      key: "cv",
      label: "CV or professional history",
      tier: "critical",
      weight: 14,
      score: present(record.cv_file_path) || present(record.exhibition_history) || present(record.education) ? 1 : 0,
      explanation: "Upload a CV or add meaningful education or exhibition history.",
      actionHref: "/artist-dashboard/passport/#documents",
    }),
    category({
      key: "portfolio",
      label: "Portfolio work",
      tier: "critical",
      weight: 14,
      score: completeWorks.length > 0 ? 1 : 0,
      explanation: "Create at least one artwork record.",
      actionHref: "/artist-dashboard/portfolio/",
    }),
    category({
      key: "artwork_images",
      label: "Usable artwork image",
      tier: "critical",
      weight: 14,
      score: worksWithImages.length > 0 ? 1 : 0,
      explanation: "Attach at least one usable image to an artwork record.",
      actionHref: "/artist-dashboard/portfolio/",
    }),
    category({
      key: "artwork_metadata",
      label: "Artwork metadata",
      tier: "important",
      weight: 10,
      score: completeWorks.length ? Math.min(1, metadataComplete.length / completeWorks.length) : 0,
      explanation: "Complete title, year, medium or materials, and dimensions for portfolio works.",
      actionHref: "/artist-dashboard/portfolio/",
    }),
    category({
      key: "mediums",
      label: "Mediums, materials and methods",
      tier: "important",
      weight: 6,
      score: (record.mediums?.length ?? 0) > 0 ? 1 : 0,
      explanation: "Describe what you work with or how you make the work.",
      actionHref: "/artist-dashboard/passport/#practice",
    }),
    category({
      key: "practice_context",
      label: "Practice context",
      tier: "important",
      weight: 5,
      score: fraction(present(record.practice_description), present(record.exhibition_history)),
      explanation: "Add practice context and selected professional history.",
      actionHref: "/artist-dashboard/passport/#narrative",
    }),
    category({
      key: "supporting_links",
      label: "Supporting links",
      tier: "optional",
      weight: 5,
      score: fraction(present(record.website_url), present(record.instagram_url)),
      explanation: "Add public links that help reviewers understand your practice.",
      actionHref: "/artist-dashboard/passport/#identity",
    }),
  ]

  const totalWeight = categories.reduce((sum, item) => sum + item.weight, 0)
  const rawPercentage = Math.round((categories.reduce((sum, item) => sum + item.earned, 0) / totalWeight) * 100)
  const criticalMissing = categories.filter((item) => item.tier === "critical" && !item.complete)
  const criticalComplete = criticalMissing.length === 0
  const percentage = criticalComplete ? rawPercentage : Math.min(rawPercentage, 99)

  return {
    percentage,
    rawPercentage,
    criticalComplete,
    completedCategories: categories.filter((item) => item.complete),
    criticalMissing,
    importantMissing: categories.filter((item) => item.tier === "important" && !item.complete),
    optionalImprovements: categories.filter((item) => item.tier === "optional" && !item.complete),
    categories,
  }
}
