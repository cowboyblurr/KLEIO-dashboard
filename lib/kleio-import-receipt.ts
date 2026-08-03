export const KLEIO_MEDIA_IMPORT_RECEIPT_KEY = "kleio.media-import-receipt.v1"

export type KleioMediaImportReceipt = {
  id: string
  source: "google_drive"
  addedCount: number
  duplicateCount: number
  failedCount: number
  sourceIds: string[]
  createdAt: string
}

function validReceipt(value: unknown): value is KleioMediaImportReceipt {
  if (!value || typeof value !== "object") return false
  const receipt = value as Partial<KleioMediaImportReceipt>
  return typeof receipt.id === "string"
    && receipt.source === "google_drive"
    && Number.isFinite(receipt.addedCount)
    && Number.isFinite(receipt.duplicateCount)
    && Number.isFinite(receipt.failedCount)
    && Array.isArray(receipt.sourceIds)
    && typeof receipt.createdAt === "string"
}

export function saveMediaImportReceipt(receipt: Omit<KleioMediaImportReceipt, "id" | "createdAt">) {
  if (typeof window === "undefined") return null
  const value: KleioMediaImportReceipt = {
    ...receipt,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  window.localStorage.setItem(KLEIO_MEDIA_IMPORT_RECEIPT_KEY, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent("kleio:media-import-completed", { detail: value }))
  return value
}

export function readMediaImportReceipt(maxAgeMs = 24 * 60 * 60 * 1_000) {
  if (typeof window === "undefined") return null
  try {
    const value = JSON.parse(window.localStorage.getItem(KLEIO_MEDIA_IMPORT_RECEIPT_KEY) || "null")
    if (!validReceipt(value)) return null
    const age = Date.now() - new Date(value.createdAt).getTime()
    if (!Number.isFinite(age) || age < 0 || age > maxAgeMs) return null
    return value
  } catch {
    return null
  }
}
