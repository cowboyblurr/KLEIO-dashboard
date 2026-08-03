import {
  createArtworkImportItem,
  downloadGoogleDriveArtwork,
  removeArtworkImportItem,
  type ArtworkImportItem,
  type GoogleDrivePickerFile,
} from "@/lib/kleio-artwork-import"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type GoogleDrivePreparedItem = ArtworkImportItem & {
  sourceMetadata: ArtworkImportItem["sourceMetadata"] & {
    betaWasDuplicate?: boolean
  }
}

async function currentArtistUserId() {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw error ?? new Error("Sign in again to import from Google Drive.")
  return data.user.id
}

async function checksum(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer())
  return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, "0")).join("")
}

export async function prepareGoogleDriveArtwork(input: {
  selectedFile: GoogleDrivePickerFile
  accessToken: string
  sessionId: string
}) {
  const file = await downloadGoogleDriveArtwork(input.selectedFile, input.accessToken)
  const [artistUserId, fileChecksum] = await Promise.all([currentArtistUserId(), checksum(file)])
  const supabase = getSupabaseBrowserClient()
  const { data: existing, error } = await supabase
    .from("artist_import_sources")
    .select("id")
    .eq("artist_user_id", artistUserId)
    .eq("checksum", fileChecksum)
    .maybeSingle()
  if (error) throw error

  const item = await createArtworkImportItem({
    file,
    sourceType: "google_drive_image",
    sessionId: input.sessionId,
    providerFileId: input.selectedFile.id,
    providerMetadata: {
      provider_name: input.selectedFile.name,
      provider_mime_type: input.selectedFile.mimeType,
      beta_import_source: "google_drive",
    },
  })

  return {
    ...item,
    sourceMetadata: {
      ...item.sourceMetadata,
      betaWasDuplicate: Boolean(existing?.id),
    },
  } satisfies GoogleDrivePreparedItem
}

export function itemWasDuplicate(item: ArtworkImportItem) {
  return item.sourceMetadata?.betaWasDuplicate === true
}

export async function confirmGoogleDriveMediaImport(items: ArtworkImportItem[]) {
  const artistUserId = await currentArtistUserId()
  const supabase = getSupabaseBrowserClient()
  const confirmedAt = new Date().toISOString()
  const confirmedSourceIds: string[] = []

  for (const item of items) {
    const { data: existing, error: readError } = await supabase
      .from("artist_import_sources")
      .select("id,source_metadata")
      .eq("id", item.sourceId)
      .eq("artist_user_id", artistUserId)
      .single()
    if (readError || !existing) throw readError ?? new Error("A selected media item could not be found.")

    const currentMetadata = existing.source_metadata && typeof existing.source_metadata === "object"
      ? existing.source_metadata as Record<string, unknown>
      : {}
    const label = item.fields.title.value.trim() || item.originalFilename
    const { error: updateError } = await supabase
      .from("artist_import_sources")
      .update({
        label,
        library_status: "available",
        extraction_status: "review_ready",
        source_metadata: {
          ...currentMetadata,
          beta_import_confirmed_at: confirmedAt,
          artist_confirmed_private_library_import: true,
          artist_confirmed_label: label,
        },
        updated_at: confirmedAt,
      })
      .eq("id", item.sourceId)
      .eq("artist_user_id", artistUserId)
    if (updateError) throw updateError
    confirmedSourceIds.push(item.sourceId)
  }

  return confirmedSourceIds
}

export async function discardUnconfirmedGoogleDriveItems(items: ArtworkImportItem[]) {
  for (const item of items) {
    if (itemWasDuplicate(item)) continue
    await removeArtworkImportItem(item).catch(() => undefined)
  }
}
