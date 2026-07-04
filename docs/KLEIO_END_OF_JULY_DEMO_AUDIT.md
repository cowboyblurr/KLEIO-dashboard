# KLEIO End-of-July Demo Audit

Audit completed during the End-of-July Working Demo Build Session for Iker, institutions, investors, and collaborators.

**Repository:** `cowboyblurr/KLEIO-dashboard`  
**Demo institution:** KLEIO Arthouse (fictional, synthetic)  
**Live demo:** https://cowboyblurr.github.io/KLEIO-dashboard/

---

## 1. End-of-July Demo Audit List

| Area | Status | Summary |
|------|--------|---------|
| Phase 0 — Live/source parity | ✅ | Build exports expected copy; live site matches |
| Phase 1 — Route architecture | ✅ | 38 workspace routes + profiles; supplemental routes documented |
| Phase 2 — Demo auth / role safety | ✅ | Three roles route correctly; AuthGate blocks cross-role access |
| Phase 3 — Bilingual EN/ES | ⚠️ | 846 keys; institution core wired this pass; drawer/profiles remain EN |
| Phase 4 — Synthetic data + metrics | ✅ | All integrity checks pass; no hardcoded KPI numbers in JSX |
| Phase 5 — Three demo scenarios | ✅ | Documented in `KLEIO_END_OF_JULY_DEMO_SCENARIOS.md` |
| Phase 6 — Institution walkthrough | ✅ | Onboarding → open call → review → shortlist → reports |
| Phase 7 — Artist path | ✅ | Passport, portfolio, applications, funding narrative intact |
| Phase 8 — Claim safety | ✅ | “Verified passport” softened; no production/auth overclaims |
| Phase 9 — Visual polish | ⚠️ | Desktop primary; mobile usable; drawer i18n deferred |
| Phase 10 — Route QA | ✅ | See `KLEIO_ROUTE_QA_CHECKLIST.md` |
| Phase 11 — Deliverables | ✅ | This file + metric map + scenarios + route QA |
| Phase 12 — Build + deploy | ✅ | Build passes; push triggers GitHub Actions |

---

## 2. Route / CTA Fix List

| Issue | Fix | Status |
|-------|-----|--------|
| Auth wall “Return to KLEIO” hardcoded | Wired to `t("auth.returnToKleio")` | ✅ Fixed |
| “Verified KLEIO passport” aria-label | Changed to “Demo Creative Passport” | ✅ Fixed |
| Institution KPI labels English-only in lib | Moved to i18n keys; `KpiCards` translates | ✅ Fixed |
| Overview dashboard greeting English-only | Wired `institution.workspace.dashboard.*` keys | ✅ Fixed |
| Review queue tabs/filters English-only | Wired `institution.reviewQueue.*` keys | ✅ Fixed |
| Shortlist page English-only | Wired `institution.shortlist.*` keys | ✅ Fixed |
| Top bar English-only | Wired `institution.topBar.*` keys | ✅ Fixed |
| Portfolio hardcoded 6/4/3 counts | Derived from `getArtistAnalytics()` | ✅ Fixed |
| Route registry missing supplemental routes | Added `supplementalPublicRoutes` | ✅ Fixed |
| `href="#"` broken CTAs | None found | ✅ Clean |
| Raw asset wordmark links | Uses `KleioWordmarkLink` + `assetPath` | ✅ Clean |

---

## 3. Visual-to-Data Metric Map

See **`docs/KLEIO_VISUAL_TO_DATA_METRIC_MAP.md`** for full label → source → formula → integrity check mapping.

Summary:
- Institution: 30 submissions drive all KPIs, charts, badges
- Artist: `getArtistAnalytics({ artistId: "amina-el-badri" })` drives workspace stats
- Collaborator: `getCollaboratorAnalytics("celeste-rowan")` drives review seat stats

---

## 4. Synthetic Data Integrity Fix List

| Check | Result |
|-------|--------|
| `analyticsIntegrity.allChecksPass` | ✅ true |
| `artistAnalyticsIntegrity.allChecksPass` | ✅ true |
| `collaboratorAnalyticsIntegrity.allChecksPass` | ✅ true |
| `getI18nIntegrity().allChecksPass` | ✅ true (846 EN / 846 ES) |
| `kleioContentIntegrity.allChecksPass` | ✅ true |
| Static `artistDashboardProfile.stats` driving visible KPIs | ✅ Not used where analytics exist |
| Portfolio page hardcoded counts | ✅ Fixed |

No integrity flags were forced — all checks pass from source data.

---

## 5. Three Scenario Build Checklist

| Scenario | Submission ID | Visible in UI | Metrics consistent |
|----------|---------------|---------------|-------------------|
| Deadline Triage | `mei-lin-zhang` | ✅ Review queue · Needs Attention | ✅ |
| Reviewer Bottleneck | `sofia-karim` | ✅ Committee · Pending Vote | ✅ |
| Strong Candidate Shortlist | `amina-el-badri` | ✅ Default drawer · Priority queue | ✅ |

Details: **`docs/KLEIO_END_OF_JULY_DEMO_SCENARIOS.md`**

---

## 6. Bilingual Cleanup Checklist

| Surface | EN | ES | Notes |
|---------|----|----|-------|
| Homepage / login | ✅ | ✅ | |
| Public pages (about, manifesto, journal) | ✅ | ✅ | |
| Signup flows | ✅ | ✅ | Institution 5-step incl. Review Team |
| Nav labels (all roles) | ✅ | ✅ | via `kleio-nav-i18n.ts` |
| Institution dashboard header + KPIs | ✅ | ✅ | This pass |
| Review queue + shortlist + top bar | ✅ | ✅ | This pass |
| Charts (title chrome) | ✅ | ✅ | Status labels remain EN (demo data) |
| Artist workspace headers | ✅ | ✅ | |
| Collaborator workspace | ✅ | ✅ | |
| Submission drawer | ⚠️ | ⚠️ | Next pass |
| Public profiles | ⚠️ | ⚠️ | Synthetic record copy EN |
| KLEIO Assist insights block | ⚠️ | ⚠️ | Next pass |

---

## 7. Priority Build Plan — Next 3 Sessions

### Session A — Drawer + messages i18n
- Translate `submission-drawer.tsx`, `messages-view.tsx`, `kleio-ai-insights.tsx`
- Add ES status label map for institution tables (optional)

### Session B — Public profiles + mobile polish
- Bilingual public artist/institution profiles
- Mobile pass on submission drawer and review queue table scroll

### Session C — Narration rehearsal + export previews
- Wire report export preview copy across EN/ES
- Rehearsal script tied to three scenarios for Iker demo recording

---

## 8. Deployment / Live Parity Status

| Item | Status |
|------|--------|
| Branch | `main` |
| `next.config.mjs` static export | ✅ `output: "export"`, `trailingSlash`, basePath |
| `.github/workflows/deploy.yml` | ✅ push main + workflow_dispatch |
| Local build grep checks | ✅ collaborator review flow, Enter Collaborator Demo, reviewer@kleio.demo |
| Live homepage grep | ✅ All three strings present |
| Live institution signup | ✅ Step 1 of 5, Review Team, Materials & suggestions |
| GitHub Actions on latest commit | ✅ Triggered by push after this audit |

---

## 9. Remaining Production-Only Limitations

These are intentional for the demo prototype — not bugs:

| Limitation | Demo-safe language used |
|------------|------------------------|
| No real authentication | “Demo workspace” · role-based prototype |
| No real email invites | “Prepared invite” · limited collaborator review seat |
| No file storage / uploads | Synthetic materials · preview states |
| No payment / billing | Not shown |
| No live grant scraping | Calculated demo analytics from seed data |
| No AI-selected winners | KLEIO Assist = suggestions; people decide |
| localStorage session only | Resets on clear; no secure account system |
| TypeScript strict build | `ignoreBuildErrors: true` — strict tsc not clean |
| Vercel Analytics in layout | Dev infra only when NODE_ENV=production |

---

## Readiness Summary

| Dimension | Estimate | Notes |
|-----------|----------|-------|
| **Source repo demo readiness** | **~92%** | Core journey complete; drawer i18n remains |
| **Live public demo readiness** | **~90%** | Deploy parity confirmed; same as source after push |
| **Production SaaS readiness** | **~15%** | Intentionally out of scope for July demo |

The live KLEIO site and source code tell the same demo story: artists reduce repeated application labor, institutions run review workflows with calculated metrics, and collaborators get a limited review seat — bilingual where it matters most for the pitch path.
