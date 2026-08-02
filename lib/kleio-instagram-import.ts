import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

export type InstagramConnectionStatus = {
  configured: boolean
  connected: boolean
  username: string
  accountType: string
  mediaCount: number | null
  expiresAt: string | null
  needsReconnect: boolean
}

export type InstagramMediaItem = {
  id: string
  caption: string
  media_type: string
  media_product_type: string
  media_url: string
  thumbnail_url: string
  permalink: string
  timestamp: string
  username: string
  children?: { data?: InstagramMediaItem[] }
}

export type InstagramGalleryAsset = {
  id: string
  parentId: string
  imageUrl: string
  permalink: string
  caption: string
  timestamp: string
  mediaProductType: string
  selectable: boolean
  kind: "image" | "video"
}

export type InstagramPreparedField = {
  value: string
  status: "extracted" | "suggested" | "missing" | "edited" | "confirmed"
  source: string
  confidence: "strong_source_match" | "possible_suggestion" | "needs_artist_confirmation"
}

export type InstagramPreparedItem = {
  sourceId: string
  providerMediaId: string
  storagePath: string
  previewUrl: string
  mimeType: string
  byteSize: number
  checksum: string
  width: number | null
  height: number | null
  permalink: string
  caption: string
  timestamp: string
  fields: {
    title: InstagramPreparedField
    year: InstagramPreparedField
    medium: InstagramPreparedField
    dimensions: InstagramPreparedField
    series: InstagramPreparedField
    description: InstagramPreparedField
    tags: InstagramPreparedField
    altText: InstagramPreparedField
  }
  alreadyPrepared: boolean
  approved: boolean
  reusedExistingSource?: boolean
  portfolioWorkId?: string
}

type FunctionError = Error & { context?: Response }

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Instagram import is available only in an artist workspace.")
  return account
}

async function functionMessage(error: unknown, fallback: string) {
  const candidate = error as FunctionError
  let code = candidate instanceof Error ? candidate.message : ""
  if (candidate?.context instanceof Response) {
    const payload = await candidate.context.clone().json().catch(() => null) as { error?: string } | null
    if (payload?.error) code = payload.error
  }
  const normalized = code.replaceAll("_", " ").toLowerCase()
  if (/instagram connection unavailable|instagram not configured|instagram encryption not configured/.test(normalized)) {
    return "Instagram connection is temporarily unavailable. Your other import options still work."
  }
  if (/authentication required/.test(normalized)) return "Your session expired. Sign in again to connect Instagram."
  if (/artist workspace required/.test(normalized)) return "Instagram import is available only in an artist workspace."
  if (/rate limited/.test(normalized)) return "Too many connection attempts were started. Wait a few minutes and try again."
  if (/connection required/.test(normalized)) return "Reconnect Instagram to continue."
  if (/token refresh failed|api 190|oauth/.test(normalized)) return "Instagram access expired or was removed. Reconnect the account to continue."
  if (/rights confirmation required/.test(normalized)) return "Confirm that you own or have permission to use the selected Instagram images."
  if (/image selection required|selection required/.test(normalized)) return "Select at least one image post or carousel image."
  if (/image too large/.test(normalized)) return "One selected Instagram image is larger than KLEIO’s 20 MB import limit."
  if (/media not supported/.test(normalized)) return "That Instagram item is not a supported still image. Choose a photo or carousel image."
  if (/image unavailable|api unavailable/.test(normalized)) return "Instagram could not provide that image right now. Refresh the gallery and try again."
  if (/artwork title required/.test(normalized)) return "Add and confirm an artwork title before approval."
  if (/instagram import not found/.test(normalized)) return "This prepared Instagram item is no longer available. Refresh the import list."
  if (/approved artwork remove from portfolio/.test(normalized)) return "Remove approved work from the Portfolio page."
  if (/redirect mismatch/.test(normalized)) return "Instagram connection is temporarily unavailable while KLEIO verifies its callback configuration."
  if (/invalid code/.test(normalized)) return "That Instagram authorization link is no longer valid. Start a fresh connection."
  if (/code exchange|basic permission missing/.test(normalized)) return "Instagram could not complete authorization. Return to KLEIO and start a fresh connection."
  if (/non-2xx|failed to send a request/.test(normalized)) return fallback
  return fallback
}

async function invoke<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("instagram-import", {
    body: { action, ...payload },
  })
  if (error) throw new Error(await functionMessage(error, "KLEIO could not complete the Instagram request."))
  if (data?.error) throw new Error(await functionMessage(new Error(String(data.error)), "KLEIO could not complete the Instagram request."))
  return data as T
}

export async function loadInstagramConnection() {
  return invoke<InstagramConnectionStatus>("status")
}

export async function startInstagramConnection(returnUrl: string) {
  return invoke<{ authorizeUrl: string }>("start_oauth", { returnUrl })
}

export async function loadInstagramMedia(after = "") {
  return invoke<{ items: InstagramMediaItem[]; nextCursor: string }>("list_media", { after })
}

export async function loadInstagramPreparedImports() {
  return invoke<{ items: InstagramPreparedItem[] }>("list_prepared")
}

export async function saveInstagramPreparedDrafts(items: Array<{ sourceId: string; fields: InstagramPreparedItem["fields"] }>) {
  return invoke<{ saved: number }>("save_drafts", { items })
}

export async function prepareInstagramImports(input: {
  mediaIds: string[]
  sessionId: string
  rightsConfirmed: boolean
}) {
  return invoke<{
    results: Array<{ ok: true; item: InstagramPreparedItem } | { ok: false; mediaId: string; error: string }>
    completed: number
    failed: number
  }>("prepare_import", input)
}

export async function approveInstagramImport(input: {
  sourceId: string
  fields: {
    title: string
    year: string
    medium: string
    dimensions: string
    series: string
    description: string
    tags: string
    altText: string
  }
}) {
  return invoke<{ portfolioWorkId: string; alreadyApproved: boolean }>("approve_import", input)
}

export async function deleteInstagramImport(sourceId: string) {
  return invoke<{ deleted: true }>("delete_import", { sourceId })
}

export async function disconnectInstagram() {
  return invoke<{ disconnected: true }>("disconnect")
}

export function flattenInstagramMedia(items: InstagramMediaItem[]): InstagramGalleryAsset[] {
  const output: InstagramGalleryAsset[] = []
  for (const item of items) {
    const shared = {
      parentId: item.id,
      permalink: item.permalink || "",
      caption: item.caption || "",
      timestamp: item.timestamp || "",
      mediaProductType: item.media_product_type || "",
    }
    if (item.media_type === "IMAGE" && item.media_url) {
      output.push({ ...shared, id: item.id, imageUrl: item.media_url, selectable: true, kind: "image" })
      continue
    }
    if (item.media_type === "CAROUSEL_ALBUM") {
      for (const child of item.children?.data ?? []) {
        const imageUrl = child.media_url || child.thumbnail_url || ""
        output.push({
          ...shared,
          id: child.id,
          imageUrl,
          selectable: child.media_type === "IMAGE" && Boolean(child.media_url),
          kind: child.media_type === "IMAGE" ? "image" : "video",
        })
      }
      continue
    }
    const imageUrl = item.thumbnail_url || item.media_url || ""
    if (imageUrl) output.push({ ...shared, id: item.id, imageUrl, selectable: false, kind: "video" })
  }
  return output
}

export function updateInstagramPreparedField(
  item: InstagramPreparedItem,
  name: keyof InstagramPreparedItem["fields"],
  value: string,
): InstagramPreparedItem {
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

export function confirmedInstagramFields(item: InstagramPreparedItem) {
  return {
    title: item.fields.title.value.trim(),
    year: item.fields.year.value.trim(),
    medium: item.fields.medium.value.trim(),
    dimensions: item.fields.dimensions.value.trim(),
    series: item.fields.series.value.trim(),
    description: item.fields.description.value.trim(),
    tags: item.fields.tags.value.trim(),
    altText: item.fields.altText.value.trim(),
  }
}
