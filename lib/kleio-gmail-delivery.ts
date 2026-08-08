import { normalizeKleioEdgeFunctionError } from "@/lib/kleio-edge-function-error"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type GmailConnectionStatus = {
  configured: boolean
  connected: boolean
  requires_reauth: boolean
  account_email: string
  scopes: string[]
  connected_at: string | null
  last_error_code: string
  last_error_message: string
  updated_at: string | null
}

export type GmailDeliveryState =
  | "prepared"
  | "handoff_prepared"
  | "provider_sending"
  | "provider_unknown"
  | "provider_accepted"
  | "artist_reported_sent"
  | "review_room_opened"
  | "receipt_confirmed"
  | "conversation_started"
  | "failed"
  | "cancelled"

export type GmailDeliveryRecord = {
  id: string
  state: GmailDeliveryState
  evidence_level: "self_reported" | "system_observed" | "recipient_confirmed" | "provider_confirmed"
  provider_reference: string
  last_error_code: string
  last_error_message: string
  provider_accepted_at: string | null
  provider_unknown_at: string | null
  updated_at: string
}

export type GmailSendResult = {
  status: "provider_accepted" | "already_sent"
  provider?: string
  provider_reference?: string
  recipient?: string
  attachment_count?: number
  raw_message_bytes?: number
  review_access_expires_at?: string
  message: string
}

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.functions.invoke("gmail-delivery", { body })
  if (error) throw await normalizeKleioEdgeFunctionError(error, "The Gmail delivery request could not be completed.")
  if (data?.error) {
    const requestError = new Error(data.message || data.error)
    requestError.name = data.error
    throw requestError
  }
  return data as T
}

export function loadGmailConnectionStatus() {
  return invoke<GmailConnectionStatus>({ action: "status" })
}

export async function loadGmailDeliveryState(submissionVersionId: string): Promise<GmailDeliveryRecord | null> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_deliveries")
    .select("id,state,evidence_level,provider_reference,last_error_code,last_error_message,provider_accepted_at,provider_unknown_at,updated_at")
    .eq("submission_version_id", submissionVersionId)
    .eq("channel", "gmail")
    .maybeSingle()
  if (error) throw error
  return data as GmailDeliveryRecord | null
}

export function startGmailConnection(returnPath: string) {
  return invoke<{ authorization_url: string; redirect_uri: string; scopes: string[] }>({
    action: "connect",
    return_path: returnPath,
  })
}

export function disconnectGmail() {
  return invoke<{ disconnected: boolean }>({ action: "disconnect" })
}

export function sendFinalizedApplicationWithGmail(submissionVersionId: string) {
  return invoke<GmailSendResult>({
    action: "send",
    submission_version_id: submissionVersionId,
  })
}
