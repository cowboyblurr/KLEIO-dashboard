import {
  clearLocalKleioDraft,
  loadRemoteKleioDraft,
  newestKleioDraft,
  readLocalKleioDraft,
  saveLocalKleioDraft,
  saveRemoteKleioDraft,
  type KleioDraftEnvelope,
} from "@/lib/kleio-passport-drafts"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export const ARTWORK_IMPORT_DRAFT_KEY = "artwork_import_active"
export const ARTWORK_IMPORT_MAX_BYTES = 20 * 1024 * 1024
export const ARTWORK_IMPORT_ACCEPT = "image/jpeg,image/png,image/webp"

export type ArtworkFieldStatus = "extracted" | "suggested" | "missing" | "edited" | "confirmed"
export type ArtworkImportSourceType = "device_image" | "google_drive_image"
export type ArtworkImportStep = "source" | "review" | "complete"
export type ArtworkImportItemStatus = "ready" | "approved" | "failed"

export type ArtworkImportField = {
  value: string
  status: ArtworkFieldStatus
  source: string
  confidence: "strong_source_match" | "possible_suggestion" | "needs_artist_confirmation"
}

export type ArtworkImportItem = {
  id: string
  sourceId: string
  sourceType: ArtworkImportSourceType
  providerFileId: string
  originalFilename: string
  storagePath: string
  mimeType: string
  byteSize: number
  checksum: string
  width: number | null
  height: number | null
  aspectRatio: number | null
  sourceMetadata: Record<string, unknown>
  fields: {
    title: ArtworkImportField
    year: ArtworkImportField
    medium: ArtworkImportField
    dimensions: ArtworkImportField
    series: ArtworkImportField
    description: ArtworkImportField
    tags: ArtworkImportField
    altText: ArtworkImportField
  }
  status: ArtworkImportItemStatus
  error: string
  createdAt: string
  approvedAt: string | null
  portfolioWorkId: string | null
}

export type ArtworkImportDraftPayload = Record<string, unknown> & {
  version: 1
  sessionId: string
  step: ArtworkImportStep
  activeItemId: string
  items: ArtworkImportItem[]
  updatedAt: string
}

export type GoogleDrivePickerFile = { id: string; name: string; mimeType: string }

type EmbeddedMetadata = {
  title: string
  description: string
  creator: string
  copyright: string
  keywords: string[]
  createdAt: string
}

type ImageInspection = {
  width: number
  height: number
  aspectRatio: number
  orientation: "landscape" | "portrait" | "square"
  palette: "light" | "dark" | "warm" | "cool" | "balanced"
  embedded: EmbeddedMetadata
}

const GENERIC_FILENAME = /^(img|dsc|dcim|image|photo|scan|screenshot|untitled)[-_ ]?\d*$/i
const YEAR_PATTERN = /\b(19|20)\d{2}\b/
const DIMENSION_PATTERN = /\b(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(cm|mm|in|inch|inches|ft|feet|m)?\b/i
const MEDIUM_TERMS: Array<[RegExp, string]> = [
  [/\boil(?:[_ -]on[_ -]canvas)?\b/i, "Oil on canvas"],
  [/\bacrylic(?:[_ -]on[_ -]canvas)?\b/i, "Acrylic on canvas"],
  [/\bwatercolou?r\b/i, "Watercolor"],
  [/\bgouache\b/i, "Gouache"],
  [/\bceramic(?:s)?\b|\bclay\b/i, "Ceramics"],
  [/\bphotograph(?:y|ic)?\b|\bphoto\b/i, "Photography"],
  [/\bdigital\b/i, "Digital media"],
  [/\bmixed[_ -]media\b/i, "Mixed media"],
  [/\binstallation\b/i, "Installation"],
  [/\bsculpture\b/i, "Sculpture"],
  [/\btextile\b|\bfiber\b|\bfibre\b/i, "Textile"],
  [/\bdrawing\b|\bgraphite\b|\bcharcoal\b/i, "Drawing"],
  [/\bprint(?:making)?\b|\bscreenprint\b|\blithograph\b/i, "Printmaking"],
]

function cleanText(value: unknown, max = 5_000) {
  return typeof value === "string" ? value.replace(/\0/g, "").trim().slice(0, max) : ""
}

function cleanTags(values: string[]) {
  return Array.from(new Set(values.map((value) => cleanText(value, 80)).filter(Boolean))).slice(0, 20)
}

function safeFilename(value: string) {
  const normalized = value.normalize("NFKD").replace(/[^\w.\- ]+/g, "").trim()
  return normalized.replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 110) || `artwork-${crypto.randomUUID()}.bin`
}

function field(value: string, status: ArtworkFieldStatus, source: string, confidence: ArtworkImportField["confidence"]): ArtworkImportField {
  return { value: cleanText(value), status, source, confidence }
}

function blankField(source: string) {
  return field("", "missing", source, "needs_artist_confirmation")
}

function filenameStem(filename: string) {
  return filename.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()
}

function titleFromFilename(filename: string) {
  const stem = filenameStem(filename)
  if (!stem || GENERIC_FILENAME.test(stem)) return ""
  return stem
    .replace(YEAR_PATTERN, "")
    .replace(DIMENSION_PATTERN, "")
    .replace(/\b(oil|acrylic|watercolou?r|gouache|ceramics?|clay|photograph(?:y)?|photo|digital|mixed media|installation|sculpture|textile|drawing|graphite|charcoal|printmaking)\b/gi, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s,.;:_-]+|[\s,.;:_-]+$/g, "")
    .trim()
}

function filenameSuggestions(filename: string) {
  const stem = filenameStem(filename)
  const year = stem.match(YEAR_PATTERN)?.[0] ?? ""
  const dimensionsMatch = stem.match(DIMENSION_PATTERN)
  const dimensions = dimensionsMatch ? `${dimensionsMatch[1]} × ${dimensionsMatch[2]}${dimensionsMatch[3] ? ` ${dimensionsMatch[3]}` : ""}` : ""
  const medium = MEDIUM_TERMS.find(([pattern]) => pattern.test(stem))?.[1] ?? ""
  const seriesMatch = stem.match(/\b(.+?)\s+(?:series|study|variation)\s*(\d+|[ivx]+)?\b/i)
  return { title: titleFromFilename(filename), year, dimensions, medium, series: seriesMatch ? cleanText(seriesMatch[1], 160) : "" }
}

function decodeXml(value: string) {
  return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim()
}

function xmpValue(text: string, names: string[]) {
  for (const name of names) {
    const attribute = text.match(new RegExp(`${name}=["']([^"']+)["']`, "i"))?.[1]
    if (attribute) return decodeXml(attribute)
    const element = text.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1]
    if (element) {
      const listValue = element.match(/<rdf:li[^>]*>([\s\S]*?)<\/rdf:li>/i)?.[1]
      return decodeXml((listValue ?? element).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "))
    }
  }
  return ""
}

async function extractEmbeddedMetadata(file: File): Promise<EmbeddedMetadata> {
  const empty: EmbeddedMetadata = { title: "", description: "", creator: "", copyright: "", keywords: [], createdAt: "" }
  if (file.type !== "image/jpeg") return empty
  try {
    const bytes = new Uint8Array(await file.slice(0, Math.min(file.size, 1024 * 1024)).arrayBuffer())
    const text = new TextDecoder("latin1").decode(bytes)
    const keywords = xmpValue(text, ["dc:subject", "photoshop:Keywords", "pdf:Keywords"])
    return {
      title: xmpValue(text, ["dc:title", "photoshop:Headline"]),
      description: xmpValue(text, ["dc:description", "photoshop:CaptionWriter"]),
      creator: xmpValue(text, ["dc:creator", "photoshop:AuthorsPosition"]),
      copyright: xmpValue(text, ["dc:rights", "photoshop:Copyright"]),
      keywords: cleanTags(keywords.split(/[;,]/)),
      createdAt: xmpValue(text, ["photoshop:DateCreated", "xmp:CreateDate", "exif:DateTimeOriginal"]),
    }
  } catch {
    return empty
  }
}

async function inspectImage(file: File): Promise<ImageInspection> {
  const bitmap = await createImageBitmap(file)
  const width = bitmap.width
  const height = bitmap.height
  const canvas = document.createElement("canvas")
  canvas.width = 24
  canvas.height = 24
  const context = canvas.getContext("2d", { willReadFrequently: true })
  let palette: ImageInspection["palette"] = "balanced"
  if (context) {
    context.drawImage(bitmap, 0, 0, 24, 24)
    const pixels = context.getImageData(0, 0, 24, 24).data
    let red = 0
    let green = 0
    let blue = 0
    let samples = 0
    for (let index = 0; index < pixels.length; index += 16) {
      if (pixels[index + 3] < 32) continue
      red += pixels[index]
      green += pixels[index + 1]
      blue += pixels[index + 2]
      samples += 1
    }
    if (samples) {
      red /= samples
      green /= samples
      blue /= samples
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722
      if (luminance >= 185) palette = "light"
      else if (luminance <= 70) palette = "dark"
      else if (red - blue >= 18) palette = "warm"
      else if (blue - red >= 18) palette = "cool"
    }
  }
  bitmap.close()
  const ratio = width / height
  return {
    width,
    height,
    aspectRatio: Number(ratio.toFixed(4)),
    orientation: Math.abs(ratio - 1) < 0.05 ? "square" : ratio > 1 ? "landscape" : "portrait",
    palette,
    embedded: await extractEmbeddedMetadata(file),
  }
}

function validateArtworkFile(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error(`${file.name} is not a supported image. Choose JPEG, PNG, or WebP.`)
  if (file.size <= 0) throw new Error(`${file.name} is empty or unavailable.`)
  if (file.size > ARTWORK_IMPORT_MAX_BYTES) throw new Error(`${file.name} is larger than 20 MB.`)
}

async function sha256(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

function buildFields(file: File, inspection: ImageInspection): ArtworkImportItem["fields"] {
  const filename = filenameSuggestions(file.name)
  const embedded = inspection.embedded
  const title = embedded.title
    ? field(embedded.title, "extracted", "Found in embedded image metadata", "strong_source_match")
    : filename.title
      ? field(filename.title, "suggested", "Based on the filename", "possible_suggestion")
      : blankField("Title not found; add the artist-confirmed title")
  const year = embedded.createdAt.match(YEAR_PATTERN)?.[0]
    ? field(embedded.createdAt.match(YEAR_PATTERN)?.[0] ?? "", "suggested", "Based on the embedded file date; confirm this is the artwork year", "needs_artist_confirmation")
    : filename.year
      ? field(filename.year, "suggested", "Based on the filename; confirm this is the artwork year", "needs_artist_confirmation")
      : blankField("Artwork year not found")
  const medium = filename.medium ? field(filename.medium, "suggested", "Based on the filename", "needs_artist_confirmation") : blankField("Medium requires artist input")
  const dimensions = filename.dimensions ? field(filename.dimensions, "suggested", "Based on the filename; confirm physical dimensions", "needs_artist_confirmation") : blankField("Physical dimensions cannot be inferred from image pixels")
  const series = filename.series ? field(filename.series, "suggested", "Based on the filename", "needs_artist_confirmation") : blankField("Series not found")
  const description = embedded.description ? field(embedded.description, "extracted", "Found in embedded image metadata", "strong_source_match") : blankField("Description not found")
  const visualTags = [inspection.orientation, `${inspection.palette} palette`]
  const tags = cleanTags([...embedded.keywords, ...visualTags]).join(", ")
  const altText = field(
    `Artwork image in ${inspection.orientation} format with a ${inspection.palette} palette. Add the subject, materials, and meaningful visual details.`,
    "suggested",
    "Suggested from image format and sampled palette only",
    "needs_artist_confirmation",
  )
  return {
    title,
    year,
    medium,
    dimensions,
    series,
    description,
    tags: tags ? field(tags, embedded.keywords.length ? "extracted" : "suggested", embedded.keywords.length ? "Keywords found in image metadata; visual format added" : "Suggested from image format and palette", embedded.keywords.length ? "strong_source_match" : "possible_suggestion") : blankField("Keywords not found"),
    altText,
  }
}

async function currentArtistUserId() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error ?? new Error("Sign in again to import artwork.")
  return data.user.id
}

export async function createArtworkImportItem(input: {
  file: File
  sourceType: ArtworkImportSourceType
  sessionId: string
  providerFileId?: string
  providerMetadata?: Record<string, unknown>
}): Promise<ArtworkImportItem> {
  validateArtworkFile(input.file)
  const [inspection, checksum, artistUserId] = await Promise.all([inspectImage(input.file), sha256(input.file), currentArtistUserId()])
  const supabase = getSupabaseBrowserClient()
  const { data: duplicate, error: duplicateError } = await supabase
    .from("artist_import_sources")
    .select("id,storage_path,extraction_status")
    .eq("artist_user_id", artistUserId)
    .eq("checksum", checksum)
    .maybeSingle()
  if (duplicateError) throw duplicateError

  let sourceId = duplicate?.id ? String(duplicate.id) : ""
  let storagePath = duplicate?.storage_path ? String(duplicate.storage_path) : ""
  let existingPortfolioWorkId: string | null = null
  if (sourceId && duplicate?.extraction_status === "approved") {
    const { data: existing, error } = await supabase.from("portfolio_works").select("id").eq("artist_user_id", artistUserId).eq("import_source_id", sourceId).maybeSingle()
    if (error) throw error
    existingPortfolioWorkId = existing?.id ? String(existing.id) : null
  }

  if (!sourceId || !storagePath) {
    storagePath = `${artistUserId}/imports/${input.sessionId}/${crypto.randomUUID()}-${safeFilename(input.file.name)}`
    const { error: uploadError } = await supabase.storage.from("artist-assets").upload(storagePath, input.file, {
      cacheControl: "3600",
      contentType: input.file.type,
      upsert: false,
    })
    if (uploadError) throw uploadError
    const sourceMetadata = {
      original_filename: input.file.name,
      width: inspection.width,
      height: inspection.height,
      aspect_ratio: inspection.aspectRatio,
      orientation: inspection.orientation,
      palette: inspection.palette,
      embedded_title: inspection.embedded.title || null,
      embedded_description: inspection.embedded.description || null,
      embedded_creator: inspection.embedded.creator || null,
      embedded_copyright: inspection.embedded.copyright || null,
      embedded_keywords: inspection.embedded.keywords,
      embedded_created_at: inspection.embedded.createdAt || null,
      ...input.providerMetadata,
    }
    const { data: source, error: sourceError } = await supabase
      .from("artist_import_sources")
      .insert({
        artist_user_id: artistUserId,
        source_type: input.sourceType,
        label: input.file.name,
        storage_path: storagePath,
        mime_type: input.file.type,
        byte_size: input.file.size,
        checksum,
        extraction_status: "review_ready",
        extraction_method: "artwork_metadata_v1",
        extracted_at: new Date().toISOString(),
        provider_file_id: input.providerFileId || null,
        original_filename: input.file.name,
        source_metadata: sourceMetadata,
      })
      .select("id")
      .single()
    if (sourceError) {
      await supabase.storage.from("artist-assets").remove([storagePath])
      throw sourceError
    }
    sourceId = String(source.id)
  }

  return {
    id: crypto.randomUUID(),
    sourceId,
    sourceType: input.sourceType,
    providerFileId: input.providerFileId ?? "",
    originalFilename: input.file.name,
    storagePath,
    mimeType: input.file.type,
    byteSize: input.file.size,
    checksum,
    width: inspection.width,
    height: inspection.height,
    aspectRatio: inspection.aspectRatio,
    sourceMetadata: { orientation: inspection.orientation, palette: inspection.palette },
    fields: buildFields(input.file, inspection),
    status: existingPortfolioWorkId ? "approved" : "ready",
    error: "",
    createdAt: new Date().toISOString(),
    approvedAt: existingPortfolioWorkId ? new Date().toISOString() : null,
    portfolioWorkId: existingPortfolioWorkId,
  }
}

export async function loadArtworkPreview(storagePath: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(storagePath, 60 * 60)
  if (error) throw error
  return { path: storagePath, url: data.signedUrl }
}

function splitTags(value: string) {
  return cleanTags(value.split(/[,;\n]/))
}

function fieldProvenance(item: ArtworkImportItem) {
  return Object.fromEntries(Object.entries(item.fields).map(([name, value]) => [name, { status: value.status, source: value.source, confidence: value.confidence }]))
}

export async function approveArtworkImportItem(item: ArtworkImportItem) {
  if (item.status === "approved" && item.portfolioWorkId) return item.portfolioWorkId
  const title = item.fields.title.value.trim()
  if (!title) throw new Error("Add an artwork title before approval.")
  const artistUserId = await currentArtistUserId()
  const supabase = getSupabaseBrowserClient()
  const { data: existing, error: existingError } = await supabase.from("portfolio_works").select("id").eq("artist_user_id", artistUserId).eq("import_source_id", item.sourceId).maybeSingle()
  if (existingError) throw existingError
  if (existing?.id) return String(existing.id)
  const { data, error } = await supabase
    .from("portfolio_works")
    .insert({
      artist_user_id: artistUserId,
      title,
      year: item.fields.year.value.trim(),
      medium: item.fields.medium.value.trim(),
      dimensions: item.fields.dimensions.value.trim(),
      description: item.fields.description.value.trim(),
      series: item.fields.series.value.trim(),
      tags: splitTags(item.fields.tags.value),
      image_path: item.storagePath,
      import_source_id: item.sourceId,
      accessibility_alt_text: item.fields.altText.value.trim(),
      field_provenance: fieldProvenance(item),
      approval_status: "approved",
    })
    .select("id")
    .single()
  if (error) {
    if (error.code === "23505") {
      const { data: raced } = await supabase.from("portfolio_works").select("id").eq("artist_user_id", artistUserId).eq("import_source_id", item.sourceId).single()
      return String(raced.id)
    }
    throw error
  }
  const { error: sourceError } = await supabase.from("artist_import_sources").update({ extraction_status: "approved", updated_at: new Date().toISOString() }).eq("id", item.sourceId)
  if (sourceError) throw sourceError
  return String(data.id)
}

export async function removeArtworkImportItem(item: ArtworkImportItem) {
  if (item.status === "approved") throw new Error("Remove approved artwork from the Portfolio page.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_import_sources").delete().eq("id", item.sourceId)
  if (error) throw error
  if (item.storagePath) await supabase.storage.from("artist-assets").remove([item.storagePath])
}

export function updateArtworkField(item: ArtworkImportItem, name: keyof ArtworkImportItem["fields"], value: string): ArtworkImportItem {
  return {
    ...item,
    fields: {
      ...item.fields,
      [name]: {
        ...item.fields[name],
        value,
        status: value.trim() ? "edited" : "missing",
        source: value.trim() ? "Edited by artist" : "Not yet provided",
        confidence: value.trim() ? "strong_source_match" : "needs_artist_confirmation",
      },
    },
  }
}

export function confirmArtworkFields(item: ArtworkImportItem): ArtworkImportItem {
  return {
    ...item,
    fields: Object.fromEntries(Object.entries(item.fields).map(([name, value]) => [name, value.value.trim() ? { ...value, status: "confirmed", source: value.status === "edited" ? "Edited and confirmed by artist" : "Confirmed by artist", confidence: "strong_source_match" } : value])) as ArtworkImportItem["fields"],
  }
}

export function blankArtworkImportDraft(): ArtworkImportDraftPayload {
  return { version: 1, sessionId: crypto.randomUUID(), step: "source", activeItemId: "", items: [], updatedAt: new Date().toISOString() }
}

function normalizeField(value: unknown, label: string): ArtworkImportField {
  if (!value || typeof value !== "object") return blankField(label)
  const record = value as Record<string, unknown>
  const status = ["extracted", "suggested", "missing", "edited", "confirmed"].includes(String(record.status)) ? record.status as ArtworkFieldStatus : "missing"
  const confidence = ["strong_source_match", "possible_suggestion", "needs_artist_confirmation"].includes(String(record.confidence)) ? record.confidence as ArtworkImportField["confidence"] : "needs_artist_confirmation"
  return field(cleanText(record.value), status, cleanText(record.source, 240) || label, confidence)
}

function normalizeItem(value: unknown): ArtworkImportItem | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== "string" || typeof record.sourceId !== "string" || typeof record.storagePath !== "string") return null
  const fields = record.fields && typeof record.fields === "object" ? record.fields as Record<string, unknown> : {}
  return {
    id: record.id,
    sourceId: record.sourceId,
    sourceType: record.sourceType === "google_drive_image" ? "google_drive_image" : "device_image",
    providerFileId: cleanText(record.providerFileId, 240),
    originalFilename: cleanText(record.originalFilename, 240) || "Imported artwork",
    storagePath: record.storagePath,
    mimeType: cleanText(record.mimeType, 120),
    byteSize: Number(record.byteSize) || 0,
    checksum: cleanText(record.checksum, 128),
    width: Number.isFinite(Number(record.width)) ? Number(record.width) : null,
    height: Number.isFinite(Number(record.height)) ? Number(record.height) : null,
    aspectRatio: Number.isFinite(Number(record.aspectRatio)) ? Number(record.aspectRatio) : null,
    sourceMetadata: record.sourceMetadata && typeof record.sourceMetadata === "object" ? record.sourceMetadata as Record<string, unknown> : {},
    fields: {
      title: normalizeField(fields.title, "Title not found"),
      year: normalizeField(fields.year, "Artwork year not found"),
      medium: normalizeField(fields.medium, "Medium requires artist input"),
      dimensions: normalizeField(fields.dimensions, "Dimensions require artist input"),
      series: normalizeField(fields.series, "Series not found"),
      description: normalizeField(fields.description, "Description not found"),
      tags: normalizeField(fields.tags, "Keywords not found"),
      altText: normalizeField(fields.altText, "Accessibility description requires review"),
    },
    status: record.status === "approved" || record.status === "failed" ? record.status : "ready",
    error: cleanText(record.error, 500),
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString(),
    approvedAt: typeof record.approvedAt === "string" ? record.approvedAt : null,
    portfolioWorkId: typeof record.portfolioWorkId === "string" ? record.portfolioWorkId : null,
  }
}

export function normalizeArtworkImportDraft(value: unknown): ArtworkImportDraftPayload | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  const items = Array.isArray(record.items) ? record.items.map(normalizeItem).filter((item): item is ArtworkImportItem => Boolean(item)) : []
  return {
    version: 1,
    sessionId: typeof record.sessionId === "string" && record.sessionId ? record.sessionId : crypto.randomUUID(),
    step: record.step === "review" || record.step === "complete" ? record.step : "source",
    activeItemId: typeof record.activeItemId === "string" && items.some((item) => item.id === record.activeItemId) ? record.activeItemId : items[0]?.id ?? "",
    items,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : new Date().toISOString(),
  }
}

export async function loadArtworkImportDraft(): Promise<KleioDraftEnvelope<ArtworkImportDraftPayload> | null> {
  const [local, remote] = await Promise.all([
    Promise.resolve(readLocalKleioDraft<ArtworkImportDraftPayload>(ARTWORK_IMPORT_DRAFT_KEY)),
    loadRemoteKleioDraft<ArtworkImportDraftPayload>(ARTWORK_IMPORT_DRAFT_KEY).catch(() => null),
  ])
  const newest = newestKleioDraft(local, remote)
  if (!newest) return null
  const payload = normalizeArtworkImportDraft(newest.payload)
  return payload ? { ...newest, payload } : null
}

export function saveArtworkImportDraftLocally(payload: ArtworkImportDraftPayload, revision: number) {
  const normalized = normalizeArtworkImportDraft({ ...payload, updatedAt: new Date().toISOString() }) ?? blankArtworkImportDraft()
  return saveLocalKleioDraft({ draftKey: ARTWORK_IMPORT_DRAFT_KEY, draftKind: "import_review", payload: normalized, revision })
}

export async function saveArtworkImportDraft(payload: ArtworkImportDraftPayload, expectedRevision: number) {
  const normalized = normalizeArtworkImportDraft({ ...payload, updatedAt: new Date().toISOString() }) ?? blankArtworkImportDraft()
  const local = saveArtworkImportDraftLocally(normalized, expectedRevision)
  return saveRemoteKleioDraft({
    draftKey: ARTWORK_IMPORT_DRAFT_KEY,
    draftKind: "import_review",
    payload: normalized,
    expectedRevision,
    clientUpdatedAt: local?.clientUpdatedAt,
  })
}

export async function clearArtworkImportDraft() {
  clearLocalKleioDraft(ARTWORK_IMPORT_DRAFT_KEY)
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("artist_passport_drafts").delete().eq("draft_key", ARTWORK_IMPORT_DRAFT_KEY)
  if (error) throw error
}

export async function downloadGoogleDriveArtwork(file: GoogleDrivePickerFile, accessToken: string) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimeType)) throw new Error(`${file.name} is not a supported Drive image.`)
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`, { headers: { Authorization: `Bearer ${accessToken}` } })
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new Error("Google Drive access expired or was denied. Connect again and reselect the file.")
    throw new Error(`Google Drive could not provide ${file.name}.`)
  }
  const blob = await response.blob()
  const result = new File([blob], file.name || "drive-artwork", { type: blob.type || file.mimeType, lastModified: Date.now() })
  validateArtworkFile(result)
  return result
}
