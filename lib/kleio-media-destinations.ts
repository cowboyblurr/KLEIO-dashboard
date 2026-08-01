import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { recordMediaUsage, type ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"
import { loadArtistProfilePresentation, saveArtistProfilePresentation } from "@/lib/kleio-profile-presentation"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"

async function requireArtistAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("This action is available only to artist accounts.")
  return account
}

export async function useMediaAsProfileImage(item: ArtistMediaLibraryItem) {
  if (!item.mimeType.startsWith("image/")) throw new Error("Choose an image for your profile photo.")
  const current = await loadArtistProfilePresentation()
  const saved = await saveArtistProfilePresentation({
    ...current,
    profile_image_path: item.storagePath,
  })
  await recordMediaUsage({ item, context: "profile_image", destinationId: "artist_profile", role: "profile" })
  return saved
}

export async function deletePortfolioWorkPreservingLibrary(work: PortfolioWorkRecord) {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("portfolio_works").delete().eq("id", work.id).eq("artist_user_id", account.user.id)
  if (error) throw error
  if (work.image_path) {
    const { data: source } = await supabase
      .from("artist_import_sources")
      .select("id")
      .eq("artist_user_id", account.user.id)
      .eq("storage_path", work.image_path)
      .maybeSingle()
    if (source?.id) {
      await supabase.from("artist_media_usages").delete().eq("artist_user_id", account.user.id).eq("source_id", source.id).eq("usage_context", "portfolio").eq("destination_id", work.id)
      await supabase.from("artist_import_sources").update({ library_status: "available", updated_at: new Date().toISOString() }).eq("id", source.id)
    }
  }
}

export async function recordApplicationMediaSelection(input: {
  items: ArtistMediaLibraryItem[]
  applicationId: string
}) {
  await Promise.all(input.items.map((item) => recordMediaUsage({
    item,
    context: "application_portfolio_selection",
    destinationId: input.applicationId,
    role: "selected_work",
  })))
}
