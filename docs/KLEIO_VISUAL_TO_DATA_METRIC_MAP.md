# KLEIO Visual-to-Data Metric Map

Every major visible metric in the end-of-July demo, with source, formula, and integrity check.

**Demo anchor date:** `2026-08-10` (`DEMO_DATE` in analytics helpers)  
**Source of truth:** `lib/kleio-data.ts` → derived in `lib/kleio-analytics.ts`, `lib/kleio-artist-analytics.ts`, `lib/kleio-collaborator-analytics.ts`

---

## Institution workspace (`/dashboard/` and related)

| Label | Route / Component | Source file | Source array | Formula | Integrity check | UI location |
|-------|-------------------|-------------|--------------|---------|-----------------|-------------|
| Total Applications | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `allSubmissions` | `allSubmissions.length` | `statusBreakdownTotal === totalApplications` | KPI card row |
| In Review | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `allSubmissions` | `filter status === "In Review"` | status breakdown sum | KPI card |
| Shortlisted | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `allSubmissions` | `filter status === "Shortlisted"` | matches shortlist groups | KPI card |
| Pending Committee Vote | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `allSubmissions` | `filter status === "Pending Vote"` | committee page stat | KPI card |
| Deadlines This Week | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `programs` | `filter deadline within 7 days of DEMO_DATE` | reports metric | KPI card |
| Incomplete Applications | `/dashboard/` · `KpiCards` | `kleio-analytics.ts` | `allSubmissions` | `isIncompleteSubmission()` | `incompleteMatchesKpi` | KPI card |
| Review queue badge | Sidebar | `kleio-analytics.ts` | `reviewQueue` | `filter !EXCLUDED_QUEUE_STATUSES` | `reviewQueueMatchesBadge` | Institution nav |
| Needs attention count | Review queue tab | `kleio-analytics.ts` | `allSubmissions` | `isNeedsAttention()` | `needsAttentionMatchesTab` | Tab badge |
| Upcoming deadlines count | Review queue tab | `kleio-analytics.ts` | `reviewQueue` + `programs` | `isUpcomingDeadlineQueueSubmission()` | `upcomingDeadlinesMatchesTab` | Tab badge |
| Message badge | Top bar · Sidebar | `kleio-analytics.ts` | `demoMessages` | `isPendingMessage()` count | `messagesBadgeMatchesPending` | Bell icon |
| Applications over time | `ApplicationsChart` | `kleio-analytics.ts` | `allSubmissions` | group by `submittedAt` month | `applicationsOverTimeMatchesTotal` | Dashboard chart |
| Status breakdown | `StatusBreakdown` | `kleio-analytics.ts` | `allSubmissions` | count per `DISPLAY_STATUS_ORDER` | sum equals total | Dashboard donut |
| Reviewer completion rate | `/committee/` | `kleio-analytics.ts` | `reviews` | completed / assigned × 100 | derived from `getReviewerProgress()` | Committee metrics |
| Active programs | Reports · Programs | `kleio-data.ts` | `programs` | `status === "Open" \|\| "In Review"` | manual spot-check | Reports page |
| Shortlist group counts | `/shortlist/` | `kleio-analytics.ts` | `allSubmissions` | `getShortlistGroups()` by status | matches `shortlistedCount` | Shortlist sections |
| Pending reviewer actions | KLEIO Assist · Committee | `kleio-analytics.ts` | `reviews` | Pending / In Progress / Not Started | bottleneck scenario | Insights panel |

---

## Artist workspace (`/artist-dashboard/`)

| Label | Route / Component | Source file | Source array | Formula | Integrity check | UI location |
|-------|-------------------|-------------|--------------|---------|-----------------|-------------|
| Active applications | Overview · Funding | `kleio-artist-analytics.ts` | `artistDashboardProfile.applications` | exclude Awarded/Declined | `activeAppsMatchRows` | KPI cards |
| Due soon | Overview | `kleio-artist-analytics.ts` | applications | deadline within 14 days of DEMO_DATE | `dueSoonLteUpcoming` | Stat detail |
| Upcoming deadlines | Calendar · Overview | `kleio-artist-analytics.ts` | applications | future deadlines | derived | Stat |
| Pending decisions | Overview | `kleio-artist-analytics.ts` | applications | Submitted/Under Review/Waiting/Interview | status sum check | Stat |
| Overdue decisions | Overview | `kleio-artist-analytics.ts` | applications | past decision date | bounds check | Stat |
| Potential funding | Funding page | `kleio-artist-analytics.ts` | `fundingOpportunities` | sum of `amountMax` for open fits | `fundingSumMatches` | Funding KPI |
| Passport completeness | Passport · Insights | `kleio-artist-analytics.ts` | profile `materialsReady` | ready / total × 100 | `passportPctMatches` | Progress bar |
| Materials ready | Passport | `kleio-artist-analytics.ts` | `materialsReady` object | count `true` values | `materialsReadyMatches` | Checklist |
| Selected works | Portfolio | `kleio-profile-data.ts` | `selectedWorks` | `selectedWorks.length` | `selectedWorksCount` | Portfolio grid |
| Portfolio set counts | Portfolio sets | `kleio-artist-analytics.ts` | derived | activeApps / materialsReady / selectedWorks | no hardcoded JSX counts | Portfolio cards |
| Application status counts | Applications | `kleio-artist-analytics.ts` | applications | group by status | sum equals total apps | Status pills |
| Timeline confidence | Insights | `kleio-artist-analytics.ts` | active applications | ready-for-deadline / active | 0–100 bounds | Insights metric |
| Opportunity count | Opportunities | `kleio-artist-analytics.ts` | `matchedOpportunities` | array length | spot-check | Opportunities header |

**Note:** `artistDashboardProfile.stats` static object is not used for visible KPIs where analytics helpers exist.

---

## Collaborator review seat (`/collaborator-dashboard/`)

Default collaborator: `celeste-rowan` (demo login: `reviewer@kleio.demo`)

| Label | Route / Component | Source file | Source array | Formula | Integrity check | UI location |
|-------|-------------------|-------------|--------------|---------|-----------------|-------------|
| Assigned reviews | Overview | `kleio-collaborator-analytics.ts` | `reviews` + `collaborators` | rows for collaborator | `assignedReviewsMatchesRows` | Metric cards |
| Completed reviews | Overview · Submitted | same | assignment rows | `reviewStatus === "Complete"` | completed+pending+inProgress = assigned | Metric |
| Pending reviews | Overview · Queue | same | assignment rows | not Complete | `pendingRowsMatchPendingCount` | Metric |
| Due soon | Overview | same | assignment rows | deadline within 14 days | `dueSoonNotGreaterThanPending` | Queue detail |
| Overdue | Overview | same | assignment rows | past deadline | spot-check | Queue badges |
| Completion rate | Overview | same | completed / assigned | pct | `completionRateMatches` | Metric card |
| Scoped messages | Messages | same | `demoMessages` | filtered by collaborator assignments | `messageCountsValid` | Messages stat |
| Submitted reviews | `/submitted/` | same | completed rows | filter Complete | matches completed count | Submitted list |
| Assigned programs | Guidelines | same | `programs` | programs linked to assignments | non-negative | Guidelines cards |

---

## Integrity orchestrator

`lib/kleio-content-integrity.ts` aggregates:

- `getI18nIntegrity().allChecksPass` — EN/ES key parity (846 keys each)
- `analyticsIntegrity.allChecksPass` — institution metrics
- `artistAnalyticsIntegrity.allChecksPass` — artist metrics
- `collaboratorAnalyticsIntegrity.allChecksPass` — collaborator metrics

Run locally:

```bash
npx tsx -e "import { kleioContentIntegrity } from './lib/kleio-content-integrity.ts'; console.log(kleioContentIntegrity)"
```

---

## Demo-only / not calculated

| Item | Location | Notes |
|------|----------|-------|
| Public profile KPIs | `/institution/kleio-arthouse/` | `profile.publicSignals` — synthetic marketing signals, not live data |
| Export confirmation | `/shortlist/` | Demo action toast, no file generated |
| KLEIO Assist walkthrough | Dashboard insights | Narration tied to `demoScenarios`, counts from analytics |
| Institution signup stats | `/signup/institution/` | `reviewTeamIntegrity` from prepared invite records |
