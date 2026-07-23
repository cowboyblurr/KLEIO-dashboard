import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { loadInstitutionContext } from "@/lib/kleio-live-data"

export type DiscoveryVisibility = "private" | "applications_only" | "institutions"
export type DiscoveryContactMode = "none" | "opportunity_invites"

export type DiscoveryWork = {
  id: string
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  series: string
  tags: string[]
  image_path: string | null
  image_url?: string | null
  sort_order: number
}

export type ArtistDiscoveryRecord = {
  artist_user_id: string
  visibility: DiscoveryVisibility
  contact_mode: DiscoveryContactMode
  availability: string[]
  themes: string[]
  selected_work_ids: string[]
  professional_name: string
  location: string
  bio: string
  artist_statement: string
  practice_description: string
  website_url: string
  instagram_url: string
  disciplines: string[]
  mediums: string[]
  languages: string[]
  career_stage: string | null
  profile_completion: number
  profile_image_path: string
  profile_image_url?: string | null
  featured_work_id: string | null
  selected_works: DiscoveryWork[]
  enabled_at: string | null
  updated_at: string
}

export type ActiveInstitutionListing = {
  id: string
  title: string
  opportunity_type: string
  deadline_at: string | null
  provider_name: string
}

const discoverySelect = "artist_user_id, visibility, contact_mode, availability, themes, selected_work_ids, professional_name, location, bio, artist_statement, practice_description, website_url, instagram_url, disciplines, mediums, languages, career_stage, profile_completion, profile_image_path, featured_work_id, selected_works, enabled_at, updated_at"

async function signedArtistAsset(path: string | null | undefined) {
  if (!path) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

async function hydrate(record: ArtistDiscoveryRecord): Promise<ArtistDiscoveryRecord> {
  const selectedWorks = await Promise.all((record.selected_works ?? []).map(async (work) => ({
    ...work,
    image_url: await signedArtistAsset(work.image_path),
  })))
  return {
    ...record,
    selected_works: selectedWorks,
    profile_image_url: await signedArtistAsset(record.profile_image_path),
  }
}

export async function loadMyArtistDiscoveryProfile(): Promise<ArtistDiscoveryRecord | null> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to manage discovery visibility.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_discovery_profiles").select(discoverySelect).eq("artist_user_id", account.user.id).maybeSingle()
  if (error) throw error
  return data ? hydrate(data as ArtistDiscoveryRecord) : null
}

export async function saveMyArtistDiscoveryProfile(input: {
  visibility: DiscoveryVisibility
  contact_mode: DiscoveryContactMode
  availability: string[]
  themes: string[]
  selected_work_ids: string[]
}) {
  const account = await loadKleioAccount()
  if (!account || account.profile.role !== "artist") throw new Error("Only an artist account can change discovery visibility.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_discovery_profiles").upsert({
    artist_user_id: account.user.id,
    visibility: input.visibility,
    contact_mode: input.contact_mode,
    availability: input.availability,
    themes: input.themes,
    selected_work_ids: input.selected_work_ids.slice(0, 8),
    updated_at: new Date().toISOString(),
  }, { onConflict: "artist_user_id" }).select(discoverySelect).single()
  if (error) throw error
  return hydrate(data as ArtistDiscoveryRecord)
}

export async function loadDiscoverableArtists(): Promise<ArtistDiscoveryRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_discovery_profiles").select(discoverySelect).eq("visibility", "institutions").order("updated_at", { ascending: false })
  if (error) throw error
  return Promise.all((data ?? []).map((row) => hydrate(row as ArtistDiscoveryRecord)))
}

export async function loadActiveInstitutionListings(): Promise<ActiveInstitutionListing[]> {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("opportunities")
    .select("id, title, opportunity_type, deadline_at, provider_name, open_calls!inner(institution_id, status, published_at, opens_at, deadline_at)")
    .eq("open_calls.institution_id", context.institution_id)
    .eq("open_calls.status", "open")
    .not("open_calls.published_at", "is", null)
    .eq("application_mode", "internal")
    .eq("status", "open")
    .order("deadline_at", { ascending: true, nullsFirst: false })
  if (error) throw error
  const now = Date.now()
  return (data ?? []).filter((row) => {
    const deadline = row.deadline_at ? new Date(String(row.deadline_at)).getTime() : null
    return deadline === null || deadline >= now
  }).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    opportunity_type: String(row.opportunity_type),
    deadline_at: row.deadline_at ? String(row.deadline_at) : null,
    provider_name: String(row.provider_name),
  }))
}

export async function inviteArtistToOpportunity(input: { artistUserId: string; opportunityId: string; message: string }) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("invite_artist_to_opportunity", {
    target_artist_user_id: input.artistUserId,
    target_opportunity_id: input.opportunityId,
    message_body: input.message.trim(),
    request_nonce: crypto.randomUUID(),
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("The invitation was not confirmed by the server.")
  return row as { invitation_id: string; conversation_id: string; invitation_status: string }
}
