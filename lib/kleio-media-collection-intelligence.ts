import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import type { ArtistMediaLibraryItem } from "@/lib/kleio-universal-media"

export type CollectionPattern = {
  text: string
  sourceRefs: string[]
  confidence: number | null
}

export type MediaCollectionInsight = {
  id: string
  title: string
  sourceIds: string[]
  status: "review_ready" | "confirmed" | "dismissed"
  summary: string
  bodyOfWorkSummary: string
  shortSummary: string
  recurringThemes: CollectionPattern[]
  formalRelationships: CollectionPattern[]
  materialProcessPatterns: CollectionPattern[]
  workDialogues: CollectionPattern[]
  seriesPossibilities: string[]
  applicationKeywords: string[]
  questionsForArtist: string[]
  limitations: string[]
  confidence: number | null
  artistSummary: string
  analyzedAt: string
  confirmedAt: string | null
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : "" }
function strings(value: unknown) {
  return Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string" && Boolean(entry.trim())).map((entry) => entry.trim())
    : []
}
function confidence(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : null
}
function patterns(value: unknown): CollectionPattern[] {
  if (!Array.isArray(value)) return []
  return value.map(object).flatMap((entry) => {
    const copy = text(entry.text)
    if (!copy) return []
    return [{ text: copy, sourceRefs: strings(entry.source_refs), confidence: confidence(entry.confidence) }]
  })
}

function fromRow(row: Record<string, unknown>): MediaCollectionInsight {
  const insight = object(row.generated_insight)
  return {
    id: text(row.id),
    title: text(row.title) || text(insight.title) || "Media Assist comparison",
    sourceIds: strings(row.source_ids),
    status: (["review_ready", "confirmed", "dismissed"].includes(text(row.status)) ? text(row.status) : "review_ready") as MediaCollectionInsight["status"],
    summary: text(insight.summary),
    bodyOfWorkSummary: text(insight.body_of_work_summary),
    shortSummary: text(insight.short_summary),
    recurringThemes: patterns(insight.recurring_themes),
    formalRelationships: patterns(insight.formal_relationships),
    materialProcessPatterns: patterns(insight.material_process_patterns),
    workDialogues: patterns(insight.work_dialogues),
    seriesPossibilities: strings(insight.series_possibilities),
    applicationKeywords: strings(insight.application_keywords),
    questionsForArtist: strings(insight.questions_for_artist),
    limitations: strings(insight.limitations),
    confidence: confidence(insight.confidence),
    artistSummary: text(row.artist_summary),
    analyzedAt: text(row.analyzed_at),
    confirmedAt: text(row.confirmed_at) || null,
  }
}

async function requireArtist() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  if (account.profile.role !== "artist") throw new Error("Media Assist is available only in an artist workspace.")
  return account
}

export async function requestMediaCollectionInsight(items: ArtistMediaLibraryItem[]) {
  await requireArtist()
  const sourceIds = Array.from(new Set(items.flatMap((item) => item.sourceId ? [item.sourceId] : [])))
  if (sourceIds.length < 2) throw new Error("Select at least two private sources to use Media Assist together.")
  if (sourceIds.length > 12) throw new Error("Choose no more than 12 sources for one Media Assist comparison.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("analyze-artist-media-collection", { body: { source_ids: sourceIds } })
  if (error) throw new Error(error.message || "Media Assist could not compare these private sources.")
  if (data?.error) throw new Error(String(data.message || data.error))
  const row = object(data?.collection)
  if (!text(row.id)) throw new Error("Media Assist finished without a reviewable result. Try again.")
  return fromRow(row)
}

export async function loadMediaCollectionInsights(limit = 6) {
  const account = await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_media_collection_insights")
    .select("id,title,source_ids,status,generated_insight,artist_summary,analyzed_at,confirmed_at")
    .eq("artist_user_id", account.user.id)
    .neq("status", "dismissed")
    .order("updated_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []).map((row) => fromRow(row as Record<string, unknown>))
}

export async function confirmMediaCollectionInsight(id: string, artistSummary: string) {
  const account = await requireArtist()
  const summary = artistSummary.trim()
  if (!summary) throw new Error("Review or edit the Media Assist note before keeping it as artist context.")
  const supabase = getSupabaseBrowserClient()
  const { error: rpcError } = await supabase.rpc("confirm_my_media_collection_insight", {
    target_insight_id: id,
    reviewed_summary: summary,
  })
  if (rpcError) throw rpcError
  const { data, error } = await supabase.from("artist_media_collection_insights")
    .select("id,title,source_ids,status,generated_insight,artist_summary,analyzed_at,confirmed_at")
    .eq("id", id)
    .eq("artist_user_id", account.user.id)
    .single()
  if (error) throw error
  return fromRow(data as Record<string, unknown>)
}

export async function dismissMediaCollectionInsight(id: string) {
  await requireArtist()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.rpc("dismiss_my_media_collection_insight", { target_insight_id: id })
  if (error) throw error
}
