import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  loadPublishedOpenCalls,
  type ArtistPassportRecord,
  type OpenCallRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"

export type OpportunitySourceRecord = {
  id: string
  slug: string
  name: string
  base_domain: string
  source_type: string
  ingestion_method: string
  attribution_required: boolean
  active: boolean
  last_successful_sync: string | null
}

export type OpportunityEligibilityRule = {
  id: string
  opportunity_id: string
  rule_type: string
  operator: string
  value: unknown
  requirement_level: "required" | "preferred" | "informational"
  source_text: string
  source_url: string
  source_field: string
  extraction_method: string
  verification_status: "confirmed" | "ambiguous"
  last_verified_at: string | null
  sort_order: number
}

export type OpportunityRequirement = {
  id: string
  opportunity_id: string
  material_key: string
  label: string
  required: boolean
  source_text: string
  source_url: string
  extraction_method: string
  verification_status: "confirmed" | "ambiguous"
  last_verified_at: string | null
  sort_order: number
}

export type OpportunityRecord = {
  id: string
  source_id: string
  external_id: string
  internal_call_id: string | null
  canonical_url: string
  application_url: string
  guidelines_url: string
  title: string
  provider_name: string
  provider_id: string
  opportunity_type: string
  summary: string
  description: string
  disciplines: string[]
  eligible_applicant_types: string[]
  eligible_countries: string[]
  eligible_regions: string[]
  citizenship_requirements: string[]
  residency_requirements: string[]
  career_stages: string[]
  age_min: number | null
  age_max: number | null
  award_min: number | null
  award_max: number | null
  currency: string | null
  application_fee: number | null
  deadline_at: string | null
  deadline_timezone: string
  opens_at: string | null
  recurring: boolean
  remote_allowed: boolean | null
  travel_supported: boolean | null
  accommodation_supported: boolean | null
  fiscal_sponsor_allowed: boolean | null
  language_requirements: string[]
  education_requirements: string[]
  organization_status_requirements: string[]
  previous_award_restrictions: string
  required_materials: string[]
  participation_format: string
  locations: string[]
  application_mode: "internal" | "external"
  status: "open" | "forecasted" | "upcoming"
  verification_status: string
  source_published_at: string | null
  source_updated_at: string | null
  last_verified_at: string | null
}

export type OpportunityDirectoryItem = OpportunityRecord & {
  source: OpportunitySourceRecord | null
  rules: OpportunityEligibilityRule[]
  requirements: OpportunityRequirement[]
  internal_call: OpenCallRecord | null
  saved: boolean
}

export type ExtendedArtistPassport = ArtistPassportRecord & {
  country_of_residence?: string | null
  citizenships?: string[]
  state_or_region?: string | null
  birth_date?: string | null
  artist_type?: string | null
  career_stage?: string | null
  organization_status?: string | null
  fiscal_sponsor_status?: string | null
  location_data?: Record<string, unknown>
}

export type RuleResult = {
  rule_id: string
  label: string
  status: "passed" | "failed" | "unknown" | "not_applicable"
  explanation: string
}

export type OpportunityEvaluation = {
  eligibility: "eligible" | "likely_eligible" | "eligibility_unclear" | "missing_information" | "not_eligible"
  relevance: "strong_relevance" | "moderate_relevance" | "limited_relevance" | "insufficient_information"
  ruleResults: RuleResult[]
  readiness: {
    readyCount: number
    totalCount: number
    ready: string[]
    missing: string[]
    unknown: boolean
  }
}

export type OpportunityDirectoryFilters = {
  query?: string
  opportunityTypes?: string[]
  sourceSlugs?: string[]
  applicantTypes?: string[]
  eligibleCountry?: string
  participationFormats?: string[]
  noFeeOnly?: boolean
  externalOnly?: boolean
  limit?: number
  offset?: number
}

export type OpportunityDirectoryData = {
  items: OpportunityDirectoryItem[]
  passport: ExtendedArtistPassport | null
  portfolioWorks: PortfolioWorkRecord[]
}

export type OpportunityConversationSummary = {
  conversation_id: string
  opportunity_id: string
  opportunity_title: string
  institution_id: string
  institution_name: string
  artist_user_id: string
  artist_name: string
  last_message_body: string | null
  last_message_sender_role: "artist" | "institution" | null
  last_message_at: string | null
  unread_count: number
}

export type OpportunityMessageRecord = {
  id: string
  conversation_id: string
  sender_user_id: string
  sender_role: "artist" | "institution"
  body: string
  client_nonce: string
  created_at: string
}

function relationMap<T extends { id: string }>(rows: T[] | null | undefined) {
  return new Map((rows ?? []).map((row) => [row.id, row]))
}

export async function loadOpportunityDirectory(filters: OpportunityDirectoryFilters = {}): Promise<OpportunityDirectoryData> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to view your opportunity directory.")

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("search_opportunities", {
    search_query: filters.query?.trim() || null,
    opportunity_types: filters.opportunityTypes?.length ? filters.opportunityTypes : null,
    source_slugs: filters.sourceSlugs?.length ? filters.sourceSlugs : null,
    applicant_types: filters.applicantTypes?.length ? filters.applicantTypes : null,
    eligible_country: filters.eligibleCountry?.trim() || null,
    participation_formats: filters.participationFormats?.length ? filters.participationFormats : null,
    no_fee_only: Boolean(filters.noFeeOnly),
    external_only: Boolean(filters.externalOnly),
    limit_count: filters.limit ?? 50,
    offset_count: filters.offset ?? 0,
  })
  if (error) throw error

  const opportunities = (data ?? []) as OpportunityRecord[]
  const opportunityIds = opportunities.map((item) => item.id)
  const internalCallIds = opportunities.flatMap((item) => item.internal_call_id ? [item.internal_call_id] : [])

  const [sourceResponse, rulesResponse, requirementsResponse, passport, portfolioWorks, openCalls, savedResponse] = await Promise.all([
    supabase.from("opportunity_sources").select("id, slug, name, base_domain, source_type, ingestion_method, attribution_required, active, last_successful_sync"),
    opportunityIds.length
      ? supabase.from("opportunity_eligibility_rules").select("*").in("opportunity_id", opportunityIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    opportunityIds.length
      ? supabase.from("opportunity_requirements").select("*").in("opportunity_id", opportunityIds).order("sort_order")
      : Promise.resolve({ data: [], error: null }),
    loadArtistPassport() as Promise<ExtendedArtistPassport | null>,
    loadPortfolioWorks(),
    internalCallIds.length ? loadPublishedOpenCalls() : Promise.resolve([]),
    supabase.from("saved_opportunities").select("opportunity_id").eq("artist_user_id", account.user.id).not("opportunity_id", "is", null),
  ])

  if (sourceResponse.error) throw sourceResponse.error
  if (rulesResponse.error) throw rulesResponse.error
  if (requirementsResponse.error) throw requirementsResponse.error
  if (savedResponse.error) throw savedResponse.error

  const sourceById = relationMap((sourceResponse.data ?? []) as OpportunitySourceRecord[])
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

  return {
    passport,
    portfolioWorks,
    items: opportunities.map((opportunity) => ({
      ...opportunity,
      source: sourceById.get(opportunity.source_id) ?? null,
      rules: rulesByOpportunity.get(opportunity.id) ?? [],
      requirements: requirementsByOpportunity.get(opportunity.id) ?? [],
      internal_call: opportunity.internal_call_id ? callById.get(opportunity.internal_call_id) ?? null : null,
      saved: savedIds.has(opportunity.id),
    })),
  }
}

function cleanToken(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")
}

function valueList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => cleanToken(String(item))).filter(Boolean)
  if (value === null || value === undefined) return []
  return [cleanToken(String(value))].filter(Boolean)
}

function artistRuleValues(ruleType: string, passport: ExtendedArtistPassport | null): string[] | number | boolean | null {
  if (!passport) return null
  switch (ruleType) {
    case "applicant_type": return [cleanToken(passport.artist_type || "individual_artist")]
    case "country_of_residence": return passport.country_of_residence ? [cleanToken(passport.country_of_residence)] : null
    case "citizenship": return passport.citizenships?.length ? passport.citizenships.map(cleanToken) : null
    case "region": return passport.state_or_region ? [cleanToken(passport.state_or_region)] : null
    case "discipline": return passport.disciplines.length ? passport.disciplines.map(cleanToken) : null
    case "career_stage": return passport.career_stage ? [cleanToken(passport.career_stage)] : null
    case "organization_status": return passport.organization_status ? [cleanToken(passport.organization_status)] : null
    case "language": return passport.languages.length ? passport.languages.map(cleanToken) : null
    case "fiscal_sponsor": return passport.fiscal_sponsor_status ? [cleanToken(passport.fiscal_sponsor_status)] : null
    case "age": {
      if (!passport.birth_date) return null
      const born = new Date(passport.birth_date)
      if (Number.isNaN(born.getTime())) return null
      const today = new Date()
      let age = today.getUTCFullYear() - born.getUTCFullYear()
      const beforeBirthday = today.getUTCMonth() < born.getUTCMonth() || (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() < born.getUTCDate())
      if (beforeBirthday) age -= 1
      return age
    }
    default: return null
  }
}

function evaluateRule(rule: OpportunityEligibilityRule, passport: ExtendedArtistPassport | null): RuleResult {
  const artistValue = artistRuleValues(rule.rule_type, passport)
  const expected = valueList(rule.value)
  const label = rule.source_text || rule.rule_type.replaceAll("_", " ")
  if (rule.verification_status === "ambiguous") {
    return { rule_id: rule.id, label, status: "unknown", explanation: "The official requirement is ambiguous and needs confirmation." }
  }
  if (artistValue === null || (Array.isArray(artistValue) && !artistValue.length)) {
    return { rule_id: rule.id, label, status: "unknown", explanation: `Creative Passport information for ${rule.rule_type.replaceAll("_", " ")} is missing.` }
  }

  let passed = false
  if (typeof artistValue === "number") {
    const target = Number(Array.isArray(rule.value) ? rule.value[0] : rule.value)
    passed = rule.operator === "greater_than_or_equal" ? artistValue >= target : rule.operator === "less_than_or_equal" ? artistValue <= target : artistValue === target
  } else if (typeof artistValue === "boolean") {
    passed = rule.operator === "is_true" ? artistValue : rule.operator === "is_false" ? !artistValue : false
  } else {
    const actual = artistValue.map(cleanToken)
    const overlap = actual.some((item) => expected.includes(item))
    if (["in", "overlaps", "contains", "equals"].includes(rule.operator)) passed = overlap
    else if (["not_in", "not_equals"].includes(rule.operator)) passed = !overlap
  }

  return {
    rule_id: rule.id,
    label,
    status: passed ? "passed" : "failed",
    explanation: passed ? "Confirmed by the current Creative Passport." : "The current Creative Passport does not meet this stated requirement.",
  }
}

function taxonomy(values: string[]) {
  const tags = new Set<string>()
  for (const raw of values) {
    const value = raw.toLowerCase()
    if (/art|artist|interdisciplinary|installation|painting|sculpture|drawing|print|craft/.test(value)) tags.add("arts")
    if (/film|media|video|digital|photograph|audiovisual/.test(value)) tags.add("media_arts")
    if (/perform|dance|theatre|theater|music/.test(value)) tags.add("performing_arts")
    if (/heritage|museum|archive|cultural/.test(value)) tags.add("culture_heritage")
    tags.add(cleanToken(raw))
  }
  return tags
}

function materialReady(key: string, passport: ExtendedArtistPassport | null, works: PortfolioWorkRecord[]) {
  if (!passport) return false
  switch (cleanToken(key)) {
    case "biography": return passport.bio.trim().length >= 40
    case "artist_statement": return passport.artist_statement.trim().length >= 80
    case "cv": return Boolean(passport.cv_file_path)
    case "portfolio":
    case "work_samples": return works.some((work) => Boolean(work.title.trim() && work.image_path))
    case "contact_information": return Boolean(passport.professional_name.trim() && passport.website_url.trim())
    default: return false
  }
}

export function evaluateOpportunity(item: OpportunityDirectoryItem, passport: ExtendedArtistPassport | null, portfolioWorks: PortfolioWorkRecord[]): OpportunityEvaluation {
  const confirmedRules = item.rules.filter((rule) => rule.verification_status === "confirmed")
  const ambiguousRules = item.rules.filter((rule) => rule.verification_status === "ambiguous")
  const ruleResults = item.rules.map((rule) => evaluateRule(rule, passport))
  const requiredResults = ruleResults.filter((result) => item.rules.find((rule) => rule.id === result.rule_id)?.requirement_level === "required")

  let eligibility: OpportunityEvaluation["eligibility"]
  if (requiredResults.some((result) => result.status === "failed")) eligibility = "not_eligible"
  else if (!confirmedRules.length && !ambiguousRules.length) eligibility = "eligibility_unclear"
  else if (requiredResults.some((result) => result.status === "unknown")) eligibility = "missing_information"
  else if (ambiguousRules.length) eligibility = "likely_eligible"
  else eligibility = "eligible"

  const artistTags = taxonomy([...(passport?.disciplines ?? []), ...(passport?.mediums ?? [])])
  const opportunityTags = taxonomy(item.disciplines)
  const overlapCount = [...artistTags].filter((tag) => opportunityTags.has(tag)).length
  let relevance: OpportunityEvaluation["relevance"]
  if (!artistTags.size || !opportunityTags.size) relevance = "insufficient_information"
  else if (overlapCount >= 2) relevance = "strong_relevance"
  else if (overlapCount === 1) relevance = "moderate_relevance"
  else relevance = "limited_relevance"

  const requirements = item.requirements.filter((requirement) => requirement.required && requirement.verification_status === "confirmed")
  const fallbackRequirements = requirements.length
    ? requirements.map((requirement) => ({ key: requirement.material_key, label: requirement.label }))
    : item.required_materials.map((label) => ({ key: cleanToken(label), label }))
  const ready = fallbackRequirements.filter((requirement) => materialReady(requirement.key, passport, portfolioWorks)).map((requirement) => requirement.label)
  const missing = fallbackRequirements.filter((requirement) => !materialReady(requirement.key, passport, portfolioWorks)).map((requirement) => requirement.label)

  return {
    eligibility,
    relevance,
    ruleResults,
    readiness: {
      readyCount: ready.length,
      totalCount: fallbackRequirements.length,
      ready,
      missing,
      unknown: fallbackRequirements.length === 0,
    },
  }
}

export async function setGlobalOpportunitySaved(opportunityId: string, saved: boolean) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to save opportunities.")
  const supabase = getSupabaseBrowserClient()
  const query = saved
    ? supabase.from("saved_opportunities").upsert({ artist_user_id: account.user.id, opportunity_id: opportunityId, call_id: null }, { onConflict: "artist_user_id,opportunity_id" })
    : supabase.from("saved_opportunities").delete().eq("artist_user_id", account.user.id).eq("opportunity_id", opportunityId)
  const { error } = await query
  if (error) throw error
  await recordOpportunityEvent(saved ? "save" : "unsave", opportunityId)
}

export async function recordOpportunityEvent(eventName: string, opportunityId: string | null = null, searchQuery = "", metadata: Record<string, unknown> = {}) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("record_opportunity_event", {
    target_event_name: eventName,
    target_opportunity_id: opportunityId,
    target_search_query: searchQuery,
    target_metadata: metadata,
  })
  if (error) throw error
}

export async function getOrCreateOpportunityConversation(opportunityId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("get_or_create_opportunity_conversation", { target_opportunity_id: opportunityId })
  if (error) throw error
  return String(data)
}

export async function loadOpportunityConversations(): Promise<OpportunityConversationSummary[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("list_my_opportunity_conversations")
  if (error) throw error
  return (data ?? []) as OpportunityConversationSummary[]
}

export async function loadOpportunityMessages(conversationId: string): Promise<OpportunityMessageRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("opportunity_messages").select("*").eq("conversation_id", conversationId).order("created_at").order("id")
  if (error) throw error
  return (data ?? []) as OpportunityMessageRecord[]
}

export async function sendOpportunityMessage(conversationId: string, body: string): Promise<OpportunityMessageRecord> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("send_opportunity_message", {
    target_conversation_id: conversationId,
    message_body: body.trim(),
    request_nonce: crypto.randomUUID(),
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("The opportunity message was not confirmed by the server.")
  return row as OpportunityMessageRecord
}

export async function markOpportunityConversationRead(conversationId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("mark_opportunity_conversation_read", { target_conversation_id: conversationId })
  if (error) throw error
}
