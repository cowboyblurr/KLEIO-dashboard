import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import {
  normalizeRequirementFileTypes,
  requirementFileTypeMatches,
  REQUIREMENT_FILE_TYPE_ALIASES,
} from "@/lib/kleio-requirement-file-types"
import {
  fileSignatureMatchesKnownMime,
  mediaKindForMimeType,
} from "@/lib/kleio-media-file-types"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim()
  return normalized.replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 110) || `requirement-${crypto.randomUUID()}`
}

function extension(value: string) {
  return value.toLowerCase().split(".").pop()?.replace(/[^a-z0-9]+/g, "") || ""
}

function filenameMimeCandidates(name: string) {
  return REQUIREMENT_FILE_TYPE_ALIASES[extension(name)] ?? []
}

function resolvedMimeType(file: File) {
  const declared = file.type.trim().toLowerCase()
  if (declared) return declared
  return filenameMimeCandidates(file.name)[0] ?? "application/octet-stream"
}

async function checksum(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

function acceptedByRequirement(file: File, allowedMimeTypes: string[]) {
  const mimeType = resolvedMimeType(file)
  if (allowedMimeTypes.includes(mimeType)) return mimeType
  const fromFilename = filenameMimeCandidates(file.name).find((candidate) => allowedMimeTypes.includes(candidate))
  return fromFilename ?? null
}

async function imageDimensions(file: File) {
  if (!resolvedMimeType(file).startsWith("image/")) return { width: null, height: null }
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  } catch {
    return { width: null, height: null }
  }
}

async function signedUrl(storagePath: string, mimeType: string) {
  if (!storagePath || !["image", "video", "audio"].includes(mediaKindForMimeType(mimeType))) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(storagePath, 3600)
  return error ? null : data.signedUrl
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to add application material.")
  if (account.profile.role !== "artist") throw new Error("Application material is available only in an artist workspace.")
  return account
}

async function sourceToItem(row: Record<string, unknown>): Promise<ArtistMediaLibraryItem> {
  const mimeType = typeof row.mime_type === "string" ? row.mime_type : "application/octet-stream"
  const storagePath = typeof row.storage_path === "string" ? row.storage_path : ""
  const filename = typeof row.original_filename === "string" && row.original_filename ? row.original_filename : typeof row.label === "string" ? row.label : "Private file"
  return {
    id: String(row.id),
    sourceId: String(row.id),
    storagePath,
    originalFilename: filename,
    title: filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    mimeType,
    byteSize: row.byte_size === null || row.byte_size === undefined ? null : Number(row.byte_size),
    checksum: typeof row.checksum === "string" ? row.checksum : "",
    sourceType: typeof row.source_type === "string" ? row.source_type : "existing_kleio_media",
    mediaKind: mediaKindForMimeType(mimeType),
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    libraryStatus: "available",
    usageCount: 0,
    associatedWorkId: null,
    associatedWorkTitle: "",
    previewUrl: await signedUrl(storagePath, mimeType),
    approvalState: "available",
  }
}

export async function loadRequirementFileLibrary(allowedMimeTypes: string[]) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_import_sources")
    .select("id,source_type,label,storage_path,mime_type,byte_size,checksum,original_filename,media_kind,library_status,width,height,created_at")
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .neq("storage_path", "")
    .neq("library_status", "archived")
    .order("created_at", { ascending: false })
    .limit(120)
  if (error) throw error
  const eligible = (data ?? []).filter((row) => {
    const mimeType = String(row.mime_type || "").toLowerCase()
    if (allowedMimeTypes.includes(mimeType)) return true
    return filenameMimeCandidates(String(row.original_filename || row.label || "")).some((candidate) => allowedMimeTypes.includes(candidate))
  })
  return Promise.all(eligible.map((row) => sourceToItem(row as Record<string, unknown>)))
}

export async function uploadRequirementFile(input: {
  file: File
  allowedMimeTypes: string[]
  maximumFileSizeBytes: number
  sourceAcceptedTypes?: string[]
}) {
  const file = input.file
  if (file.size <= 0) throw new Error(`${file.name} is empty or unavailable.`)
  if (file.size > input.maximumFileSizeBytes) throw new Error(`${file.name} is larger than ${Math.round(input.maximumFileSizeBytes / 1024 / 1024)} MB.`)
  const mimeType = acceptedByRequirement(file, input.allowedMimeTypes)
  if (!mimeType) throw new Error(`${file.name} is not one of the supported media/file types for this requirement.`)
  const validationFile = file.type === mimeType ? file : new File([file], file.name, { type: mimeType, lastModified: file.lastModified })
  if (!(await fileSignatureMatchesKnownMime(validationFile))) throw new Error(`${file.name} does not match its file type. Choose the original file rather than a renamed extension.`)
  if ((input.sourceAcceptedTypes?.length ?? 0) > 0 && requirementFileTypeMatches(mimeType, input.sourceAcceptedTypes) === false) throw new Error(`${file.name} does not match the formats stated by the opportunity source.`)

  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const [fileChecksum, dimensions] = await Promise.all([checksum(file), imageDimensions(validationFile)])
  const { data: existing, error: existingError } = await supabase
    .from("artist_import_sources")
    .select("id,source_type,label,storage_path,mime_type,byte_size,checksum,original_filename,media_kind,library_status,width,height,created_at")
    .eq("artist_user_id", account.user.id)
    .eq("checksum", fileChecksum)
    .is("deleted_at", null)
    .maybeSingle()
  if (existingError) throw existingError
  if (existing?.id && existing.storage_path) return { item: await sourceToItem(existing as Record<string, unknown>), duplicate: true }

  const kind = mediaKindForMimeType(mimeType)
  const storagePath = `${account.user.id}/media/opportunity_requirement/${crypto.randomUUID()}-${safeFilename(file.name)}`
  const { error: uploadError } = await supabase.storage.from("artist-assets").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: mimeType,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase.from("artist_import_sources").insert({
    artist_user_id: account.user.id,
    source_type: `device_${kind}`,
    label: file.name,
    storage_path: storagePath,
    mime_type: mimeType,
    byte_size: file.size,
    checksum: fileChecksum,
    extraction_status: "review_ready",
    extraction_method: "requirement_file_v2",
    extracted_at: new Date().toISOString(),
    original_filename: file.name,
    source_metadata: { import_context: "opportunity_requirement", source_accepted_types: input.sourceAcceptedTypes ?? [] },
    media_kind: kind,
    library_status: "available",
    width: dimensions.width,
    height: dimensions.height,
  }).select("id,source_type,label,storage_path,mime_type,byte_size,checksum,original_filename,media_kind,library_status,width,height,created_at").single()

  if (insertError) {
    await supabase.storage.from("artist-assets").remove([storagePath])
    throw insertError
  }
  return { item: await sourceToItem(row as Record<string, unknown>), duplicate: false }
}

export function normalizedRequirementAcceptedTypes(values: string[]) {
  return normalizeRequirementFileTypes(values)
}
