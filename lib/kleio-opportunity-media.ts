import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import { OPPORTUNITY_IMAGE_BUCKET, validateOpportunityImage } from "@/lib/kleio-opportunity-images"

export async function uploadSubmissionCover(file: File, callId: string) {
  validateOpportunityImage(file)
  const account = await loadKleioAccount()
  if (!account || account.profile.role !== "institution") {
    throw new Error("Please sign in with an institution account to upload a submission cover.")
  }
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"
  const safeCallId = callId.replace(/[^a-zA-Z0-9-]/g, "") || "draft"
  const path = `${account.user.id}/${safeCallId}/submission-cover/${crypto.randomUUID()}.${extension}`
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.storage.from(OPPORTUNITY_IMAGE_BUCKET).upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  })
  if (error) throw error
  return path
}
