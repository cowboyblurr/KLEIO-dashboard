# KLEIO — Technical Cost & Market Intelligence

**Current snapshot:** August 7, 2026  
**Use:** reusable KLEIO operating reference for pricing, product, finance, and business development.  
**Evidence standard:** verified KLEIO implementation, observed production telemetry, modeled reserves, current vendor pricing inputs, competitive signals, and strategic hypotheses are labeled separately.

> **Purpose:** provide technically grounded cost inputs for KLEIO's pricing model without confusing underlying COGS with customer value. AI inference and ordinary infrastructure are inexpensive relative to institutional submission/review pricing. KLEIO should price around demonstrated workflow value, support, reliability, and institutional outcomes—not cost-plus token arithmetic.

## Executive decision snapshot

| Model input | Working value | How to use it |
|---|---:|---|
| Normal document analysis reserve | **$0.20** | Internal planning reserve; not an artist price |
| AI writing-action reserve | **$0.06** | Drafting reserve |
| Rare complex document escalation | **$1 ceiling** | Stress ceiling; do not use as an average |
| Normal active artist COGS allowance | **$1 / month** | Planning assumption |
| AI-heavy active artist COGS allowance | **$4 / month** | Planning assumption |
| 100 / 500 / 1,000-application AI-heavy program | **~$30 / ~$130 / ~$260** | Conservative variable-tech stress reserve |

## What is verified in KLEIO now

- Gemini 3.6 Flash is the normal document-analysis and drafting model in the live workflow.
- Gemini 2.5 Pro is configured as an escalation path for limited or complex document analysis.
- Document guardrails include a 15 MB PDF cap, a 100-page application-level cap, and a 12 document-analyses/day artist abuse ceiling.
- Embedded PDF text is parsed locally where available, and unchanged analyses can be reused from cache by input hash.
- Interactive opportunity search runs against KLEIO's canonical Supabase opportunity data rather than requiring a fresh grounded web search for every artist query.
- Preferred search architecture remains: **background discovery → normalization / verification → canonical database → inexpensive artist search**.

### Observed production usage

| Production signal | Observed value |
|---|---|
| Successful Gemini 3.6 Flash document analyses | 11,720 · 10,015 · 14,382 · 15,450 total tokens |
| Average successful run | **12,892 total tokens** |
| Cached repeat analysis | **0 inference units** |
| Early storage sample | ~7.3 MB artist documents + ~1.9 MB artist assets across 10 objects |

The storage sample is intentionally treated as too early and too small to use as a per-artist average.

## Modeled AI action costs

| Action | Modeled cost |
|---|---:|
| 5-page document / ~4k output | **~$0.034** |
| 10 pages / ~8k output | **~$0.066** |
| 25 pages / ~15k output | **~$0.124** |
| Extreme 100 pages / full 48k output ceiling | **~$0.40 Flash-only** |
| Typical 5k input + 1k output draft | **~$0.015** |
| Larger 20k input + 3k output draft | **~$0.0525** |

## Infrastructure planning

Current Supabase Pro baseline: **$25/month**.

| Area | Included / baseline | Overage reference |
|---|---|---:|
| MAU | 100k | $0.00325 / user |
| Storage | 100 GB | $0.0213 / GB |
| Uncached egress | 250 GB | $0.09 / GB |
| Cached egress | 250 GB | $0.03 / GB |
| Edge Functions | 2M invocations | $2 / 1M invocations |

> **Architecture implication:** the larger avoidable variable-cost risk is uncontrolled live search/grounding and unnecessary re-analysis—not ordinary KLEIO drafting. Do not turn every artist opportunity query into a fresh grounded web request.

## Institution program stress test

| Application volume | Conservative variable-tech reserve |
|---|---:|
| 100 applications | **~$30** |
| 500 applications | **~$130** |
| 1,000 applications | **~$260** |

These scenarios deliberately assume AI analysis/support on every application. Current KLEIO review does not require that, so actual variable cost can be materially lower.

## AI provider comparison — pricing-model input

Use this to shape KLEIO's tiers, included AI usage, overages, and maintenance assumptions—not to set customer price by token cost. Keep Gemini as the live baseline while KLEIO benchmarks OpenAI and Mistral behind a provider-agnostic adapter in GitHub. **No Vercel dependency is required for this work.**

### Standardized daily-use stress case

For apples-to-apples planning, this model assumes **100% daily AI usage for 30 days**. Per active artist/day: **35k input + 5k output** for extraction/ranking/requirements, plus **20k input + 5k output** for drafting/synthesis. No caching or batch discounts are assumed. Figures include a **20% operating reserve**.

| Provider route | 100 daily users | 500 daily users | 1,000 daily users | 5,000 daily users |
|---|---:|---:|---:|---:|
| **OpenAI** — GPT-5.4 nano + GPT-5.4 mini | **~$183/mo** | **~$914/mo** | **~$1,827/mo** | **~$9,135/mo** |
| **Google Gemini** — 3.5 Flash-Lite + 3.6 Flash | **~$326/mo** | **~$1,629/mo** | **~$3,258/mo** | **~$16,290/mo** |
| **Anthropic** — Haiku 4.5 + Sonnet 5 steady-state | **~$702/mo** | **~$3,510/mo** | **~$7,020/mo** | **~$35,100/mo** |
| **Mistral** — Small 4 + Large 3 | **~$93/mo** | **~$464/mo** | **~$927/mo** | **~$4,635/mo** |

Anthropic Sonnet 5 is temporarily $2/M input + $10/M output through August 31, 2026; the table uses the announced September steady-state $3/M + $15/M so KLEIO's pricing model is not built around a launch discount.

### Why each provider matters

| Provider | Benefit to KLEIO | Current use case / caution |
|---|---|---|
| **OpenAI** | Strong cost/capability balance; structured outputs, function calling, file search, large context; nano is positioned for extraction/ranking. | **Best current challenger for the default intelligence layer.** Paid COGS are low enough that lack of a dependable free production tier is not a beta blocker. |
| **Gemini** | Already integrated; 1M context; strong multimodal/PDF support; Flash-Lite supports high-volume extraction. | **Lowest migration risk.** Real artist CV/application handling should use production-appropriate paid data handling rather than relying on consumer/free-tier assumptions. |
| **Anthropic** | Strong long-form synthesis and reasoning route for complex writing or escalation cases. | Useful quality benchmark and potential escalation route, but materially higher modeled steady-state cost in this stress case. |
| **Mistral** | Lowest modeled token cost; Small 4 is multilingual/multimodal; dedicated OCR pricing can support structured document extraction. | Cost challenger worth benchmarking, especially for extraction/OCR-heavy workflows; validate KLEIO-specific quality before routing production work. |

### Current official provider-rate inputs — checked August 7, 2026

- **OpenAI:** GPT-5.4 nano $0.20/M input · $1.25/M output; GPT-5.4 mini $0.75/M input · $4.50/M output.
- **Google:** Gemini 3.5 Flash-Lite $0.30/M input · $2.50/M output; Gemini 3.6 Flash $1.50/M input · $7.50/M output.
- **Anthropic:** Haiku 4.5 $1/M input · $5/M output; Sonnet 5 $2/M input · $10/M output through Aug 31, then $3/M · $15/M.
- **Mistral:** Small 4 $0.15/M input · $0.60/M output; Large 3 $0.50/M · $1.50/M; OCR 4 $4/1,000 pages.

## Competitive pricing snapshot

| Competitor | Current pricing signal | Strategic meaning |
|---|---|---|
| **Artsume** | $0 institutions / $0 artists; 10% when collecting application payments | Closest conceptual pressure point |
| **Artwork Archive** | Artists $9–$36/mo annual · organizations $39–$156/mo annual | Career management + opportunities + calls |
| **CaFÉ** | $225 onboarding + $250/$475 per call + application fees | Arts-specific transactional model |
| **Zealous** | £26 / £79 / £239 monthly equivalents on annual plans | Modern creative submission SaaS |
| **SlideRoom** | $2,600/year + submission fees | Established institutional benchmark |
| **Award Force** | $3,250 Growth · $6,500 Pro / year | Premium review benchmark |
| **Evalato** | €2,500–€5,500 / program · enterprise custom | High program-value benchmark |
| **Submittable** | Institution pricing quote-based; transactional fees apply | Enterprise / procurement end |

> **Pressure test:** artist passport + opportunity discovery + institutional review is not enough differentiation by itself. KLEIO's premium thesis still needs proof through evidence-grounded application intelligence, exceptional committee workflow, preserved decision history, reliable external-submission packaging/tracking, and artist-controlled reusable evidence.

## Unit economics for planning

- **Normal active artist:** 2 analyses + 5 drafts ≈ $0.70 modeled AI reserve. Use **$1/month** including ordinary infrastructure allowance.
- **AI-heavy active artist:** 10 analyses + 25 drafts ≈ $3.50 modeled AI reserve. Use **$4/month**.

## Architecture recommendation

- Keep one provider interface in the **GitHub codebase** for document analysis, requirement extraction, opportunity ranking, and application drafting.
- Keep Gemini as the baseline adapter.
- Add OpenAI as the first benchmark challenger; add Mistral behind a controlled feature flag.
- Benchmark with **synthetic KLEIO data only** until privacy/data-handling settings and provider terms are explicitly confirmed for production artist material.
- Cache unchanged analyses and normalized opportunity intelligence so repeat views do not trigger unnecessary inference or live search.
- Choose default + fallback from KLEIO-specific quality, latency, reliability, and cost evidence—not vendor preference.

## Pricing implications

1. **Do not charge artists per prompt or per submission.** Preserve the artist-centered value proposition and let institution economics subsidize core artist utility.
2. Start by testing a **clear per-program institutional pilot** rather than forcing an annual enterprise commitment before procurement/value proof exists.
3. Evolve toward **base institutional license + included application volume + overage + optional implementation/service** once repeated use is demonstrated.
4. A **$750 pilot** is a strategic test point only—**not a verified market-clearing price**.
5. Model maintenance/service separately from tokens: database/storage/egress, email, monitoring, model migrations, regression QA, privacy/security work, support hours, opportunity-data upkeep, and provider failover all matter.
6. Track real cost per successful workflow: CV analysis, opportunity analysis, drafted application, packaged submission, and institutional review cycle. This telemetry is required for margin decisions.

### What the pricing owner should not do

- Do not convert token cost directly into customer price.
- Do not treat the AI bill as total maintenance cost.
- Do not assume the early storage sample is a per-artist average.
- Do not treat competitor list prices as proof of KLEIO willingness-to-pay.
- Do not present the premium thesis as validated until real institution conversations support it.

## Source-of-truth and refresh rule

This file is a portable snapshot of the live Notion page **KLEIO — Technical Cost & Market Intelligence — August 7, 2026**. If the Notion source changes materially, refresh the attached DOCX/PDF as part of the same update rather than allowing the files to drift. External vendor pricing should be re-checked before a material pricing or vendor-routing decision.

**Primary source categories checked August 7, 2026:** OpenAI model pricing; Google Gemini API pricing/latest-model documentation; Anthropic Haiku/Sonnet pricing; Mistral API pricing; Supabase pricing; KLEIO production telemetry and GitHub implementation evidence; competitor pricing pages for Artsume, Artwork Archive, CaFÉ, Zealous, SlideRoom, Award Force, Evalato, and Submittable.

*Prepared as reusable KLEIO operating documentation. No individual recipient is required for this brief to remain useful.*
