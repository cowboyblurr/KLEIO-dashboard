import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { normalizeArtistTerms } from "@/lib/kleio-artist-taxonomy"
import type { ArtistPassportRecord } from "@/lib/kleio-live-data"

export type EnhancedArtistProfile = ArtistPassportRecord & {
  profile_image_path: string
  profile_image_url: string | null
  profile_image_position_x: number
  profile_image_position_y: number
}

export type ArtistProfileInput = Omit<EnhancedArtistProfile, "user_id" | "profile_completion" | "profile_image_url">

const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024
const PROFILE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

async function requireArtistAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to manage your Creative Passport.")
  if (account.profile.role !== "artist") throw new Error("This profile editor is available only to artist accounts.")
  return account
}

export function normalizeMultilineText(value: string) {
  const normalized = value.replace(/\r\n?/g, "\n").split("\n").map((line) => line.replace(/[\t ]+$/g, "")).join("\n")
  return normalized.replace(/^\n+|\n+$/g, "")
}

export function calculateArtistProfileCompletion(input: Pick<EnhancedArtistProfile, "professional_name" | "location" | "bio" | "artist_statement" | "practice_description" | "website_url" | "education" | "exhibition_history" | "profile_image_path">) {
  const fields = [input.professional_name, input.location, input.bio, input.artist_statement, input.practice_description, input.website_url, input.education, input.exhibition_history, input.profile_image_path]
  return Math.round((fields.filter((field) => field.trim()).length / fields.length) * 100)
}

export async function signedArtistAssetUrl(path: string | null | undefined, expiresIn = 3600) {
  if (!path) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(path, expiresIn)
  if (error) throw error
  return data.signedUrl
}

export async function loadEnhancedArtistProfile(): Promise<EnhancedArtistProfile | null> {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_profiles").select("*").eq("user_id", account.user.id).maybeSingle()
  if (error) throw error
  if (!data) return null
  const path = String(data.profile_image_path || "")
  return {
    ...(data as ArtistPassportRecord),
    profile_image_path: path,
    profile_image_url: await signedArtistAssetUrl(path),
    profile_image_position_x: Number(data.profile_image_position_x ?? 50),
    profile_image_position_y: Number(data.profile_image_position_y ?? 50),
  }
}

export async function saveEnhancedArtistProfile(input: ArtistProfileInput) {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const record = {
    user_id: account.user.id,
    professional_name: input.professional_name.trim().replace(/\s+/g, " "),
    location: input.location.trim().replace(/\s+/g, " "),
    bio: normalizeMultilineText(input.bio),
    artist_statement: normalizeMultilineText(input.artist_statement),
    practice_description: normalizeMultilineText(input.practice_description),
    website_url: input.website_url.trim(),
    instagram_url: input.instagram_url.trim(),
    disciplines: normalizeArtistTerms(input.disciplines, "discipline"),
    mediums: normalizeArtistTerms(input.mediums),
    languages: normalizeArtistTerms(input.languages),
    education: normalizeMultilineText(input.education),
    exhibition_history: normalizeMultilineText(input.exhibition_history),
    awards: normalizeMultilineText(input.awards),
    cv_file_path: input.cv_file_path,
    profile_image_path: input.profile_image_path || "",
    profile_image_position_x: Math.max(0, Math.min(100, Math.round(input.profile_image_position_x))),
    profile_image_position_y: Math.max(0, Math.min(100, Math.round(input.profile_image_position_y))),
    profile_completion: calculateArtistProfileCompletion(input),
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("artist_profiles").upsert(record, { onConflict: "user_id" }).select("*").single()
  if (error) throw error
  const path = String(data.profile_image_path || "")
  return {
    ...(data as ArtistPassportRecord),
    profile_image_path: path,
    profile_image_url: await signedArtistAssetUrl(path),
    profile_image_position_x: Number(data.profile_image_position_x ?? 50),
    profile_image_position_y: Number(data.profile_image_position_y ?? 50),
  } satisfies EnhancedArtistProfile
}

function validateProfileImage(file: File) {
  if (!PROFILE_IMAGE_TYPES.has(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.")
  if (file.size > PROFILE_IMAGE_MAX_BYTES) throw new Error("Profile images must be 5 MB or smaller.")
}

export async function replaceArtistProfileImage(file: File, previousPath = "") {
  validateProfileImage(file)
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const path = `${account.user.id}/profile/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from("artist-assets").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type })
  if (uploadError) throw uploadError
  const { error: updateError } = await supabase.from("artist_profiles").update({ profile_image_path: path, updated_at: new Date().toISOString() }).eq("user_id", account.user.id)
  if (updateError) {
    await supabase.storage.from("artist-assets").remove([path])
    throw updateError
  }
  if (previousPath && previousPath !== path) await supabase.storage.from("artist-assets").remove([previousPath])
  return { path, url: await signedArtistAssetUrl(path) }
}

export async function removeArtistProfileImage(previousPath: string) {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_profiles").update({ profile_image_path: "", profile_image_position_x: 50, profile_image_position_y: 50, updated_at: new Date().toISOString() }).eq("user_id", account.user.id)
  if (error) throw error
  if (previousPath) await supabase.storage.from("artist-assets").remove([previousPath])
}

export async function saveArtistProfileImagePosition(x: number, y: number) {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const positionX = Math.max(0, Math.min(100, Math.round(x)))
  const positionY = Math.max(0, Math.min(100, Math.round(y)))
  const { error } = await supabase.from("artist_profiles").update({ profile_image_position_x: positionX, profile_image_position_y: positionY, updated_at: new Date().toISOString() }).eq("user_id", account.user.id)
  if (error) throw error
  return { x: positionX, y: positionY }
}
