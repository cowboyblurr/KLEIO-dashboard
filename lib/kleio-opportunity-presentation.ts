import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  loadOpportunityDirectory,
  type ExtendedArtistPassport,
  type OpportunityDirectoryData,
  type OpportunityDirectoryFilters,
  type OpportunityDirectoryItem,
  type OpportunitySourceRecord,
} from "@/lib/kleio-opportunity-data"
import {
  localizeOpportunity,
  type LocalizedOpportunityItem,
  type OpportunityTranslationRecord,
} from "@/lib/kleio-opportunity-localization"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"

export type OpportunityDirectoryDataWithSources = Omit<OpportunityDirectoryData, "items"> & {
  items: LocalizedOpportunityItem[]
  sources: OpportunitySourceRecord[]
}

export type RequirementReadinessStatus = "complete" | "missing" | "needs_review" | "limit_error" | "unverified" | "optional"

export type RequirementReadinessResult = {
  id: string
  key: string
  label: string
  required: boolean
  status: RequirementReadinessStatus
  explanation: string
  sourceText: string
  sourceUrl: string
  currentCount: number | null
  minimumCount: number | null
  maximumCount: number | null
}

export type OpportunityMaterialReadiness = {
  readyCount: number
  assessableCount: number
  totalCount: number
  requiredCount: number
  score: number | null
  blockingCount: number
  ready: string[]
  missing: string[]
  manualReview: string[]
  limitErrors: string[]
  unknown: boolean
  requirements: RequirementReadinessResult[]
}

type EnrichedRequirement = OpportunityDirectoryItem["requirements"][number] & {
  category?: string
  description?: string
  passport_field?: string
  input_type?: string
  minimum_word_count?: number | null
  maximum_word_count?: number | null
  minimum_item_count?: number | null
  maximum_item_count?: number | null
  accepted_file_types?: string[]
  maximum_file_size_bytes?: number | null
  maximum_total_size_bytes?: number | null
  requires_artist_confirmation?: boolean
  legal_declaration?: boolean
  payment_required?: boolean
  human_verification_required?: boolean
  confidence_score?: number | null
}

function selectedInterfaceLocale(): "en" | "es" {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem("kleio_locale") === "es" ? "es" : "en"
}

export async function loadOpportunityDirectoryWithSources(
  filters: OpportunityDirectoryFilters = {},
): Promise<OpportunityDirectoryDataWithSources> {
  const supabase = getSupabaseBrowserClient()
  const directory = await loadOpportunityDirectory(filters)
  const opportunityIds = directory.items.map((item) => item.id)
  const [sourceResponse, translationResponse] = await Promise.all([
    supabase
      .from("opportunity_sources")
      .select("id, slug, name, base_domain, source_type, ingestion_method, attribution_required, active, last_successful_sync")
      .eq("active", true)
      .order("name"),
    opportunityIds.length
      ? supabase.from("opportunity_translations").select("*").in("opportunity_id", opportunityIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (sourceResponse.error) throw sourceResponse.error
  if (translationResponse.error) throw translationResponse.error

  const locale = selectedInterfaceLocale()
  const translations = (translationResponse.data ?? []) as OpportunityTranslationRecord[]

  return {
    ...directory,
    items: directory.items.map((item) => localizeOpportunity(item as OpportunityDirectoryItem & { source_language?: string }, locale, translations)),
    sources: (sourceResponse.data ?? []) as OpportunitySourceRecord[],
  }
}

function cleanToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function wordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

function requirementText(requirement: EnrichedRequirement, passport: ExtendedArtistPassport | null) {
  if (!passport) return null
  const key = cleanToken(requirement.passport_field || requirement.material_key)
  switch (key) {
    case "biography":
    case "bio": return passport.bio
    case "artist_statement": return passport.artist_statement
    case "practice_description": return passport.practice_description
    case "education": return passport.education
    case "exhibition_history": return passport.exhibition_history
    case "awards": return passport.awards
    case "website":
    case "website_url": return passport.website_url
    case "instagram":
    case "instagram_url": return passport.instagram_url
    case "location": return passport.location
    case "professional_name":
    case "artist_name": return passport.professional_name
    default: return null
  }
}

function assessRequirement(
  rawRequirement: OpportunityDirectoryItem["requirements"][number],
  passport: ExtendedArtistPassport | null,
  portfolioWorks: PortfolioWorkRecord[],
): RequirementReadinessResult {
  const requirement = rawRequirement as EnrichedRequirement
  const normalized = cleanToken(requirement.passport_field || requirement.material_key)
  const base = {
    id: requirement.id,
    key: normalized,
    label: requirement.label,
    required: requirement.required,
    sourceText: requirement.source_text,
    sourceUrl: requirement.source_url,
    currentCount: null as number | null,
    minimumCount: requirement.minimum_item_count ?? requirement.minimum_word_count ?? null,
    maximumCount: requirement.maximum_item_count ?? requirement.maximum_word_count ?? null,
  }

  if (!requirement.required) return { ...base, status: "optional", explanation: "This source requirement is optional." }
  if (requirement.verification_status !== "confirmed") return { ...base, status: "unverified", explanation: "The source requirement needs verification before KLEIO can treat it as complete." }
  if (requirement.legal_declaration || requirement.requires_artist_confirmation || requirement.payment_required || requirement.human_verification_required) return { ...base, status: "needs_review", explanation: "The artist must personally review or confirm this requirement." }

  if (["portfolio", "work_samples", "artwork_images", "images", "image_list"].includes(normalized)) {
    const completeWorks = portfolioWorks.filter((work) => Boolean(work.title.trim() && work.image_path))
    const currentCount = completeWorks.length
    const minimum = requirement.minimum_item_count ?? 1
    const maximum = requirement.maximum_item_count ?? null
    if (currentCount < minimum) return { ...base, currentCount, minimumCount: minimum, maximumCount: maximum, status: "missing", explanation: `${minimum} completed portfolio work${minimum === 1 ? " is" : "s are"} required; ${currentCount} currently available.` }
    if (maximum !== null && currentCount > maximum) return { ...base, currentCount, minimumCount: minimum, maximumCount: maximum, status: "needs_review", explanation: `${currentCount} works are available; select no more than ${maximum} for this application.` }
    if ((requirement.accepted_file_types?.length ?? 0) > 0 || requirement.maximum_file_size_bytes || requirement.maximum_total_size_bytes) return { ...base, currentCount, minimumCount: minimum, maximumCount: maximum, status: "needs_review", explanation: "Enough works are available, but file format and size limits require final validation." }
    return { ...base, currentCount, minimumCount: minimum, maximumCount: maximum, status: "complete", explanation: `${currentCount} completed portfolio work${currentCount === 1 ? " is" : "s are"} available.` }
  }

  if (normalized === "cv" || normalized === "resume" || normalized === "résumé") {
    return passport?.cv_file_path
      ? { ...base, status: "complete", explanation: "A current CV is stored in the Creative Passport." }
      : { ...base, status: "missing", explanation: "No CV is stored in the Creative Passport." }
  }

  if (normalized === "contact_information") {
    const complete = Boolean(passport?.professional_name.trim() && passport.website_url.trim())
    return complete
      ? { ...base, status: "complete", explanation: "Professional name and website are available." }
      : { ...base, status: "missing", explanation: "Professional name or website information is missing." }
  }

  const text = requirementText(requirement, passport)
  if (text !== null) {
    const count = wordCount(text)
    const minimum = requirement.minimum_word_count ?? null
    const maximum = requirement.maximum_word_count ?? null
    if (!text.trim()) return { ...base, currentCount: count, minimumCount: minimum, maximumCount: maximum, status: "missing", explanation: "No approved Creative Passport content is available for this requirement." }
    if (minimum !== null && count < minimum) return { ...base, currentCount: count, minimumCount: minimum, maximumCount: maximum, status: "limit_error", explanation: `${count} words available; the source requires at least ${minimum}.` }
    if (maximum !== null && count > maximum) return { ...base, currentCount: count, minimumCount: minimum, maximumCount: maximum, status: "limit_error", explanation: `${count} words available; the source allows no more than ${maximum}.` }
    return { ...base, currentCount: count, minimumCount: minimum, maximumCount: maximum, status: "complete", explanation: maximum ? `${count} of ${maximum} allowed words are ready.` : "Approved Creative Passport content is available." }
  }

  if (["project_proposal", "budget", "timeline", "work_plan", "references", "recommendation_letters", "application_question", "signature", "proof_of_residency", "proof_of_identity", "tax_information"].includes(normalized)) return { ...base, status: "needs_review", explanation: "This application-specific requirement must be completed or confirmed by the artist." }

  return { ...base, status: "needs_review", explanation: "KLEIO cannot safely confirm this requirement from the current Creative Passport fields." }
}

export function assessOpportunityMaterialReadiness(
  item: OpportunityDirectoryItem,
  passport: ExtendedArtistPassport | null,
  portfolioWorks: PortfolioWorkRecord[],
): OpportunityMaterialReadiness {
  const sourceRequirements = item.requirements.length
    ? item.requirements
    : item.required_materials.map((label, index) => ({
        id: `fallback-${index}`,
        opportunity_id: item.id,
        material_key: cleanToken(label),
        label,
        required: true,
        source_text: label,
        source_url: item.canonical_url,
        extraction_method: "source_material_list",
        verification_status: "confirmed" as const,
        last_verified_at: item.last_verified_at,
        sort_order: index,
      }))

  const requirements = sourceRequirements.map((requirement) => assessRequirement(requirement, passport, portfolioWorks))
  const required = requirements.filter((requirement) => requirement.required)
  const ready = required.filter((requirement) => requirement.status === "complete").map((requirement) => requirement.label)
  const missing = required.filter((requirement) => requirement.status === "missing").map((requirement) => requirement.label)
  const limitErrors = required.filter((requirement) => requirement.status === "limit_error").map((requirement) => requirement.label)
  const manualReview = required.filter((requirement) => ["needs_review", "unverified"].includes(requirement.status)).map((requirement) => requirement.label)
  const assessableCount = required.filter((requirement) => ["complete", "missing", "limit_error"].includes(requirement.status)).length
  const blockingCount = required.filter((requirement) => ["missing", "limit_error", "unverified"].includes(requirement.status)).length

  return {
    readyCount: ready.length,
    assessableCount,
    totalCount: requirements.length,
    requiredCount: required.length,
    score: required.length ? Math.round((ready.length / required.length) * 100) : null,
    blockingCount,
    ready,
    missing,
    manualReview,
    limitErrors,
    unknown: requirements.length === 0,
    requirements,
  }
}

export function safeOpportunityUrl(value: string | null | undefined) {
  if (!value) return ""
  try {
    const parsed = new URL(value)
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : ""
  } catch {
    return ""
  }
}
