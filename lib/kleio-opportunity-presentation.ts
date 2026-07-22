import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  loadOpportunityDirectory,
  type ExtendedArtistPassport,
  type OpportunityDirectoryData,
  type OpportunityDirectoryFilters,
  type OpportunityDirectoryItem,
  type OpportunitySourceRecord,
} from "@/lib/kleio-opportunity-data"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"

export type OpportunityDirectoryDataWithSources = OpportunityDirectoryData & {
  sources: OpportunitySourceRecord[]
}

export type OpportunityMaterialReadiness = {
  readyCount: number
  assessableCount: number
  totalCount: number
  ready: string[]
  missing: string[]
  manualReview: string[]
  unknown: boolean
}

export async function loadOpportunityDirectoryWithSources(
  filters: OpportunityDirectoryFilters = {},
): Promise<OpportunityDirectoryDataWithSources> {
  const supabase = getSupabaseBrowserClient()
  const [directory, sourceResponse] = await Promise.all([
    loadOpportunityDirectory(filters),
    supabase
      .from("opportunity_sources")
      .select("id, slug, name, base_domain, source_type, ingestion_method, attribution_required, active, last_successful_sync")
      .eq("active", true)
      .order("name"),
  ])

  if (sourceResponse.error) throw sourceResponse.error

  return {
    ...directory,
    sources: (sourceResponse.data ?? []) as OpportunitySourceRecord[],
  }
}

function cleanToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function assessableMaterial(
  key: string,
  passport: ExtendedArtistPassport | null,
  portfolioWorks: PortfolioWorkRecord[],
): boolean | null {
  const normalized = cleanToken(key)
  if (!passport) {
    return ["biography", "artist_statement", "cv", "portfolio", "work_samples", "contact_information"].includes(normalized)
      ? false
      : null
  }

  switch (normalized) {
    case "biography":
      return passport.bio.trim().length >= 40
    case "artist_statement":
      return passport.artist_statement.trim().length >= 80
    case "cv":
      return Boolean(passport.cv_file_path)
    case "portfolio":
    case "work_samples":
      return portfolioWorks.some((work) => Boolean(work.title.trim() && work.image_path))
    case "contact_information":
      return Boolean(passport.professional_name.trim() && passport.website_url.trim())
    default:
      return null
  }
}

export function assessOpportunityMaterialReadiness(
  item: OpportunityDirectoryItem,
  passport: ExtendedArtistPassport | null,
  portfolioWorks: PortfolioWorkRecord[],
): OpportunityMaterialReadiness {
  const structured = item.requirements.filter((requirement) => requirement.required)
  const requirements = structured.length
    ? structured.map((requirement) => ({
        key: requirement.material_key,
        label: requirement.label,
        confirmed: requirement.verification_status === "confirmed",
      }))
    : item.required_materials.map((label) => ({
        key: cleanToken(label),
        label,
        confirmed: true,
      }))

  const ready: string[] = []
  const missing: string[] = []
  const manualReview: string[] = []

  for (const requirement of requirements) {
    if (!requirement.confirmed) {
      manualReview.push(requirement.label)
      continue
    }

    const result = assessableMaterial(requirement.key, passport, portfolioWorks)
    if (result === true) ready.push(requirement.label)
    else if (result === false) missing.push(requirement.label)
    else manualReview.push(requirement.label)
  }

  return {
    readyCount: ready.length,
    assessableCount: ready.length + missing.length,
    totalCount: requirements.length,
    ready,
    missing,
    manualReview,
    unknown: requirements.length === 0,
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
