import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type KleioImportSource =
  | "google_drive_image"
  | "google_drive_document"
  | "google_drive_video"
  | "google_drive_audio"
  | "existing_kleio_media"
  | "device_image"
  | "device_document"
  | "device_video"
  | "device_audio"
  | "instagram_image"
  | "website"
  | "pdf"
  | "pasted_text"
  | "voice_transcript"

export type KleioImportAvailability = Record<KleioImportSource, boolean>

export const DEFAULT_IMPORT_AVAILABILITY: KleioImportAvailability = {
  google_drive_image: false,
  google_drive_document: false,
  google_drive_video: false,
  google_drive_audio: false,
  existing_kleio_media: true,
  device_image: true,
  device_document: true,
  device_video: true,
  device_audio: true,
  instagram_image: false,
  website: false,
  pdf: true,
  pasted_text: false,
  voice_transcript: false,
}

export async function loadImportAvailability(): Promise<KleioImportAvailability> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("kleio_import_source_availability").select("source_type,artist_beta_enabled")
  if (error) throw error

  const availability = { ...DEFAULT_IMPORT_AVAILABILITY }
  for (const row of data || []) {
    const source = String(row.source_type) as KleioImportSource
    if (source in availability) availability[source] = row.artist_beta_enabled === true
  }
  return availability
}

export function importSourceEnabled(availability: KleioImportAvailability | null, source: KleioImportSource) {
  return availability ? availability[source] === true : DEFAULT_IMPORT_AVAILABILITY[source] === true
}

// Compatibility aliases for existing non-UI callers and validation scripts.
export type KleioBetaImportSource = KleioImportSource
export type KleioBetaImportAvailability = KleioImportAvailability
export const DEFAULT_BETA_IMPORT_AVAILABILITY = DEFAULT_IMPORT_AVAILABILITY
export const loadBetaImportAvailability = loadImportAvailability
export const betaSourceEnabled = importSourceEnabled
