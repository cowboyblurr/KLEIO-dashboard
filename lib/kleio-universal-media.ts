import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type MediaImportContext =
  | "artist_onboarding"
  | "creative_passport"
  | "portfolio"
  | "profile_image"
  | "profile_cover"
  | "application_material"
  | "application_portfolio_selection"
  | "opportunity_requirement"
  | "existing_media_library"

export type MediaSourceType = "device" | "google_drive" | "kleio_library" | "instagram"
export type MediaKind = "image" | "document" | "video" | "audio"
export type MediaUsageRole = "primary" | "detail" | "cover" | "profile" | "cv" | "supporting_document" | "application_attachment" | "selected_work"

export type MediaImportConfig = {
  context: MediaImportContext
  title: string
  description: string
  completionAction: string
  allowedMimeTypes: string[]
  maxFileSizeBytes: number
  maxSelectionCount: number
  allowMultiple: boolean
  availableSources: MediaSourceType[]
  requireMetadataReview: boolean
  requireExplicitApproval: boolean
  allowExistingKleioMedia: boolean
  allowDraftSave: boolean
  destinationType: string
  destinationId?: string
  usageRole: MediaUsageRole
}

export type ArtistMediaLibraryItem = {
  id: string
  sourceId: string | null
  storagePath: string
  originalFilename: string
  title: string
  mimeType: string
  byteSize: number | null
  checksum: string
  sourceType: string
  mediaKind: MediaKind
  width: number | null
  height: number | null
  createdAt: string
  libraryStatus: "draft" | "available" | "attached" | "archived"
  usageCount: number
  associatedWorkId: string | null
  associatedWorkTitle: string
  previewUrl: string | null
  approvalState: "draft" | "approved" | "available"
}

export type MediaSelectionResult = {
  items: ArtistMediaLibraryItem[]
  source: Exclude<MediaSourceType, "instagram">
}

export type GoogleDrivePickerFile = {
  id: string
  name: string
  mimeType: string
}

export type MediaSourceAdapter = {
  type: MediaSourceType
  isAvailable(config: MediaImportConfig): boolean
  getPermissionExplanation(config: MediaImportConfig): string
}

const DEFAULT_CONFIGS: Record<MediaImportContext, Omit<MediaImportConfig, "context" | "destinationId">> = {
  artist_onboarding: {
    title: "Bring your existing work into KLEIO",
    description: "Choose artwork you already have. KLEIO prepares private, editable records and waits for your approval.",
    completionAction: "Add selected media",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 30,
    allowMultiple: true,
    availableSources: ["device", "google_drive", "kleio_library", "instagram"],
    requireMetadataReview: true,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "creative_passport",
    usageRole: "primary",
  },
  creative_passport: {
    title: "Add existing materials",
    description: "Bring artwork or a supporting file into your private Creative Passport workspace.",
    completionAction: "Use selected media",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 20,
    allowMultiple: true,
    availableSources: ["device", "google_drive", "kleio_library", "instagram"],
    requireMetadataReview: true,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "creative_passport",
    usageRole: "supporting_document",
  },
  portfolio: {
    title: "Add artwork",
    description: "Start with the images. Review each work visually, then add only the details that help you reuse it.",
    completionAction: "Continue with selected media",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 30,
    allowMultiple: true,
    availableSources: ["device", "google_drive", "kleio_library", "instagram"],
    requireMetadataReview: true,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "portfolio",
    usageRole: "primary",
  },
  profile_image: {
    title: "Choose a profile image",
    description: "Select one image. Nothing changes until you confirm it.",
    completionAction: "Use this image",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 5 * 1024 * 1024,
    maxSelectionCount: 1,
    allowMultiple: false,
    availableSources: ["device", "google_drive", "kleio_library"],
    requireMetadataReview: false,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: false,
    destinationType: "artist_profile",
    usageRole: "profile",
  },
  profile_cover: {
    title: "Choose a cover image",
    description: "Select one wide image for the artist-profile cover.",
    completionAction: "Use this cover",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 10 * 1024 * 1024,
    maxSelectionCount: 1,
    allowMultiple: false,
    availableSources: ["device", "google_drive", "kleio_library"],
    requireMetadataReview: false,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: false,
    destinationType: "artist_profile",
    usageRole: "cover",
  },
  application_material: {
    title: "Add required material",
    description: "Choose only files that match this opportunity requirement. KLEIO keeps them in the draft until you attach them.",
    completionAction: "Attach to application draft",
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 10,
    allowMultiple: true,
    availableSources: ["device", "google_drive", "kleio_library"],
    requireMetadataReview: false,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "application",
    usageRole: "application_attachment",
  },
  application_portfolio_selection: {
    title: "Choose works for this application",
    description: "Reuse approved KLEIO works first. Import a missing work only when it is not already in your portfolio.",
    completionAction: "Add selected works",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 10,
    allowMultiple: true,
    availableSources: ["kleio_library", "device", "google_drive"],
    requireMetadataReview: true,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "application",
    usageRole: "selected_work",
  },
  opportunity_requirement: {
    title: "Add material for this requirement",
    description: "The opportunity controls the accepted file types, size, and number of files.",
    completionAction: "Use for this requirement",
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 10,
    allowMultiple: true,
    availableSources: ["kleio_library", "device", "google_drive"],
    requireMetadataReview: false,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: true,
    destinationType: "opportunity_requirement",
    usageRole: "application_attachment",
  },
  existing_media_library: {
    title: "Choose from your KLEIO Library",
    description: "Reuse private media you have already added without uploading another copy.",
    completionAction: "Use selected media",
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    maxFileSizeBytes: 20 * 1024 * 1024,
    maxSelectionCount: 30,
    allowMultiple: true,
    availableSources: ["kleio_library"],
    requireMetadataReview: false,
    requireExplicitApproval: true,
    allowExistingKleioMedia: true,
    allowDraftSave: false,
    destinationType: "media_library",
    usageRole: "primary",
  },
}

export function mediaImportConfig(context: MediaImportContext, overrides: Partial<MediaImportConfig> = {}): MediaImportConfig {
  return { context, ...DEFAULT_CONFIGS[context], ...overrides }
}

export const MEDIA_SOURCE_ADAPTERS: MediaSourceAdapter[] = [
  {
    type: "device",
    isAvailable: (config) => config.availableSources.includes("device"),
    getPermissionExplanation: () => "KLEIO receives only the files you choose from this device.",
  },
  {
    type: "google_drive",
    isAvailable: (config) => config.availableSources.includes("google_drive"),
    getPermissionExplanation: () => "Drive access is separate from Google login. KLEIO receives only files you select in Google Picker.",
  },
  {
    type: "kleio_library",
    isAvailable: (config) => config.allowExistingKleioMedia && config.availableSources.includes("kleio_library"),
    getPermissionExplanation: () => "KLEIO reuses the existing private asset instead of creating another copy.",
  },
  {
    type: "instagram",
    isAvailable: () => false,
    getPermissionExplanation: () => "Instagram Professional Account import is planned but is not connected in this beta.",
  },
]

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim()
  return normalized.replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 110) || `media-${crypto.randomUUID()}`
}

function mediaKindFor(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

function sourceTypeFor(source: "device" | "google_drive", mimeType: string) {
  const suffix = mimeType.startsWith("image/") ? "image" : "document"
  return `${source}_${suffix}`
}

async function requireArtistAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media import is available only in an artist workspace.")
  return account
}

async function fileChecksum(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

async function fileSignatureMatches(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (file.type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index])
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (file.type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  return false
}

async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/")) return { width: null, height: null }
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}

export async function validateMediaFile(file: File, config: MediaImportConfig) {
  if (!config.allowedMimeTypes.includes(file.type)) throw new Error(`${file.name} is not an accepted file type for this step.`)
  if (file.size <= 0) throw new Error(`${file.name} is empty or unavailable.`)
  if (file.size > config.maxFileSizeBytes) throw new Error(`${file.name} is larger than ${Math.round(config.maxFileSizeBytes / 1024 / 1024)} MB.`)
  if (!(await fileSignatureMatches(file))) throw new Error(`${file.name} does not match its declared file type.`)
}

async function signedUrl(storagePath: string, mimeType: string) {
  if (!storagePath || !mimeType.startsWith("image/")) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(storagePath, 3600)
  if (error) return null
  return data.signedUrl
}

export async function uploadMediaToLibrary(input: {
  file: File
  source: "device" | "google_drive"
  config: MediaImportConfig
  providerFileId?: string
  providerMetadata?: Record<string, unknown>
}) {
  await validateMediaFile(input.file, input.config)
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const [checksum, dimensions] = await Promise.all([fileChecksum(input.file), imageDimensions(input.file)])

  const { data: existing, error: existingError } = await supabase
    .from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .eq("checksum", checksum)
    .is("deleted_at", null)
    .maybeSingle()
  if (existingError) throw existingError

  if (existing?.id && existing.storage_path) {
    return {
      item: await sourceRowToLibraryItem(existing, null, 0),
      duplicate: true,
    }
  }

  const kind = mediaKindFor(input.file.type)
  const storagePath = `${account.user.id}/media/${input.config.context}/${crypto.randomUUID()}-${safeFilename(input.file.name)}`
  const { error: uploadError } = await supabase.storage.from("artist-assets").upload(storagePath, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  })
  if (uploadError) throw uploadError

  const { data: row, error: insertError } = await supabase
    .from("artist_import_sources")
    .insert({
      artist_user_id: account.user.id,
      source_type: sourceTypeFor(input.source, input.file.type),
      label: input.file.name,
      storage_path: storagePath,
      mime_type: input.file.type,
      byte_size: input.file.size,
      checksum,
      extraction_status: "review_ready",
      extraction_method: "universal_media_v1",
      extracted_at: new Date().toISOString(),
      provider_file_id: input.providerFileId || null,
      original_filename: input.file.name,
      source_metadata: {
        import_context: input.config.context,
        destination_type: input.config.destinationType,
        ...input.providerMetadata,
      },
      media_kind: kind,
      library_status: "available",
      width: dimensions.width,
      height: dimensions.height,
    })
    .select("*")
    .single()

  if (insertError) {
    await supabase.storage.from("artist-assets").remove([storagePath])
    throw insertError
  }

  return {
    item: await sourceRowToLibraryItem(row, null, 0),
    duplicate: false,
  }
}

async function sourceRowToLibraryItem(row: Record<string, unknown>, work: Record<string, unknown> | null, usageCount: number): Promise<ArtistMediaLibraryItem> {
  const storagePath = typeof row.storage_path === "string" ? row.storage_path : ""
  const mimeType = typeof row.mime_type === "string" ? row.mime_type : ""
  const filename = typeof row.original_filename === "string" && row.original_filename ? row.original_filename : typeof row.label === "string" ? row.label : "Private media"
  return {
    id: String(row.id),
    sourceId: String(row.id),
    storagePath,
    originalFilename: filename,
    title: typeof work?.title === "string" && work.title ? work.title : filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "),
    mimeType,
    byteSize: typeof row.byte_size === "number" ? row.byte_size : row.byte_size ? Number(row.byte_size) : null,
    checksum: typeof row.checksum === "string" ? row.checksum : "",
    sourceType: typeof row.source_type === "string" ? row.source_type : "existing_kleio_media",
    mediaKind: (typeof row.media_kind === "string" ? row.media_kind : mediaKindFor(mimeType)) as MediaKind,
    width: row.width ? Number(row.width) : null,
    height: row.height ? Number(row.height) : null,
    createdAt: typeof row.created_at === "string" ? row.created_at : new Date().toISOString(),
    libraryStatus: (["draft","available","attached","archived"].includes(String(row.library_status)) ? row.library_status : "available") as ArtistMediaLibraryItem["libraryStatus"],
    usageCount,
    associatedWorkId: typeof work?.id === "string" ? work.id : null,
    associatedWorkTitle: typeof work?.title === "string" ? work.title : "",
    previewUrl: await signedUrl(storagePath, mimeType),
    approvalState: typeof work?.id === "string" ? "approved" : row.extraction_status === "approved" ? "approved" : "available",
  }
}

export async function loadArtistMediaLibrary(filters: {
  kinds?: MediaKind[]
  mimeTypes?: string[]
  search?: string
  limit?: number
} = {}): Promise<ArtistMediaLibraryItem[]> {
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  let sourceQuery = supabase
    .from("artist_import_sources")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .is("deleted_at", null)
    .neq("storage_path", "")
    .neq("library_status", "archived")
    .order("created_at", { ascending: false })
    .limit(filters.limit ?? 100)
  if (filters.kinds?.length) sourceQuery = sourceQuery.in("media_kind", filters.kinds)
  if (filters.mimeTypes?.length) sourceQuery = sourceQuery.in("mime_type", filters.mimeTypes)
  const [{ data: sources, error: sourceError }, { data: works, error: workError }, { data: usages, error: usageError }] = await Promise.all([
    sourceQuery,
    supabase.from("portfolio_works").select("id,title,import_source_id,image_path,created_at").eq("artist_user_id", account.user.id),
    supabase.from("artist_media_usages").select("source_id").eq("artist_user_id", account.user.id),
  ])
  if (sourceError) throw sourceError
  if (workError) throw workError
  if (usageError) throw usageError

  const usageCounts = new Map<string, number>()
  for (const usage of usages ?? []) usageCounts.set(String(usage.source_id), (usageCounts.get(String(usage.source_id)) ?? 0) + 1)
  const workBySource = new Map<string, Record<string, unknown>>()
  for (const work of works ?? []) if (work.import_source_id) workBySource.set(String(work.import_source_id), work as Record<string, unknown>)

  const sourceItems = await Promise.all((sources ?? []).map((row) => sourceRowToLibraryItem(row as Record<string, unknown>, workBySource.get(String(row.id)) ?? null, usageCounts.get(String(row.id)) ?? 0)))
  const knownPaths = new Set(sourceItems.map((item) => item.storagePath))
  const legacyItems = await Promise.all((works ?? []).flatMap((work) => {
    if (!work.image_path || knownPaths.has(String(work.image_path))) return []
    const mimeType = "image/jpeg"
    return [Promise.resolve({
      id: `portfolio:${work.id}`,
      sourceId: null,
      storagePath: String(work.image_path),
      originalFilename: String(work.title || "Portfolio work"),
      title: String(work.title || "Portfolio work"),
      mimeType,
      byteSize: null,
      checksum: "",
      sourceType: "existing_kleio_media",
      mediaKind: "image" as MediaKind,
      width: null,
      height: null,
      createdAt: String(work.created_at),
      libraryStatus: "attached" as const,
      usageCount: 1,
      associatedWorkId: String(work.id),
      associatedWorkTitle: String(work.title || ""),
      previewUrl: null as string | null,
      approvalState: "approved" as const,
    }).then(async (item) => ({ ...item, previewUrl: await signedUrl(item.storagePath, mimeType) }))]
  }))

  const search = filters.search?.trim().toLowerCase()
  return [...sourceItems, ...legacyItems].filter((item) => !search || `${item.title} ${item.originalFilename} ${item.associatedWorkTitle}`.toLowerCase().includes(search))
}

export async function recordMediaUsage(input: {
  item: ArtistMediaLibraryItem
  context: MediaImportContext
  destinationId?: string
  role: MediaUsageRole
}) {
  if (!input.item.sourceId) return null
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_media_usages").upsert({
    artist_user_id: account.user.id,
    source_id: input.item.sourceId,
    usage_context: input.context,
    destination_id: input.destinationId || "",
    usage_role: input.role,
    updated_at: new Date().toISOString(),
  }, { onConflict: "artist_user_id,source_id,usage_context,destination_id,usage_role" }).select("*").single()
  if (error) throw error
  await supabase.from("artist_import_sources").update({ library_status: "attached", updated_at: new Date().toISOString() }).eq("id", input.item.sourceId)
  return data
}

export async function createPortfolioWorkFromMedia(input: {
  item: ArtistMediaLibraryItem
  title: string
  year?: string
  medium?: string
  dimensions?: string
  description?: string
  series?: string
  tags?: string[]
  accessibilityAltText?: string
}) {
  const title = input.title.trim()
  if (!title) throw new Error("Add an artwork title before saving.")
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  if (input.item.associatedWorkId) return input.item.associatedWorkId
  if (input.item.sourceId) {
    const { data: existing, error: existingError } = await supabase.from("portfolio_works").select("id").eq("artist_user_id", account.user.id).eq("import_source_id", input.item.sourceId).maybeSingle()
    if (existingError) throw existingError
    if (existing?.id) return String(existing.id)
  }
  const { data, error } = await supabase.from("portfolio_works").insert({
    artist_user_id: account.user.id,
    title,
    year: input.year?.trim() || "",
    medium: input.medium?.trim() || "",
    dimensions: input.dimensions?.trim() || "",
    description: input.description?.trim() || "",
    series: input.series?.trim() || "",
    tags: input.tags ?? [],
    image_path: input.item.storagePath,
    import_source_id: input.item.sourceId,
    accessibility_alt_text: input.accessibilityAltText?.trim() || "",
    field_provenance: {
      title: { status: "confirmed", source: "Confirmed by artist in visual portfolio studio" },
      media: { status: "confirmed", source: input.item.sourceType },
    },
    approval_status: "approved",
  }).select("id").single()
  if (error) throw error
  if (input.item.sourceId) await recordMediaUsage({ item: input.item, context: "portfolio", destinationId: String(data.id), role: "primary" })
  return String(data.id)
}

export async function attachMediaToCreativePassportCv(item: ArtistMediaLibraryItem) {
  if (item.mimeType !== "application/pdf") throw new Error("Choose a PDF for the Creative Passport CV.")
  const account = await requireArtistAccount()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_profiles").update({ cv_file_path: item.storagePath, updated_at: new Date().toISOString() }).eq("user_id", account.user.id)
  if (error) throw error
  await recordMediaUsage({ item, context: "creative_passport", destinationId: account.user.id, role: "cv" })
}

export async function archiveMediaLibraryItem(item: ArtistMediaLibraryItem) {
  if (!item.sourceId) throw new Error("This legacy portfolio asset is managed from its portfolio work.")
  if (item.usageCount > 0 || item.associatedWorkId) throw new Error("This file is currently used elsewhere. Remove those associations before archiving it.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_sources").update({ library_status: "archived", deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", item.sourceId)
  if (error) throw error
}

function loadScript(id: string, src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing?.dataset.loaded === "true") return resolve()
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
      return
    }
    const script = document.createElement("script")
    script.id = id
    script.src = src
    script.async = true
    script.defer = true
    script.addEventListener("load", () => { script.dataset.loaded = "true"; resolve() }, { once: true })
    script.addEventListener("error", () => reject(new Error("A required Google service could not load.")), { once: true })
    document.head.appendChild(script)
  })
}

async function ensureGooglePicker() {
  await Promise.all([
    loadScript("kleio-google-identity", "https://accounts.google.com/gsi/client"),
    loadScript("kleio-google-api", "https://apis.google.com/js/api.js"),
  ])
  await new Promise<void>((resolve, reject) => {
    const gapi = (window as typeof window & { gapi?: { load?: (name: string, options: { callback: () => void; onerror: () => void }) => void } }).gapi
    if (!gapi?.load) return reject(new Error("Google Picker did not initialize."))
    gapi.load("picker", { callback: resolve, onerror: () => reject(new Error("Google Picker did not initialize.")) })
  })
}

export async function chooseGoogleDriveFiles(config: MediaImportConfig): Promise<{ files: GoogleDrivePickerFile[]; accessToken: string }> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID ?? ""
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY ?? ""
  const appId = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_APP_ID ?? ""
  if (!clientId || !apiKey) throw new Error("Google Drive is not configured for this KLEIO deployment.")
  await ensureGooglePicker()
  const google = (window as typeof window & { google?: Record<string, any> }).google as any
  if (!google?.accounts?.oauth2 || !google?.picker) throw new Error("Google Drive authorization did not initialize.")

  const accessToken = await new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.file",
      include_granted_scopes: false,
      callback: (response: { access_token?: string; error?: string; error_description?: string }) => response.access_token ? resolve(response.access_token) : reject(new Error(response.error_description || response.error || "Drive permission was not granted.")),
      error_callback: () => reject(new Error("Google Drive authorization was cancelled or blocked.")),
    })
    client.requestAccessToken({ prompt: "consent" })
  })

  const mimeTypes = config.allowedMimeTypes.join(",")
  const files = await new Promise<GoogleDrivePickerFile[]>((resolve, reject) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS).setMimeTypes(mimeTypes).setMode(google.picker.DocsViewMode.LIST)
    const builder = new google.picker.PickerBuilder().addView(view).setOAuthToken(accessToken).setDeveloperKey(apiKey)
    if (config.allowMultiple) builder.enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
    if (appId) builder.setAppId(appId)
    builder.setCallback((data: { action?: string; docs?: Array<{ id?: string; name?: string; mimeType?: string; type?: string }> }) => {
      if (data.action === google.picker.Action.PICKED) {
        resolve((data.docs ?? []).slice(0, config.maxSelectionCount).flatMap((doc) => doc.id && (doc.mimeType || doc.type) ? [{ id: doc.id, name: doc.name || "Drive media", mimeType: doc.mimeType || doc.type || "" }] : []))
      } else if (data.action === google.picker.Action.CANCEL) resolve([])
      else if (data.action === google.picker.Action.ERROR) reject(new Error("Google Drive could not complete the selection."))
    }).build().setVisible(true)
  })

  return { files, accessToken }
}

export async function downloadGoogleDriveFile(file: GoogleDrivePickerFile, accessToken: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Google Drive access expired or was denied. Reconnect and select the file again.")
    throw new Error(`${file.name} could not be copied from Google Drive.`)
  }
  const blob = await response.blob()
  return new File([blob], file.name, { type: blob.type || file.mimeType, lastModified: Date.now() })
}

export function revokeGoogleDriveAccess(accessToken: string) {
  const google = (window as typeof window & { google?: Record<string, any> }).google as any
  if (!accessToken || !google?.accounts?.oauth2?.revoke) return Promise.resolve()
  return new Promise<void>((resolve) => google.accounts.oauth2.revoke(accessToken, () => resolve()))
}
