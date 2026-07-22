import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export const OPPORTUNITY_IMAGE_BUCKET = "opportunity-images"
export const OPPORTUNITY_IMAGE_MAX_BYTES = 10 * 1024 * 1024
export const OPPORTUNITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

export type OpportunityImageMetadata = {
  preview_image_path: string
  preview_image_url: string
  preview_image_source_url: string
  preview_image_alt_text: string
  preview_image_attribution: string
  preview_image_rights_status: "not_supplied" | "provider_owned" | "licensed" | "official_publication" | "public_domain" | "permission_confirmed" | "unknown"
  preview_image_origin: "kleio_fallback" | "institution_upload" | "official_source" | "provider_upload" | "provider_logo"
}

export function emptyOpportunityImageMetadata(): OpportunityImageMetadata {
  return {
    preview_image_path: "",
    preview_image_url: "",
    preview_image_source_url: "",
    preview_image_alt_text: "",
    preview_image_attribution: "",
    preview_image_rights_status: "not_supplied",
    preview_image_origin: "kleio_fallback",
  }
}

export function validateOpportunityImage(file: File) {
  if (!OPPORTUNITY_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Use a JPG, PNG, or WebP image.")
  }
  if (file.size > OPPORTUNITY_IMAGE_MAX_BYTES) {
    throw new Error("Opportunity preview images must be 10 MB or smaller.")
  }
}

export async function uploadOpportunityImage(file: File) {
  validateOpportunityImage(file)
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to upload an opportunity image.")

  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  const path = `${account.user.id}/${crypto.randomUUID()}.${extension}`
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.storage.from(OPPORTUNITY_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}

export async function removeOpportunityImage(path: string) {
  if (!path) return
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.storage.from(OPPORTUNITY_IMAGE_BUCKET).remove([path])
  if (error) throw error
}

export function getOpportunityImagePublicUrl(path: string) {
  if (!path) return ""
  const supabase = getSupabaseBrowserClient()
  return supabase.storage.from(OPPORTUNITY_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

export function resolveOpportunityImageUrl(input: { preview_image_path?: string | null; preview_image_url?: string | null }) {
  if (input.preview_image_path) return getOpportunityImagePublicUrl(input.preview_image_path)
  return input.preview_image_url?.trim() || ""
}
