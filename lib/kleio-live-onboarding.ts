import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import { getSupabaseBrowserClient, type KleioAccountRole } from "@/lib/kleio-supabase"
import type { KleioEntitySuggestion, KleioLocationData } from "@/lib/kleio-entity-search"
import { getKleioAuthCallbackUrl } from "@/lib/kleio-url"

const PENDING_ONBOARDING_KEY = "kleio:auth:pending-onboarding:v3"
const LEGACY_PENDING_ONBOARDING_V2_KEY = "kleio:auth:pending-onboarding:v2"
const LEGACY_PENDING_ONBOARDING_KEY = "kleio-pending-live-onboarding"
const RECOVERY_METADATA_KEY = "kleio_onboarding_recovery"

export type ArtistOnboardingPayload = {
  role: "artist"
  email: string
  displayName: string
  location: string
  selectedLocation: KleioEntitySuggestion | null
  discipline: string
  disciplines: string[]
  careerStage: string
  website: string
  shortBio: string
  artistStatement: string
  mediums: string
  opportunityTypes: string[]
  geographicPreferences: string[]
  portfolioReadiness: string
  existingMaterials: string[]
  primaryGoal: string
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
  organizationSize: string
  reviewTeamSize: string
  currentWorkflow: string
  workflowChallenges: string[]
  openCallStatus: string
  programTypes: string[]
  primaryGoal: string
}

export type KleioOnboardingPayload = ArtistOnboardingPayload | InstitutionOnboardingPayload
export type KleioSignupResult = { userId: string; confirmationRequired: boolean }

function isBrowser() { return typeof window !== "undefined" }
function normalizeEmail(value: string) { return value.trim().toLowerCase() }
function splitList(value: string) { return value.split(/[,;\n]/).map((entry) => entry.trim()).filter(Boolean) }
function normalizedUrl(value: string) { const trimmed = value.trim(); if (!trimmed) return ""; return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}` }
function locationData(selection: KleioEntitySuggestion | null, fallback: string): KleioLocationData { return selection ? selection.locationData : { formatted_address: fallback.trim() } }
function stringField(record: Record<string, unknown>, key: string) { return typeof record[key] === "string" ? record[key] : "" }
function stringArrayField(record: Record<string, unknown>, key: string) { const value = record[key]; return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [] }
function suggestionField(record: Record<string, unknown>, key: string): KleioEntitySuggestion | null { const value = record[key]; return value && typeof value === "object" ? value as KleioEntitySuggestion : null }

function normalizeStoredOnboarding(value: unknown): KleioOnboardingPayload | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const role = record.role
  const email = normalizeEmail(stringField(record, "email"))
  const displayName = stringField(record, "displayName")
  if (!email || !displayName || (role !== "artist" && role !== "institution")) return null

  if (role === "artist") {
    const discipline = stringField(record, "discipline")
    const disciplines = stringArrayField(record, "disciplines")
    return {
      role,
      email,
      displayName,
      location: stringField(record, "location"),
      selectedLocation: suggestionField(record, "selectedLocation"),
      discipline: discipline || disciplines[0] || "",
      disciplines: disciplines.length ? disciplines : splitList(discipline),
      careerStage: stringField(record, "careerStage"),
      website: stringField(record, "website"),
      shortBio: stringField(record, "shortBio"),
      artistStatement: stringField(record, "artistStatement"),
      mediums: stringField(record, "mediums"),
      opportunityTypes: stringArrayField(record, "opportunityTypes"),
      geographicPreferences: stringArrayField(record, "geographicPreferences"),
      portfolioReadiness: stringField(record, "portfolioReadiness"),
      existingMaterials: stringArrayField(record, "existingMaterials"),
      primaryGoal: stringField(record, "primaryGoal"),
    }
  }

  return {
    role,
    email,
    displayName,
    institutionName: stringField(record, "institutionName"),
    selectedInstitution: suggestionField(record, "selectedInstitution"),
    institutionType: stringField(record, "institutionType"),
    location: stringField(record, "location"),
    selectedLocation: suggestionField(record, "selectedLocation"),
    website: stringField(record, "website"),
    publicDescription: stringField(record, "publicDescription"),
    missionStatement: stringField(record, "missionStatement"),
    organizationSize: stringField(record, "organizationSize"),
    reviewTeamSize: stringField(record, "reviewTeamSize"),
    currentWorkflow: stringField(record, "currentWorkflow"),
    workflowChallenges: stringArrayField(record, "workflowChallenges"),
    openCallStatus: stringField(record, "openCallStatus"),
    programTypes: stringArrayField(record, "programTypes"),
    primaryGoal: stringField(record, "primaryGoal"),
  }
}

function payloadHasRequiredFields(payload: KleioOnboardingPayload) {
  const common = payload.email.trim() && payload.displayName.trim() && payload.location.trim()
  if (!common) return false
  if (payload.role === "artist") return Boolean((payload.disciplines[0] ?? payload.discipline).trim())
  return Boolean(payload.institutionName.trim() && payload.institutionType.trim())
}

function recoveryPayload(payload: KleioOnboardingPayload): KleioOnboardingPayload {
  if (payload.role === "artist") return { ...payload, email: normalizeEmail(payload.email), selectedLocation: null, shortBio: "", artistStatement: "", mediums: "" }
  return { ...payload, email: normalizeEmail(payload.email), selectedInstitution: null, selectedLocation: null, publicDescription: "", missionStatement: "" }
}

function onboardingFromUserMetadata(user: User, expectedRole?: "artist" | "institution") {
  const payload = normalizeStoredOnboarding(user.user_metadata?.[RECOVERY_METADATA_KEY])
  if (!payload || !payloadHasRequiredFields(payload)) return null
  if (expectedRole && payload.role !== expectedRole) return null
  if (normalizeEmail(user.email ?? "") !== normalizeEmail(payload.email)) return null
  return payload
}

export function readPendingKleioOnboarding(): KleioOnboardingPayload | null {
  if (!isBrowser()) return null
  const raw = window.localStorage.getItem(PENDING_ONBOARDING_KEY) ?? window.localStorage.getItem(LEGACY_PENDING_ONBOARDING_V2_KEY) ?? window.localStorage.getItem(LEGACY_PENDING_ONBOARDING_KEY)
  if (!raw) return null
  try { return normalizeStoredOnboarding(JSON.parse(raw)) } catch { clearPendingKleioOnboarding(); return null }
}

export function savePendingKleioOnboarding(payload: KleioOnboardingPayload) {
  if (!isBrowser()) return
  window.localStorage.setItem(PENDING_ONBOARDING_KEY, JSON.stringify({ ...payload, email: normalizeEmail(payload.email) }))
  window.localStorage.removeItem(LEGACY_PENDING_ONBOARDING_V2_KEY)
  window.localStorage.removeItem(LEGACY_PENDING_ONBOARDING_KEY)
}

export function clearPendingKleioOnboarding() {
  if (!isBrowser()) return
  window.localStorage.removeItem(PENDING_ONBOARDING_KEY)
  window.localStorage.removeItem(LEGACY_PENDING_ONBOARDING_V2_KEY)
  window.localStorage.removeItem(LEGACY_PENDING_ONBOARDING_KEY)
}

export function getKleioSignupRedirect(role: Extract<KleioAccountRole, "artist" | "institution">) { return getKleioAuthCallbackUrl(role) }

export async function signUpKleioAccount(input: { email: string; password: string; displayName: string; role: Extract<KleioAccountRole, "artist" | "institution">; payload: KleioOnboardingPayload }): Promise<KleioSignupResult> {
  if (input.payload.role !== input.role) throw new Error("The selected account role does not match this signup path.")
  const normalizedEmail = normalizeEmail(input.email)
  const payload = recoveryPayload({ ...input.payload, email: normalizedEmail })
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password: input.password,
    options: { data: { role: input.role, display_name: input.displayName.trim(), [RECOVERY_METADATA_KEY]: payload }, emailRedirectTo: getKleioSignupRedirect(input.role) },
  })
  if (error) throw error
  if (!data.user) throw new Error("KLEIO could not create the account.")
  if (Array.isArray(data.user.identities) && data.user.identities.length === 0) throw new Error("A user has already been registered with this email.")
  return { userId: data.user.id, confirmationRequired: !data.session }
}

async function completeArtistOnboarding(userId: string, payload: ArtistOnboardingPayload) {
  const supabase = getSupabaseBrowserClient()
  const disciplines = payload.disciplines.length ? payload.disciplines : splitList(payload.discipline)
  const completionFields = [payload.displayName, payload.location, payload.website, disciplines[0] ?? "", payload.careerStage, payload.portfolioReadiness, payload.primaryGoal]
  const profileCompletion = Math.round((completionFields.filter((field) => field.trim()).length / completionFields.length) * 100)
  const { error: artistError } = await supabase.from("artist_profiles").upsert({
    user_id: userId,
    professional_name: payload.displayName.trim(),
    location: payload.location.trim(),
    bio: payload.shortBio.trim(),
    artist_statement: payload.artistStatement.trim(),
    practice_description: payload.shortBio.trim(),
    website_url: normalizedUrl(payload.website),
    disciplines,
    mediums: splitList(payload.mediums),
    career_stage: payload.careerStage || null,
    profile_completion: profileCompletion,
    location_data: locationData(payload.selectedLocation, payload.location),
    onboarding_preferences: {
      opportunity_types: payload.opportunityTypes,
      geographic_preferences: payload.geographicPreferences,
      portfolio_readiness: payload.portfolioReadiness,
      existing_materials: payload.existingMaterials,
      primary_goal: payload.primaryGoal,
      disciplines,
    },
  }, { onConflict: "user_id" })
  if (artistError) throw artistError
  const { error: profileError } = await supabase.from("profiles").update({ display_name: payload.displayName.trim(), onboarding_completed: true }).eq("id", userId)
  if (profileError) throw profileError
}

async function completeInstitutionOnboarding(userId: string, payload: InstitutionOnboardingPayload) {
  const supabase = getSupabaseBrowserClient()
  const entitySelection = payload.selectedInstitution
  const selectedLocation = payload.selectedLocation ?? entitySelection
  const resolvedLocation = payload.location.trim() || entitySelection?.locationData.formatted_address || ""
  const { error: institutionError } = await supabase.from("institutions").upsert({
    owner_user_id: userId,
    name: payload.institutionName.trim(),
    display_name: payload.institutionName.trim(),
    organization_type: payload.institutionType.trim(),
    description: [payload.publicDescription.trim(), payload.missionStatement.trim() ? `Mission: ${payload.missionStatement.trim()}` : ""].filter(Boolean).join("\n\n"),
    location: resolvedLocation,
    website_url: normalizedUrl(payload.website),
    contact_name: payload.displayName.trim(),
    contact_email: normalizeEmail(payload.email),
    provider: entitySelection?.provider ?? null,
    provider_place_id: entitySelection?.providerPlaceId ?? null,
    source_mode: entitySelection ? "external_provider" : "manual",
    entity_type: entitySelection?.entityType ?? "institution",
    location_data: locationData(selectedLocation, resolvedLocation),
    onboarding_preferences: {
      organization_size: payload.organizationSize,
      review_team_size: payload.reviewTeamSize,
      current_workflow: payload.currentWorkflow,
      workflow_challenges: payload.workflowChallenges,
      open_call_status: payload.openCallStatus,
      program_types: payload.programTypes,
      primary_goal: payload.primaryGoal,
    },
  }, { onConflict: "owner_user_id" })
  if (institutionError) throw institutionError
  const { error: profileError } = await supabase.from("profiles").update({ display_name: payload.displayName.trim(), onboarding_completed: true }).eq("id", userId)
  if (profileError) throw profileError
}

export async function completeKleioOnboarding(userId: string, payload: KleioOnboardingPayload) {
  if (!payloadHasRequiredFields(payload)) throw new Error("The onboarding profile is missing required information.")
  if (payload.role === "artist") await completeArtistOnboarding(userId, payload)
  else await completeInstitutionOnboarding(userId, payload)
  clearPendingKleioOnboarding()
  const supabase = getSupabaseBrowserClient()
  await supabase.auth.updateUser({ data: { [RECOVERY_METADATA_KEY]: null } }).catch(() => undefined)
}

export async function completeAuthenticatedKleioOnboarding(payload: KleioOnboardingPayload) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error ?? new Error("Sign in again to finish setting up this account.")
  if (!data.user.email_confirmed_at) throw new Error("Email not confirmed.")
  if (normalizeEmail(data.user.email ?? "") !== normalizeEmail(payload.email)) throw new Error("The signed-in account does not match this onboarding email.")
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, onboarding_completed").eq("id", data.user.id).single()
  if (profileError) throw profileError
  if (profile.role !== payload.role) throw new Error("This account belongs to a different KLEIO workspace type.")
  if (!profile.onboarding_completed) await completeKleioOnboarding(data.user.id, payload)
  return data.user.id
}

export async function resumePendingKleioOnboarding(expectedRole?: "artist" | "institution") {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user || !data.user.email_confirmed_at) return false
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role, onboarding_completed").eq("id", data.user.id).single()
  if (profileError) throw profileError
  if (profile.onboarding_completed || (expectedRole && profile.role !== expectedRole)) return false
  let payload = readPendingKleioOnboarding()
  if (payload && normalizeEmail(data.user.email ?? "") !== normalizeEmail(payload.email)) { clearPendingKleioOnboarding(); payload = null }
  if (payload && expectedRole && payload.role !== expectedRole) payload = null
  if (!payload || !payloadHasRequiredFields(payload)) payload = onboardingFromUserMetadata(data.user, expectedRole)
  if (!payload || payload.role !== profile.role) return false
  await completeKleioOnboarding(data.user.id, payload)
  return true
}

export function subscribeToKleioAuth(callback: (event: AuthChangeEvent, session: Session | null) => void) { return getSupabaseBrowserClient().auth.onAuthStateChange(callback).data.subscription }
