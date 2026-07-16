import { getSupabaseConfig, supabaseRest } from "@/lib/kleio-supabase"
import { locationData, type NormalizedEntityValue } from "@/lib/kleio-entity-search"

export async function saveArtistLocationData(userId: string, location: NormalizedEntityValue | null) {
  if (!getSupabaseConfig().configured || !location) return
  await supabaseRest(`artist_profiles?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ location_data: locationData(location), location: location.formattedAddress || location.displayName }),
  })
}

export async function saveInstitutionEntityData(institutionId: string, entity: NormalizedEntityValue | null, organizationType: string) {
  if (!getSupabaseConfig().configured || !entity) return
  await supabaseRest(`institutions?id=eq.${encodeURIComponent(institutionId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({
      display_name: entity.organizationName || entity.displayName,
      name: entity.organizationName || entity.displayName,
      provider: entity.provider ?? null,
      provider_place_id: entity.providerPlaceId ?? null,
      source_mode: entity.sourceMode,
      entity_type: entity.entityType ?? organizationType,
      organization_type: organizationType,
      location_data: locationData(entity),
      location: entity.formattedAddress || [entity.city, entity.stateOrRegion, entity.country].filter(Boolean).join(", ") || entity.displayName,
      provider_selected: entity.providerSelected,
      manually_entered: entity.manuallyEntered,
      possible_duplicate_ids: entity.existingKleioInstitutionId ? [entity.existingKleioInstitutionId] : [],
      duplicate_review_status: entity.existingKleioInstitutionId ? "possible_duplicate" : "none",
    }),
  })
}

export async function saveOpenCallLocationData(callId: string, location: NormalizedEntityValue | null) {
  if (!getSupabaseConfig().configured || !location) return
  await supabaseRest(`open_calls?id=eq.${encodeURIComponent(callId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ location_data: locationData(location), location: location.formattedAddress || location.displayName }),
  })
}
