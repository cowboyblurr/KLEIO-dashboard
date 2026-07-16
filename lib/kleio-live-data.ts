import { getDemoSession } from "@/lib/kleio-demo-auth"
import { getSupabaseConfig, supabaseRest } from "@/lib/kleio-supabase"

export type KleioPersistenceMode = "supabase" | "preview"
export type OpenCallStatus = "draft" | "open" | "closed" | "under_review" | "completed" | "archived"
export type ApplicationStatus = "draft" | "submitted" | "in_review" | "needs_follow_up" | "shortlisted" | "finalist" | "accepted" | "declined" | "withdrawn"

export type InstitutionRecord = {
  id: string
  owner_user_id: string
  name: string
  organization_type: string
  description: string
  location: string
  website_url: string
  contact_name: string
  contact_email: string
  logo_path?: string | null
  created_at: string
  updated_at: string
}

export type ArtistProfileRecord = {
  id: string
  user_id: string
  professional_name: string
  location: string
  bio: string
  artist_statement: string
  practice_description: string
  website_url: string
  instagram_url: string
  disciplines: string[]
  mediums: string[]
  languages: string[]
  education: string
  exhibition_history: string
  awards: string
  cv_file_path?: string | null
  profile_completion: number
  created_at: string
  updated_at: string
}

export type PortfolioWorkRecord = {
  id: string
  artist_user_id: string
  title: string
  year: string
  medium: string
  dimensions: string
  description: string
  series: string
  tags: string[]
  image_path?: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type OpenCallRecord = {
  id: string
  institution_id: string
  created_by: string
  institution_name?: string
  title: string
  slug: string
  opportunity_type: string
  summary: string
  description: string
  location: string
  participation_format: string
  opens_at: string | null
  deadline_at: string | null
  notification_date: string | null
  program_start_date: string | null
  program_end_date: string | null
  eligibility: Record<string, unknown>
  required_materials: string[]
  review_configuration: {
    stages: string[]
    criteria: string[]
    ratingScale: number
    recommendationOptions: string[]
  }
  custom_questions: Array<{ id: string; label: string; required: boolean; type: "short" | "long" }>
  status: OpenCallStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export type ApplicationRecord = {
  id: string
  call_id: string
  artist_user_id: string
  artist_name: string
  artist_email: string
  status: ApplicationStatus
  profile_snapshot: Record<string, unknown>
  answers: Record<string, string>
  selected_work_ids: string[]
  submitted_at: string | null
  last_saved_at: string
  created_at: string
  updated_at: string
  call?: OpenCallRecord
  review?: ReviewRecord | null
}

export type ReviewRecord = {
  id: string
  application_id: string
  reviewer_user_id: string
  recommendation: string
  score: number | null
  internal_notes: string
  review_status: string
  created_at: string
  updated_at: string
}

export type MessageRecord = {
  id: string
  application_id: string
  sender_user_id: string
  recipient_user_id: string
  sender_role: "artist" | "institution"
  body: string
  read_at: string | null
  created_at: string
}

type PreviewState = {
  institutions: InstitutionRecord[]
  artistProfiles: ArtistProfileRecord[]
  portfolioWorks: PortfolioWorkRecord[]
  openCalls: OpenCallRecord[]
  applications: ApplicationRecord[]
  reviews: ReviewRecord[]
  messages: MessageRecord[]
}

const PREVIEW_KEY = "kleio-connected-preview-v1"

function now() {
  return new Date().toISOString()
}

function makeId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `call-${Date.now()}`
}

function isBrowser() {
  return typeof window !== "undefined"
}

function sessionIdentity() {
  const session = getDemoSession()
  if (!session) throw new Error("Sign in before changing KLEIO records.")
  return {
    id: session.userId ?? `preview-${session.role}`,
    role: session.role,
    name: session.name,
    email: session.email,
  }
}

function seedPreviewState(): PreviewState {
  const createdAt = now()
  const institution: InstitutionRecord = {
    id: "preview-institution-kleio",
    owner_user_id: "preview-institution",
    name: "KLEIO Arthouse",
    organization_type: "Arthouse",
    description: "Synthetic institution record for the controlled KLEIO test-run.",
    location: "Brooklyn, NY",
    website_url: "",
    contact_name: "Mara Voss",
    contact_email: "institution@kleio.demo",
    created_at: createdAt,
    updated_at: createdAt,
  }
  const artist: ArtistProfileRecord = {
    id: "preview-artist-profile",
    user_id: "preview-artist",
    professional_name: "Amina El Badri",
    location: "Miami, FL",
    bio: "A synthetic artist profile used to demonstrate KLEIO's connected application workflow.",
    artist_statement: "My practice explores memory, material presence, light, and spatial experience.",
    practice_description: "Installation, image-making, archival research, and sound.",
    website_url: "",
    instagram_url: "",
    disciplines: ["Installation", "Photography"],
    mediums: ["Textile", "Light", "Sound"],
    languages: ["English"],
    education: "Demo record",
    exhibition_history: "Demo record",
    awards: "Demo record",
    profile_completion: 88,
    created_at: createdAt,
    updated_at: createdAt,
  }
  const works: PortfolioWorkRecord[] = [
    ["preview-work-1", "Threshold Archive", "2026", "Textile, light, sound"],
    ["preview-work-2", "Soft Index", "2025", "Archival pigment print"],
    ["preview-work-3", "Rooms for Remembering", "2025", "Installation"],
  ].map(([id, title, year, medium], index) => ({
    id,
    artist_user_id: "preview-artist",
    title,
    year,
    medium,
    dimensions: "Variable",
    description: "Synthetic portfolio work for the KLEIO test-run.",
    series: "Memory Fields",
    tags: ["memory", "installation"],
    image_path: null,
    sort_order: index,
    created_at: createdAt,
    updated_at: createdAt,
  }))
  const call: OpenCallRecord = {
    id: "preview-call-residency-2026",
    institution_id: institution.id,
    created_by: institution.owner_user_id,
    institution_name: institution.name,
    title: "KLEIO Arthouse Residency 2026",
    slug: "kleio-arthouse-residency-2026",
    opportunity_type: "Residency",
    summary: "A synthetic open call demonstrating a complete KLEIO application and review workflow.",
    description: "A residency for artists working across installation, image-making, archival practice, sound, performance, and socially engaged research.",
    location: "Brooklyn, NY",
    participation_format: "In person",
    opens_at: "2026-07-16",
    deadline_at: "2026-08-14",
    notification_date: "2026-09-05",
    program_start_date: "2026-10-01",
    program_end_date: "2026-12-15",
    eligibility: { geography: "International", careerStage: "All career stages", notes: "Synthetic eligibility for demo purposes." },
    required_materials: ["Artist bio", "Artist statement", "CV", "Portfolio", "Project proposal"],
    review_configuration: {
      stages: ["Intake", "Review", "Shortlist", "Final decision"],
      criteria: ["Conceptual strength", "Program fit", "Feasibility"],
      ratingScale: 5,
      recommendationOptions: ["Advance", "Discuss", "Decline"],
    },
    custom_questions: [
      { id: "proposal", label: "Describe the project you would develop during the residency.", required: true, type: "long" },
      { id: "fit", label: "Why is this program relevant to your practice now?", required: true, type: "long" },
    ],
    status: "open",
    published_at: createdAt,
    created_at: createdAt,
    updated_at: createdAt,
  }
  return { institutions: [institution], artistProfiles: [artist], portfolioWorks: works, openCalls: [call], applications: [], reviews: [], messages: [] }
}

function loadPreviewState(): PreviewState {
  if (!isBrowser()) return seedPreviewState()
  const raw = window.localStorage.getItem(PREVIEW_KEY)
  if (!raw) {
    const seeded = seedPreviewState()
    window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(seeded))
    return seeded
  }
  try {
    return JSON.parse(raw) as PreviewState
  } catch {
    const seeded = seedPreviewState()
    window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(seeded))
    return seeded
  }
}

function savePreviewState(state: PreviewState) {
  if (!isBrowser()) return
  window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(state))
}

export function getPersistenceMode(): { mode: KleioPersistenceMode; label: string; detail: string } {
  if (getSupabaseConfig().configured) {
    return { mode: "supabase", label: "Connected Supabase data", detail: "Authentication and workflow records persist in the configured Supabase project." }
  }
  return { mode: "preview", label: "Local preview dataset", detail: "Supabase is not configured in this build. Test-run changes persist only in this browser." }
}

export function resetPreviewData() {
  if (!isBrowser()) return
  window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(seedPreviewState()))
}

export async function saveArtistProfile(input: Omit<ArtistProfileRecord, "id" | "user_id" | "created_at" | "updated_at">) {
  const identity = sessionIdentity()
  if (identity.role !== "artist") throw new Error("An artist session is required.")
  const timestamp = now()

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.artistProfiles.find((profile) => profile.user_id === identity.id)
    const record: ArtistProfileRecord = {
      ...input,
      id: existing?.id ?? makeId("artist-profile"),
      user_id: identity.id,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
    }
    state.artistProfiles = [...state.artistProfiles.filter((profile) => profile.user_id !== identity.id), record]
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<ArtistProfileRecord[]>("artist_profiles?on_conflict=user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify({ ...input, user_id: identity.id, updated_at: timestamp }),
  })
  return rows[0]
}

export async function saveInstitution(input: Omit<InstitutionRecord, "id" | "owner_user_id" | "created_at" | "updated_at">) {
  const identity = sessionIdentity()
  if (identity.role !== "institution") throw new Error("An institution session is required.")
  const timestamp = now()

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.institutions.find((institution) => institution.owner_user_id === identity.id)
    const record: InstitutionRecord = {
      ...input,
      id: existing?.id ?? makeId("institution"),
      owner_user_id: identity.id,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
    }
    state.institutions = [...state.institutions.filter((institution) => institution.owner_user_id !== identity.id), record]
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<InstitutionRecord[]>("institutions?on_conflict=owner_user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify({ ...input, owner_user_id: identity.id, updated_at: timestamp }),
  })
  return rows[0]
}

export async function getCurrentArtistProfile() {
  const identity = sessionIdentity()
  if (!getSupabaseConfig().configured) return loadPreviewState().artistProfiles.find((profile) => profile.user_id === identity.id) ?? loadPreviewState().artistProfiles[0] ?? null
  const rows = await supabaseRest<ArtistProfileRecord[]>(`artist_profiles?select=*&user_id=eq.${encodeURIComponent(identity.id)}&limit=1`, { method: "GET" })
  return rows[0] ?? null
}

export async function getCurrentInstitution() {
  const identity = sessionIdentity()
  if (!getSupabaseConfig().configured) return loadPreviewState().institutions.find((institution) => institution.owner_user_id === identity.id) ?? loadPreviewState().institutions[0] ?? null
  const rows = await supabaseRest<InstitutionRecord[]>(`institutions?select=*&owner_user_id=eq.${encodeURIComponent(identity.id)}&limit=1`, { method: "GET" })
  return rows[0] ?? null
}

export async function listPortfolioWorks() {
  const identity = sessionIdentity()
  if (!getSupabaseConfig().configured) return loadPreviewState().portfolioWorks.filter((work) => work.artist_user_id === identity.id || work.artist_user_id === "preview-artist")
  return supabaseRest<PortfolioWorkRecord[]>(`portfolio_works?select=*&artist_user_id=eq.${encodeURIComponent(identity.id)}&order=sort_order.asc`, { method: "GET" })
}

export async function savePortfolioWork(input: Omit<PortfolioWorkRecord, "id" | "artist_user_id" | "created_at" | "updated_at"> & { id?: string }) {
  const identity = sessionIdentity()
  if (identity.role !== "artist") throw new Error("An artist session is required.")
  const timestamp = now()
  const id = input.id ?? makeId("work")
  const { id: _inputId, ...payload } = input
  const record: PortfolioWorkRecord = { ...payload, id, artist_user_id: identity.id, created_at: timestamp, updated_at: timestamp }

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.portfolioWorks.find((work) => work.id === id)
    record.created_at = existing?.created_at ?? timestamp
    state.portfolioWorks = [...state.portfolioWorks.filter((work) => work.id !== id), record]
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<PortfolioWorkRecord[]>("portfolio_works?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify(record),
  })
  return rows[0]
}

export async function saveOpenCall(input: Omit<OpenCallRecord, "id" | "institution_id" | "created_by" | "institution_name" | "created_at" | "updated_at" | "published_at" | "slug"> & { id?: string; slug?: string }) {
  const identity = sessionIdentity()
  if (identity.role !== "institution") throw new Error("An institution session is required.")
  const institution = await getCurrentInstitution()
  if (!institution) throw new Error("Complete the institution profile before creating an open call.")
  const timestamp = now()
  const id = input.id ?? makeId("call")
  const { id: _inputId, slug: requestedSlug, ...payload } = input
  const record: OpenCallRecord = {
    ...payload,
    id,
    institution_id: institution.id,
    created_by: identity.id,
    institution_name: institution.name,
    slug: requestedSlug ?? slugify(input.title),
    published_at: input.status === "open" ? timestamp : null,
    created_at: timestamp,
    updated_at: timestamp,
  }

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.openCalls.find((call) => call.id === id)
    record.created_at = existing?.created_at ?? timestamp
    record.published_at = input.status === "open" ? existing?.published_at ?? timestamp : null
    state.openCalls = [...state.openCalls.filter((call) => call.id !== id), record]
    savePreviewState(state)
    return record
  }

  const { custom_questions, institution_name: _institutionName, ...callPayload } = record
  const rows = await supabaseRest<OpenCallRecord[]>("open_calls?on_conflict=id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify(callPayload),
  })
  const saved = rows[0]
  if (!saved) throw new Error("The open call was not returned after saving.")

  await supabaseRest(`call_questions?call_id=eq.${encodeURIComponent(saved.id)}`, { method: "DELETE", prefer: "return=minimal" })
  if (custom_questions.length) {
    await supabaseRest("call_questions", {
      method: "POST",
      prefer: "return=minimal",
      body: JSON.stringify(custom_questions.map((question, index) => ({
        id: question.id.includes("-") && question.id.length > 20 ? question.id : undefined,
        call_id: saved.id,
        label: question.label,
        question_type: question.type,
        required: question.required,
        sort_order: index,
      }))),
    })
  }
  return { ...saved, custom_questions }
}

async function loadQuestions(callId: string) {
  if (!getSupabaseConfig().configured) return loadPreviewState().openCalls.find((call) => call.id === callId)?.custom_questions ?? []
  const rows = await supabaseRest<Array<{ id: string; label: string; question_type: "short" | "long"; required: boolean }>>(`call_questions?select=id,label,question_type,required&call_id=eq.${encodeURIComponent(callId)}&order=sort_order.asc`, { method: "GET", publicRead: true })
  return rows.map((row) => ({ id: row.id, label: row.label, required: row.required, type: row.question_type }))
}

export async function listPublishedCalls() {
  if (!getSupabaseConfig().configured) return loadPreviewState().openCalls.filter((call) => call.status === "open")
  const rows = await supabaseRest<OpenCallRecord[]>("open_calls?select=*&status=eq.open&order=deadline_at.asc", { method: "GET", publicRead: true })
  return Promise.all(rows.map(async (call) => ({ ...call, custom_questions: await loadQuestions(call.id) })))
}

export async function listInstitutionCalls() {
  const institution = await getCurrentInstitution()
  if (!institution) return []
  if (!getSupabaseConfig().configured) return loadPreviewState().openCalls.filter((call) => call.institution_id === institution.id)
  const rows = await supabaseRest<OpenCallRecord[]>(`open_calls?select=*&institution_id=eq.${encodeURIComponent(institution.id)}&order=created_at.desc`, { method: "GET" })
  return Promise.all(rows.map(async (call) => ({ ...call, custom_questions: await loadQuestions(call.id), institution_name: institution.name })))
}

export async function getOpenCall(callId: string) {
  if (!getSupabaseConfig().configured) return loadPreviewState().openCalls.find((call) => call.id === callId) ?? null
  const rows = await supabaseRest<OpenCallRecord[]>(`open_calls?select=*&id=eq.${encodeURIComponent(callId)}&limit=1`, { method: "GET", publicRead: true })
  const call = rows[0]
  return call ? { ...call, custom_questions: await loadQuestions(call.id) } : null
}

export async function saveApplication(input: {
  callId: string
  status: "draft" | "submitted"
  answers: Record<string, string>
  selectedWorkIds: string[]
}) {
  const identity = sessionIdentity()
  if (identity.role !== "artist") throw new Error("An artist session is required.")
  const call = await getOpenCall(input.callId)
  if (!call) throw new Error("This open call could not be found.")
  const profile = await getCurrentArtistProfile()
  const timestamp = now()

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.applications.find((application) => application.call_id === input.callId && application.artist_user_id === identity.id)
    const record: ApplicationRecord = {
      id: existing?.id ?? makeId("application"),
      call_id: input.callId,
      artist_user_id: identity.id,
      artist_name: profile?.professional_name ?? identity.name,
      artist_email: identity.email,
      status: input.status,
      profile_snapshot: profile ?? {},
      answers: input.answers,
      selected_work_ids: input.selectedWorkIds,
      submitted_at: input.status === "submitted" ? existing?.submitted_at ?? timestamp : null,
      last_saved_at: timestamp,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
      call,
      review: existing?.review ?? null,
    }
    state.applications = [...state.applications.filter((application) => application.id !== record.id), record]
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<ApplicationRecord[]>("applications?on_conflict=call_id,artist_user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify({
      call_id: input.callId,
      artist_user_id: identity.id,
      artist_name: profile?.professional_name ?? identity.name,
      artist_email: identity.email,
      profile_snapshot: profile ?? {},
      status: input.status,
      submitted_at: input.status === "submitted" ? timestamp : null,
      last_saved_at: timestamp,
      updated_at: timestamp,
    }),
  })
  const application = rows[0]
  if (!application) throw new Error("The application was not returned after saving.")

  await supabaseRest(`application_answers?application_id=eq.${encodeURIComponent(application.id)}`, { method: "DELETE", prefer: "return=minimal" })
  const answerRows = Object.entries(input.answers).filter(([, answer]) => answer.trim()).map(([questionKey, answerText]) => ({ application_id: application.id, question_key: questionKey, answer_text: answerText }))
  if (answerRows.length) await supabaseRest("application_answers", { method: "POST", prefer: "return=minimal", body: JSON.stringify(answerRows) })

  await supabaseRest(`application_works?application_id=eq.${encodeURIComponent(application.id)}`, { method: "DELETE", prefer: "return=minimal" })
  if (input.selectedWorkIds.length) await supabaseRest("application_works", { method: "POST", prefer: "return=minimal", body: JSON.stringify(input.selectedWorkIds.map((portfolioWorkId, index) => ({ application_id: application.id, portfolio_work_id: portfolioWorkId, sort_order: index }))) })

  return { ...application, answers: input.answers, selected_work_ids: input.selectedWorkIds, call }
}

async function hydrateApplication(application: ApplicationRecord) {
  const call = await getOpenCall(application.call_id)
  if (!getSupabaseConfig().configured) return { ...application, call }
  const answers = await supabaseRest<Array<{ question_key: string; answer_text: string }>>(`application_answers?select=question_key,answer_text&application_id=eq.${encodeURIComponent(application.id)}`, { method: "GET" })
  const works = await supabaseRest<Array<{ portfolio_work_id: string }>>(`application_works?select=portfolio_work_id&application_id=eq.${encodeURIComponent(application.id)}&order=sort_order.asc`, { method: "GET" })
  const reviews = await supabaseRest<ReviewRecord[]>(`reviews?select=*&application_id=eq.${encodeURIComponent(application.id)}&limit=1`, { method: "GET" })
  return {
    ...application,
    call: call ?? undefined,
    answers: Object.fromEntries(answers.map((row) => [row.question_key, row.answer_text])),
    selected_work_ids: works.map((row) => row.portfolio_work_id),
    review: reviews[0] ?? null,
  }
}

export async function listArtistApplications() {
  const identity = sessionIdentity()
  if (!getSupabaseConfig().configured) return loadPreviewState().applications.filter((application) => application.artist_user_id === identity.id).map((application) => ({ ...application, review: loadPreviewState().reviews.find((review) => review.application_id === application.id) ?? null }))
  const rows = await supabaseRest<ApplicationRecord[]>(`applications?select=*&artist_user_id=eq.${encodeURIComponent(identity.id)}&order=updated_at.desc`, { method: "GET" })
  return Promise.all(rows.map(hydrateApplication))
}

export async function listInstitutionApplications() {
  const institution = await getCurrentInstitution()
  if (!institution) return []
  const calls = await listInstitutionCalls()
  const callIds = calls.map((call) => call.id)
  if (!callIds.length) return []

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    return state.applications.filter((application) => callIds.includes(application.call_id)).map((application) => ({ ...application, call: calls.find((call) => call.id === application.call_id), review: state.reviews.find((review) => review.application_id === application.id) ?? null }))
  }

  const filter = callIds.map(encodeURIComponent).join(",")
  const rows = await supabaseRest<ApplicationRecord[]>(`applications?select=*&call_id=in.(${filter})&order=updated_at.desc`, { method: "GET" })
  return Promise.all(rows.map(hydrateApplication))
}

export async function saveReview(input: {
  applicationId: string
  score: number | null
  recommendation: string
  internalNotes: string
  reviewStatus: string
  applicationStatus: ApplicationStatus
}) {
  const identity = sessionIdentity()
  if (identity.role !== "institution" && identity.role !== "collaborator") throw new Error("An institution or reviewer session is required.")
  const timestamp = now()

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    const existing = state.reviews.find((review) => review.application_id === input.applicationId && review.reviewer_user_id === identity.id)
    const record: ReviewRecord = {
      id: existing?.id ?? makeId("review"),
      application_id: input.applicationId,
      reviewer_user_id: identity.id,
      recommendation: input.recommendation,
      score: input.score,
      internal_notes: input.internalNotes,
      review_status: input.reviewStatus,
      created_at: existing?.created_at ?? timestamp,
      updated_at: timestamp,
    }
    state.reviews = [...state.reviews.filter((review) => review.id !== record.id), record]
    state.applications = state.applications.map((application) => application.id === input.applicationId ? { ...application, status: input.applicationStatus, updated_at: timestamp, review: record } : application)
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<ReviewRecord[]>("reviews?on_conflict=application_id,reviewer_user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: JSON.stringify({
      application_id: input.applicationId,
      reviewer_user_id: identity.id,
      recommendation: input.recommendation,
      score: input.score,
      internal_notes: input.internalNotes,
      review_status: input.reviewStatus,
      updated_at: timestamp,
    }),
  })
  await supabaseRest(`applications?id=eq.${encodeURIComponent(input.applicationId)}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ status: input.applicationStatus, updated_at: timestamp }) })
  return rows[0]
}

export async function sendApplicationMessage(input: { application: ApplicationRecord; body: string }) {
  const identity = sessionIdentity()
  const recipientId = identity.role === "artist" ? input.application.call?.created_by : input.application.artist_user_id
  if (!recipientId) throw new Error("The message recipient could not be resolved.")
  const timestamp = now()
  const record: MessageRecord = {
    id: makeId("message"),
    application_id: input.application.id,
    sender_user_id: identity.id,
    recipient_user_id: recipientId,
    sender_role: identity.role === "artist" ? "artist" : "institution",
    body: input.body.trim(),
    read_at: null,
    created_at: timestamp,
  }

  if (!record.body) throw new Error("Write a message before sending.")

  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    state.messages = [...state.messages, record]
    savePreviewState(state)
    return record
  }

  const rows = await supabaseRest<MessageRecord[]>("messages", { method: "POST", prefer: "return=representation", body: JSON.stringify(record) })
  return rows[0]
}

export async function listApplicationMessages(applicationId: string) {
  if (!getSupabaseConfig().configured) return loadPreviewState().messages.filter((message) => message.application_id === applicationId).sort((a, b) => a.created_at.localeCompare(b.created_at))
  return supabaseRest<MessageRecord[]>(`messages?select=*&application_id=eq.${encodeURIComponent(applicationId)}&order=created_at.asc`, { method: "GET" })
}

export async function markMessageRead(messageId: string) {
  const identity = sessionIdentity()
  const timestamp = now()
  if (!getSupabaseConfig().configured) {
    const state = loadPreviewState()
    state.messages = state.messages.map((message) => message.id === messageId && message.recipient_user_id === identity.id ? { ...message, read_at: timestamp } : message)
    savePreviewState(state)
    return
  }
  await supabaseRest(`messages?id=eq.${encodeURIComponent(messageId)}&recipient_user_id=eq.${encodeURIComponent(identity.id)}`, { method: "PATCH", prefer: "return=minimal", body: JSON.stringify({ read_at: timestamp }) })
}
