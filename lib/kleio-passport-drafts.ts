import { getKleioActiveUserScope } from "@/lib/kleio-client-session"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

const LOCAL_PREFIX = "kleio:artist:draft:v2:"
const LEGACY_LOCAL_PREFIX = "kleio:artist:draft:v1:"
const LOCAL_RETENTION_MS = 7 * 24 * 60 * 60 * 1000

export type KleioDraftKind = "creative_passport" | "import_review" | "voice_transcript" | "opportunity_questions"

export type KleioDraftEnvelope<T extends Record<string, unknown>> = {
  draftKey: string
  draftKind: KleioDraftKind
  opportunityId: string | null
  payload: T
  revision: number
  clientUpdatedAt: string
  serverUpdatedAt: string | null
  expiresAt: string
}

type DraftRow = {
  draft_key: string
  draft_kind: KleioDraftKind
  opportunity_id: string | null
  payload: Record<string, unknown>
  revision: number
  client_updated_at: string | null
  updated_at: string
  expires_at: string
}

function cleanDraftKey(value: string) {
  return value.replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120)
}

function storageKey(draftKey: string) {
  const userId = getKleioActiveUserScope()
  return userId ? `${LOCAL_PREFIX}${userId}:${draftKey}` : null
}

function clearLegacyUnscopedDraft(draftKey: string) {
  if (typeof window !== "undefined") window.localStorage.removeItem(`${LEGACY_LOCAL_PREFIX}${draftKey}`)
}

function normalizeEnvelope<T extends Record<string, unknown>>(value: unknown): KleioDraftEnvelope<T> | null {
  if (!value || typeof value !== "object") return null
  const record = value as Record<string, unknown>
  if (typeof record.draftKey !== "string" || !cleanDraftKey(record.draftKey)) return null
  if (record.draftKind !== "creative_passport" && record.draftKind !== "import_review" && record.draftKind !== "voice_transcript" && record.draftKind !== "opportunity_questions") return null
  if (!record.payload || typeof record.payload !== "object" || Array.isArray(record.payload)) return null
  if (typeof record.revision !== "number" || record.revision < 0) return null
  if (typeof record.clientUpdatedAt !== "string" || Number.isNaN(new Date(record.clientUpdatedAt).getTime())) return null
  if (typeof record.expiresAt !== "string" || new Date(record.expiresAt).getTime() <= Date.now()) return null
  return {
    draftKey: cleanDraftKey(record.draftKey),
    draftKind: record.draftKind,
    opportunityId: typeof record.opportunityId === "string" ? record.opportunityId : null,
    payload: record.payload as T,
    revision: record.revision,
    clientUpdatedAt: new Date(record.clientUpdatedAt).toISOString(),
    serverUpdatedAt: typeof record.serverUpdatedAt === "string" ? record.serverUpdatedAt : null,
    expiresAt: new Date(record.expiresAt).toISOString(),
  }
}

export function readLocalKleioDraft<T extends Record<string, unknown>>(draftKey: string) {
  if (typeof window === "undefined") return null
  const key = cleanDraftKey(draftKey)
  if (!key) return null
  clearLegacyUnscopedDraft(key)
  const scopedKey = storageKey(key)
  if (!scopedKey) return null
  const raw = window.localStorage.getItem(scopedKey)
  if (!raw) return null
  try {
    const draft = normalizeEnvelope<T>(JSON.parse(raw))
    if (draft) return draft
  } catch {
    // Invalid data is removed below.
  }
  window.localStorage.removeItem(scopedKey)
  return null
}

export function saveLocalKleioDraft<T extends Record<string, unknown>>(input: {
  draftKey: string
  draftKind: KleioDraftKind
  opportunityId?: string | null
  payload: T
  revision?: number
  serverUpdatedAt?: string | null
}) {
  if (typeof window === "undefined") return null
  const draftKey = cleanDraftKey(input.draftKey)
  if (!draftKey) return null
  const scopedKey = storageKey(draftKey)
  if (!scopedKey) return null
  clearLegacyUnscopedDraft(draftKey)
  const clientUpdatedAt = new Date().toISOString()
  const envelope: KleioDraftEnvelope<T> = {
    draftKey,
    draftKind: input.draftKind,
    opportunityId: input.opportunityId ?? null,
    payload: input.payload,
    revision: Math.max(0, input.revision ?? 0),
    clientUpdatedAt,
    serverUpdatedAt: input.serverUpdatedAt ?? null,
    expiresAt: new Date(Date.now() + LOCAL_RETENTION_MS).toISOString(),
  }
  window.localStorage.setItem(scopedKey, JSON.stringify(envelope))
  return envelope
}

export function clearLocalKleioDraft(draftKey: string) {
  if (typeof window === "undefined") return
  const key = cleanDraftKey(draftKey)
  if (!key) return
  clearLegacyUnscopedDraft(key)
  const scopedKey = storageKey(key)
  if (scopedKey) window.localStorage.removeItem(scopedKey)
}

export async function loadRemoteKleioDraft<T extends Record<string, unknown>>(draftKey: string): Promise<KleioDraftEnvelope<T> | null> {
  const key = cleanDraftKey(draftKey)
  if (!key) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("artist_passport_drafts")
    .select("draft_key,draft_kind,opportunity_id,payload,revision,client_updated_at,updated_at,expires_at")
    .eq("draft_key", key)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const row = data as DraftRow
  return {
    draftKey: row.draft_key,
    draftKind: row.draft_kind,
    opportunityId: row.opportunity_id,
    payload: row.payload as T,
    revision: Number(row.revision),
    clientUpdatedAt: row.client_updated_at ?? row.updated_at,
    serverUpdatedAt: row.updated_at,
    expiresAt: row.expires_at,
  }
}

export async function saveRemoteKleioDraft<T extends Record<string, unknown>>(input: {
  draftKey: string
  draftKind: KleioDraftKind
  opportunityId?: string | null
  payload: T
  expectedRevision: number
  clientUpdatedAt?: string
}): Promise<KleioDraftEnvelope<T>> {
  const draftKey = cleanDraftKey(input.draftKey)
  if (!draftKey) throw new Error("Invalid draft key.")
  const clientUpdatedAt = input.clientUpdatedAt ?? new Date().toISOString()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("save_my_artist_draft", {
    target_draft_key: draftKey,
    target_draft_kind: input.draftKind,
    target_opportunity_id: input.opportunityId ?? null,
    target_payload: input.payload,
    expected_revision: Math.max(0, input.expectedRevision),
    target_client_updated_at: clientUpdatedAt,
  })
  if (error) {
    if (error.message.includes("draft_conflict")) {
      const conflict = new Error("A newer KLEIO draft exists on another device.")
      conflict.name = "KleioDraftConflictError"
      throw conflict
    }
    throw error
  }
  const row = data as DraftRow
  const envelope: KleioDraftEnvelope<T> = {
    draftKey: row.draft_key,
    draftKind: row.draft_kind,
    opportunityId: row.opportunity_id,
    payload: row.payload as T,
    revision: Number(row.revision),
    clientUpdatedAt: row.client_updated_at ?? clientUpdatedAt,
    serverUpdatedAt: row.updated_at,
    expiresAt: row.expires_at,
  }
  saveLocalKleioDraft({
    draftKey,
    draftKind: envelope.draftKind,
    opportunityId: envelope.opportunityId,
    payload: envelope.payload,
    revision: envelope.revision,
    serverUpdatedAt: envelope.serverUpdatedAt,
  })
  return envelope
}

export function newestKleioDraft<T extends Record<string, unknown>>(
  local: KleioDraftEnvelope<T> | null,
  remote: KleioDraftEnvelope<T> | null,
) {
  if (!local) return remote
  if (!remote) return local
  return new Date(local.clientUpdatedAt).getTime() > new Date(remote.clientUpdatedAt).getTime() ? local : remote
}
