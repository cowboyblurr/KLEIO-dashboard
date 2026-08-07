import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"
import type { PortfolioWorkRecord } from "@/lib/kleio-live-data"
import type { OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import type { ApplicationPackageRecord, SubmissionMethod } from "@/lib/kleio-application-preparation"
import type { OpportunityMaterialReadiness } from "@/lib/kleio-opportunity-presentation"

export type ComposerRequirement = OpportunityDirectoryItem["requirements"][number] & {
  category?: string
  description?: string
  source_location?: string
  passport_field?: string
  input_type?: string
  minimum_word_count?: number | null
  maximum_word_count?: number | null
  minimum_item_count?: number | null
  maximum_item_count?: number | null
  accepted_file_types?: string[]
  maximum_file_size_bytes?: number | null
  maximum_total_size_bytes?: number | null
  filename_pattern?: string
  requires_artist_confirmation?: boolean
  legal_declaration?: boolean
  payment_required?: boolean
  human_verification_required?: boolean
  confidence_score?: number | null
  constraints?: Record<string, unknown>
}

export type ComposerAnswer = {
  text: string
  aiDraftId?: string
  aiAssisted?: boolean
  reviewed?: boolean
  updatedAt?: string
}

export type ComposerAnswerMap = Record<string, ComposerAnswer>

export type PreflightIssue = {
  id: string
  severity: "blocking" | "review"
  section: "requirements" | "questions" | "portfolio" | "documents" | "submission" | "approval"
  label: string
  detail: string
  anchor: string
}

export type ApplicationPreflight = {
  ready: boolean
  blockingCount: number
  reviewCount: number
  completedQuestionCount: number
  totalQuestionCount: number
  selectedWorkCount: number
  requiredWorkCount: number | null
  issues: PreflightIssue[]
  checkedAt: string
}

export type ApplicationSubmissionVersion = {
  id: string
  package_id: string
  artist_user_id: string
  opportunity_id: string
  application_id: string | null
  version_number: number
  submission_method: SubmissionMethod
  destination: string
  snapshot: Record<string, unknown>
  preflight_snapshot: Record<string, unknown>
  data_scope: "real" | "guided_demo" | "synthetic_test"
  finalized_at: string
  created_at: string
}

export type ApplicationTimelineItem = {
  id: string
  source: "composer" | "submission" | "recipient"
  eventType: string
  evidenceLevel: "self_reported" | "system_observed" | "recipient_confirmed" | "provider_confirmed"
  label: string
  detail: string
  createdAt: string
}

const answerKeys = new Set([
  "project_proposal",
  "project_description",
  "application_question",
  "motivation",
  "interest_statement",
  "community_impact",
  "public_programming",
  "work_plan",
  "timeline",
  "budget",
  "budget_narrative",
  "references",
  "additional_information",
])

const explicitWrittenInputTypes = new Set(["textarea", "long_text", "written_response", "essay", "text", "short_text"])
const explicitFileInputTypes = new Set(["document", "documents", "file", "upload", "url_or_document"])

function normalizedKey(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")
}

function words(value: string) {
  const clean = value.trim()
  return clean ? clean.split(/\s+/).length : 0
}

export function requirementAnswerKey(requirement: ComposerRequirement) {
  return requirement.id || normalizedKey(requirement.material_key || requirement.label)
}

export function requirementNeedsComposerAnswer(requirement: ComposerRequirement) {
  const key = normalizedKey(requirement.material_key)
  const category = normalizedKey(requirement.category || "")
  const inputType = normalizedKey(requirement.input_type || "")
  if (explicitWrittenInputTypes.has(inputType)) return true
  if (explicitFileInputTypes.has(inputType)) return false
  if ((requirement.accepted_file_types?.length ?? 0) > 0 && inputType !== "mixed") return false
  if (answerKeys.has(key)) return true
  if (["application_question", "written_response", "narrative", "essay", "proposal"].includes(category)) return true
  if (inputType === "mixed") return true
  return false
}

export function composerQuestions(item: OpportunityDirectoryItem) {
  return (item.requirements as ComposerRequirement[])
    .filter(requirementNeedsComposerAnswer)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function answersFromPackage(packageRecord: ApplicationPackageRecord | null): ComposerAnswerMap {
  const written = packageRecord?.written_content && typeof packageRecord.written_content === "object"
    ? packageRecord.written_content as Record<string, unknown>
    : {}
  const stored = written.application_answers
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return {}
  const answers: ComposerAnswerMap = {}
  for (const [key, value] of Object.entries(stored as Record<string, unknown>)) {
    if (typeof value === "string") answers[key] = { text: value }
    else if (value && typeof value === "object" && !Array.isArray(value)) {
      const record = value as Record<string, unknown>
      answers[key] = {
        text: typeof record.text === "string" ? record.text : "",
        aiDraftId: typeof record.aiDraftId === "string" ? record.aiDraftId : undefined,
        aiAssisted: Boolean(record.aiAssisted),
        reviewed: Boolean(record.reviewed),
        updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
      }
    }
  }
  return answers
}

export function writtenContentWithAnswers(
  current: Record<string, unknown>,
  answers: ComposerAnswerMap,
) {
  return {
    ...current,
    application_answers: answers,
  }
}

function portfolioRequirement(item: OpportunityDirectoryItem): ComposerRequirement | null {
  return ((item.requirements as ComposerRequirement[]).find((requirement) => {
    const key = normalizedKey(requirement.material_key)
    return ["portfolio", "work_samples", "artwork_images", "images", "image_list"].includes(key)
  }) ?? null)
}

export function buildApplicationPreflight(input: {
  item: OpportunityDirectoryItem
  readiness: OpportunityMaterialReadiness
  selectedWorks: PortfolioWorkRecord[]
  answers: ComposerAnswerMap
  approvals: Record<string, boolean>
  method: SubmissionMethod
  destination: string
}): ApplicationPreflight {
  const { item, readiness, selectedWorks, answers, approvals, method, destination } = input
  const issues: PreflightIssue[] = []
  const questions = composerQuestions(item)

  for (const requirement of readiness.requirements) {
    if (["missing", "limit_error", "unverified"].includes(requirement.status)) {
      issues.push({
        id: `requirement-${requirement.id}`,
        severity: "blocking",
        section: "requirements",
        label: requirement.label,
        detail: requirement.explanation,
        anchor: `requirement-${requirement.id}`,
      })
    } else if (requirement.status === "needs_review" && !questions.some((question) => question.id === requirement.id)) {
      issues.push({
        id: `review-${requirement.id}`,
        severity: "review",
        section: "requirements",
        label: requirement.label,
        detail: requirement.explanation,
        anchor: `requirement-${requirement.id}`,
      })
    }
  }

  for (const question of questions) {
    if (!question.required) continue
    const answer = answers[requirementAnswerKey(question)]?.text?.trim() ?? ""
    const count = words(answer)
    if (!answer) {
      issues.push({
        id: `question-${question.id}-missing`,
        severity: "blocking",
        section: "questions",
        label: question.label || "Application question",
        detail: "This required response is still empty.",
        anchor: `question-${question.id}`,
      })
      continue
    }
    if (question.minimum_word_count && count < question.minimum_word_count) {
      issues.push({
        id: `question-${question.id}-minimum`,
        severity: "blocking",
        section: "questions",
        label: question.label,
        detail: `${count} words written; the source requires at least ${question.minimum_word_count}.`,
        anchor: `question-${question.id}`,
      })
    }
    if (question.maximum_word_count && count > question.maximum_word_count) {
      issues.push({
        id: `question-${question.id}-maximum`,
        severity: "blocking",
        section: "questions",
        label: question.label,
        detail: `${count} words written; the source allows no more than ${question.maximum_word_count}.`,
        anchor: `question-${question.id}`,
      })
    }
  }

  const workRequirement = portfolioRequirement(item)
  const minimumWorks = workRequirement?.minimum_item_count ?? (workRequirement?.required ? 1 : null)
  const maximumWorks = workRequirement?.maximum_item_count ?? null
  if (minimumWorks !== null && selectedWorks.length < minimumWorks) {
    issues.push({
      id: "portfolio-minimum",
      severity: "blocking",
      section: "portfolio",
      label: "Portfolio selection",
      detail: `${minimumWorks} work${minimumWorks === 1 ? " is" : "s are"} required; ${selectedWorks.length} selected.`,
      anchor: "portfolio-selection",
    })
  }
  if (maximumWorks !== null && selectedWorks.length > maximumWorks) {
    issues.push({
      id: "portfolio-maximum",
      severity: "blocking",
      section: "portfolio",
      label: "Portfolio selection",
      detail: `Select no more than ${maximumWorks} works; ${selectedWorks.length} are selected.`,
      anchor: "portfolio-selection",
    })
  }
  for (const work of selectedWorks) {
    const missing = [!work.title.trim() ? "title" : "", !work.image_path ? "image" : ""].filter(Boolean)
    if (missing.length) {
      issues.push({
        id: `portfolio-${work.id}`,
        severity: "blocking",
        section: "portfolio",
        label: work.title || "Untitled work",
        detail: `Missing required portfolio metadata: ${missing.join(", ")}.`,
        anchor: "portfolio-selection",
      })
    }
  }

  if (method === "email" && !destination.trim()) {
    issues.push({
      id: "submission-email",
      severity: "blocking",
      section: "submission",
      label: "Submission email",
      detail: "KLEIO could not verify a recipient email from the opportunity source.",
      anchor: "submission-review",
    })
  }
  if (["external_portal", "download_package", "unknown"].includes(method) && !destination.trim()) {
    issues.push({
      id: "submission-destination",
      severity: "review",
      section: "submission",
      label: "Submission destination",
      detail: "Confirm the official submission destination before leaving KLEIO.",
      anchor: "submission-review",
    })
  }

  const incompleteApproval = Object.entries(approvals).find(([, approved]) => !approved)
  if (incompleteApproval) {
    issues.push({
      id: "artist-approval",
      severity: "blocking",
      section: "approval",
      label: "Final artist review",
      detail: "Complete every final review confirmation before finalizing a submission version.",
      anchor: "final-review",
    })
  }

  const blockingCount = issues.filter((issue) => issue.severity === "blocking").length
  const reviewCount = issues.filter((issue) => issue.severity === "review").length
  const completedQuestionCount = questions.filter((question) => Boolean(answers[requirementAnswerKey(question)]?.text?.trim())).length

  return {
    ready: blockingCount === 0,
    blockingCount,
    reviewCount,
    completedQuestionCount,
    totalQuestionCount: questions.length,
    selectedWorkCount: selectedWorks.length,
    requiredWorkCount: minimumWorks,
    issues,
    checkedAt: new Date().toISOString(),
  }
}

export async function autosaveComposerWrittenContent(packageId: string, writtenContent: Record<string, unknown>) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to save this application.")
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const { error } = await supabase.from("application_packages").update({
    written_content: writtenContent,
    last_autosaved_at: now,
    updated_at: now,
  }).eq("id", packageId).eq("artist_user_id", account.user.id)
  if (error) throw error
  return now
}

export async function finalizeApplicationSubmissionVersion(packageId: string, preflight: ApplicationPreflight) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in before finalizing an application.")
  if (!preflight.ready) throw new Error("Resolve every blocking preflight issue before finalizing this application.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("finalize_my_application_submission_version", {
    target_package_id: packageId,
    supplied_preflight: {
      ready: preflight.ready,
      blocking_count: preflight.blockingCount,
      review_count: preflight.reviewCount,
      completed_question_count: preflight.completedQuestionCount,
      total_question_count: preflight.totalQuestionCount,
      selected_work_count: preflight.selectedWorkCount,
      required_work_count: preflight.requiredWorkCount,
      issues: preflight.issues,
      checked_at: preflight.checkedAt,
    },
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row?.submission_version_id) throw new Error("KLEIO could not preserve the finalized application version.")
  return {
    id: String(row.submission_version_id),
    versionNumber: Number(row.version_number),
    finalizedAt: String(row.finalized_at),
  }
}

export async function loadApplicationSubmissionVersions(packageId: string): Promise<ApplicationSubmissionVersion[]> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to view application versions.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("application_submission_versions").select("*")
    .eq("package_id", packageId)
    .eq("artist_user_id", account.user.id)
    .order("version_number", { ascending: false })
  if (error) throw error
  return (data ?? []) as ApplicationSubmissionVersion[]
}

export async function recordArtistApplicationTimelineEvent(input: {
  packageId: string
  submissionVersionId?: string | null
  eventType: string
  summary?: string
  metadata?: Record<string, unknown>
}) {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to update this application.")
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("record_my_application_timeline_event", {
    target_package_id: input.packageId,
    target_submission_version_id: input.submissionVersionId || null,
    target_event_type: input.eventType,
    target_summary: input.summary || "",
    target_metadata: input.metadata ?? {},
  })
  if (error) throw error
  return String(data)
}

function displayEvent(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export async function loadApplicationTimeline(packageId: string): Promise<ApplicationTimelineItem[]> {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to view this application timeline.")
  const supabase = getSupabaseBrowserClient()
  const [composerResponse, submissionResponse, recipientResponse] = await Promise.all([
    supabase.from("application_timeline_events").select("id,event_type,evidence_level,summary,created_at").eq("package_id", packageId).eq("artist_user_id", account.user.id),
    supabase.from("application_submission_attempts").select("id,status,method,destination,provider_reference,created_at").eq("package_id", packageId).eq("artist_user_id", account.user.id),
    supabase.from("application_recipient_events").select("id,event_type,evidence_level,metadata,created_at").eq("package_id", packageId).eq("artist_user_id", account.user.id),
  ])
  if (composerResponse.error) throw composerResponse.error
  if (submissionResponse.error) throw submissionResponse.error
  if (recipientResponse.error) throw recipientResponse.error

  const items: ApplicationTimelineItem[] = [
    ...(composerResponse.data ?? []).map((row) => ({
      id: `composer:${row.id}`,
      source: "composer" as const,
      eventType: row.event_type,
      evidenceLevel: row.evidence_level as ApplicationTimelineItem["evidenceLevel"],
      label: displayEvent(row.event_type),
      detail: row.summary || "Application activity recorded in KLEIO.",
      createdAt: row.created_at,
    })),
    ...(submissionResponse.data ?? []).map((row) => ({
      id: `submission:${row.id}`,
      source: "submission" as const,
      eventType: row.status,
      evidenceLevel: row.status === "confirmed" ? "provider_confirmed" as const : row.status === "artist_reported" ? "self_reported" as const : "system_observed" as const,
      label: row.status === "artist_reported" ? "Artist marked as sent" : displayEvent(row.status),
      detail: [row.method ? `Method: ${displayEvent(row.method)}` : "", row.destination ? `Destination: ${row.destination}` : "", row.provider_reference ? `Reference: ${row.provider_reference}` : ""].filter(Boolean).join(" · ") || "Submission activity recorded.",
      createdAt: row.created_at,
    })),
    ...(recipientResponse.data ?? []).map((row) => ({
      id: `recipient:${row.id}`,
      source: "recipient" as const,
      eventType: row.event_type,
      evidenceLevel: row.evidence_level as ApplicationTimelineItem["evidenceLevel"],
      label: displayEvent(row.event_type),
      detail: row.event_type === "application_page_viewed" ? "The hosted application page was accessed. This does not prove the application was read in full." : "Recipient-side activity recorded for this application.",
      createdAt: row.created_at,
    })),
  ]

  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
