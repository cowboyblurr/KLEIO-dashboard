export type KleioEntityKind = "location" | "institution"

export type KleioLocationData = {
  city?: string
  state_or_region?: string
  country?: string
  country_code?: string
  formatted_address: string
  latitude?: number
  longitude?: number
}

export type KleioEntitySuggestion = {
  id: string
  kind: KleioEntityKind
  name: string
  label: string
  detail: string
  provider: "photon"
  providerPlaceId: string
  entityType: string
  locationData: KleioLocationData
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] }
  properties?: {
    name?: string
    city?: string
    district?: string
    county?: string
    state?: string
    country?: string
    countrycode?: string
    osm_id?: number | string
    osm_type?: string
    osm_key?: string
    osm_value?: string
    type?: string
  }
}

type PhotonResponse = { features?: PhotonFeature[] }

const searchCache = new Map<string, KleioEntitySuggestion[]>()

function cleanParts(parts: Array<string | undefined>) {
  return parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part))
}

function uniqueParts(parts: string[]) {
  return parts.filter((part, index) => parts.findIndex((candidate) => candidate.toLowerCase() === part.toLowerCase()) === index)
}

function mapPhotonFeature(feature: PhotonFeature, kind: KleioEntityKind): KleioEntitySuggestion | null {
  const properties = feature.properties ?? {}
  const name = properties.name?.trim()
  if (!name) return null

  const city = properties.city ?? properties.district ?? properties.county
  const state = properties.state
  const country = properties.country
  const context = uniqueParts(cleanParts([city, state, country]))
  const formattedAddress = uniqueParts(cleanParts([name, ...context])).join(", ")
  const coordinates = feature.geometry?.coordinates
  const providerPlaceId = `${properties.osm_type ?? "osm"}:${properties.osm_id ?? formattedAddress}`
  const entityType = properties.osm_value ?? properties.type ?? properties.osm_key ?? kind

  return {
    id: `photon:${providerPlaceId}`,
    kind,
    name,
    label: formattedAddress,
    detail: context.join(", ") || entityType,
    provider: "photon",
    providerPlaceId,
    entityType,
    locationData: {
      city,
      state_or_region: state,
      country,
      country_code: properties.countrycode?.toUpperCase(),
      formatted_address: formattedAddress,
      longitude: coordinates?.[0],
      latitude: coordinates?.[1],
    },
  }
}

function relevanceScore(suggestion: KleioEntitySuggestion, query: string, kind: KleioEntityKind) {
  const normalizedQuery = query.trim().toLowerCase()
  const normalizedName = suggestion.name.toLowerCase()
  let score = normalizedName === normalizedQuery ? 100 : normalizedName.startsWith(normalizedQuery) ? 70 : 30

  if (kind === "institution") {
    const type = suggestion.entityType.toLowerCase()
    if (["museum", "gallery", "arts_centre", "college", "university", "school", "library", "theatre"].includes(type)) score += 30
  }

  return score
}

export async function searchRealWorldEntities(
  query: string,
  kind: KleioEntityKind,
  locale: "en" | "es" = "en",
  signal?: AbortSignal,
): Promise<KleioEntitySuggestion[]> {
  const normalizedQuery = query.trim()
  if (normalizedQuery.length < 3) return []

  const cacheKey = `${kind}:${locale}:${normalizedQuery.toLowerCase()}`
  const cached = searchCache.get(cacheKey)
  if (cached) return cached

  const endpoint = new URL("https://photon.komoot.io/api/")
  endpoint.searchParams.set("q", normalizedQuery)
  endpoint.searchParams.set("limit", "8")
  endpoint.searchParams.set("lang", locale)

  const response = await fetch(endpoint, {
    signal,
    headers: { Accept: "application/json" },
  })

  if (!response.ok) throw new Error(`Location search failed (${response.status}).`)
  const payload = (await response.json()) as PhotonResponse
  const suggestions = (payload.features ?? [])
    .map((feature) => mapPhotonFeature(feature, kind))
    .filter((suggestion): suggestion is KleioEntitySuggestion => Boolean(suggestion))
    .sort((a, b) => relevanceScore(b, normalizedQuery, kind) - relevanceScore(a, normalizedQuery, kind))
    .filter((suggestion, index, all) => all.findIndex((candidate) => candidate.label === suggestion.label) === index)
    .slice(0, 7)

  searchCache.set(cacheKey, suggestions)
  return suggestions
}
