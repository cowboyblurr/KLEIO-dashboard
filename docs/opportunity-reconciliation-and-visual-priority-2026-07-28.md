# KLEIO Opportunity Reconciliation and Visual Priority

Implemented July 28, 2026.

## Catalog reconciliation

The unresolved July research batches were reconciled against the production catalog. Missing direct-artist, partnership-based, regional, organisation-facing, and procurement records were added or held behind `needs_review` as appropriate.

The catalog now contains:

- 99 total opportunity and verification records.
- 83 artist-visible open, upcoming, or forecasted records.
- 13 protected `needs_review` records.
- Source snapshots for the 28 records in this reconciliation.
- Structured application requirements generated from the verified official materials.
- Source-backed eligibility rules for artist-facing records.

Organisation-only and legally incomplete records remain excluded from artist search. These include workspace infrastructure, publisher rights support, record-label programmes, UNESCO procurement, a host-city designation, and municipal calls that still require complete annex review.

## Compact search controls

The artist opportunity search now:

- Keeps the natural-language search visible at all times.
- Collapses structured controls behind a `Refine search` button.
- Removes Career stage and Funding from the visible refinement set.
- Clears legacy persisted Career stage and Funding selections before loading results, preventing invisible old filters from narrowing the catalog.
- Keeps Discipline, Opportunity type, Participation, Geography, Deadline, Source, confirmed no-fee, and structured-requirement controls available when expanded.

## Visual priority

The opportunity query now preserves text relevance first, then prioritizes records with an attached verified visual before deadline and title ordering.

Visual priority never overrides:

- Verification state.
- Eligibility.
- Search relevance.
- Closed or expired status.
- Protected `needs_review` status.

## Visual research system

A new `opportunity_image_research_queue` tracks opportunities that do not yet have safe, relevant visual assets.

Research policy:

1. Search the official opportunity page.
2. Search the organiser's official news or media centre.
3. Search official public social announcements where accessible.
4. Check downloadable call artwork and official PDFs.
5. Use a provider-owned logo only when no opportunity-specific visual exists and label it as a provider logo.
6. Reject unrelated, scraped, unattributed, or rights-unclear images.
7. Preserve source URL, attribution, origin, rights status, and alt text.

Initial official visuals attached in this reconciliation:

- Japan Foundation — An Open Draft: Asia Film Programmers Lab #3.
- Argentina National Prizes 2021–2024.
- UNESCO Asia documentary-production contract.
- Music Australia Record Label Development Scheme.
- Music Australia Marketing & Manufacturing Grants.

The remaining image queue is prioritized by deadline urgency, upcoming status, verification status, and whether the record is artist-facing.

## Supabase changes

- Added official opportunity sources used by the unresolved batches.
- Added and enriched opportunity records.
- Added application requirements and eligibility rules.
- Added one current source snapshot per reconciled opportunity.
- Added `opportunity_image_research_queue`.
- Updated `search_opportunities_v2` to prioritize verified visuals after search relevance.
- Attached official-publication image metadata where a safe official asset was found.

## Trust boundary

An opportunity without a visual remains eligible for search and matching. KLEIO uses a branded category fallback until a safe asset is verified. Visual completeness must never become a proxy for institutional credibility, artistic quality, geographic importance, or artist eligibility.
