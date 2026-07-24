import type { OpportunityDirectoryItem, OpportunityDirectoryFilters } from "@/lib/kleio-opportunity-data"

export type OpportunityIntentChip = {
  key: string
  kind: "discipline" | "opportunity_type" | "location" | "format" | "fee" | "support"
  label: string
}

export type OpportunitySearchIntent = {
  rawQuery: string
  disciplines: string[]
  opportunityTypes: string[]
  locations: string[]
  participationFormats: string[]
  noFeeOnly: boolean
  accommodationRequired: boolean
  fundedOnly: boolean
  freeTextTerms: string[]
  chips: OpportunityIntentChip[]
  hasStructuredIntent: boolean
}

export type OpportunityIntentMatch = {
  kind: "exact" | "partial" | "unrelated"
  matchedLabels: string[]
  missingLabels: string[]
  score: number
}

export type OpportunityIntentSearchPlan = {
  exact: OpportunityDirectoryFilters
  broader: OpportunityDirectoryFilters[]
}

type AliasDefinition = {
  value: string
  label: string
  aliases: string[]
}

const DISCIPLINES: AliasDefinition[] = [
  { value: "Ceramics", label: "Ceramics", aliases: ["ceramics", "ceramic", "pottery", "potter", "clay art", "clay"] },
  { value: "Painting", label: "Painting", aliases: ["painting", "paintings", "painter"] },
  { value: "Drawing", label: "Drawing", aliases: ["drawing", "drawings", "illustrative drawing"] },
  { value: "Photography", label: "Photography", aliases: ["photography", "photographic", "photographer", "photo art"] },
  { value: "Sculpture", label: "Sculpture", aliases: ["sculpture", "sculptural", "sculptor"] },
  { value: "Film", label: "Film / Video", aliases: ["film", "filmmaking", "cinema", "video art", "moving image"] },
  { value: "Performance", label: "Performance", aliases: ["performance art", "performance", "live art"] },
  { value: "Installation", label: "Installation", aliases: ["installation art", "installation", "site specific"] },
  { value: "Digital Art", label: "Digital Art", aliases: ["digital art", "new media", "interactive media", "creative technology"] },
  { value: "Illustration", label: "Illustration", aliases: ["illustration", "illustrator"] },
  { value: "Printmaking", label: "Printmaking", aliases: ["printmaking", "print maker", "prints"] },
  { value: "Textiles", label: "Textiles / Fiber", aliases: ["textile", "textiles", "fiber art", "fibre art", "fashion art"] },
  { value: "Sound", label: "Sound", aliases: ["sound art", "audio art", "sonic art"] },
  { value: "Writing", label: "Writing / Literary Arts", aliases: ["writing", "writer", "literary art", "poetry"] },
  { value: "Multidisciplinary", label: "Multidisciplinary", aliases: ["multidisciplinary", "interdisciplinary", "cross disciplinary"] },
]

const OPPORTUNITY_TYPES: AliasDefinition[] = [
  { value: "residency", label: "Residencies", aliases: ["artist residency", "artist residencies", "residency", "residencies", "studio residency"] },
  { value: "grant", label: "Grants", aliases: ["art grant", "artist grant", "grants", "grant"] },
  { value: "fellowship", label: "Fellowships", aliases: ["fellowships", "fellowship"] },
  { value: "commission", label: "Commissions", aliases: ["public art commission", "art commission", "commissions", "commission"] },
  { value: "prize_award", label: "Prizes / Awards", aliases: ["art competition", "competitions", "competition", "art prize", "prizes", "prize", "awards", "award"] },
  { value: "open_call", label: "Open Calls", aliases: ["open calls", "open call", "call for artists", "calls for artists", "call for entries"] },
  { value: "professional_development", label: "Professional Development", aliases: ["professional development", "training program", "training programmes", "workshop", "workshops"] },
]

const LOCATIONS: AliasDefinition[] = [
  { value: "Asia", label: "Asia", aliases: ["asia", "asian"] },
  { value: "East Asia", label: "East Asia", aliases: ["east asia", "eastern asia"] },
  { value: "Southeast Asia", label: "Southeast Asia", aliases: ["southeast asia", "south east asia"] },
  { value: "South Asia", label: "South Asia", aliases: ["south asia"] },
  { value: "West Asia", label: "West Asia", aliases: ["west asia", "western asia", "middle east"] },
  { value: "Central Asia", label: "Central Asia", aliases: ["central asia"] },
  { value: "Europe", label: "Europe", aliases: ["europe", "european"] },
  { value: "Africa", label: "Africa", aliases: ["africa", "african"] },
  { value: "North America", label: "North America", aliases: ["north america"] },
  { value: "Latin America", label: "Latin America", aliases: ["latin america", "south america"] },
  { value: "Caribbean", label: "Caribbean", aliases: ["caribbean"] },
  { value: "Oceania", label: "Oceania", aliases: ["oceania", "australasia"] },
  { value: "Worldwide", label: "Worldwide", aliases: ["worldwide", "global", "international"] },
  { value: "Japan", label: "Japan", aliases: ["japan", "japanese"] },
  { value: "China", label: "China", aliases: ["china", "chinese"] },
  { value: "South Korea", label: "South Korea", aliases: ["south korea", "korea", "korean"] },
  { value: "India", label: "India", aliases: ["india", "indian"] },
  { value: "Singapore", label: "Singapore", aliases: ["singapore", "singaporean"] },
  { value: "Thailand", label: "Thailand", aliases: ["thailand", "thai"] },
  { value: "Indonesia", label: "Indonesia", aliases: ["indonesia", "indonesian"] },
  { value: "Philippines", label: "Philippines", aliases: ["philippines", "filipino"] },
  { value: "Vietnam", label: "Vietnam", aliases: ["vietnam", "vietnamese"] },
  { value: "Malaysia", label: "Malaysia", aliases: ["malaysia", "malaysian"] },
  { value: "Taiwan", label: "Taiwan", aliases: ["taiwan", "taiwanese"] },
  { value: "Hong Kong", label: "Hong Kong", aliases: ["hong kong"] },
  { value: "Mexico", label: "Mexico", aliases: ["mexico", "mexican"] },
  { value: "Spain", label: "Spain", aliases: ["spain", "spanish"] },
  { value: "France", label: "France", aliases: ["france", "french"] },
  { value: "Germany", label: "Germany", aliases: ["germany", "german"] },
  { value: "Italy", label: "Italy", aliases: ["italy", "italian"] },
  { value: "United Kingdom", label: "United Kingdom", aliases: ["united kingdom", "uk", "britain", "british"] },
  { value: "United States", label: "United States", aliases: ["united states", "usa", "u.s.", "american"] },
  { value: "Canada", label: "Canada", aliases: ["canada", "canadian"] },
  { value: "Brazil", label: "Brazil", aliases: ["brazil", "brazilian"] },
  { value: "Jamaica", label: "Jamaica", aliases: ["jamaica", "jamaican"] },
]

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "around", "at", "for", "from", "i", "in", "is", "looking", "me", "my", "near", "of", "on", "or", "show", "that", "the", "to", "want", "with",
  "art", "artist", "artists", "opportunities", "opportunity", "program", "programs", "programme", "programmes",
])

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
}

function containsPhrase(text: string, phrase: string) {
  const normalizedPhrase = normalize(phrase)
  return (` ${text} `).includes(` ${normalizedPhrase} `)
}

function detectAliases(text: string, definitions: AliasDefinition[]) {
  const matches: AliasDefinition[] = []
  const consumed = new Set<string>()
  const ordered = [...definitions].sort((a, b) => Math.max(...b.aliases.map((alias) => alias.length)) - Math.max(...a.aliases.map((alias) => alias.length)))
  for (const definition of ordered) {
    const alias = [...definition.aliases].sort((a, b) => b.length - a.length).find((candidate) => containsPhrase(text, candidate))
    if (!alias || consumed.has(definition.value)) continue
    matches.push(definition)
    consumed.add(definition.value)
  }
  return matches
}

function removeKnownPhrases(text: string, definitions: AliasDefinition[]) {
  let remaining = ` ${text} `
  const aliases = definitions.flatMap((definition) => definition.aliases).sort((a, b) => b.length - a.length)
  for (const alias of aliases) {
    const phrase = normalize(alias)
    remaining = remaining.replaceAll(` ${phrase} `, " ")
  }
  return remaining.trim().replace(/\s+/g, " ")
}

function unique(values: string[]) {
  return [...new Set(values)]
}

function chip(kind: OpportunityIntentChip["kind"], key: string, label: string): OpportunityIntentChip {
  return { kind, key: `${kind}:${key}`, label }
}

export function parseOpportunitySearchIntent(rawQuery: string): OpportunitySearchIntent {
  const normalizedQuery = normalize(rawQuery)
  const disciplineMatches = detectAliases(normalizedQuery, DISCIPLINES)
  const typeMatches = detectAliases(normalizedQuery, OPPORTUNITY_TYPES)
  const locationMatches = detectAliases(normalizedQuery, LOCATIONS)

  const online = containsPhrase(normalizedQuery, "online") || containsPhrase(normalizedQuery, "remote") || containsPhrase(normalizedQuery, "virtual")
  const inPerson = containsPhrase(normalizedQuery, "in person") || containsPhrase(normalizedQuery, "on site") || containsPhrase(normalizedQuery, "onsite")
  const hybrid = containsPhrase(normalizedQuery, "hybrid")
  const noFeeOnly = containsPhrase(normalizedQuery, "no fee") || containsPhrase(normalizedQuery, "free to apply") || containsPhrase(normalizedQuery, "without application fee")
  const accommodationRequired = containsPhrase(normalizedQuery, "housing included") || containsPhrase(normalizedQuery, "accommodation included") || containsPhrase(normalizedQuery, "with housing") || containsPhrase(normalizedQuery, "with accommodation")
  const fundedOnly = containsPhrase(normalizedQuery, "fully funded") || containsPhrase(normalizedQuery, "funded") || containsPhrase(normalizedQuery, "with stipend") || containsPhrase(normalizedQuery, "travel support")

  const participationFormats = unique([
    ...(online ? ["online"] : []),
    ...(inPerson ? ["in_person"] : []),
    ...(hybrid ? ["hybrid"] : []),
  ])

  let remaining = removeKnownPhrases(normalizedQuery, [...DISCIPLINES, ...OPPORTUNITY_TYPES, ...LOCATIONS])
  for (const phrase of ["online", "remote", "virtual", "in person", "on site", "onsite", "hybrid", "no fee", "free to apply", "without application fee", "housing included", "accommodation included", "with housing", "with accommodation", "fully funded", "funded", "with stipend", "travel support"]) {
    remaining = ` ${remaining} `.replaceAll(` ${normalize(phrase)} `, " ").trim().replace(/\s+/g, " ")
  }
  const freeTextTerms = remaining.split(" ").filter((term) => term.length > 1 && !STOP_WORDS.has(term))

  const chips: OpportunityIntentChip[] = [
    ...disciplineMatches.map((item) => chip("discipline", item.value, item.label)),
    ...typeMatches.map((item) => chip("opportunity_type", item.value, item.label)),
    ...locationMatches.map((item) => chip("location", item.value, item.label)),
    ...(online ? [chip("format", "online", "Online / remote")] : []),
    ...(inPerson ? [chip("format", "in_person", "In person")] : []),
    ...(hybrid ? [chip("format", "hybrid", "Hybrid")] : []),
    ...(noFeeOnly ? [chip("fee", "no_fee", "No application fee")] : []),
    ...(accommodationRequired ? [chip("support", "accommodation", "Housing / accommodation included")] : []),
    ...(fundedOnly ? [chip("support", "funded", "Funding explicitly stated")] : []),
  ]

  return {
    rawQuery,
    disciplines: disciplineMatches.map((item) => item.value),
    opportunityTypes: typeMatches.map((item) => item.value),
    locations: locationMatches.map((item) => item.value),
    participationFormats,
    noFeeOnly,
    accommodationRequired,
    fundedOnly,
    freeTextTerms,
    chips,
    hasStructuredIntent: chips.length > 0,
  }
}

function searchableTerms(intent: OpportunitySearchIntent, include: { disciplines?: boolean; locations?: boolean; freeText?: boolean } = {}) {
  const terms = [
    ...(include.disciplines === false ? [] : intent.disciplines),
    ...(include.locations === false ? [] : intent.locations),
    ...(include.freeText === false ? [] : intent.freeTextTerms),
  ]
  return unique(terms).join(" ").trim()
}

function dedupeFilters(filters: OpportunityDirectoryFilters[]) {
  const seen = new Set<string>()
  return filters.filter((filter) => {
    const key = JSON.stringify(filter)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function buildOpportunityIntentSearchPlan(intent: OpportunitySearchIntent): OpportunityIntentSearchPlan {
  const exact: OpportunityDirectoryFilters = {
    query: searchableTerms(intent) || intent.rawQuery.trim(),
    opportunityTypes: intent.opportunityTypes.length ? intent.opportunityTypes : undefined,
    participationFormats: intent.participationFormats.length ? intent.participationFormats : undefined,
    noFeeOnly: intent.noFeeOnly,
    limit: 50,
  }

  if (!intent.hasStructuredIntent) return { exact, broader: [] }

  const broader = dedupeFilters([
    {
      query: searchableTerms(intent, { locations: false }),
      opportunityTypes: intent.opportunityTypes.length ? intent.opportunityTypes : undefined,
      limit: 24,
    },
    {
      query: searchableTerms(intent, { disciplines: false }),
      opportunityTypes: intent.opportunityTypes.length ? intent.opportunityTypes : undefined,
      limit: 24,
    },
    {
      query: searchableTerms(intent),
      participationFormats: intent.participationFormats.length ? intent.participationFormats : undefined,
      limit: 24,
    },
    {
      query: searchableTerms(intent, { locations: false }),
      limit: 24,
    },
    {
      query: searchableTerms(intent, { disciplines: false }),
      limit: 24,
    },
  ].filter((filter) => Boolean(filter.query || filter.opportunityTypes?.length || filter.participationFormats?.length)))

  return { exact, broader }
}

function normalizedList(values: string[]) {
  return values.map(normalize).filter(Boolean)
}

function matchesRequestedValue(requested: string, available: string[]) {
  const target = normalize(requested)
  return available.some((value) => {
    const normalizedValue = normalize(value)
    return normalizedValue === target || (` ${normalizedValue} `).includes(` ${target} `) || (` ${target} `).includes(` ${normalizedValue} `)
  })
}

function explicitlyFunded(item: OpportunityDirectoryItem & { funding_display_text?: string; funding_source_note?: string }) {
  if ((item.award_max ?? item.award_min ?? 0) > 0) return true
  const fundingText = normalize(`${item.funding_display_text ?? ""} ${item.funding_source_note ?? ""}`)
  if (/self funded|artist funded|pay to participate/.test(fundingText)) return false
  return /fully funded|stipend|travel support|production support|grant funding|award amount/.test(fundingText)
}

export function classifyOpportunityAgainstIntent(
  item: OpportunityDirectoryItem & { funding_display_text?: string; funding_source_note?: string },
  intent: OpportunitySearchIntent,
): OpportunityIntentMatch {
  if (!intent.hasStructuredIntent) return { kind: "exact", matchedLabels: [], missingLabels: [], score: 1 }

  const checks: Array<{ label: string; matched: boolean }> = []
  const itemDisciplines = normalizedList(item.disciplines)
  const itemLocations = normalizedList([...item.locations, ...item.eligible_regions, ...item.eligible_countries])

  if (intent.disciplines.length) checks.push({
    label: intent.disciplines.join(" or "),
    matched: intent.disciplines.some((value) => matchesRequestedValue(value, itemDisciplines)),
  })
  if (intent.opportunityTypes.length) checks.push({
    label: intent.opportunityTypes.map((value) => OPPORTUNITY_TYPES.find((itemType) => itemType.value === value)?.label ?? value).join(" or "),
    matched: intent.opportunityTypes.includes(item.opportunity_type),
  })
  if (intent.locations.length) checks.push({
    label: intent.locations.join(" or "),
    matched: intent.locations.some((value) => matchesRequestedValue(value, itemLocations)),
  })
  if (intent.participationFormats.length) checks.push({
    label: intent.participationFormats.map((value) => value === "in_person" ? "In person" : value === "online" ? "Online / remote" : "Hybrid").join(" or "),
    matched: intent.participationFormats.includes(item.participation_format) || (intent.participationFormats.includes("online") && item.remote_allowed === true),
  })
  if (intent.noFeeOnly) checks.push({ label: "No application fee", matched: item.application_fee === 0 })
  if (intent.accommodationRequired) checks.push({ label: "Housing / accommodation included", matched: item.accommodation_supported === true })
  if (intent.fundedOnly) checks.push({ label: "Funding explicitly stated", matched: explicitlyFunded(item) })

  const matchedLabels = checks.filter((check) => check.matched).map((check) => check.label)
  const missingLabels = checks.filter((check) => !check.matched).map((check) => check.label)
  const score = checks.length ? matchedLabels.length / checks.length : 1
  const kind = missingLabels.length === 0 ? "exact" : matchedLabels.length > 0 ? "partial" : "unrelated"
  return { kind, matchedLabels, missingLabels, score }
}
