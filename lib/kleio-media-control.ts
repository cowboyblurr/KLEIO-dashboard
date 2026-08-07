import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import type { ArtistMediaLibraryItem, MediaImportContext } from "@/lib/kleio-universal-media"

export type MediaReference = {
  key: string
  context: string
  label: string
  destinationId: string
  removable: boolean
  finalized: boolean
}

export type MediaDeletionAssessment = {
  editableReferences: MediaReference[]
  blockingReferences: MediaReference[]
  finalizedReferences: MediaReference[]
}

export type MediaDeleteResult =
  | { status: "deleted"; assessment: MediaDeletionAssessment }
  | { status: "needs_detach"; assessment: MediaDeletionAssessment }
  | { status: "blocked"; assessment: MediaDeletionAssessment }

const detachableContexts = new Set<MediaImportContext>([
  "artist_onboarding",
  "creative_passport",
  "application_material",
  "application_portfolio_selection",
  "opportunity_requirement",
  "existing_media_library",
])

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media controls are available only in an artist workspace.")
  return account
}

function usageLabel(context: string, destinationId: string) {
  if (context === "creative_passport") return "Creative Passport"
  if (context === "portfolio") return "Portfolio"
  if (context === "profile_image") return "Profile image"
  if (context === "profile_cover") return "Profile cover"
  if (context === "application_material") return destinationId ? `Application draft · ${destinationId}` : "Application draft"
  if (context === "application_portfolio_selection") return destinationId ? `Application portfolio · ${destinationId}` : "Application portfolio"
  if (context === "opportunity_requirement") return destinationId ? `Opportunity requirement · ${destinationId}` : "Opportunity requirement"
  if (context === "artist_onboarding") return "Artist onboarding"
  return "Private KLEIO workspace"
}

function uniqueReferences(references: MediaReference[]) {
  const seen = new Set<string>()
  return references.filter((reference) => {
    if (seen.has(reference.key)) return false
    seen.add(reference.key)
    return true
  })
}

function snapshotContainsMedia(snapshot: unknown, item: ArtistMediaLibraryItem) {
  const serialized = JSON.stringify(snapshot ?? {})
  return Boolean(
    (item.sourceId && serialized.includes(item.sourceId))
    || (item.storagePath && serialized.includes(item.storagePath)),
  )
}

export async function loadMediaDeletionAssessment(item: ArtistMediaLibraryItem): Promise<MediaDeletionAssessment> {
  if (!item.sourceId) {
    return {
      editableReferences: [],
      blockingReferences: [{
        key: `legacy:${item.id}`,
        context: "portfolio",
        label: item.associatedWorkTitle ? `Portfolio · ${item.associatedWorkTitle}` : "Legacy portfolio work",
        destinationId: item.associatedWorkId || "",
        removable: false,
        finalized: false,
      }],
      finalizedReferences: [],
    }
  }

  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase
    .from("artist_import_sources")
    .select("id,storage_path")
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (sourceError) throw sourceError
  if (!source) throw new Error("This private media source is no longer available.")

  const [{ data: usages, error: usageError }, { data: works, error: workError }, { data: versions, error: versionError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("artist_media_usages").select("id,usage_context,destination_id,usage_role").eq("artist_user_id", account.user.id).eq("source_id", item.sourceId),
    supabase.from("portfolio_works").select("id,title").eq("artist_user_id", account.user.id).eq("import_source_id", item.sourceId),
    supabase.from("application_submission_versions").select("id,version_number,finalized_at,snapshot").eq("artist_user_id", account.user.id).order("finalized_at", { ascending: false }).limit(250),
    supabase.from("artist_profiles").select("cv_file_path").eq("user_id", account.user.id).maybeSingle(),
  ])
  if (usageError) throw usageError
  if (workError) throw workError
  if (versionError) throw versionError
  if (profileError) throw profileError

  const editableReferences: MediaReference[] = []
  const blockingReferences: MediaReference[] = []
  const finalizedReferences: MediaReference[] = []

  for (const usage of usages ?? []) {
    const context = String(usage.usage_context || "")
    const destinationId = String(usage.destination_id || "")
    const removable = detachableContexts.has(context as MediaImportContext)
    const reference: MediaReference = {
      key: `usage:${usage.id}`,
      context,
      label: usageLabel(context, destinationId),
      destinationId,
      removable,
      finalized: false,
    }
    if (removable) editableReferences.push(reference)
    else blockingReferences.push(reference)
  }

  for (const work of works ?? []) {
    blockingReferences.push({
      key: `portfolio:${work.id}`,
      context: "portfolio",
      label: work.title ? `Portfolio · ${work.title}` : "Portfolio work",
      destinationId: String(work.id),
      removable: false,
      finalized: false,
    })
  }

  if (profile?.cv_file_path && String(profile.cv_file_path) === item.storagePath) {
    editableReferences.push({
      key: "passport:cv",
      context: "creative_passport",
      label: "Creative Passport · CV",
      destinationId: account.user.id,
      removable: true,
      finalized: false,
    })
  }

  for (const version of versions ?? []) {
    if (!snapshotContainsMedia(version.snapshot, item)) continue
    finalizedReferences.push({
      key: `finalized:${version.id}`,
      context: "finalized_submission",
      label: `Finalized application · Version ${Number(version.version_number || 0) || "—"}`,
      destinationId: String(version.id),
      removable: false,
      finalized: true,
    })
  }

  return {
    editableReferences: uniqueReferences(editableReferences),
    blockingReferences: uniqueReferences(blockingReferences),
    finalizedReferences: uniqueReferences(finalizedReferences),
  }
}

export async function detachMediaFromContext(item: ArtistMediaLibraryItem, context: MediaImportContext, destinationId?: string) {
  if (!item.sourceId) throw new Error("This legacy portfolio asset must be managed from its portfolio work.")
  if (!detachableContexts.has(context)) throw new Error("Replace or remove this media from that destination before deleting the original source.")
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()

  const { data: source, error: sourceError } = await supabase
    .from("artist_import_sources")
    .select("id")
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (sourceError) throw sourceError
  if (!source) throw new Error("This private media source is no longer available.")

  let deletion = supabase.from("artist_media_usages").delete().eq("artist_user_id", account.user.id).eq("source_id", item.sourceId).eq("usage_context", context)
  if (destinationId !== undefined) deletion = deletion.eq("destination_id", destinationId)
  const { error: usageError } = await deletion
  if (usageError) throw usageError

  if (context === "creative_passport") {
    const { error: profileError } = await supabase.from("artist_profiles").update({ cv_file_path: "", updated_at: new Date().toISOString() }).eq("user_id", account.user.id).eq("cv_file_path", item.storagePath)
    if (profileError) throw profileError
  }

  const { count, error: countError } = await supabase
    .from("artist_media_usages")
    .select("id", { count: "exact", head: true })
    .eq("artist_user_id", account.user.id)
    .eq("source_id", item.sourceId)
  if (countError) throw countError
  const { error: sourceUpdateError } = await supabase
    .from("artist_import_sources")
    .update({ library_status: (count ?? 0) > 0 ? "attached" : "available", updated_at: new Date().toISOString() })
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
  if (sourceUpdateError) throw sourceUpdateError
}

export async function deleteMediaFromKleio(item: ArtistMediaLibraryItem, options: { removeEditableReferences?: boolean } = {}): Promise<MediaDeleteResult> {
  if (!item.sourceId) return { status: "blocked", assessment: await loadMediaDeletionAssessment(item) }
  const assessment = await loadMediaDeletionAssessment(item)
  if (assessment.blockingReferences.length || assessment.finalizedReferences.length) return { status: "blocked", assessment }
  if (assessment.editableReferences.length && !options.removeEditableReferences) return { status: "needs_detach", assessment }

  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase
    .from("artist_import_sources")
    .select("id,storage_path,mime_type,source_metadata,library_status,review_summary,deleted_at")
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (sourceError) throw sourceError
  if (!source) throw new Error("This private media source is no longer available.")

  if (options.removeEditableReferences) {
    const { error: usageError } = await supabase.from("artist_media_usages").delete().eq("artist_user_id", account.user.id).eq("source_id", item.sourceId)
    if (usageError) throw usageError
    const { error: profileError } = await supabase.from("artist_profiles").update({ cv_file_path: "", updated_at: new Date().toISOString() }).eq("user_id", account.user.id).eq("cv_file_path", item.storagePath)
    if (profileError) throw profileError
  }

  const now = new Date().toISOString()
  const previousStatus = String(source.library_status || "available")
  const previousSummary = object(source.review_summary)
  const { error: tombstoneError } = await supabase
    .from("artist_import_sources")
    .update({ library_status: "archived", deleted_at: now, review_summary: {}, last_error_category: "", updated_at: now })
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
  if (tombstoneError) throw tombstoneError

  const metadata = object(source.source_metadata)
  const explicitBucket = typeof metadata.storage_bucket === "string" ? metadata.storage_bucket : ""
  const bucket = explicitBucket || (String(source.mime_type) === "application/pdf" ? "artist-documents" : "artist-assets")
  const storagePath = String(source.storage_path || "")
  if (storagePath) {
    const { error: storageError } = await supabase.storage.from(bucket).remove([storagePath])
    if (storageError) {
      await supabase.from("artist_import_sources").update({
        library_status: previousStatus,
        deleted_at: source.deleted_at,
        review_summary: previousSummary,
        updated_at: new Date().toISOString(),
      }).eq("id", item.sourceId).eq("artist_user_id", account.user.id)
      throw new Error("KLEIO could not safely remove the private file, so the library record was restored. Nothing was deleted.")
    }
  }

  return { status: "deleted", assessment }
}
