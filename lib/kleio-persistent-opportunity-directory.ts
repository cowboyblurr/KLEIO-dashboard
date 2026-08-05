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

export type PersistentOpportunityDirectoryData = OpportunityDirectoryDataWithSources & {
  total: number
}

export type OpportunityReportReason =
  | "deadline_incorrect"
  | "closed"
  | "broken_link"
  | "funding_inaccurate"
  | "eligibility_inaccurate"
  | "possible_scam"
  | "rights_concern"
  | "unexpected_fee"
  | "match_incorrect"
  | "duplicate"
  | "other"

function relationMap<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

function selectedInterfaceLocale(): "en" | "es" {
  if (typeof window === "undefined") return "en"
  return window.localStorage.getItem("kleio_locale") === "es" ? "es" : "en"
}

function opportunityRpcArgs(filters: PersistentOpportunityFilters) {
  return {
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
  }
}

export async function loadPersistentOpportunityDirectory(
  filters: PersistentOpportunityFilters = {},
): Promise<PersistentOpportunityDirectoryData> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to view your opportunity directory.")

  const supabase = getSupabaseBrowserClient()
  const baseArgs = opportunityRpcArgs(filters)
  const [pageResponse, totalResponse] = await Promise.all([
    supabase.rpc("search_my_opportunities_v3", {
      ...baseArgs,
      limit_count: filters.limit ?? 24,
      offset_count: filters.offset ?? 0,
    }),
    supabase.rpc("count_my_opportunities_v3", baseArgs),
  ])

  if (pageResponse.error) throw pageResponse.error
  if (totalResponse.error) throw totalResponse.error

  const opportunities = (pageResponse.data ?? []) as OpportunityRecord[]
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
    total: Number(totalResponse.data ?? 0),
    items: directoryItems.map((item) => localizeOpportunity(
      item as OpportunityDirectoryItem & { source_language?: string },
      locale,
      translations,
    )),
  }
}

export async function setOpportunityHidden(opportunityId: string, hidden: boolean) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to manage opportunity recommendations.")
  const supabase = getSupabaseBrowserClient()

  if (hidden) {
    const { error } = await supabase.from("artist_hidden_opportunities").upsert({
      artist_user_id: account.user.id,
      opportunity_id: opportunityId,
    }, { onConflict: "artist_user_id,opportunity_id" })
    if (error) throw error
    return
  }

  const { error } = await supabase
    .from("artist_hidden_opportunities")
    .delete()
    .eq("artist_user_id", account.user.id)
    .eq("opportunity_id", opportunityId)
  if (error) throw error
}

export async function reportOpportunityIssue(
  opportunityId: string,
  reason: OpportunityReportReason,
  notes: string,
) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to report an opportunity issue.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("opportunity_reports").insert({
    artist_user_id: account.user.id,
    opportunity_id: opportunityId,
    reason,
    notes: notes.trim(),
  })
  if (error) {
    if (error.code === "23505") throw new Error("You already reported this issue. KLEIO has kept it in the review queue.")
    throw error
  }
}
