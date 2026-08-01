import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { mediaImportConfig, recordMediaUsage, uploadMediaToLibrary } from "@/lib/kleio-universal-media"

export type ArtistProfilePresentationRecord = {
  profile_image_path: string | null
  featured_work_id: string | null
  profile_image_url: string | null
  profile_image_position_x: number
  profile_image_position_y: number
}

async function requireArtistAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("This profile editor is available only to artist accounts.")
  return account
}

export async function signedArtistProfileImageUrl(path: string | null) {
  if (!path) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function loadArtistProfilePresentation(): Promise<ArtistProfilePresentationRecord> {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_profiles")
    .select("profile_image_path, featured_work_id, profile_image_position_x, profile_image_position_y")
    .eq("user_id", account.user.id)
    .maybeSingle()

  if (error) throw error

  const profileImagePath = typeof data?.profile_image_path === "string" && data.profile_image_path ? data.profile_image_path : null
  const featuredWorkId = typeof data?.featured_work_id === "string" ? data.featured_work_id : null

  return {
    profile_image_path: profileImagePath,
    featured_work_id: featuredWorkId,
    profile_image_url: await signedArtistProfileImageUrl(profileImagePath),
    profile_image_position_x: Number(data?.profile_image_position_x ?? 50),
    profile_image_position_y: Number(data?.profile_image_position_y ?? 50),
  }
}

export async function uploadArtistProfileImage(file: File) {
  const result = await uploadMediaToLibrary({
    file,
    source: "device",
    config: mediaImportConfig("profile_image"),
  })
  return {
    path: result.item.storagePath,
    signedUrl: result.item.previewUrl ?? await signedArtistProfileImageUrl(result.item.storagePath),
    mediaItem: result.item,
  }
}

export async function saveArtistProfilePresentation(input: {
  profile_image_path: string | null
  featured_work_id: string | null
  profile_image_position_x: number
  profile_image_position_y: number
}) {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { data: current, error: currentError } = await supabase
    .from("artist_profiles")
    .select("profile_image_path")
    .eq("user_id", account.user.id)
    .maybeSingle()
  if (currentError) throw currentError

  const positionX = Math.max(0, Math.min(100, Math.round(input.profile_image_position_x)))
  const positionY = Math.max(0, Math.min(100, Math.round(input.profile_image_position_y)))
  const { data, error } = await supabase
    .from("artist_profiles")
    .update({
      profile_image_path: input.profile_image_path || "",
      featured_work_id: input.featured_work_id,
      profile_image_position_x: positionX,
      profile_image_position_y: positionY,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", account.user.id)
    .select("profile_image_path, featured_work_id, profile_image_position_x, profile_image_position_y")
    .single()

  if (error) throw error

  const previousPath = typeof current?.profile_image_path === "string" ? current.profile_image_path : null
  if (previousPath && previousPath !== input.profile_image_path) {
    const { data: previousSource } = await supabase.from("artist_import_sources").select("id").eq("artist_user_id", account.user.id).eq("storage_path", previousPath).maybeSingle()
    if (previousSource?.id) {
      await supabase.from("artist_media_usages").delete().eq("artist_user_id", account.user.id).eq("source_id", previousSource.id).eq("usage_context", "profile_image")
      await supabase.from("artist_import_sources").update({ library_status: "available", updated_at: new Date().toISOString() }).eq("id", previousSource.id)
    }
  }

  const profileImagePath = typeof data.profile_image_path === "string" && data.profile_image_path ? data.profile_image_path : null
  if (profileImagePath) {
    const { data: source } = await supabase.from("artist_import_sources").select("*").eq("artist_user_id", account.user.id).eq("storage_path", profileImagePath).maybeSingle()
    if (source?.id) {
      const item = {
        id: String(source.id),
        sourceId: String(source.id),
        storagePath: profileImagePath,
        originalFilename: String(source.original_filename || source.label || "Profile image"),
        title: "Profile image",
        mimeType: String(source.mime_type || "image/jpeg"),
        byteSize: source.byte_size === null ? null : Number(source.byte_size),
        checksum: String(source.checksum || ""),
        sourceType: String(source.source_type || "existing_kleio_media"),
        mediaKind: "image" as const,
        width: source.width ? Number(source.width) : null,
        height: source.height ? Number(source.height) : null,
        createdAt: String(source.created_at || new Date().toISOString()),
        libraryStatus: "attached" as const,
        usageCount: 0,
        associatedWorkId: null,
        associatedWorkTitle: "",
        previewUrl: null,
        approvalState: "available" as const,
      }
      await recordMediaUsage({ item, context: "profile_image", destinationId: account.user.id, role: "profile" })
    }
  }

  return {
    profile_image_path: profileImagePath,
    featured_work_id: typeof data.featured_work_id === "string" ? data.featured_work_id : null,
    profile_image_url: await signedArtistProfileImageUrl(profileImagePath),
    profile_image_position_x: Number(data.profile_image_position_x ?? 50),
    profile_image_position_y: Number(data.profile_image_position_y ?? 50),
  } satisfies ArtistProfilePresentationRecord
}
