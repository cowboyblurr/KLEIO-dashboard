import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { loadGmailDeliveryState } from "@/lib/kleio-gmail-delivery"
import {
  buildMailtoHref,
  createRecipientReviewAccess,
  recipientReviewUrl,
} from "@/lib/kleio-recipient-application"

export type ApplicationDeliveryChannel = "gmail" | "email_client" | "external_portal" | "native_kleio" | "download_package"
export type ApplicationDeliveryState = "prepared" | "handoff_prepared" | "provider_accepted" | "artist_reported_sent" | "review_room_opened" | "receipt_confirmed" | "conversation_started" | "failed" | "cancelled"
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

async function assertManualFallbackSafe(submissionVersionId: string) {
  const gmailDelivery = await loadGmailDeliveryState(submissionVersionId)
  if (!gmailDelivery) return

  if (["provider_sending", "provider_unknown"].includes(gmailDelivery.state)) {
    throw new Error("Check Gmail Sent before doing anything else. KLEIO cannot prepare a manual fallback while the Gmail provider state is unknown or still in flight.")
  }
  if (["provider_accepted", "artist_reported_sent", "review_room_opened", "receipt_confirmed", "conversation_started"].includes(gmailDelivery.state)) {
    throw new Error("Gmail already accepted or advanced this finalized application. KLEIO blocked a duplicate email handoff.")
  }
}

/**
 * Prepare the beta-safe email handoff from one immutable submission version.
 *
 * KLEIO creates secure Review Room access for the exact artist-finalized version,
 * then inserts that one-time recipient URL into the artist's normal email client.
 * An already-active recipient handoff is never silently rotated; replacement
 * requires the artist to revoke access intentionally first.
 */
export async function prepareTrackedEmailClientHandoff(input: {
  packageId: string
  submissionVersionId: string
  recipient: string
  subject: string
  body: string
}) {
  if (!input.recipient.trim()) throw new Error("A verified submission email is required before preparing delivery.")
  await assertManualFallbackSafe(input.submissionVersionId)

  let access: Awaited<ReturnType<typeof createRecipientReviewAccess>>
  try {
    access = await createRecipientReviewAccess(input.packageId, input.submissionVersionId)
  } catch (reason) {
    if (reason instanceof Error && reason.name === "active_access_exists") {
      throw new Error("A tracked recipient handoff is already active for this application. Use Recipient access and replies to revoke it only if you intentionally need to prepare a new handoff.")
    }
    throw reason
  }

  if (access.submission_version_id && access.submission_version_id !== input.submissionVersionId) {
    throw new Error("KLEIO refused to prepare delivery because the recipient handoff did not match the preserved application version.")
  }

  const reviewUrl = recipientReviewUrl(access.token)
  const deliveryId = await recordApplicationDelivery({
    submissionVersionId: input.submissionVersionId,
    channel: "email_client",
    destination: input.recipient.trim(),
    recipientAccessId: access.access_id,
    state: "handoff_prepared",
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
