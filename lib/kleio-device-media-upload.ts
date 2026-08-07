import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  fileSignatureMatchesKnownMime,
  mediaKindForMimeType,
  readableAcceptedMedia,
} from "@/lib/kleio-media-file-types"
import type { ArtistMediaLibraryItem, MediaImportConfig } from "@/lib/kleio-universal-media"

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim()
  return normalized.replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 110) || `media-${crypto.randomUUID()}`
}

async function requireArtistAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media upload is available only in an artist workspace.")
  return account
}

async function fileChecksum(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/")) return { width: null, height: null }
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  } catch {
    return { width: null, height: null }
  }
}

export async function signPrivateMediaPreview(storagePath: string, mimeType: string) {
  const kind = mediaKindForMimeType(mimeType)
  if (!storagePath || !["image", "video", "audio"].includes(kind)) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(storagePath, 3600)
  return error ? null : data.signedUrl
}

async function rowToItem(row: Record<string, unknown>): Promise<ArtistMediaLibraryItem> {
  const supabase = getSupabaseBrowserClient()
  const sourceId = String(row.id)
  const storagePath = typeof row.storage_path === "string" ? row.storage_path : ""
  const mimeType = typeof row.mime_type === "string" ? row.mime_type : ""
  const filename = typeof row.original_filename === "string" && row.original_filename
    ? row.original_filename
    : typeof row.label === "string" && row.label
      ? row.label
      : "Private media"
  const { data: work } = await supabase.from("portfolio_works").select("id,title").eq("import_source_id", sourceId).maybeSingle()
  return {
    id: sourceId,
    sourceId,
    storagePath,
    originalFilename: filename,
    title: work?.title || filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    mimeType,
    byteSize: typeof row.byte_size === "number" ? row.byte_size : row.byte_size ? Number(row.byte_size) : null,
    checksum: typeof row.checksum === "string" ? row.checksum : "",
    sourceType: typeof row.source_type === "string" ? row.source_type : `device_${mediaKindForMimeType(mimeType)}`,
    mediaKind: mediaKindForMimeType(mimeType),
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    libraryStatus: (["draft", "available", "attached", "archived"].includes(String(row.library_status)) ? row.library_status : "available") as ArtistMediaLibraryItem["libraryStatus"],
    usageCount: 0,
    associatedWorkId: work?.id ? String(work.id) : null,
    associatedWorkTitle: work?.title ? String(work.title) : "",
    previewUrl: await signPrivateMediaPreview(storagePath, mimeType),
    approvalState: work?.id ? "approved" : row.extraction_status === "approved" ? "approved" : "available",
  }
}

export async function validateDeviceMedia(file: File, config: MediaImportConfig) {
  const mimeType = file.type.trim().toLowerCase()
  if (!config.allowedMimeTypes.includes(mimeType)) throw new Error(`${file.name} is not accepted here. Choose ${readableAcceptedMedia(config.allowedMimeTypes)} supported by this step.`)
  if (file.size <= 0) throw new Error(`${file.name} is empty or unavailable.`)
  if (file.size > config.maxFileSizeBytes) throw new Error(`${file.name} is larger than ${Math.round(config.maxFileSizeBytes / 1024 / 1024)} MB.`)
  if (!(await fileSignatureMatchesKnownMime(file))) throw new Error(`${file.name} does not match its declared file type.`)
}

export async function uploadDeviceMediaToLibrary(file: File, config: MediaImportConfig) {
  await validateDeviceMedia(file, config)
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const [checksum, dimensions] = await Promise.all([fileChecksum(file), imageDimensions(file)])

  const { data: existing, error: existingError } = await supabase
    .from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .eq("checksum", checksum)
    .is("deleted_at", null)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing?.id && existing.storage_path) return { item: await rowToItem(existing), duplicate: true }

  const kind = mediaKindForMimeType(file.type)
  const storagePath = `${account.user.id}/media/${config.context}/${crypto.randomUUID()}-${safeFilename(file.name)}`
  const { error: uploadError } = await supabase.storage.from("artist-assets").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase.from("artist_import_sources").insert({
    artist_user_id: account.user.id,
    source_type: `device_${kind}`,
    label: file.name,
    storage_path: storagePath,
    mime_type: file.type,
    byte_size: file.size,
    checksum,
    extraction_status: "review_ready",
    extraction_method: "universal_media_v2",
    extracted_at: new Date().toISOString(),
    original_filename: file.name,
    source_metadata: { import_context: config.context, destination_type: config.destinationType, direct_media_upload: true },
    media_kind: kind,
    library_status: "available",
    width: dimensions.width,
    height: dimensions.height,
  }).select("*").single()

  if (insertError) {
    await supabase.storage.from("artist-assets").remove([storagePath])
    throw insertError
  }
  return { item: await rowToItem(row as Record<string, unknown>), duplicate: false }
}
