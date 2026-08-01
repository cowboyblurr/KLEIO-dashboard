import { validateRasterImageFile } from "@/lib/kleio-file-validation"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type ArtistProfilePresentationRecord = {
  profile_image_path: string | null
  featured_work_id: string | null
  profile_image_url: string | null
  profile_image_position_x: number
  profile_image_position_y: number
}

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

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
  await validateRasterImageFile(file, {
    maxBytes: PROFILE_IMAGE_MAX_BYTES,
    label: "Profile image",
  })

  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const path = `${account.user.id}/profile/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from("artist-assets").upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error

  return {
    path,
    signedUrl: await signedArtistProfileImageUrl(path),
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
    await supabase.storage.from("artist-assets").remove([previousPath])
  }

  const profileImagePath = typeof data.profile_image_path === "string" && data.profile_image_path ? data.profile_image_path : null
  return {
    profile_image_path: profileImagePath,
    featured_work_id: typeof data.featured_work_id === "string" ? data.featured_work_id : null,
    profile_image_url: await signedArtistProfileImageUrl(profileImagePath),
    profile_image_position_x: Number(data.profile_image_position_x ?? 50),
    profile_image_position_y: Number(data.profile_image_position_y ?? 50),
  } satisfies ArtistProfilePresentationRecord
}
