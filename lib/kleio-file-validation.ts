const RASTER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

function hasBytes(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value)
}

export async function detectRasterImageMimeType(file: Blob): Promise<string | null> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())

  if (bytes.length >= 3 && hasBytes(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg"
  if (
    bytes.length >= 8 &&
    hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  ) return "image/png"
  if (
    bytes.length >= 12 &&
    hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    hasBytes(bytes, [0x57, 0x45, 0x42, 0x50], 8)
  ) return "image/webp"

  return null
}

export async function validateRasterImageFile(
  file: File,
  options: { maxBytes: number; label?: string },
) {
  const label = options.label ?? "Image"
  if (!RASTER_IMAGE_TYPES.has(file.type)) {
    throw new Error(`${label} must be a JPG, PNG, or WebP file.`)
  }
  if (file.size === 0) throw new Error(`${label} cannot be empty.`)
  if (file.size > options.maxBytes) {
    throw new Error(`${label} must be ${Math.floor(options.maxBytes / (1024 * 1024))} MB or smaller.`)
  }

  const detectedType = await detectRasterImageMimeType(file)
  if (!detectedType || detectedType !== file.type) {
    throw new Error(`${label} content does not match its declared file type.`)
  }
}

export async function validatePdfFile(
  file: File,
  options: { maxBytes: number; label?: string },
) {
  const label = options.label ?? "PDF"
  if (file.type !== "application/pdf") throw new Error(`${label} must be a PDF file.`)
  if (file.size === 0) throw new Error(`${label} cannot be empty.`)
  if (file.size > options.maxBytes) {
    throw new Error(`${label} must be ${Math.floor(options.maxBytes / (1024 * 1024))} MB or smaller.`)
  }

  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  if (!hasBytes(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    throw new Error(`${label} content does not match the PDF file type.`)
  }
}
