import { loadKleioAccount } from "@/lib/kleio-supabase"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import type { ExtendedArtistPassport, OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import type { OpportunityMaterialReadiness } from "@/lib/kleio-opportunity-presentation"
import type { ApplicationRecord, PortfolioWorkRecord } from "@/lib/kleio-live-data"

export type SubmissionMethod = "native_kleio" | "email" | "external_portal" | "download_package" | "unknown"
export type ApplicationPackageState =
  | "draft"
  | "missing_information"
  | "artist_review_required"
  | "ready_for_submission"
  | "email_preview_ready"
  | "external_submission_required"
  | "submitted"
  | "confirmed"
  | "artist_reported_submitted"
  | "failed"
  | "withdrawn"
  | "deadline_passed"

export type ApplicationPackageItemInput = {
  requirement_id: string | null
  item_type: string
  label: string
  status: "complete" | "needs_review" | "missing" | "limit_error" | "unverified" | "optional" | "blocked"
  source_kind: string
  source_reference?: string
  content_text?: string
  content_data?: Record<string, unknown>
  artist_approved?: boolean
  ai_assisted?: boolean
  sort_order: number
}

export type ApplicationPackageRecord = {
  id: string
  artist_user_id: string
  opportunity_id: string
  application_id: string | null
  submission_method: SubmissionMethod
  state: ApplicationPackageState
  readiness: Record<string, unknown>
  requirement_snapshot: unknown[]
  passport_snapshot: Record<string, unknown>
  portfolio_snapshot: unknown[]
  written_content: Record<string, unknown>
  email_preview: Record<string, unknown>
  external_destination: string
  approval_confirmations: Record<string, boolean>
  artist_approved_at: string | null
  submitted_at: string | null
  provider_confirmation: string
  created_at: string
  updated_at: string
}

export type EmailPreview = {
  to: string
  subject: string
  body: string
  verifiedFromSource: boolean
  attachments: string[]
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function firstEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ""
}

export function deriveSubmissionMethod(item: OpportunityDirectoryItem): SubmissionMethod {
  const storedMethod = cleanText((item as OpportunityDirectoryItem & { submission_method?: string }).submission_method)
  if (["native_kleio", "email", "external_portal", "download_package", "unknown"].includes(storedMethod)) {
    return storedMethod as SubmissionMethod
  }
  if (item.application_mode === "internal" && item.internal_call) return "native_kleio"
  const requirementText = item.requirements.map((requirement) => `${requirement.material_key} ${requirement.label} ${requirement.source_text}`).join(" ")
  if (/email|e-mail|correo/i.test(requirementText) && firstEmail(requirementText)) return "email"
  if (item.application_url) return "external_portal"
  return item.canonical_url ? "download_package" : "unknown"
}

export function sourceSubmissionEmail(item: OpportunityDirectoryItem) {
  const storedEmail = cleanText((item as OpportunityDirectoryItem & { submission_email?: string }).submission_email)
  if (storedEmail) return storedEmail
  const sourceText = item.requirements.map((requirement) => requirement.source_text).join(" ")
  return firstEmail(sourceText)
}

export function buildEmailPreview(
  item: OpportunityDirectoryItem,
  passport: ExtendedArtistPassport | null,
  selectedWorks: PortfolioWorkRecord[],
  writtenContent: Record<string, string>,
): EmailPreview {
  const to = sourceSubmissionEmail(item)
  const artistName = passport?.professional_name?.trim() || "Artist"
  const subject = `Application: ${item.title} — ${artistName}`
  const introduction = writtenContent.email_introduction?.trim()
    || `Dear ${item.provider_name || "selection committee"},\n\nPlease find my application materials for ${item.title}.`
  const body = [
    introduction,
    "",
    writtenContent.project_proposal?.trim() || "",
    "",
    selectedWorks.length ? `Portfolio works included:\n${selectedWorks.map((work, index) => `${index + 1}. ${work.title}${work.year ? ` (${work.year})` : ""}`).join("\n")}` : "",
    "",
    `Sincerely,\n${artistName}`,
  ].filter(Boolean).join("\n")

  const attachments = [
    passport?.cv_file_path ? "Current CV" : "",
    passport?.bio?.trim() ? "Artist biography" : "",
    passport?.artist_statement?.trim() ? "Artist statement" : "",
    ...selectedWorks.map((work) => work.title),
  ].filter(Boolean)

  return { to, subject, body, verifiedFromSource: Boolean(to), attachments }
}

export function packageStateFor(
  item: OpportunityDirectoryItem,
  readiness: OpportunityMaterialReadiness,
  approvalsComplete: boolean,
): ApplicationPackageState {
  if (item.deadline_at && new Date(item.deadline_at).getTime() < Date.now()) return "deadline_passed"
  if (readiness.blockingCount > 0 || readiness.missing.length > 0) return "missing_information"
  if (!approvalsComplete || readiness.manualReview.length > 0) return "artist_review_required"
  const method = deriveSubmissionMethod(item)
  if (method === "email") return "email_preview_ready"
  if (method === "external_portal" || method === "download_package" || method === "unknown") return "external_submission_required"
  return "ready_for_submission"
}

export function buildPackageManifest(input: {
  item: OpportunityDirectoryItem
  passport: ExtendedArtistPassport | null
  selectedWorks: PortfolioWorkRecord[]
  readiness: OpportunityMaterialReadiness
  writtenContent: Record<string, string>
  emailPreview: EmailPreview
}) {
  const { item, passport, selectedWorks, readiness, writtenContent, emailPreview } = input
  return {
    generated_at: new Date().toISOString(),
    notice: "Prepared by KLEIO for artist review. This file is not proof of submission.",
    opportunity: {
      id: item.id,
      title: item.title,
      provider: item.provider_name,
      deadline_at: item.deadline_at,
      deadline_timezone: item.deadline_timezone,
      canonical_url: item.canonical_url,
      application_url: item.application_url,
      submission_method: deriveSubmissionMethod(item),
      source_last_verified_at: item.last_verified_at,
    },
    artist: passport ? {
      professional_name: passport.professional_name,
      location: passport.location,
      website_url: passport.website_url,
      instagram_url: passport.instagram_url,
      biography: passport.bio,
      artist_statement: passport.artist_statement,
      practice_description: passport.practice_description,
      education: passport.education,
      exhibition_history: passport.exhibition_history,
      awards: passport.awards,
      cv_file_path: passport.cv_file_path,
    } : null,
    readiness,
    written_content: writtenContent,
    portfolio: selectedWorks.map((work, index) => ({
      order: index + 1,
      id: work.id,
      title: work.title,
      year: work.year,
      medium: work.medium,
      dimensions: work.dimensions,
      description: work.description,
      series: work.series,
      tags: work.tags,
      source_asset_path: work.image_path,
    })),
    email_preview: emailPreview,
    requirements: item.requirements.map((requirement) => ({ ...requirement })),
  }
}

export async function loadApplicationPackage(opportunityId: string): Promise<ApplicationPackageRecord | null> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to prepare an application.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_packages")
    .select("*")
    .eq("artist_user_id", account.user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle()
  if (error) throw error
  return data as ApplicationPackageRecord | null
}

export async function saveApplicationPackage(input: {
  item: OpportunityDirectoryItem
  application: ApplicationRecord | null
  state: ApplicationPackageState
  readiness: OpportunityMaterialReadiness
  passport: ExtendedArtistPassport | null
  selectedWorks: PortfolioWorkRecord[]
  writtenContent: Record<string, string>
  emailPreview: EmailPreview
  approvals: Record<string, boolean>
  items: ApplicationPackageItemInput[]
}) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to prepare an application.")
  const supabase = getSupabaseBrowserClient()
  const approved = Object.values(input.approvals).length > 0 && Object.values(input.approvals).every(Boolean)
  const destination = deriveSubmissionMethod(input.item) === "email"
    ? input.emailPreview.to
    : input.item.application_url || input.item.canonical_url || ""
  const record = {
    artist_user_id: account.user.id,
    opportunity_id: input.item.id,
    application_id: input.application?.id ?? null,
    submission_method: deriveSubmissionMethod(input.item),
    state: input.state,
    readiness: input.readiness,
    requirement_snapshot: input.item.requirements,
    passport_snapshot: input.passport ?? {},
    portfolio_snapshot: input.selectedWorks.map((work) => ({ ...work, image_url: undefined })),
    written_content: input.writtenContent,
    email_preview: input.emailPreview,
    external_destination: destination,
    approval_confirmations: input.approvals,
    artist_approved_at: approved ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from("application_packages")
    .upsert(record, { onConflict: "artist_user_id,opportunity_id" })
    .select("*")
    .single()
  if (error) throw error

  const packageRecord = data as ApplicationPackageRecord
  const { error: deleteError } = await supabase.from("application_package_items").delete().eq("package_id", packageRecord.id)
  if (deleteError) throw deleteError
  if (input.items.length) {
    const { error: insertError } = await supabase.from("application_package_items").insert(
      input.items.map((item) => ({
        ...item,
        package_id: packageRecord.id,
        source_reference: item.source_reference ?? "",
        content_text: item.content_text ?? "",
        content_data: item.content_data ?? {},
        artist_approved: item.artist_approved ?? false,
        ai_assisted: item.ai_assisted ?? false,
      })),
    )
    if (insertError) throw insertError
  }
  return packageRecord
}

export async function recordSubmissionAttempt(input: {
  packageId: string
  method: SubmissionMethod
  status: "started" | "prepared" | "submitted" | "confirmed" | "failed" | "artist_reported"
  destination?: string
  providerReference?: string
  requestSnapshot?: Record<string, unknown>
  responseSnapshot?: Record<string, unknown>
  errorCode?: string
  errorMessage?: string
}) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("application_submission_attempts").insert({
    package_id: input.packageId,
    artist_user_id: account.user.id,
    method: input.method,
    status: input.status,
    destination: input.destination ?? "",
    provider_reference: input.providerReference ?? "",
    request_snapshot: input.requestSnapshot ?? {},
    response_snapshot: input.responseSnapshot ?? {},
    error_code: input.errorCode ?? "",
    error_message: input.errorMessage ?? "",
  })
  if (error) throw error
}

export async function markPackageArtistReportedSubmitted(packageId: string, confirmation: string) {
  const supabase = getSupabaseBrowserClient()
  const submittedAt = new Date().toISOString()
  const { data, error } = await supabase
    .from("application_packages")
    .update({
      state: "artist_reported_submitted",
      submitted_at: submittedAt,
      provider_confirmation: confirmation.trim(),
      updated_at: submittedAt,
    })
    .eq("id", packageId)
    .select("*")
    .single()
  if (error) throw error
  const packageRecord = data as ApplicationPackageRecord
  await recordSubmissionAttempt({
    packageId,
    method: packageRecord.submission_method,
    status: "artist_reported",
    destination: packageRecord.external_destination,
    providerReference: confirmation.trim(),
  })
  return packageRecord
}
