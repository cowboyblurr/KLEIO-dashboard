# KLEIO Route QA Checklist

End-of-July demo smoke test. Run after `pnpm run build` against `out/` and on live GitHub Pages.

**Live URL:** https://cowboyblurr.github.io/KLEIO-dashboard/  
**Demo credentials:** `institution@kleio.demo` · `artist@kleio.demo` · `reviewer@kleio.demo` · password `kleio2026`

Legend: ✅ pass · ⚠️ partial · ❌ fail

---

## Public routes

| Route | Static export | Live GHP | EN/ES | Demo framing | Notes |
|-------|---------------|----------|-------|--------------|-------|
| `/` | ✅ | ✅ | ✅ | ✅ | Collaborator demo CTA, reviewer@kleio.demo visible |
| `/about/` | ✅ | ✅ | ✅ | ✅ | Public product story |
| `/manifesto/` | ✅ | ✅ | ✅ | ✅ | Principles |
| `/journal/` | ✅ | ✅ | ✅ | ✅ | Build notes |
| `/signup/artist/` | ✅ | ✅ | ✅ | ✅ | Synthetic signup flow |
| `/signup/institution/` | ✅ | ✅ | ✅ | ✅ | Step 1 of 5 · Review Team step |

## Artist workspace (requires artist demo login)

| Route | Static export | Role gate | EN/ES | Calculated metrics | Notes |
|-------|---------------|-----------|-------|-------------------|-------|
| `/artist-dashboard/` | ✅ | ✅ | ✅ | ✅ | Overview from `getArtistAnalytics()` |
| `/artist-dashboard/passport/` | ✅ | ✅ | ✅ | ✅ | Completeness calculated |
| `/artist-dashboard/portfolio/` | ✅ | ✅ | ✅ | ✅ | Set counts from analytics |
| `/artist-dashboard/opportunities/` | ✅ | ✅ | ✅ | ✅ | |
| `/artist-dashboard/applications/` | ✅ | ✅ | ✅ | ✅ | |
| `/artist-dashboard/collaborators/` | ✅ | ✅ | ⚠️ | — | Demo thread copy EN |
| `/artist-dashboard/calendar/` | ✅ | ✅ | ✅ | ✅ | |
| `/artist-dashboard/messages/` | ✅ | ✅ | ⚠️ | — | Demo threads EN |
| `/artist-dashboard/funding/` | ✅ | ✅ | ✅ | ✅ | |
| `/artist-dashboard/insights/` | ✅ | ✅ | ✅ | ✅ | |
| `/artist-dashboard/settings/` | ✅ | ✅ | ⚠️ | — | Settings body EN |

## Institution workspace (requires institution demo login)

| Route | Static export | Role gate | EN/ES | Calculated metrics | Notes |
|-------|---------------|-----------|-------|-------------------|-------|
| `/dashboard/` | ✅ | ✅ | ✅ | ✅ | KPI cards i18n wired |
| `/programs/` | ✅ | ✅ | ✅ | ✅ | |
| `/programs/new/` | ✅ | ✅ | ✅ | — | Open call builder |
| `/review-queue/` | ✅ | ✅ | ✅ | ✅ | Three demo scenarios |
| `/submissions/` | ✅ | ✅ | ✅ | ✅ | |
| `/shortlist/` | ✅ | ✅ | ✅ | ✅ | Counts match analytics |
| `/committee/` | ✅ | ✅ | ✅ | ✅ | Bottleneck scenario |
| `/messages/` | ✅ | ✅ | ⚠️ | ✅ | Badge from pending messages |
| `/reports/` | ✅ | ✅ | ✅ | ✅ | |
| `/activity-log/` | ✅ | ✅ | ✅ | ✅ | |
| `/artists/` | ✅ | ✅ | ✅ | — | Institution-only directory |
| `/templates/` | ✅ | ✅ | ✅ | — | Admin templates |
| `/settings/` | ✅ | ✅ | ⚠️ | — | Demo settings copy |

## Collaborator review seat (requires reviewer demo login)

| Route | Static export | Role gate | Scoped visibility | EN/ES | Notes |
|-------|---------------|-----------|-------------------|-------|-------|
| `/collaborator-dashboard/` | ✅ | ✅ | ✅ | ✅ | Limited seat framing |
| `/collaborator-dashboard/assignments/` | ✅ | ✅ | ✅ | ✅ | Assigned only |
| `/collaborator-dashboard/review-queue/` | ✅ | ✅ | ✅ | ✅ | |
| `/collaborator-dashboard/guidelines/` | ✅ | ✅ | ✅ | ✅ | Rubric scoped |
| `/collaborator-dashboard/messages/` | ✅ | ✅ | ✅ | ✅ | Scoped threads |
| `/collaborator-dashboard/submitted/` | ✅ | ✅ | ✅ | ✅ | |

## Public profiles

| Route | Static export | EN/ES | Synthetic label | Notes |
|-------|---------------|-------|-----------------|-------|
| `/artist/amina-el-badri/` | ✅ | ⚠️ | ✅ | Scenario 3 artist |
| `/artist/mei-lin-zhang/` | ✅ | ⚠️ | ✅ | Scenario 1 artist |
| `/artist/sofia-karim/` | ✅ | ⚠️ | ✅ | Scenario 2 artist |
| `/institution/kleio-arthouse/` | ✅ | ⚠️ | ✅ | Fictional demo institution |

---

## Cross-cutting checks

| Check | Status | Notes |
|-------|--------|-------|
| No `href="#"` in components | ✅ | Grep clean |
| Wordmark uses `KleioWordmarkLink` / `assetPath` | ✅ | |
| Wrong-role redirect clear | ✅ | AuthGate switch UI |
| Sign-out returns to `/` | ✅ | |
| `kleioContentIntegrity.allChecksPass` | ✅ | Verified via tsx |
| Live/source parity (homepage copy) | ✅ | collaborator review flow present |

## Remaining partial items

- Submission drawer body copy — English only (demo record labels intentional)
- Public profile pages — English body copy (synthetic records)
- Artist settings / collaborators / messages — some English demo thread content
- `submission-drawer.tsx`, `messages-view.tsx`, `kleio-ai-insights.tsx` — next i18n pass
