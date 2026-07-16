import { getSupabaseConfig, supabaseRest } from "@/lib/kleio-supabase"

export type EntitySource = "kleio_existing" | "external_provider" | "manual"
export type SearchPurpose = "institution" | "country" | "region" | "city" | "venue"

export type NormalizedEntityValue = {
  sourceMode: EntitySource
  provider?: string | null
  providerPlaceId?: string | null
  displayName: string
  organizationName?: string | null
  formattedAddress?: string | null
  city?: string | null
  county?: string | null
  stateOrRegion?: string | null
  postalCode?: string | null
  country?: string | null
  countryCode?: string | null
  latitude?: number | null
  longitude?: number | null
  entityType?: string | null
  existingKleioInstitutionId?: string | null
  providerSelected: boolean
  manuallyEntered: boolean
  userAdjusted?: boolean
}

type InternalInstitutionRow = {
  institution_id: string
  display_name: string
  organization_type: string
  city?: string | null
  state_or_region?: string | null
  country?: string | null
  country_code?: string | null
  formatted_address?: string | null
  provider?: string | null
  provider_place_id?: string | null
  entity_type?: string | null
}

type MapboxContext = Record<string, { name?: string; country_code?: string; region_code?: string } | undefined>
type MapboxSuggestion = {
  name: string
  mapbox_id: string
  feature_type: string
  full_address?: string
  place_formatted?: string
  context?: MapboxContext
  poi_category?: string[]
}

const suggestionCache = new Map<string, NormalizedEntityValue[]>()
let searchSessionToken = ""

function sessionToken() {
  if (!searchSessionToken) searchSessionToken = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
  return searchSessionToken
}

export function normalizeManualEntity(displayName: string, purpose: SearchPurpose): NormalizedEntityValue {
  const clean = displayName.trim().replace(/\s+/g, " ")
  return {
    sourceMode: "manual",
    provider: null,
    providerPlaceId: null,
    displayName: clean,
    organizationName: purpose === "institution" ? clean : null,
    formattedAddress: purpose === "institution" || purpose === "venue" ? clean : null,
    entityType: purpose,
    providerSelected: false,
    manuallyEntered: true,
  }
}

function contextValue(context: MapboxContext | undefined, keys: string[]) {
  for (const key of keys) {
    const value = context?.[key]?.name
    if (value) return value
  }
  return null
}

function mapSuggestion(suggestion: MapboxSuggestion, purpose: SearchPurpose): NormalizedEntityValue {
  return {
    sourceMode: "external_provider",
    provider: "mapbox",
    providerPlaceId: suggestion.mapbox_id,
    displayName: suggestion.name,
    organizationName: purpose === "institution" ? suggestion.name : null,
    formattedAddress: suggestion.full_address || suggestion.place_formatted || suggestion.name,
    city: contextValue(suggestion.context, ["place", "city", "locality"]),
    county: contextValue(suggestion.context, ["district"]),
    stateOrRegion: contextValue(suggestion.context, ["region"]),
    postalCode: contextValue(suggestion.context, ["postcode"]),
    country: contextValue(suggestion.context, ["country"]),
    countryCode: suggestion.context?.country?.country_code?.toUpperCase() ?? null,
    entityType: suggestion.feature_type,
    providerSelected: true,
    manuallyEntered: false,
  }
}

async function searchInternalInstitutions(query: string, signal?: AbortSignal) {
  if (!getSupabaseConfig().configured) return []
  try {
    const pattern = encodeURIComponent(`*${query.trim()}*`)
    const rows = await supabaseRest<InternalInstitutionRow[]>(`institution_search_index?select=*&display_name=ilike.${pattern}&order=display_name.asc&limit=5`, { method: "GET", publicRead: true, signal })
    return rows.map<NormalizedEntityValue>((row) => ({
      sourceMode: "kleio_existing",
      provider: row.provider,
      providerPlaceId: row.provider_place_id,
      displayName: row.display_name,
      organizationName: row.display_name,
      formattedAddress: row.formatted_address,
      city: row.city,
      stateOrRegion: row.state_or_region,
      country: row.country,
      countryCode: row.country_code,
      entityType: row.entity_type || row.organization_type,
      existingKleioInstitutionId: row.institution_id,
      providerSelected: Boolean(row.provider_place_id),
      manuallyEntered: false,
    }))
  } catch {
    return []
  }
}

function mapboxTypes(purpose: SearchPurpose) {
  if (purpose === "country") return "country"
  if (purpose === "region") return "region"
  if (purpose === "city") return "place,city,locality"
  if (purpose === "institution") return "poi"
  return "poi,address"
}

async function searchMapbox(query: string, purpose: SearchPurpose, countryCode?: string, signal?: AbortSignal) {
  const token = (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "").trim()
  if (!token) return []
  const params = new URLSearchParams({
    q: query.trim(),
    access_token: token,
    session_token: sessionToken(),
    language: "en",
    limit: "8",
    types: mapboxTypes(purpose),
  })
  if (countryCode) params.set("country", countryCode.toUpperCase())
  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/suggest?${params}`, { signal })
  if (!response.ok) throw new Error(`Search provider unavailable (${response.status}).`)
  const payload = await response.json() as { suggestions?: MapboxSuggestion[] }
  return (payload.suggestions ?? []).map((entry) => mapSuggestion(entry, purpose))
}

export async function searchEntities(input: { query: string; purpose: SearchPurpose; countryCode?: string; signal?: AbortSignal }) {
  const query = input.query.trim().replace(/\s+/g, " ")
  if (query.length < 2) return []
  const cacheKey = `${input.purpose}:${input.countryCode ?? ""}:${query.toLowerCase()}`
  const cached = suggestionCache.get(cacheKey)
  if (cached) return cached

  const internal = input.purpose === "institution" ? await searchInternalInstitutions(query, input.signal) : []
  let external: NormalizedEntityValue[] = []
  try { external = await searchMapbox(query, input.purpose, input.countryCode, input.signal) } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error
  }

  const internalIds = new Set(internal.map((entry) => entry.providerPlaceId).filter(Boolean))
  const combined = [...internal, ...external.filter((entry) => !entry.providerPlaceId || !internalIds.has(entry.providerPlaceId))].slice(0, 8)
  suggestionCache.set(cacheKey, combined)
  return combined
}

export async function retrieveEntity(value: NormalizedEntityValue, signal?: AbortSignal) {
  if (value.sourceMode !== "external_provider" || value.provider !== "mapbox" || !value.providerPlaceId) return value
  const token = (process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "").trim()
  if (!token) return value
  const params = new URLSearchParams({ access_token: token, session_token: sessionToken(), language: "en" })
  const response = await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(value.providerPlaceId)}?${params}`, { signal })
  if (!response.ok) return value
  const payload = await response.json() as { features?: Array<{ geometry?: { coordinates?: [number, number] }; properties?: MapboxSuggestion & { coordinates?: { latitude?: number; longitude?: number } } }> }
  const feature = payload.features?.[0]
  if (!feature?.properties) return value
  const mapped = mapSuggestion(feature.properties, value.organizationName ? "institution" : "venue")
  return {
    ...value,
    ...mapped,
    latitude: feature.properties.coordinates?.latitude ?? feature.geometry?.coordinates?.[1] ?? null,
    longitude: feature.properties.coordinates?.longitude ?? feature.geometry?.coordinates?.[0] ?? null,
  }
}

export function locationData(value: NormalizedEntityValue | null) {
  if (!value) return {}
  return {
    provider: value.provider ?? null,
    provider_place_id: value.providerPlaceId ?? null,
    source_mode: value.sourceMode,
    display_name: value.displayName,
    formatted_address: value.formattedAddress ?? null,
    city: value.city ?? null,
    county: value.county ?? null,
    state_or_region: value.stateOrRegion ?? null,
    postal_code: value.postalCode ?? null,
    country: value.country ?? null,
    country_code: value.countryCode ?? null,
    latitude: value.latitude ?? null,
    longitude: value.longitude ?? null,
    entity_type: value.entityType ?? null,
    provider_selected: value.providerSelected,
    manually_entered: value.manuallyEntered,
    user_adjusted: value.userAdjusted ?? false,
  }
}
