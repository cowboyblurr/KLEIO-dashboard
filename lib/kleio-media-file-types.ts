export const KLEIO_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
] as const

export const KLEIO_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-ms-wmv",
  "video/x-ms-asf",
  "application/vnd.ms-asf",
] as const

export const KLEIO_AUDIO_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
] as const

export const KLEIO_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/csv",
  "text/plain",
  "application/rtf",
  "text/rtf",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-subrip",
  "text/vtt",
] as const

export const KLEIO_ARTWORK_MEDIA_MIME_TYPES = Array.from(new Set([
  ...KLEIO_IMAGE_MIME_TYPES,
  ...KLEIO_VIDEO_MIME_TYPES,
  ...KLEIO_AUDIO_MIME_TYPES,
]))

export const KLEIO_GENERAL_UPLOAD_MIME_TYPES = Array.from(new Set([
  ...KLEIO_ARTWORK_MEDIA_MIME_TYPES,
  ...KLEIO_DOCUMENT_MIME_TYPES,
]))

export type KleioMediaKind = "image" | "document" | "video" | "audio"

export function mediaKindForMimeType(mimeType: string): KleioMediaKind {
  const normalized = mimeType.trim().toLowerCase()
  if (normalized.startsWith("image/")) return "image"
  if (normalized.startsWith("video/") || normalized === "application/vnd.ms-asf") return "video"
  if (normalized.startsWith("audio/")) return "audio"
  return "document"
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end))
}

function startsWithBytes(bytes: Uint8Array, signature: number[]) {
  return signature.every((value, index) => bytes[index] === value)
}

function isZip(bytes: Uint8Array) {
  return startsWithBytes(bytes, [0x50, 0x4b, 0x03, 0x04])
    || startsWithBytes(bytes, [0x50, 0x4b, 0x05, 0x06])
    || startsWithBytes(bytes, [0x50, 0x4b, 0x07, 0x08])
}

function isOle(bytes: Uint8Array) {
  return startsWithBytes(bytes, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
}

function isFtyp(bytes: Uint8Array) {
  return ascii(bytes, 4, 8) === "ftyp"
}

function isTextMime(mimeType: string) {
  return mimeType.startsWith("text/") || ["application/csv", "application/x-subrip"].includes(mimeType)
}

async function textLooksSafe(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 8192).arrayBuffer())
  if (!bytes.length) return false
  if (bytes.includes(0x00)) return false
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes)
  const replacementCount = (text.match(/\uFFFD/g) || []).length
  return replacementCount <= Math.max(3, Math.floor(text.length * 0.02))
}

export async function fileSignatureMatchesKnownMime(file: File) {
  const mimeType = file.type.trim().toLowerCase()
  const bytes = new Uint8Array(await file.slice(0, 64).arrayBuffer())

  if (mimeType === "image/jpeg") return startsWithBytes(bytes, [0xff, 0xd8, 0xff])
  if (mimeType === "image/png") return startsWithBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (mimeType === "image/webp") return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP"
  if (mimeType === "image/gif") return ["GIF87a", "GIF89a"].includes(ascii(bytes, 0, 6))
  if (["image/heic", "image/heif"].includes(mimeType)) {
    const brand = ascii(bytes, 8, 12)
    return isFtyp(bytes) && ["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heif"].includes(brand)
  }

  if (mimeType === "application/pdf") return ascii(bytes, 0, 5) === "%PDF-"
  if ([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
  ].includes(mimeType)) return isZip(bytes)
  if (["application/msword", "application/vnd.ms-excel", "application/vnd.ms-powerpoint"].includes(mimeType)) return isOle(bytes)
  if (["application/rtf", "text/rtf"].includes(mimeType)) return ascii(bytes, 0, 5).toLowerCase() === "{\\rtf"

  if (["video/mp4", "video/quicktime", "audio/mp4"].includes(mimeType)) return isFtyp(bytes)
  if (mimeType === "video/webm") return startsWithBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3])
  if (["video/x-ms-wmv", "video/x-ms-asf", "application/vnd.ms-asf"].includes(mimeType)) return startsWithBytes(bytes, [0x30, 0x26, 0xb2, 0x75, 0x8e, 0x66, 0xcf, 0x11, 0xa6, 0xd9, 0x00, 0xaa, 0x00, 0x62, 0xce, 0x6c])

  if (["audio/mpeg", "audio/mp3"].includes(mimeType)) {
    return ascii(bytes, 0, 3) === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  }
  if (["audio/wav", "audio/x-wav"].includes(mimeType)) return ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WAVE"
  if (mimeType === "audio/ogg") return ascii(bytes, 0, 4) === "OggS"

  if (isTextMime(mimeType)) return textLooksSafe(file)
  return false
}

export function readableAcceptedMedia(mimeTypes: readonly string[]) {
  const kinds = new Set(mimeTypes.map(mediaKindForMimeType))
  const labels = [
    kinds.has("image") ? "images" : "",
    kinds.has("video") ? "video" : "",
    kinds.has("audio") ? "audio" : "",
    kinds.has("document") ? "documents" : "",
  ].filter(Boolean)
  return labels.length ? labels.join(", ") : "supported files"
}
