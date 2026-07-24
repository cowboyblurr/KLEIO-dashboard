# KLEIO Worldwide Opportunity Protocol

Implemented July 24, 2026.

## Objective

Make worldwide and non-English artist opportunities first-class records in KLEIO without weakening source verification, eligibility matching, translation transparency, or artist approval boundaries.

## Database additions

The `opportunities` record now supports:

- Original-language titles.
- Accepted application languages.
- Application-fee currency.
- Explicit eligibility scope: worldwide, regional, country-specific, residency-based, citizenship-based, diaspora, or partnership-based.
- Travel, accommodation, visa, insurance, and production-support states.
- Living-stipend display text.
- Translation status and human-translation review requirements.
- Institutional verification level.
- Separate financial-terms and rights-terms verification.
- Logistics and translation notes.

The search document now includes the original title, accepted application languages, source language, eligibility scope, logistics notes, and translation notes.

## Trust rules

1. Language is never a reason to exclude a credible opportunity.
2. The original source text, title, currency, deadline, and official link remain authoritative.
3. Translations are presentation aids and never promote unverified facts.
4. Contracts, rights clauses, tax declarations, and legally binding language require human review when translation is not verified.
5. An unknown fee remains `NULL`; it is never presented as free.
6. A date-only deadline is stored with a conservative normalized timestamp and a visible exact-time confirmation note.
7. Worldwide discovery and worldwide eligibility are different concepts.
8. Diaspora, identity, partnership, and OIF-membership rules are not inferred from keywords.
9. Match status is based on source-backed eligibility rules and actual Creative Passport data.
10. Every curated record keeps a current source snapshot and an explicit verification state.

## Live source-backed rollout

Eight records were added in the initial rollout:

- PhotoVogue — Brave New Visions: Creativity as Rebellion.
- PhotoVogue — MENA Panorama.
- Maybank Foundation Artist Fellowship Programme 2026.
- Cité internationale des arts — Kota Residency Programme.
- Cité internationale des arts — Timor-Leste Residency Programme.
- Cité internationale des arts — Dominican Republic residency programme.
- British Council — Connections Through Culture 2026.
- Organisation internationale de la Francophonie — artist mobility and cultural-goods circulation support.

The rollout also added:

- Five official-source records.
- Twenty-two source-backed eligibility rules.
- Thirty application-material requirements.
- One current source snapshot per opportunity.
- English and Spanish OIF translations marked `machine_review_required`, with no false human-verification claim.

## Operational boundary

The twice-daily ChatGPT research action discovers and verifies new opportunities. It does not silently write every finding into production. New records must pass deduplication, source verification, eligibility normalization, translation labeling, rights review, and KLEIO ingestion approval before promotion to the canonical catalog.

## Applied Supabase migrations

- `add_worldwide_opportunity_protocol`
- `seed_worldwide_opportunity_sources`
- `seed_photovogue_2026_open_calls_v2`
- `seed_maybank_artist_fellowship_2026`
- `seed_kota_residency_2027`
- `seed_timor_leste_residency_2027`
- `seed_dominican_republic_residency_2027`
- `seed_connections_through_culture_2026`
- `seed_oif_artist_mobility_2026`
- `seed_worldwide_opportunity_eligibility_rules`
- `seed_worldwide_photo_maybank_requirements`
- `seed_cite_residency_requirements`
- `seed_british_council_oif_requirements`
- `seed_oif_review_required_translations`
- `snapshot_verified_worldwide_opportunities`

## Validation completed

- Worldwide and source-language fields are present in production.
- Full-text search returns MENA and Francophonie records.
- Country filtering for Indonesia returns regional, residency-based, and partnership-based opportunities where appropriate.
- Every initial record has source attribution, a verification state, eligibility evidence, application requirements, and one current snapshot.
- Unknown support and rights terms remain explicitly unverified.
- Existing security and RLS advisor warnings were not broadened or silently changed by this rollout.
