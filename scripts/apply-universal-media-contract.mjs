import fs from "node:fs"

const file = "lib/kleio-universal-media.ts"
let source = fs.readFileSync(file, "utf8")

function replaceRequired(from, to, label) {
  if (!source.includes(from)) throw new Error(`Could not apply ${label}`)
  source = source.replace(from, to)
}

replaceRequired(
  'import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"\n',
  'import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"\nimport {\n  KLEIO_ARTWORK_MEDIA_MIME_TYPES,\n  KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n  fileSignatureMatchesKnownMime,\n  mediaKindForMimeType,\n  readableAcceptedMedia,\n  type KleioMediaKind,\n} from "@/lib/kleio-media-file-types"\n',
  "shared MIME imports",
)

replaceRequired('export type MediaKind = "image" | "document" | "video" | "audio"', 'export type MediaKind = KleioMediaKind', "media kind alias")
replaceRequired('description: "Choose artwork you already have. KLEIO prepares private, editable records and waits for your approval.",\n    completionAction: "Add selected media",\n    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],\n    maxFileSizeBytes: 20 * 1024 * 1024,', 'description: "Choose artwork, media, or supporting material you already have. KLEIO prepares private, reusable records and waits for your approval.",\n    completionAction: "Add selected media",\n    allowedMimeTypes: KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,', "onboarding formats")
replaceRequired('description: "Bring artwork or a supporting file into your private Creative Passport workspace.",\n    completionAction: "Use selected media",\n    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],\n    maxFileSizeBytes: 20 * 1024 * 1024,', 'description: "Bring artwork, media, or a supporting file into your private Creative Passport workspace.",\n    completionAction: "Use selected media",\n    allowedMimeTypes: KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,', "passport formats")
replaceRequired('description: "Start with the images. Review each work visually, then add only the details that help you reuse it.",\n    completionAction: "Continue with selected media",\n    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],\n    maxFileSizeBytes: 20 * 1024 * 1024,', 'description: "Start with the work itself. Review images, video, or audio, then add only the details that help you reuse it.",\n    completionAction: "Continue with selected media",\n    allowedMimeTypes: KLEIO_ARTWORK_MEDIA_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,', "portfolio formats")
replaceRequired('allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],\n    maxFileSizeBytes: 20 * 1024 * 1024,', 'allowedMimeTypes: KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,', "application material formats")
replaceRequired('allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],\n    maxFileSizeBytes: 20 * 1024 * 1024,\n    maxSelectionCount: 10,\n    allowMultiple: true,\n    availableSources: ["kleio_library", "device", "google_drive"],\n    requireMetadataReview: true,', 'allowedMimeTypes: KLEIO_ARTWORK_MEDIA_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,\n    maxSelectionCount: 10,\n    allowMultiple: true,\n    availableSources: ["kleio_library", "device", "google_drive"],\n    requireMetadataReview: true,', "application portfolio formats")
replaceRequired('allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png", "image/webp"],\n    maxFileSizeBytes: 20 * 1024 * 1024,\n    maxSelectionCount: 10,\n    allowMultiple: true,\n    availableSources: ["kleio_library", "device", "google_drive"],', 'allowedMimeTypes: KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,\n    maxSelectionCount: 10,\n    allowMultiple: true,\n    availableSources: ["kleio_library", "device", "google_drive"],', "opportunity requirement formats")
replaceRequired('allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],\n    maxFileSizeBytes: 20 * 1024 * 1024,\n    maxSelectionCount: 30,\n    allowMultiple: true,\n    availableSources: ["kleio_library"],', 'allowedMimeTypes: KLEIO_GENERAL_UPLOAD_MIME_TYPES,\n    maxFileSizeBytes: 50 * 1024 * 1024,\n    maxSelectionCount: 30,\n    allowMultiple: true,\n    availableSources: ["kleio_library", "device"],', "media library upload formats")

replaceRequired(`function mediaKindFor(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image"
  if (mimeType.startsWith("video/")) return "video"
  if (mimeType.startsWith("audio/")) return "audio"
  return "document"
}

`, "", "remove local media kind helper")
replaceRequired(`function sourceTypeFor(source: "device" | "google_drive", mimeType: string) {
  const suffix = mimeType.startsWith("image/") ? "image" : "document"
  return \`${source}_\${suffix}\`
}`, `function sourceTypeFor(source: "device" | "google_drive", mimeType: string) {
  return \`${source}_\${mediaKindForMimeType(mimeType)}\`
}`, "source type mapping")
replaceRequired(`async function fileSignatureMatches(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  if (file.type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  if (file.type === "image/png") return bytes.slice(0, 8).every((value, index) => value === [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a][index])
  if (file.type === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  if (file.type === "application/pdf") return String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-"
  return false
}

`, "", "remove narrow signature helper")
replaceRequired(`async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/")) return { width: null, height: null }
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  return dimensions
}`, `async function imageDimensions(file: File) {
  if (!file.type.startsWith("image/")) return { width: null, height: null }
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  } catch {
    return { width: null, height: null }
  }
}`, "safe image dimensions")
replaceRequired(`export async function validateMediaFile(file: File, config: MediaImportConfig) {
  if (!config.allowedMimeTypes.includes(file.type)) throw new Error(\`${file.name} is not an accepted file type for this step.\`)
  if (file.size <= 0) throw new Error(\`${file.name} is empty or unavailable.\`)
  if (file.size > config.maxFileSizeBytes) throw new Error(\`${file.name} is larger than \${Math.round(config.maxFileSizeBytes / 1024 / 1024)} MB.\`)
  if (!(await fileSignatureMatches(file))) throw new Error(\`${file.name} does not match its declared file type.\`)
}`, `export async function validateMediaFile(file: File, config: MediaImportConfig) {
  const mimeType = file.type.trim().toLowerCase()
  if (!config.allowedMimeTypes.includes(mimeType)) throw new Error(\`${file.name} is not accepted here. Choose \${readableAcceptedMedia(config.allowedMimeTypes)} supported by this step.\`)
  if (file.size <= 0) throw new Error(\`${file.name} is empty or unavailable.\`)
  if (file.size > config.maxFileSizeBytes) throw new Error(\`${file.name} is larger than \${Math.round(config.maxFileSizeBytes / 1024 / 1024)} MB.\`)
  if (!(await fileSignatureMatchesKnownMime(file))) throw new Error(\`${file.name} does not match its declared file type.\`)
}`, "broad validation")
replaceRequired(`async function signedUrl(storagePath: string, mimeType: string) {
  if (!storagePath || !mimeType.startsWith("image/")) return null`, `async function signedUrl(storagePath: string, mimeType: string) {
  if (!storagePath || !["image", "video", "audio"].includes(mediaKindForMimeType(mimeType))) return null`, "signed media previews")

source = source.replaceAll("mediaKindFor(", "mediaKindForMimeType(")
if (!source.includes("KLEIO_GENERAL_UPLOAD_MIME_TYPES") || !source.includes("fileSignatureMatchesKnownMime")) throw new Error("Universal media contract verification failed")
fs.writeFileSync(file, source)
console.log("Applied broad KLEIO universal media contract.")

// Touch marker: workflow is intentionally one-shot on this feature branch.
