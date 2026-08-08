import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import {
  buildMailtoHref,
  createRecipientReviewAccess,
  recipientReviewUrl,
} from "@/lib/kleio-recipient-application"

export type ApplicationDeliveryChannel = "gmail" | "email_client" | "external_portal" | "native_kleio" | "download_package"
export type ApplicationDeliveryState = "prepared" | "email_client_opened" | "provider_accepted" | "artist_reported_sent" | "review_room_opened" | "conversation_started" | "failed" | "cancelled"
export type ApplicationDeliveryEvidence = "self_reported" | "system_observed" | "recipient_confirmed" | "provider_confirmed"

export async function recordApplicationDelivery(input: {
  submissionVersionId: string
  channel: ApplicationDeliveryChannel
  destination?: string
  recipientAccessId?: string | null
  state?: ApplicationDeliveryState
  evidenceLevel?: ApplicationDeliveryEvidence
  provider?: string
  providerReference?: string
  errorCode?: string
  errorMessage?: string
}) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("record_my_application_delivery", {
    target_submission_version_id: input.submissionVersionId,
    target_channel: input.channel,
    target_destination: input.destination ?? "",
    target_recipient_access_id: input.recipientAccessId ?? null,
    target_state: input.state ?? "prepared",
    target_evidence_level: input.evidenceLevel ?? "system_observed",
    target_provider: input.provider ?? "",
    target_provider_reference: input.providerReference ?? "",
    target_error_code: input.errorCode ?? "",
    target_error_message: input.errorMessage ?? "",
  })
  if (error) throw error
  return String(data)
}

/**
 * Prepare the beta-safe email handoff from one immutable submission version.
 *
 * KLEIO creates the secure Review Room first. The database boundary binds that
 * access to the latest artist-finalized immutable submission version for the
 * package and rebuilds the recipient snapshot from that sealed version.
 * The artist never needs to copy or manage the raw URL.
 */
export async function prepareTrackedEmailClientHandoff(input: {
  packageId: string
  submissionVersionId: string
  recipient: string
  subject: string
  body: string
}) {
  if (!input.recipient.trim()) throw new Error("A verified submission email is required before preparing delivery.")
  const access = await createRecipientReviewAccess(input.packageId)
  const reviewUrl = recipientReviewUrl(access.token)
  const deliveryId = await recordApplicationDelivery({
    submissionVersionId: input.submissionVersionId,
    channel: "email_client",
    destination: input.recipient.trim(),
    recipientAccessId: access.access_id,
    state: "email_client_opened",
    evidenceLevel: "system_observed",
    provider: "default_email_client",
    providerReference: access.access_id,
  })
  return {
    deliveryId,
    accessId: access.access_id,
    expiresAt: access.expires_at,
    reviewUrl,
    href: buildMailtoHref({
      recipient: input.recipient.trim(),
      subject: input.subject,
      body: input.body,
      reviewUrl,
    }),
  }
}
