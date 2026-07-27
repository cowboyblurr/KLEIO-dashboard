import {
  getSupabaseBrowserClient,
  loadInstitutionMessengerContexts,
  loadKleioAccount,
  type InstitutionMessengerContext,
} from "@/lib/kleio-supabase"

export type ReviewerApplicationAnswer = {
  question_key: string
  answer_text: string
}

export type ReviewerPortfolioWork = {
  id: string
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  series: string
  tags: string[]
  image_path: string | null
}

export type ReviewerAssignment = {
  id: string
  application_id: string
  due_at: string | null
  assignment_status: string
  created_at: string
  application: {
    id: string
    artist_name: string
    profile_snapshot: Record<string, unknown>
    status: string
    submitted_at: string | null
    call: {
      id: string
      title: string
      summary: string
      deadline_at: string | null
      institution_id: string
      institution_name: string
      review_configuration: Record<string, unknown>
    } | null
    answers: ReviewerApplicationAnswer[]
    works: Array<{ sort_order: number; work: ReviewerPortfolioWork | null }>
  }
  review: {
    id: string
    recommendation: string
    score: number | null
    internal_notes: string
    review_status: "not_started" | "in_progress" | "completed"
    updated_at: string
  } | null
}

export type ReviewerWorkspaceData = {
  accountName: string
  institution: InstitutionMessengerContext | null
  assignments: ReviewerAssignment[]
}

type RawCall = {
  id: string
  title: string
  summary: string
  deadline_at: string | null
  institution_id: string
  institution_name: string
  review_configuration: Record<string, unknown> | null
}

type RawApplicationWorkSelection = {
  sort_order: number
  portfolio_works: ReviewerPortfolioWork | ReviewerPortfolioWork[] | null
}

type RawApplication = {
  id: string
  artist_name: string
  profile_snapshot: Record<string, unknown> | null
  status: string
  submitted_at: string | null
  open_calls: RawCall | RawCall[] | null
  application_answers: ReviewerApplicationAnswer[] | null
  application_works: RawApplicationWorkSelection[] | null
}

type RawAssignment = {
  id: string
  application_id: string
  due_at: string | null
  status: string
  created_at: string
  applications: RawApplication | RawApplication[] | null
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

export async function loadReviewerWorkspace(): Promise<ReviewerWorkspaceData> {
  const account = await loadKleioAccount()
  if (!account || account.profile.role !== "collaborator") {
    throw new Error("A reviewer account is required to open this workspace.")
  }

  const supabase = getSupabaseBrowserClient()
  const [contextRows, assignmentResponse, reviewResponse] = await Promise.all([
    loadInstitutionMessengerContexts(),
    supabase
      .from("review_assignments")
      .select(`
        id,
        application_id,
        due_at,
        status,
        created_at,
        applications (
          id,
          artist_name,
          profile_snapshot,
          status,
          submitted_at,
          open_calls (
            id,
            title,
            summary,
            deadline_at,
            institution_id,
            institution_name,
            review_configuration
          ),
          application_answers (
            question_key,
            answer_text
          ),
          application_works (
            sort_order,
            portfolio_works (
              id,
              title,
              year,
              medium,
              dimensions,
              description,
              series,
              tags,
              image_path
            )
          )
        )
      `)
      .eq("reviewer_user_id", account.user.id)
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("reviews")
      .select("id, application_id, recommendation, score, internal_notes, review_status, updated_at")
      .eq("reviewer_user_id", account.user.id),
  ])

  if (assignmentResponse.error) throw assignmentResponse.error
  if (reviewResponse.error) throw reviewResponse.error

  const reviewByApplication = new Map(
    (reviewResponse.data ?? []).map((review) => [String(review.application_id), {
      id: String(review.id),
      recommendation: String(review.recommendation ?? ""),
      score: review.score === null ? null : Number(review.score),
      internal_notes: String(review.internal_notes ?? ""),
      review_status: String(review.review_status ?? "not_started") as "not_started" | "in_progress" | "completed",
      updated_at: String(review.updated_at),
    }]),
  )

  const assignments = ((assignmentResponse.data ?? []) as unknown as RawAssignment[]).flatMap((row): ReviewerAssignment[] => {
    const application = relationOne(row.applications)
    if (!application) return []
    const call = relationOne(application.open_calls)
    const works = (application.application_works ?? [])
      .map((selection: RawApplicationWorkSelection) => ({
        sort_order: selection.sort_order,
        work: relationOne(selection.portfolio_works),
      }))
      .sort((first, second) => first.sort_order - second.sort_order)

    return [{
      id: row.id,
      application_id: row.application_id,
      due_at: row.due_at,
      assignment_status: row.status,
      created_at: row.created_at,
      application: {
        id: application.id,
        artist_name: application.artist_name,
        profile_snapshot: application.profile_snapshot ?? {},
        status: application.status,
        submitted_at: application.submitted_at,
        call: call ? {
          ...call,
          review_configuration: call.review_configuration ?? {},
        } : null,
        answers: application.application_answers ?? [],
        works,
      },
      review: reviewByApplication.get(application.id) ?? null,
    }]
  })

  return {
    accountName: account.profile.display_name || account.user.email?.split("@")[0] || "Reviewer",
    institution: contextRows[0] ?? null,
    assignments,
  }
}

export async function saveReviewerReview(input: {
  applicationId: string
  score: number | null
  recommendation: "" | "advance" | "discuss" | "decline" | "abstain"
  internalNotes: string
  reviewStatus: "not_started" | "in_progress" | "completed"
}) {
  const account = await loadKleioAccount()
  if (!account || account.profile.role !== "collaborator") {
    throw new Error("A reviewer account is required to save a review.")
  }
  if (input.score !== null && (!Number.isFinite(input.score) || input.score < 0 || input.score > 100)) {
    throw new Error("The score must be between 0 and 100.")
  }
  if (input.reviewStatus === "completed" && (!input.recommendation || input.score === null)) {
    throw new Error("A score and recommendation are required before completing the review.")
  }

  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase
    .from("reviews")
    .upsert({
      application_id: input.applicationId,
      reviewer_user_id: account.user.id,
      score: input.score,
      recommendation: input.recommendation,
      internal_notes: input.internalNotes.trim(),
      review_status: input.reviewStatus,
      updated_at: new Date().toISOString(),
    }, { onConflict: "application_id,reviewer_user_id" })
    .select("id, application_id, recommendation, score, internal_notes, review_status, updated_at")
    .single()

  if (error) throw error
  return data
}
