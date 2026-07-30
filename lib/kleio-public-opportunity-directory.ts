import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import type { PersistentOpportunityFilters } from "@/lib/kleio-persistent-opportunity-directory"
import {
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

function relationMap<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

function selectedInterfaceLocale(): "en" | "es" {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem("kleio_locale") === "es" ? "es" : "en"
}

export async function loadPublicOpportunityDirectory(
  filters: PersistentOpportunityFilters = {},
): Promise<OpportunityDirectoryDataWithSources> {
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

  const [sourceResponse, rulesResponse, requirementsResponse, translationResponse] = await Promise.all([
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
  ])

  if (sourceResponse.error) throw sourceResponse.error
  if (rulesResponse.error) throw rulesResponse.error
  if (requirementsResponse.error) throw requirementsResponse.error
  if (translationResponse.error) throw translationResponse.error

  const sources = (sourceResponse.data ?? []) as OpportunitySourceRecord[]
  const sourceById = relationMap(sources)
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
    internal_call: null,
    saved: false,
  }))

  const locale = selectedInterfaceLocale()
  const translations = (translationResponse.data ?? []) as OpportunityTranslationRecord[]

  return {
    passport: null,
    portfolioWorks: [],
    sources,
    items: directoryItems.map((item) => localizeOpportunity(
      item as OpportunityDirectoryItem & { source_language?: string },
      locale,
      translations,
    )),
  }
}
