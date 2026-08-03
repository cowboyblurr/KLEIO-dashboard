import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type AnalyticsTrafficClass =
  | "real_user"
  | "internal_qa"
  | "guided_demo"
  | "synthetic_preview"
  | "automated_test"

export type AnalyticsViewport = "mobile" | "tablet" | "desktop" | "unknown"

export type AnalyticsSnapshot = {
  range: {
    start: string
    end: string
    traffic_class: AnalyticsTrafficClass
    acquisition_source: string | null
    viewport: AnalyticsViewport | null
  }
  overview: {
    visitors: number
    signup_starts: number
    confirmed_accounts: number
    onboarding_completions: number
    first_value_artists: number
    activated_artists: number
    upload_success_rate_pct: number | null
    opportunity_engaged_artists: number
    error_free_workflow_rate_pct: number | null
  }
  funnel: Array<{
    ordinal: number
    stage: string
    event_name: string
    people: number
    conversion_from_previous_pct: number | null
    dropoff_from_previous_pct: number | null
    median_hours_from_previous: number | null
  }>
  onboarding_friction: Array<{
    step: string
    viewport: AnalyticsViewport
    views: number
    completed: number
    skipped: number
    validation_failures: number
    save_failures: number
    saved_and_exited: number
    resumed: number
  }>
  import_performance: Array<{
    source: string
    viewport: AnalyticsViewport
    starts: number
    completed: number
    partially_completed: number
    failed: number
    completion_rate_pct: number | null
    median_completion_minutes: number | null
    artwork_records_saved: number
    portfolio_inclusions: number
  }>
  passport_usage: Array<{
    event_name: string
    mode: string
    section: string
    people: number
    events: number
  }>
  opportunity_engagement: {
    directory_viewers: number
    search_users: number
    filter_users: number
    no_result_searches: number
    opportunity_openers: number
    official_source_openers: number
    opportunity_savers: number
    readiness_viewers: number
    preparation_starters: number
  }
  reliability: Array<{
    event_name: string
    error_code: string
    step: string
    source: string
    viewport: AnalyticsViewport
    count: number
  }>
  recovery: {
    recovery_offered: number
    workflow_recovered: number
    session_recovered: number
    draft_restored: number
    recovery_success_rate_pct: number | null
  }
  feature_adoption: Array<{
    event_name: string
    people: number
    events: number
  }>
  cohorts: Array<{
    activation_week: string
    activated_artists: number
    same_day_returned: number
    day_1_returned: number
    day_7_returned: number
    day_14_returned: number
  }>
  data_quality: {
    traffic_classes: Partial<Record<AnalyticsTrafficClass, number>>
    rejected_events: number
    duplicate_attempts: number
    unknown_traffic_events: number
    missing_event_versions: number
    last_successful_ingestion_at: string | null
    last_rejection_at: string | null
  }
  sample_warnings: string[]
}

export type AnalyticsFilters = {
  start: string
  end: string
  trafficClass: AnalyticsTrafficClass
  acquisitionSource: string | null
  viewport: AnalyticsViewport | null
}

function isSnapshot(value: unknown): value is AnalyticsSnapshot {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const candidate = value as Partial<AnalyticsSnapshot>
  return Boolean(
    candidate.overview
    && Array.isArray(candidate.funnel)
    && Array.isArray(candidate.sample_warnings)
    && candidate.data_quality,
  )
}

export async function loadKleioAdminAnalyticsSnapshot(filters: AnalyticsFilters) {
  const supabase = getSupabaseBrowserClient()
  const start = new Date(`${filters.start}T00:00:00`)
  const endInclusive = new Date(`${filters.end}T00:00:00`)
  const endExclusive = new Date(endInclusive)
  endExclusive.setDate(endExclusive.getDate() + 1)

  if (!Number.isFinite(start.getTime()) || !Number.isFinite(endExclusive.getTime())) {
    throw new Error("Choose a valid analytics date range.")
  }

  const { data, error } = await supabase.rpc("get_kleio_admin_analytics_snapshot", {
    range_start: start.toISOString(),
    range_end: endExclusive.toISOString(),
    requested_traffic_class: filters.trafficClass,
    requested_acquisition_source: filters.acquisitionSource,
    requested_viewport: filters.viewport,
  })

  if (error) {
    if (error.message.includes("kleio_admin_required") || error.code === "42501") {
      throw new Error("KLEIO administrator access is required.")
    }
    throw new Error("The aggregate analytics snapshot could not be loaded.")
  }
  if (!isSnapshot(data)) throw new Error("The analytics response was incomplete.")
  return data
}

function csvCell(value: unknown) {
  if (value === null || value === undefined) return ""
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function analyticsSnapshotCsv(snapshot: AnalyticsSnapshot) {
  const rows: unknown[][] = [["section", "metric", "dimension", "value"]]
  for (const [metric, value] of Object.entries(snapshot.overview)) {
    rows.push(["overview", metric, "", value])
  }
  for (const stage of snapshot.funnel) {
    rows.push(["funnel", stage.event_name, stage.stage, stage.people])
    rows.push(["funnel_conversion", stage.event_name, "conversion_from_previous_pct", stage.conversion_from_previous_pct])
  }
  for (const item of snapshot.import_performance) {
    rows.push(["import_performance", "completion_rate_pct", `${item.source}:${item.viewport}`, item.completion_rate_pct])
    rows.push(["import_performance", "starts", `${item.source}:${item.viewport}`, item.starts])
    rows.push(["import_performance", "failed", `${item.source}:${item.viewport}`, item.failed])
  }
  for (const item of snapshot.reliability) {
    rows.push(["reliability", item.event_name, `${item.error_code}:${item.viewport}`, item.count])
  }
  for (const cohort of snapshot.cohorts) {
    rows.push(["cohorts", "activated_artists", cohort.activation_week, cohort.activated_artists])
    rows.push(["cohorts", "day_7_returned", cohort.activation_week, cohort.day_7_returned])
  }
  return rows.map((row) => row.map(csvCell).join(",")).join("\n")
}
