import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  loadPublishedOpenCalls,
  type OpenCallRecord,
} from "@/lib/kleio-live-data"
import {
  type ExtendedArtistPassport,
  type OpportunityDirectoryItem,
  type OpportunityEligibilityRule,
  type OpportunityRecord,
  type OpportunityRequirement,
  type OpportunitySourceRecord,
} from "@/lib/kleio-opportunity-data"
import {
  localizeOpportunity,
  type OpportunityTranslationRecord,
} from "@/lib/kleio-opportunity-localization"
import type { OpportunityDirectoryDataWithSources } from "@/lib/kleio-opportunity-presentation"

export type PersistentOpportunityFilters = {
  query?: string
  opportunityTypes?: string[]
  sourceSlugs?: string[]
  applicantTypes?: string[]
  eligibleCountry?: string
  participationFormats?: string[]
  disciplines?: string[]
  careerStages?: string[]
  deadlineFrom?: string | null
  deadlineTo?: string | null
  minimumFunding?: number | null
  fundingKnownOnly?: boolean
  structuredRequirementsOnly?: boolean
  noFeeOnly?: boolean
  externalOnly?: boolean
  limit?: number
  offset?: number
}

function relationMap<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

function selectedInterfaceLocale(): "en" | "es" {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem("kleio_locale") === "es" ? "es" : "en"
}

export async function loadPersistentOpportunityDirectory(
  filters: PersistentOpportunityFilters = {},
): Promise<OpportunityDirectoryDataWithSources> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to view your opportunity directory.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("search_opportunities_v2", {
    search_query: filters.query?.trim() || null,
    opportunity_types: filters.opportunityTypes?.length ? filters.opportunityTypes : null,
    source_slugs: filters.sourceSlugs?.length ? filters.sourceSlugs : null,
    applicant_types: filters.applicantTypes?.length ? filters.applicantTypes : null,
    eligible_country: filters.eligibleCountry?.trim() || null,
    participation_formats: filters.participationFormats?.length ? filters.participationFormats : null,
    discipline_filters: filters.disciplines?.length ? filters.disciplines : null,
    career_stage_filters: filters.careerStages?.length ? filters.careerStages : null,
    deadline_from: filters.deadlineFrom || null,
    deadline_to: filters.deadlineTo || null,
    minimum_funding: filters.minimumFunding ?? null,
    funding_known_only: Boolean(filters.fundingKnownOnly),
    structured_requirements_only: Boolean(filters.structuredRequirementsOnly),
    no_fee_only: Boolean(filters.noFeeOnly),
    external_only: Boolean(filters.externalOnly),
    limit_count: filters.limit ?? 50,
    offset_count: filters.offset ?? 0,
  })
  if (error) throw error

  const opportunities = (data ?? []) as OpportunityRecord[]
  const opportunityIds = opportunities.map((item) => item.id)
  const internalCallIds = opportunities.flatMap((item) => item.internal_call_id ? [item.internal_call_id] : [])

  const [sourceResponse, rulesResponse, requirementsResponse, translationResponse, passport, portfolioWorks, openCalls, savedResponse] = await Promise.all([
    supabase
      .from("opportunity_sources")
      .select("id, slug, name, base_domain, source_type, ingestion_method, attribution_required, active, last_successful_sync")
      .eq("active", true)
      .order("name"),
    opportunityIds.length
      ? supabase.from("opportunity_eligibility_rules").select("*").in("opportunity_id", opportunityIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    opportunityIds.length
      ? supabase.from("opportunity_requirements").select("*").in("opportunity_id", opportunityIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    opportunityIds.length
      ? supabase.from("opportunity_translations").select("*").in("opportunity_id", opportunityIds)
      : Promise.resolve({ data: [], error: null }),
    loadArtistPassport() as Promise<ExtendedArtistPassport | null>,
    loadPortfolioWorks(),
    internalCallIds.length ? loadPublishedOpenCalls() : Promise.resolve([] as OpenCallRecord[]),
    supabase
      .from("saved_opportunities")
      .select("opportunity_id")
      .eq("artist_user_id", account.user.id)
      .not("opportunity_id", "is", null),
  ])

  if (sourceResponse.error) throw sourceResponse.error
  if (rulesResponse.error) throw rulesResponse.error
  if (requirementsResponse.error) throw requirementsResponse.error
  if (translationResponse.error) throw translationResponse.error
  if (savedResponse.error) throw savedResponse.error

  const sources = (sourceResponse.data ?? []) as OpportunitySourceRecord[]
  const sourceById = relationMap(sources)
  const callById = relationMap(openCalls)
  const savedIds = new Set((savedResponse.data ?? []).map((row) => String(row.opportunity_id)))
  const rulesByOpportunity = new Map<string, OpportunityEligibilityRule[]>()
  const requirementsByOpportunity = new Map<string, OpportunityRequirement[]>()

  for (const rule of (rulesResponse.data ?? []) as OpportunityEligibilityRule[]) {
    const current = rulesByOpportunity.get(rule.opportunity_id) ?? []
    current.push(rule)
    rulesByOpportunity.set(rule.opportunity_id, current)
  }

  for (const requirement of (requirementsResponse.data ?? []) as OpportunityRequirement[]) {
    const current = requirementsByOpportunity.get(requirement.opportunity_id) ?? []
    current.push(requirement)
    requirementsByOpportunity.set(requirement.opportunity_id, current)
  }

  const directoryItems: OpportunityDirectoryItem[] = opportunities.map((opportunity) => ({
    ...opportunity,
    source: sourceById.get(opportunity.source_id) ?? null,
    rules: rulesByOpportunity.get(opportunity.id) ?? [],
    requirements: requirementsByOpportunity.get(opportunity.id) ?? [],
    internal_call: opportunity.internal_call_id ? callById.get(opportunity.internal_call_id) ?? null : null,
    saved: savedIds.has(opportunity.id),
  }))

  const locale = selectedInterfaceLocale()
  const translations = (translationResponse.data ?? []) as OpportunityTranslationRecord[]

  return {
    passport,
    portfolioWorks,
    sources,
    items: directoryItems.map((item) => localizeOpportunity(
      item as OpportunityDirectoryItem & { source_language?: string },
      locale,
      translations,
    )),
  }
}
