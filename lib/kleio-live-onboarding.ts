import type { AuthChangeEvent, Session } from "@supabase/supabase-js"
import { getSupabaseBrowserClient, type KleioAccountRole } from "@/lib/kleio-supabase"
import type { KleioEntitySuggestion, KleioLocationData } from "@/lib/kleio-entity-search"

const PENDING_ONBOARDING_KEY = "kleio-pending-live-onboarding"

export type ArtistOnboardingPayload = {
  role: "artist"
  email: string
  displayName: string
  location: string
  selectedLocation: KleioEntitySuggestion | null
  discipline: string
  website: string
  shortBio: string
  artistStatement: string
  mediums: string
}

export type InstitutionOnboardingPayload = {
  role: "institution"
  email: string
  displayName: string
  institutionName: string
  selectedInstitution: KleioEntitySuggestion | null
  institutionType: string
  location: string
  selectedLocation: KleioEntitySuggestion | null
  website: string
  publicDescription: string
  missionStatement: string
}

export type KleioOnboardingPayload = ArtistOnboardingPayload | InstitutionOnboardingPayload

export type KleioSignupResult = {
  userId: string
  confirmationRequired: boolean
}

function isBrowser() {
  return typeof window !== "undefined"
}

function splitList(value: string) {
  return value
    .split(/[,;\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function normalizedUrl(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function locationData(selection: KleioEntitySuggestion | null, fallback: string): KleioLocationData {
  if (selection) return selection.locationData
  return { formatted_address: fallback.trim() }
}

function readPendingPayload(): KleioOnboardingPayload | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(PENDING_ONBOARDING_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as KleioOnboardingPayload
    if (parsed?.role === "artist" || parsed?.role === "institution") return parsed
  } catch {
    window.localStorage.removeItem(PENDING_ONBOARDING_KEY)
  }
  return null
}

export function savePendingKleioOnboarding(payload: KleioOnboardingPayload) {
  if (!isBrowser()) return
  window.localStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify(payload))
}

export function clearPendingKleioOnboarding() {
  if (!isBrowser()) return
  window.localStorage.removeItem(PENDING_ONBOARDING_KEY)
}

export function getKleioSignupRedirect(role: Extract<KleioAccountRole, "artist" | "institution">) {
  if (!isBrowser()) return undefined
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
  return `${window.location.origin}${basePath}/signup/${role}/`
}

export async function signUpKleioAccount(input: {
  email: string
  password: string
  displayName: string
  role: Extract<KleioAccountRole, "artist" | "institution">
}): Promise<KleioSignupResult> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        role: input.role,
        display_name: input.displayName.trim(),
      },
      emailRedirectTo: getKleioSignupRedirect(input.role),
    },
  })

  if (error) throw error
  if (!data.user) throw new Error("KLEIO could not create the account.")
  return { userId: data.user.id, confirmationRequired: !data.session }
}

async function completeArtistOnboarding(userId: string, payload: ArtistOnboardingPayload) {
  const supabase = getSupabaseBrowserClient()
  const disciplines = splitList(payload.discipline)
  const mediums = splitList(payload.mediums)
  const completionFields = [payload.displayName, payload.location, payload.shortBio, payload.artistStatement, payload.website, payload.discipline, payload.mediums]
  const profileCompletion = Math.round((completionFields.filter((field) => field.trim()).length / completionFields.length) * 100)

  const { error: artistError } = await supabase.from("artist_profiles").upsert(
    {
      user_id: userId,
      professional_name: payload.displayName.trim(),
      location: payload.location.trim(),
      bio: payload.shortBio.trim(),
      artist_statement: payload.artistStatement.trim(),
      practice_description: payload.shortBio.trim(),
      website_url: normalizedUrl(payload.website),
      disciplines,
      mediums,
      profile_completion: profileCompletion,
      location_data: locationData(payload.selectedLocation, payload.location),
    },
    { onConflict: "user_id" },
  )
  if (artistError) throw artistError

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: payload.displayName.trim(),
      onboarding_completed: true,
    })
    .eq("id", userId)
  if (profileError) throw profileError
}

async function completeInstitutionOnboarding(userId: string, payload: InstitutionOnboardingPayload) {
  const supabase = getSupabaseBrowserClient()
  const entitySelection = payload.selectedInstitution
  const selectedLocation = payload.selectedLocation ?? entitySelection
  const resolvedLocation = payload.location.trim() || entitySelection?.locationData.formatted_address || ""
  const institutionRecord = {
    owner_user_id: userId,
    name: payload.institutionName.trim(),
    display_name: payload.institutionName.trim(),
    organization_type: payload.institutionType.trim(),
    description: [payload.publicDescription.trim(), payload.missionStatement.trim() ? `Mission: ${payload.missionStatement.trim()}` : ""].filter(Boolean).join("\n\n"),
    location: resolvedLocation,
    website_url: normalizedUrl(payload.website),
    contact_name: payload.displayName.trim(),
    contact_email: payload.email.trim().toLowerCase(),
    provider: entitySelection?.provider ?? null,
    provider_place_id: entitySelection?.providerPlaceId ?? null,
    source_mode: entitySelection ? "external_provider" : "manual",
    entity_type: entitySelection?.entityType ?? "institution",
    location_data: locationData(selectedLocation, resolvedLocation),
  }

  const { data: existing, error: existingError } = await supabase
    .from("institutions")
    .select("id")
    .eq("owner_user_id", userId)
    .limit(1)
    .maybeSingle()
  if (existingError) throw existingError

  const institutionQuery = existing?.id
    ? supabase.from("institutions").update(institutionRecord).eq("id", existing.id)
    : supabase.from("institutions").insert(institutionRecord)
  const { error: institutionError } = await institutionQuery
  if (institutionError) throw institutionError

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ display_name: payload.displayName.trim() })
    .eq("id", userId)
  if (profileError) throw profileError
}

export async function completeKleioOnboarding(userId: string, payload: KleioOnboardingPayload) {
  if (payload.role === "artist") await completeArtistOnboarding(userId, payload)
  else await completeInstitutionOnboarding(userId, payload)
  clearPendingKleioOnboarding()
}

export async function resumePendingKleioOnboarding(expectedRole?: "artist" | "institution") {
  const payload = readPendingPayload()
  if (!payload || (expectedRole && payload.role !== expectedRole)) return false

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return false
  await completeKleioOnboarding(data.user.id, payload)
  return true
}

export function subscribeToKleioAuth(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const supabase = getSupabaseBrowserClient()
  return supabase.auth.onAuthStateChange(callback).data.subscription
}
