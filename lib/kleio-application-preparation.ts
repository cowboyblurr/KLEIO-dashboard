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
  source_id?: string | null
  source_version_id?: string | null
  content_text?: string
  content_data?: Record<string, unknown>
  validation_result?: Record<string, unknown>
  included_in_package?: boolean
  artist_confirmed_at?: string | null
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
  attachment_checksums?: Record<string, unknown>
  package_version?: number
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

type RequirementAttachmentRow = {
  id: string
  requirement_id: string
  source_id: string
  source_version_id: string | null
  validation_status: string
  validation_results: unknown[]
  included_in_package: boolean
  artist_confirmed_at: string | null
  source: {
    id: string
    checksum: string
    original_filename: string | null
    label: string
    classification: string
    document_version: number
    is_current_version: boolean
  } | null
  requirement: {
    id: string
    material_key: string
    label: string
    required: boolean
  } | null
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function firstEmail(value: string) {
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  return match?.[0] ?? ""
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function attachmentItemStatus(status: string): ApplicationPackageItemInput["status"] {
  if (status === "satisfied") return "complete"
  if (status === "invalid") return "limit_error"
  if (status === "missing") return "missing"
  if (status === "cannot_determine") return "unverified"
  if (["likely_satisfied", "needs_artist_review", "partially_satisfied", "conflict_detected", "requirement_changed"].includes(status)) return "needs_review"
  return "unverified"
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
    notice: "Prepared by KLEIO for artist review. This file is not proof of submission. Private requirement attachments are preserved in the authenticated application package and are not exposed in this portable manifest.",
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

async function loadConfirmedRequirementAttachments(artistUserId: string, opportunityId: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_requirement_attachments")
    .select(`
      id,requirement_id,source_id,source_version_id,validation_status,validation_results,included_in_package,artist_confirmed_at,
      source:artist_import_sources!application_requirement_attachments_source_id_fkey(
        id,checksum,original_filename,label,classification,document_version,is_current_version
      ),
      requirement:opportunity_requirements!application_requirement_attachments_requirement_id_fkey(
        id,material_key,label,required
      )
    `)
    .eq("artist_user_id", artistUserId)
    .eq("opportunity_id", opportunityId)
    .eq("included_in_package", true)
    .order("created_at")
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    validation_results: Array.isArray(row.validation_results) ? row.validation_results : [],
    source: Array.isArray(row.source) ? row.source[0] ?? null : row.source,
    requirement: Array.isArray(row.requirement) ? row.requirement[0] ?? null : row.requirement,
  })) as unknown as RequirementAttachmentRow[]
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
  const confirmedAttachments = await loadConfirmedRequirementAttachments(account.user.id, input.item.id)
  const attachmentByRequirement = new Map(confirmedAttachments.map((attachment) => [attachment.requirement_id, attachment]))
  const attachmentChecksums = Object.fromEntries(confirmedAttachments.flatMap((attachment) => attachment.source ? [[attachment.source_id, {
    checksum: attachment.source.checksum,
    classification: attachment.source.classification,
    document_version: attachment.source.document_version,
    source_version_id: attachment.source_version_id,
  }]] : []))
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
    readiness: {
      ...input.readiness,
      exact_requirement_attachment_count: confirmedAttachments.length,
      exact_requirement_attachments_reviewed: confirmedAttachments.every((attachment) => Boolean(attachment.artist_confirmed_at)),
    },
    requirement_snapshot: input.item.requirements,
    passport_snapshot: input.passport ?? {},
    portfolio_snapshot: input.selectedWorks.map((work) => ({ ...work, image_url: undefined })),
    written_content: input.writtenContent,
    email_preview: input.emailPreview,
    external_destination: destination,
    approval_confirmations: input.approvals,
    attachment_checksums: attachmentChecksums,
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
  if (confirmedAttachments.length) {
    const { error: associationError } = await supabase.from("application_requirement_attachments").update({
      package_id: packageRecord.id,
      application_id: input.application?.id ?? null,
      updated_at: new Date().toISOString(),
    }).eq("artist_user_id", account.user.id).eq("opportunity_id", input.item.id).eq("included_in_package", true)
    if (associationError) throw associationError
  }

  const representedRequirements = new Set(input.items.flatMap((item) => item.requirement_id ? [item.requirement_id] : []))
  const providedItems = input.items.map((item) => {
    const attachment = item.requirement_id ? attachmentByRequirement.get(item.requirement_id) : undefined
    return {
      ...item,
      package_id: packageRecord.id,
      source_kind: attachment ? "private_canonical_source" : item.source_kind,
      source_reference: attachment?.source_id ?? item.source_reference ?? "",
      source_id: attachment?.source_id ?? item.source_id ?? null,
      source_version_id: attachment?.source_version_id ?? item.source_version_id ?? null,
      content_text: item.content_text ?? "",
      content_data: {
        ...(item.content_data ?? {}),
        ...(attachment ? {
          source_classification: attachment.source?.classification ?? "",
          document_version: attachment.source?.document_version ?? null,
          source_is_current_version: attachment.source?.is_current_version ?? null,
        } : {}),
      },
      validation_result: attachment ? {
        status: attachment.validation_status,
        checks: attachment.validation_results,
        source_version_id: attachment.source_version_id,
      } : item.validation_result ?? {},
      included_in_package: attachment ? attachment.included_in_package : item.included_in_package ?? false,
      artist_confirmed_at: attachment?.artist_confirmed_at ?? item.artist_confirmed_at ?? null,
      artist_approved: attachment ? Boolean(attachment.artist_confirmed_at) : item.artist_approved ?? false,
      ai_assisted: item.ai_assisted ?? false,
    }
  })
  const additionalAttachmentItems = confirmedAttachments
    .filter((attachment) => !representedRequirements.has(attachment.requirement_id))
    .map((attachment, index) => ({
      package_id: packageRecord.id,
      requirement_id: attachment.requirement_id,
      item_type: attachment.requirement?.material_key ?? "supporting_document",
      label: attachment.requirement?.label ?? attachment.source?.original_filename ?? "Private requirement source",
      status: attachmentItemStatus(attachment.validation_status),
      source_kind: "private_canonical_source",
      source_reference: attachment.source_id,
      source_id: attachment.source_id,
      source_version_id: attachment.source_version_id,
      content_text: "",
      content_data: {
        source_classification: attachment.source?.classification ?? "",
        document_version: attachment.source?.document_version ?? null,
        source_is_current_version: attachment.source?.is_current_version ?? null,
      },
      validation_result: {
        status: attachment.validation_status,
        checks: attachment.validation_results,
        source_version_id: attachment.source_version_id,
      },
      included_in_package: true,
      artist_confirmed_at: attachment.artist_confirmed_at,
      artist_approved: Boolean(attachment.artist_confirmed_at),
      ai_assisted: false,
      sort_order: input.items.length + index,
    }))

  const { error: deleteError } = await supabase.from("application_package_items").delete().eq("package_id", packageRecord.id)
  if (deleteError) throw deleteError
  const packageItems = [...providedItems, ...additionalAttachmentItems]
  if (packageItems.length) {
    const { error: insertError } = await supabase.from("application_package_items").insert(packageItems)
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
