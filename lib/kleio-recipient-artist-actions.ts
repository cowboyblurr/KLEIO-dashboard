import { buildApplicationAlignmentDraft, type ApplicationAlignmentDraft } from "@/lib/kleio-application-alignment"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import type { ExtendedArtistPassport, OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"

export type ArtistApplicationPackage = {
  id: string
  artist_user_id: string
  opportunity_id: string
  state: string
  submission_method: string
  readiness: Record<string, unknown>
  passport_snapshot: ExtendedArtistPassport | Record<string, unknown>
  portfolio_snapshot: Array<PortfolioWorkRecord | Record<string, unknown>>
  written_content: Record<string, unknown>
  email_preview: {
    to?: string
    subject?: string
    body?: string
    attachments?: string[]
  }
  external_destination: string
  approval_confirmations: Record<string, unknown>
  artist_approved_at: string | null
  data_scope: "real" | "guided_demo" | "synthetic_test"
  updated_at: string
}

export type ArtistSubmissionAttempt = {
  id: string
  method: string
  status: string
  destination: string
  provider_reference: string
  error_code: string
  error_message: string
  request_snapshot: Record<string, unknown>
  response_snapshot: Record<string, unknown>
  created_at: string
}

type AlignmentSnapshot = {
  passport: ExtendedArtistPassport | null
  portfolio: PortfolioWorkRecord[]
}

const alignmentSnapshots = new Map<string, AlignmentSnapshot>()

function normalizePortfolioSnapshot(rows: ArtistApplicationPackage["portfolio_snapshot"]): PortfolioWorkRecord[] {
  return rows.map((raw, index) => {
    const work = raw as Partial<PortfolioWorkRecord>
    return {
      id: String(work.id ?? `snapshot-${index}`),
      artist_user_id: String(work.artist_user_id ?? ""),
      title: String(work.title ?? ""),
      year: String(work.year ?? ""),
      medium: String(work.medium ?? ""),
      dimensions: String(work.dimensions ?? ""),
      description: String(work.description ?? ""),
      series: String(work.series ?? ""),
      tags: Array.isArray(work.tags) ? work.tags.map(String) : [],
      image_path: typeof work.image_path === "string" ? work.image_path : null,
      image_url: null,
      sort_order: typeof work.sort_order === "number" ? work.sort_order : index,
      created_at: String(work.created_at ?? ""),
      updated_at: String(work.updated_at ?? ""),
    }
  })
}

export async function loadArtistApplicationPackage(opportunityId: string): Promise<ArtistApplicationPackage | null> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_packages")
    .select("id, artist_user_id, opportunity_id, state, submission_method, readiness, passport_snapshot, portfolio_snapshot, written_content, email_preview, external_destination, approval_confirmations, artist_approved_at, data_scope, updated_at")
    .eq("artist_user_id", account.user.id)
    .eq("opportunity_id", opportunityId)
    .maybeSingle()
  if (error) throw error
  const packageRecord = data as ArtistApplicationPackage | null
  if (packageRecord) {
    alignmentSnapshots.set(opportunityId, {
      passport: packageRecord.passport_snapshot as ExtendedArtistPassport,
      portfolio: normalizePortfolioSnapshot(packageRecord.portfolio_snapshot ?? []),
    })
  } else {
    alignmentSnapshots.delete(opportunityId)
  }
  return packageRecord
}

export async function saveApplicationAlignment(packageId: string, alignment: ApplicationAlignmentDraft) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data: current, error: currentError } = await supabase
    .from("application_packages")
    .select("written_content")
    .eq("id", packageId)
    .eq("artist_user_id", account.user.id)
    .single()
  if (currentError) throw currentError
  const written = current?.written_content && typeof current.written_content === "object"
    ? current.written_content as Record<string, unknown>
    : {}
  const { data, error } = await supabase
    .from("application_packages")
    .update({
      written_content: {
        ...written,
        email_introduction: alignment.introduction,
        alignment_map: alignment.evidence,
        alignment_missing_context: alignment.missingContext,
        alignment_prepared_at: new Date().toISOString(),
        alignment_status: "prepared_for_review",
      },
      artist_approved_at: null,
      approval_confirmations: {},
      state: "artist_review_required",
      updated_at: new Date().toISOString(),
    })
    .eq("id", packageId)
    .eq("artist_user_id", account.user.id)
    .select("id, written_content, state, artist_approved_at, approval_confirmations, updated_at")
    .single()
  if (error) throw error
  return data
}

export function prepareApplicationAlignment(
  opportunity: OpportunityDirectoryItem,
  passport: ExtendedArtistPassport | null,
  selectedWorks: PortfolioWorkRecord[],
) {
  const snapshot = alignmentSnapshots.get(opportunity.id)
  return buildApplicationAlignmentDraft(
    opportunity,
    passport ?? snapshot?.passport ?? null,
    selectedWorks.length ? selectedWorks : snapshot?.portfolio ?? [],
  )
}

export async function recordArtistSubmissionSignal(input: {
  packageId: string
  method: "mailto" | "gmail" | "download_package" | "secure_review"
  status: "package_exported" | "gmail_draft_created" | "email_client_opened" | "artist_reported" | "failed"
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
  const { data, error } = await supabase
    .from("application_submission_attempts")
    .insert({
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
    .select("id, method, status, destination, provider_reference, error_code, error_message, request_snapshot, response_snapshot, created_at")
    .single()
  if (error) throw error
  return data as ArtistSubmissionAttempt
}

export async function loadArtistSubmissionAttempts(packageId: string) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("application_submission_attempts")
    .select("id, method, status, destination, provider_reference, error_code, error_message, request_snapshot, response_snapshot, created_at")
    .eq("package_id", packageId)
    .eq("artist_user_id", account.user.id)
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) throw error
  return (data ?? []) as ArtistSubmissionAttempt[]
}

export function approvalsComplete(approvals: Record<string, unknown>) {
  const values = Object.values(approvals)
  return values.length >= 4 && values.every(Boolean)
}
