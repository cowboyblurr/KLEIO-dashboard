import { getSupabaseBrowserClient, loadInstitutionMessengerContexts, loadKleioAccount } from "@/lib/kleio-supabase"

export type ArtistPassportRecord = {
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
  cv_file_path: string | null
  profile_completion: number
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
  image_path: string | null
  image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type OpenCallRecord = {
  id: string
  institution_id: string
  created_by: string
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
  review_configuration: Record<string, unknown>
  status: "draft" | "open" | "closed" | "under_review" | "completed" | "archived"
  published_at: string | null
  institution_name: string
  created_at: string
  updated_at: string
}

export type ApplicationStatus = "draft" | "submitted" | "in_review" | "needs_follow_up" | "shortlisted" | "finalist" | "accepted" | "declined" | "withdrawn"

export type ApplicationRecord = {
  id: string
  call_id: string
  artist_user_id: string
  artist_name: string
  artist_email: string
  profile_snapshot: Record<string, unknown>
  status: ApplicationStatus
  submitted_at: string | null
  last_saved_at: string
  created_at: string
  updated_at: string
  open_calls?: OpenCallRecord | OpenCallRecord[] | null
  application_answers?: Array<{ id: string; question_key: string; answer_text: string; answer_data: Record<string, unknown> }>
  application_works?: Array<{ portfolio_work_id: string; sort_order: number; portfolio_works?: PortfolioWorkRecord | PortfolioWorkRecord[] | null }>
  application_status_history?: Array<{ id: string; previous_status: ApplicationStatus | null; new_status: ApplicationStatus; created_at: string }>
  reviews?: Array<{ id: string; reviewer_user_id: string; recommendation: string; score: number | null; internal_notes: string; review_status: string; updated_at: string }>
  review_assignments?: Array<{ id: string; reviewer_user_id: string; due_at: string | null; status: string; created_at: string }>
}

export type ApplicationMessageRecord = {
  id: string
  application_id: string
  sender_user_id: string
  recipient_user_id: string
  sender_role: string
  body: string
  read_at: string | null
  created_at: string
}

export type NotificationRecord = {
  id: string
  kind: string
  title: string
  body: string
  href: string | null
  read_at: string | null
  created_at: string
}

export type InstitutionContextRecord = {
  institution_id: string
  institution_name: string
  member_role: string
  member_status: string
}

export type InstitutionProfileRecord = {
  id: string
  owner_user_id: string
  name: string
  display_name: string
  organization_type: string
  description: string
  location: string
  website_url: string
  contact_name: string
  contact_email: string
  updated_at: string
}

function splitList(value: string) {
  return value.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean)
}

function slugify(value: string) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "open-call"
  return `${base}-${Date.now().toString(36)}`
}

function normalizedCallType(value: string | undefined) {
  const normalized = (value || "open_call").toLowerCase().trim().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "")
  const allowed = ["open_call", "grant", "residency", "exhibition", "commission", "fellowship", "prize_award", "public_art", "acquisition", "research", "professional_development", "other"]
  return allowed.includes(normalized) ? normalized : "other"
}

function normalizedParticipationFormat(value: string | undefined) {
  const normalized = (value || "online").toLowerCase().trim().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "")
  return ["in_person", "online", "hybrid", "other"].includes(normalized) ? normalized : "other"
}

function relationOne<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null
  return value ?? null
}

async function requireAccount() {
  const account = await loadKleioAccount()
  if (!account) throw new Error("Please sign in to continue.")
  return account
}

export async function loadArtistPassport(): Promise<ArtistPassportRecord | null> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("artist_profiles").select("*").eq("user_id", account.user.id).maybeSingle()
  if (error) throw error
  return data as ArtistPassportRecord | null
}

export async function saveArtistPassport(input: Omit<ArtistPassportRecord, "user_id" | "profile_completion"> & { disciplines_text: string; mediums_text: string; languages_text: string }) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const fields = [input.professional_name, input.location, input.bio, input.artist_statement, input.practice_description, input.website_url, input.education, input.exhibition_history]
  const profileCompletion = Math.round((fields.filter((field) => field.trim()).length / fields.length) * 100)
  const record = {
    user_id: account.user.id,
    professional_name: input.professional_name.trim(),
    location: input.location.trim(),
    bio: input.bio.trim(),
    artist_statement: input.artist_statement.trim(),
    practice_description: input.practice_description.trim(),
    website_url: input.website_url.trim(),
    instagram_url: input.instagram_url.trim(),
    disciplines: splitList(input.disciplines_text),
    mediums: splitList(input.mediums_text),
    languages: splitList(input.languages_text),
    education: input.education.trim(),
    exhibition_history: input.exhibition_history.trim(),
    awards: input.awards.trim(),
    cv_file_path: input.cv_file_path,
    profile_completion: profileCompletion,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from("artist_profiles").upsert(record, { onConflict: "user_id" }).select("*").single()
  if (error) throw error
  return data as ArtistPassportRecord
}

export async function uploadArtistAsset(file: File, kind: "portfolio" | "cv") {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin"
  const path = `${account.user.id}/${kind}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from("artist-assets").upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type })
  if (error) throw error
  return path
}

export async function getArtistAssetUrl(path: string | null) {
  if (!path) return null
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.storage.from("artist-assets").createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export async function loadPortfolioWorks(): Promise<PortfolioWorkRecord[]> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("portfolio_works").select("*").eq("artist_user_id", account.user.id).order("sort_order").order("created_at")
  if (error) throw error
  return Promise.all((data ?? []).map(async (row) => ({ ...(row as Omit<PortfolioWorkRecord, "image_url">), image_url: await getArtistAssetUrl(row.image_path) })))
}

export async function createPortfolioWork(input: { title: string; year: string; medium: string; dimensions: string; description: string; series: string; tags: string; file: File | null }) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const imagePath = input.file ? await uploadArtistAsset(input.file, "portfolio") : null
  const { data, error } = await supabase.from("portfolio_works").insert({
    artist_user_id: account.user.id,
    title: input.title.trim(), year: input.year.trim(), medium: input.medium.trim(), dimensions: input.dimensions.trim(),
    description: input.description.trim(), series: input.series.trim(), tags: splitList(input.tags), image_path: imagePath,
  }).select("*").single()
  if (error) {
    if (imagePath) await supabase.storage.from("artist-assets").remove([imagePath])
    throw error
  }
  return data as PortfolioWorkRecord
}

export async function updatePortfolioWork(workId: string, input: { title: string; year: string; medium: string; dimensions: string; description: string; series: string; tags: string }) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("portfolio_works").update({
    title: input.title.trim(), year: input.year.trim(), medium: input.medium.trim(), dimensions: input.dimensions.trim(),
    description: input.description.trim(), series: input.series.trim(), tags: splitList(input.tags), updated_at: new Date().toISOString(),
  }).eq("id", workId).select("*").single()
  if (error) throw error
  return data as PortfolioWorkRecord
}

export async function deletePortfolioWork(work: PortfolioWorkRecord) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("portfolio_works").delete().eq("id", work.id)
  if (error) throw error
  if (work.image_path) await supabase.storage.from("artist-assets").remove([work.image_path])
}

export async function loadPublishedOpenCalls(): Promise<OpenCallRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("open_calls").select("*").eq("status", "open").order("deadline_at", { ascending: true, nullsFirst: false })
  if (error) throw error
  return (data ?? []) as OpenCallRecord[]
}

export async function loadSavedOpportunityIds(): Promise<string[]> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("saved_opportunities").select("call_id").eq("artist_user_id", account.user.id)
  if (error) throw error
  return (data ?? []).map((row) => String(row.call_id))
}

export async function setOpportunitySaved(callId: string, saved: boolean) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const query = saved
    ? supabase.from("saved_opportunities").upsert({ artist_user_id: account.user.id, call_id: callId }, { onConflict: "artist_user_id,call_id" })
    : supabase.from("saved_opportunities").delete().eq("artist_user_id", account.user.id).eq("call_id", callId)
  const { error } = await query
  if (error) throw error
}

export async function getOrCreateApplicationDraft(call: OpenCallRecord): Promise<ApplicationRecord> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data: existing, error: existingError } = await supabase.from("applications").select("*, application_answers(*), application_works(portfolio_work_id, sort_order)").eq("call_id", call.id).eq("artist_user_id", account.user.id).maybeSingle()
  if (existingError) throw existingError
  if (existing) return existing as ApplicationRecord
  const passport = await loadArtistPassport()
  const { data, error } = await supabase.from("applications").insert({
    call_id: call.id,
    artist_user_id: account.user.id,
    artist_name: passport?.professional_name || account.profile.display_name || "Artist",
    artist_email: account.profile.email || account.user.email || "",
    profile_snapshot: passport ?? {},
    status: "draft",
  }).select("*").single()
  if (error) throw error
  return data as ApplicationRecord
}

export async function saveApplicationDraft(applicationId: string, answer: string, selectedWorkIds: string[]) {
  const supabase = getSupabaseBrowserClient()
  const { error: answerError } = await supabase.from("application_answers").upsert({ application_id: applicationId, question_key: "project_proposal", answer_text: answer.trim(), answer_data: {} }, { onConflict: "application_id,question_key" })
  if (answerError) throw answerError
  const { error: deleteError } = await supabase.from("application_works").delete().eq("application_id", applicationId)
  if (deleteError) throw deleteError
  if (selectedWorkIds.length) {
    const { error: worksError } = await supabase.from("application_works").insert(selectedWorkIds.map((portfolioWorkId, index) => ({ application_id: applicationId, portfolio_work_id: portfolioWorkId, sort_order: index })))
    if (worksError) throw worksError
  }
  const { error } = await supabase.from("applications").update({ last_saved_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", applicationId).eq("status", "draft")
  if (error) throw error
}

export async function submitApplication(applicationId: string) {
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase.from("applications").update({ status: "submitted", submitted_at: now, last_saved_at: now, updated_at: now }).eq("id", applicationId).eq("status", "draft").select("*").single()
  if (error) throw error
  return data as ApplicationRecord
}

const applicationSelect = "*, open_calls(*), application_answers(*), application_works(portfolio_work_id, sort_order, portfolio_works(*)), application_status_history(*), reviews(*), review_assignments(*)"

export async function loadArtistApplications(): Promise<ApplicationRecord[]> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("applications").select(applicationSelect).eq("artist_user_id", account.user.id).order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ApplicationRecord[]
}

export async function loadInstitutionContext(): Promise<InstitutionContextRecord> {
  const contexts = await loadInstitutionMessengerContexts()
  const context = contexts[0]
  if (!context) throw new Error("No active institution membership was found for this account.")
  return context
}

export async function loadInstitutionOpenCalls(): Promise<OpenCallRecord[]> {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("open_calls").select("*").eq("institution_id", context.institution_id).order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as OpenCallRecord[]
}

export async function loadInstitutionProfile(): Promise<InstitutionProfileRecord> {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("institutions").select("id, owner_user_id, name, display_name, organization_type, description, location, website_url, contact_name, contact_email, updated_at").eq("id", context.institution_id).single()
  if (error) throw error
  return data as InstitutionProfileRecord
}

export async function saveInstitutionProfile(input: InstitutionProfileRecord) {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const record = {
    name: input.name.trim(), display_name: input.display_name.trim() || input.name.trim(), organization_type: input.organization_type.trim(),
    description: input.description.trim(), location: input.location.trim(), website_url: input.website_url.trim(), contact_name: input.contact_name.trim(),
    contact_email: input.contact_email.trim().toLowerCase(), updated_at: new Date().toISOString(), user_adjusted: true,
  }
  const { data, error } = await supabase.from("institutions").update(record).eq("id", context.institution_id).select("id, owner_user_id, name, display_name, organization_type, description, location, website_url, contact_name, contact_email, updated_at").single()
  if (error) throw error
  return data as InstitutionProfileRecord
}

export async function saveInstitutionOpenCall(input: Partial<OpenCallRecord> & { title: string; publish: boolean }) {
  const account = await requireAccount()
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const record = {
    institution_id: context.institution_id,
    created_by: account.user.id,
    title: input.title.trim(),
    slug: input.slug || slugify(input.title),
    opportunity_type: normalizedCallType(input.opportunity_type),
    summary: input.summary?.trim() || "",
    description: input.description?.trim() || "",
    location: input.location?.trim() || "",
    participation_format: normalizedParticipationFormat(input.participation_format),
    opens_at: input.opens_at || null,
    deadline_at: input.deadline_at || null,
    notification_date: input.notification_date || null,
    program_start_date: input.program_start_date || null,
    program_end_date: input.program_end_date || null,
    eligibility: input.eligibility || {},
    required_materials: input.required_materials || [],
    review_configuration: input.review_configuration || {},
    institution_name: context.institution_name,
    status: input.publish ? "open" : "draft",
    published_at: input.publish ? now : null,
    updated_at: now,
  }
  const query = input.id
    ? supabase.from("open_calls").update(record).eq("id", input.id).select("*").single()
    : supabase.from("open_calls").insert(record).select("*").single()
  const { data, error } = await query
  if (error) throw error
  return data as OpenCallRecord
}

export async function setInstitutionOpenCallStatus(callId: string, status: OpenCallRecord["status"]) {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const now = new Date().toISOString()
  const { data, error } = await supabase.from("open_calls").update({ status, published_at: status === "open" ? now : undefined, updated_at: now }).eq("id", callId).eq("institution_id", context.institution_id).select("*").single()
  if (error) throw error
  return data as OpenCallRecord
}

export async function loadInstitutionApplications(): Promise<ApplicationRecord[]> {
  const calls = await loadInstitutionOpenCalls()
  if (!calls.length) return []
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("applications").select(applicationSelect).in("call_id", calls.map((call) => call.id)).neq("status", "draft").order("updated_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as ApplicationRecord[]
}

export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("applications").update({ status, updated_at: new Date().toISOString() }).eq("id", applicationId).select("*").single()
  if (error) throw error
  return data as ApplicationRecord
}

export async function saveApplicationReview(applicationId: string, input: { score: number | null; recommendation: string; internal_notes: string; review_status: string }) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("reviews").upsert({ application_id: applicationId, reviewer_user_id: account.user.id, ...input, updated_at: new Date().toISOString() }, { onConflict: "application_id,reviewer_user_id" }).select("*").single()
  if (error) throw error
  return data
}

export async function assignApplicationReviewer(applicationId: string, reviewerUserId: string, dueAt: string | null) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("review_assignments").upsert({ application_id: applicationId, reviewer_user_id: reviewerUserId, assigned_by: account.user.id, due_at: dueAt, status: "assigned", updated_at: new Date().toISOString() }, { onConflict: "application_id,reviewer_user_id" }).select("*").single()
  if (error) throw error
  return data
}

export async function loadApplicationMessages(applicationId: string): Promise<ApplicationMessageRecord[]> {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("messages").select("*").eq("application_id", applicationId).order("created_at")
  if (error) throw error
  return (data ?? []) as ApplicationMessageRecord[]
}

export async function sendApplicationMessage(application: ApplicationRecord, body: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("send_application_message", { target_application_id: application.id, message_body: body.trim() })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("The message was not confirmed by the server.")
  return row as ApplicationMessageRecord
}

export async function markApplicationMessagesRead(applicationId: string) {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("application_id", applicationId).eq("recipient_user_id", account.user.id).is("read_at", null)
  if (error) throw error
}

export async function loadNotifications(): Promise<NotificationRecord[]> {
  const account = await requireAccount()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("notifications").select("id, kind, title, body, href, read_at, created_at").eq("user_id", account.user.id).order("created_at", { ascending: false }).limit(30)
  if (error) throw error
  return (data ?? []) as NotificationRecord[]
}

export async function markNotificationRead(notificationId: string) {
  const supabase = getSupabaseBrowserClient()
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", notificationId)
  if (error) throw error
}

export type InstitutionInvitationRecord = { id: string; institution_id: string; email: string; role: string; token: string; status: string; expires_at: string; created_at: string }

export async function loadInstitutionInvitations(): Promise<InstitutionInvitationRecord[]> {
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("institution_invitations").select("id, institution_id, email, role, token, status, expires_at, created_at").eq("institution_id", context.institution_id).order("created_at", { ascending: false })
  if (error) throw error
  return (data ?? []) as InstitutionInvitationRecord[]
}

export async function createInstitutionInvitation(email: string, role: string) {
  const account = await requireAccount()
  const context = await loadInstitutionContext()
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.from("institution_invitations").insert({ institution_id: context.institution_id, email: email.trim().toLowerCase(), role, invited_by: account.user.id }).select("id, institution_id, email, role, token, status, expires_at, created_at").single()
  if (error) throw error
  return data as InstitutionInvitationRecord
}

export async function acceptInstitutionInvitation(token: string) {
  const supabase = getSupabaseBrowserClient()
  const { data, error } = await supabase.rpc("accept_institution_invitation", { invitation_token: token })
  if (error) throw error
  return String(data)
}

export function applicationCall(application: ApplicationRecord) {
  return relationOne(application.open_calls)
}

export function buildApplicationsCsv(applications: ApplicationRecord[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`
  const rows = applications.map((application) => {
    const call = applicationCall(application)
    const latestReview = application.reviews?.[0]
    return [application.artist_name, application.artist_email, call?.title ?? "", application.status, application.submitted_at ?? "", latestReview?.score ?? "", latestReview?.recommendation ?? ""].map(escape).join(",")
  })
  return [["Artist", "Email", "Open call", "Status", "Submitted", "Score", "Recommendation"].map(escape).join(","), ...rows].join("\n")
}
