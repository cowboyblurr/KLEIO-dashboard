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
  if (context === "opportunity_requirement") return destinationId ? `Application requirement · ${destinationId}` : "Application requirement"
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
  return Boolean((item.sourceId && serialized.includes(item.sourceId)) || (item.storagePath && serialized.includes(item.storagePath)))
}

function storageBucket(mimeType: string, metadataValue: unknown) {
  const metadata = object(metadataValue)
  if (typeof metadata.storage_bucket === "string" && metadata.storage_bucket) return metadata.storage_bucket
  return mimeType === "application/pdf" ? "artist-documents" : "artist-assets"
}

export async function createMediaOpenUrl(item: ArtistMediaLibraryItem) {
  if (!item.sourceId) {
    if (item.previewUrl) return item.previewUrl
    throw new Error("This legacy portfolio asset must be opened from its portfolio work.")
  }
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error } = await supabase
    .from("artist_import_sources")
    .select("storage_path,mime_type,source_metadata")
    .eq("id", item.sourceId)
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) throw error
  if (!source?.storage_path) throw new Error("This private media source is no longer available.")
  const bucket = storageBucket(String(source.mime_type || item.mimeType), source.source_metadata)
  const { data, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(String(source.storage_path), 900)
  if (signedError || !data?.signedUrl) throw new Error("KLEIO could not open this private media source.")
  return data.signedUrl
}

export async function loadMediaDeletionAssessment(item: ArtistMediaLibraryItem): Promise<MediaDeletionAssessment> {
  if (!item.sourceId) {
    return {
      editableReferences: [],
      blockingReferences: [{ key: `legacy:${item.id}`, context: "portfolio", label: item.associatedWorkTitle ? `Portfolio · ${item.associatedWorkTitle}` : "Legacy portfolio work", destinationId: item.associatedWorkId || "", removable: false, finalized: false }],
      finalizedReferences: [],
    }
  }

  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase.from("artist_import_sources").select("id,storage_path").eq("id", item.sourceId).eq("artist_user_id", account.user.id).is("deleted_at", null).maybeSingle()
  if (sourceError) throw sourceError
  if (!source) throw new Error("This private media source is no longer available.")

  const [usageResult, workResult, versionResult, profileResult, attachmentResult] = await Promise.all([
    supabase.from("artist_media_usages").select("id,usage_context,destination_id,usage_role").eq("artist_user_id", account.user.id).eq("source_id", item.sourceId),
    supabase.from("portfolio_works").select("id,title").eq("artist_user_id", account.user.id).eq("import_source_id", item.sourceId),
    supabase.from("application_submission_versions").select("id,version_number,finalized_at,snapshot").eq("artist_user_id", account.user.id).order("finalized_at", { ascending: false }).limit(250),
    supabase.from("artist_profiles").select("cv_file_path").eq("user_id", account.user.id).maybeSingle(),
    supabase.from("application_requirement_attachments").select("id,requirement_id,application_id,package_id,opportunity_id,included_in_package").eq("artist_user_id", account.user.id).eq("source_id", item.sourceId),
  ])
  if (usageResult.error) throw usageResult.error
  if (workResult.error) throw workResult.error
  if (versionResult.error) throw versionResult.error
  if (profileResult.error) throw profileResult.error
  if (attachmentResult.error) throw attachmentResult.error

  const editableReferences: MediaReference[] = []
  const blockingReferences: MediaReference[] = []
  const finalizedReferences: MediaReference[] = []

  for (const usage of usageResult.data ?? []) {
    const context = String(usage.usage_context || "")
    const destinationId = String(usage.destination_id || "")
    const removable = detachableContexts.has(context as MediaImportContext)
    const reference: MediaReference = { key: `usage:${usage.id}`, context, label: usageLabel(context, destinationId), destinationId, removable, finalized: false }
    if (removable) editableReferences.push(reference)
    else blockingReferences.push(reference)
  }

  for (const attachment of attachmentResult.data ?? []) {
    const applicationId = String(attachment.application_id || "")
    const packageId = String(attachment.package_id || "")
    const requirementId = String(attachment.requirement_id || "")
    editableReferences.push({
      key: `requirement:${attachment.id}`,
      context: "opportunity_requirement",
      label: applicationId ? `Application draft · ${applicationId}` : packageId ? `Application package · ${packageId}` : `Application requirement · ${requirementId}`,
      destinationId: requirementId,
      removable: true,
      finalized: false,
    })
  }

  for (const work of workResult.data ?? []) {
    blockingReferences.push({ key: `portfolio:${work.id}`, context: "portfolio", label: work.title ? `Portfolio · ${work.title}` : "Portfolio work", destinationId: String(work.id), removable: false, finalized: false })
  }

  if (profileResult.data?.cv_file_path && String(profileResult.data.cv_file_path) === item.storagePath) {
    editableReferences.push({ key: "passport:cv", context: "creative_passport", label: "Creative Passport · CV", destinationId: account.user.id, removable: true, finalized: false })
  }

  for (const version of versionResult.data ?? []) {
    if (!snapshotContainsMedia(version.snapshot, item)) continue
    finalizedReferences.push({ key: `finalized:${version.id}`, context: "finalized_submission", label: `Finalized application · Version ${Number(version.version_number || 0) || "—"}`, destinationId: String(version.id), removable: false, finalized: true })
  }

  return { editableReferences: uniqueReferences(editableReferences), blockingReferences: uniqueReferences(blockingReferences), finalizedReferences: uniqueReferences(finalizedReferences) }
}

async function markRequirementsMissing(sourceId: string, requirementIds: string[]) {
  if (!requirementIds.length) return
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const { error } = await supabase.from("artist_requirement_assessments").update({
    status: "missing",
    explanation: "The previously selected private source was removed. Choose material again before finalizing this application.",
    evidence: [],
    validation_results: [],
    artist_confirmed_at: null,
    updated_at: now,
  }).eq("artist_user_id", account.user.id).in("requirement_id", requirementIds)
  if (error) throw error
}

export async function detachMediaFromContext(item: ArtistMediaLibraryItem, context: MediaImportContext, destinationId?: string) {
  if (!item.sourceId) throw new Error("This legacy portfolio asset must be managed from its portfolio work.")
  if (!detachableContexts.has(context)) throw new Error("Replace or remove this media from that destination before deleting the original source.")
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase.from("artist_import_sources").select("id").eq("id", item.sourceId).eq("artist_user_id", account.user.id).is("deleted_at", null).maybeSingle()
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

  if (context === "opportunity_requirement") {
    let attachmentDelete = supabase.from("application_requirement_attachments").delete().eq("artist_user_id", account.user.id).eq("source_id", item.sourceId)
    if (destinationId !== undefined) attachmentDelete = attachmentDelete.eq("requirement_id", destinationId)
    const { data: deleted, error: attachmentError } = await attachmentDelete.select("requirement_id")
    if (attachmentError) throw attachmentError
    await markRequirementsMissing(item.sourceId, Array.from(new Set((deleted ?? []).map((row) => String(row.requirement_id)))))
  }

  const { count, error: countError } = await supabase.from("artist_media_usages").select("id", { count: "exact", head: true }).eq("artist_user_id", account.user.id).eq("source_id", item.sourceId)
  if (countError) throw countError
  const { error: sourceUpdateError } = await supabase.from("artist_import_sources").update({ library_status: (count ?? 0) > 0 ? "attached" : "available", updated_at: new Date().toISOString() }).eq("id", item.sourceId).eq("artist_user_id", account.user.id)
  if (sourceUpdateError) throw sourceUpdateError
}

export async function deleteMediaFromKleio(item: ArtistMediaLibraryItem, options: { removeEditableReferences?: boolean } = {}): Promise<MediaDeleteResult> {
  if (!item.sourceId) return { status: "blocked", assessment: await loadMediaDeletionAssessment(item) }
  const assessment = await loadMediaDeletionAssessment(item)
  if (assessment.blockingReferences.length || assessment.finalizedReferences.length) return { status: "blocked", assessment }
  if (assessment.editableReferences.length && !options.removeEditableReferences) return { status: "needs_detach", assessment }

  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data: source, error: sourceError } = await supabase.from("artist_import_sources").select("id,storage_path,mime_type,source_metadata,library_status,review_summary,last_error_category,deleted_at").eq("id", item.sourceId).eq("artist_user_id", account.user.id).is("deleted_at", null).maybeSingle()
  if (sourceError) throw sourceError
  if (!source) throw new Error("This private media source is no longer available.")

  const [usageSnapshot, attachmentSnapshot, profileSnapshot] = await Promise.all([
    supabase.from("artist_media_usages").select("*").eq("artist_user_id", account.user.id).eq("source_id", item.sourceId),
    supabase.from("application_requirement_attachments").select("*").eq("artist_user_id", account.user.id).eq("source_id", item.sourceId),
    supabase.from("artist_profiles").select("cv_file_path").eq("user_id", account.user.id).maybeSingle(),
  ])
  if (usageSnapshot.error) throw usageSnapshot.error
  if (attachmentSnapshot.error) throw attachmentSnapshot.error
  if (profileSnapshot.error) throw profileSnapshot.error
  const requirementIds = Array.from(new Set((attachmentSnapshot.data ?? []).map((row) => String(row.requirement_id))))
  const assessmentSnapshot = requirementIds.length
    ? await supabase.from("artist_requirement_assessments").select("*").eq("artist_user_id", account.user.id).in("requirement_id", requirementIds)
    : { data: [], error: null }
  if (assessmentSnapshot.error) throw assessmentSnapshot.error

  const restore = async () => {
    await supabase.from("artist_import_sources").update({ library_status: source.library_status, review_summary: source.review_summary, last_error_category: source.last_error_category, deleted_at: source.deleted_at, updated_at: new Date().toISOString() }).eq("id", item.sourceId).eq("artist_user_id", account.user.id)
    if ((usageSnapshot.data ?? []).length) await supabase.from("artist_media_usages").upsert(usageSnapshot.data ?? [])
    if ((attachmentSnapshot.data ?? []).length) await supabase.from("application_requirement_attachments").upsert(attachmentSnapshot.data ?? [])
    if ((assessmentSnapshot.data ?? []).length) await supabase.from("artist_requirement_assessments").upsert(assessmentSnapshot.data ?? [])
    if (profileSnapshot.data?.cv_file_path === item.storagePath) await supabase.from("artist_profiles").update({ cv_file_path: item.storagePath, updated_at: new Date().toISOString() }).eq("user_id", account.user.id)
  }

  try {
    if (options.removeEditableReferences) {
      const { error: usageError } = await supabase.from("artist_media_usages").delete().eq("artist_user_id", account.user.id).eq("source_id", item.sourceId)
      if (usageError) throw usageError
      const { error: attachmentError } = await supabase.from("application_requirement_attachments").delete().eq("artist_user_id", account.user.id).eq("source_id", item.sourceId)
      if (attachmentError) throw attachmentError
      await markRequirementsMissing(item.sourceId, requirementIds)
      const { error: profileError } = await supabase.from("artist_profiles").update({ cv_file_path: "", updated_at: new Date().toISOString() }).eq("user_id", account.user.id).eq("cv_file_path", item.storagePath)
      if (profileError) throw profileError
    }

    const now = new Date().toISOString()
    const { error: tombstoneError } = await supabase.from("artist_import_sources").update({ library_status: "archived", deleted_at: now, review_summary: {}, last_error_category: "", updated_at: now }).eq("id", item.sourceId).eq("artist_user_id", account.user.id)
    if (tombstoneError) throw tombstoneError

    const storagePath = String(source.storage_path || "")
    if (storagePath) {
      const bucket = storageBucket(String(source.mime_type || item.mimeType), source.source_metadata)
      const { error: storageError } = await supabase.storage.from(bucket).remove([storagePath])
      if (storageError) throw storageError
    }
  } catch (reason) {
    await restore()
    throw new Error(reason instanceof Error && reason.message ? `KLEIO could not safely delete this media, so its active references were restored. ${reason.message}` : "KLEIO could not safely delete this media, so its active references were restored.")
  }

  return { status: "deleted", assessment }
}
