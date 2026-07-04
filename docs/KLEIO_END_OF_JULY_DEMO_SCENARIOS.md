# KLEIO End-of-July Demo Scenarios

Synthetic demo records for KLEIO Arthouse. All artists, institutions, and messages are fictional.

---

## Scenario 1 — Deadline Triage

**Scenario name:** Deadline Triage  
**Pain:** A promising artist is missing required materials before the open-call deadline.

### Source records

| Type | ID | Notes |
|------|-----|-------|
| Submission | `mei-lin-zhang` | Artist: Mei Lin Zhang · Project: `瞬間 / Trace` |
| Status | `Pending Info` | Completeness **82%** |
| Missing materials | Updated CV, Installation dimensions, Reference contact |
| Message thread | `thread-mei-lin` | Subject: “Missing materials before the August 14 deadline” |
| Demo message | `msg-mei-1` | Type: `request-info` · Status: `drafted` |
| Internal note | inline on submission | Author: Lina Park — promising but missing three required items |
| Activity | `m1`, `m2`, `m3` | Flagged missing materials, completeness check, submitted |

### Where it appears

| Route | UI element |
|-------|------------|
| `/dashboard/` | Review queue · Needs Attention tab · KPI “Incomplete Applications” |
| `/review-queue/` | Scenario card · default drawer selection on page load |
| `/messages/` | Drafted request-info thread |
| `/submissions/` | Row with 82% completeness · Pending Info status |

### Metrics / badges impacted

- `analytics.needsAttentionCount` — includes `mei-lin-zhang`
- `analytics.incompleteCount` — completeness < 100 + missing materials
- Review queue tab badge: **Needs Attention**
- Message badge if `msg-mei-1` is pending/drafted

### Demo narration

> “Mei Lin Zhang submitted a strong multimedia proposal, but three required materials are still missing with the August 14 deadline approaching. KLEIO surfaces the gap in the review queue, drafts a request-info message, and keeps an internal note so the program team can triage without losing context.”

### Expected next action

Open the submission drawer → review missing materials → send drafted request-info message → track completeness before deadline.

---

## Scenario 2 — Reviewer Bottleneck

**Scenario name:** Reviewer Bottleneck  
**Pain:** A finalist-level application is blocked because one committee vote is still pending.

### Source records

| Type | ID | Notes |
|------|-----|-------|
| Submission | `sofia-karim` | Artist: Sofia Karim · Project: `The Second Horizon` |
| Status | `Pending Vote` | Score **91** · Completeness **100%** |
| Reviews | `review-sofia-theo` (Complete, 91) | Theo Nguyen |
| Reviews | `review-sofia-celeste` (Complete, 89) | Celeste Rowan |
| Reviews | **`review-sofia-mateo` (Pending)** | Mateo Alvarez — blocking vote |
| Message thread | `thread-sofia` | Subject: “Committee vote still pending” |
| Demo message | `msg-sofia-1` | Recipient: `mateo-alvarez` · Status: `pending` |
| Note | `note-sofia-1` | Two reviews complete; Mateo has not submitted final vote |
| Activity log | `log-2`, `log-6`, `log-7` | Pending vote + completed reviews |

### Where it appears

| Route | UI element |
|-------|------------|
| `/dashboard/` | KPI “Pending Committee Vote” · KLEIO Assist bottleneck insight |
| `/review-queue/` | Priority queue · Pending Vote filter context |
| `/committee/` | Scenario eyebrow · Awaiting vote section · Reviewer progress |
| `/shortlist/` | Finalist / interview group |
| `/collaborator-dashboard/` | Mateo’s pending assignment (switch to collaborator demo) |

### Metrics / badges impacted

- `analytics.pendingVoteCount`
- `analytics.pendingReviewerActionsCount`
- Committee page: reviewer progress `2/3 complete · 1 pending`
- Shortlist stat: Finalist / interview count

### Demo narration

> “Sofia Karim’s application scored 91 with complete materials and two strong reviewer recommendations — but Mateo Alvarez’s committee vote is still pending. KLEIO shows exactly who is blocking the decision and lets the program director send a reminder without digging through email.”

### Expected next action

Filter review queue by Pending Vote → open committee view → message pending reviewer → advance to shortlist/decision once vote is recorded.

---

## Scenario 3 — Strong Candidate Shortlist

**Scenario name:** Strong Candidate Shortlist  
**Pain:** A strong application is buried across portfolio files, notes, and review comments.

### Source records

| Type | ID | Notes |
|------|-----|-------|
| Submission | `amina-el-badri` | Artist: Amina El Badri · Project: `Echoes of Memory` |
| Status | `In Review` | Score **94** · Completeness **95%** |
| Reviews | `review-amina-theo` (Complete, 94, Shortlist) | Theo Nguyen recommends shortlist |
| Reviews | `review-amina-celeste` (Complete, 92, Shortlist) | Celeste Rowan recommends shortlist |
| Message thread | `thread-amina` | Subject: “Shortlist recommendation — Echoes of Memory” |
| Demo message | `msg-amina-1` | Status: `sent` |
| Note | `note-amina-1` | Clearest shortlist candidate in current queue |
| Activity | `a1`–`a3`, `log-3`, `log-8` | Shortlist recommendations logged |

### Where it appears

| Route | UI element |
|-------|------------|
| `/dashboard/` | Default selected submission drawer · Priority review queue |
| `/review-queue/` | Top of scenario-sorted queue |
| `/shortlist/` | Shortlisted group (after move-to-shortlist action) |
| `/artist/amina-el-badri/` | Public profile linked from drawer |
| `/reports/` | Shortlist summary in report preview |

### Metrics / badges impacted

- `analytics.shortlistedCount` — increases when moved to Shortlisted status
- Review queue: high score + reviewer recommendations visible in drawer
- Shortlist page stat row must match `analytics.shortlistedCount`

### Demo narration

> “Amina El Badri’s installation proposal has complete materials, a 94 average score, and two reviewer shortlist recommendations — all visible in one drawer. KLEIO lets the committee move from review to decision without losing portfolio context, notes, or reviewer scores.”

### Expected next action

Open selected submission drawer → review scores and internal note → Move to Shortlist → confirm count on `/shortlist/` matches analytics.
