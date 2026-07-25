# KLEIO Opportunity Ingestion — July 25, 2026

## Production outcome

Six official-source opportunities were promoted to the artist-facing KLEIO catalog:

1. Westwerk international artist residency — Hamburg.
2. Beyond the Silence — Goethe-Institut Vietnam.
3. Martin Roth-Initiative Programme Line 1 — temporary relocation in Germany.
4. Bridges — AICA International and Cité internationale des arts.
5. Colours of Humanity — Hong Kong and Macau.
6. AOCA 2027 — Institut français support for cultural operators in Africa.

One additional official announcement was stored as a non-public verification hold:

- Hong Kong Baptist University International Writers’ Workshop 2027.

The HKBU record is `draft` and `needs_review`. It cannot be returned by `search_opportunities` because the official page contains a contradictory residency year and does not sufficiently publish the programme’s financial and logistical terms.

## Structured evidence added

- 22 source-backed eligibility rules.
- 33 application-material requirements.
- 7 current official-source snapshots.
- English and Spanish AOCA summaries marked `machine_review_required`.

## Matching safeguards

- Beyond the Silence does not receive an automatic Vietnam residency match because the official public page does not state applicant geography precisely enough.
- Martin Roth safety and threat documentation is treated as private, minimum-necessary information and must not enter public artist discovery or institution-facing profiles.
- Bridges requires explicit AICA membership and at least five years of professional art-criticism experience.
- AOCA requires an eligible organizational applicant, qualifying international structure, and category-specific partner, country, date, or event conditions.
- Unknown fees remain `NULL`; only Colours of Humanity is marked as confirmed free.
- Rights and licensing terms remain unverified unless the official source publishes enough detail for a separate review.

## Validation

The connected production database contains:

- 55 total canonical and verification records.
- 51 artist-facing open, upcoming, or forecasted records.
- 6 new artist-facing records from this ingestion.
- 1 new non-public verification hold.

Search validation confirmed:

- `Westwerk` returns the Hamburg residency.
- `AOCA Afrique` returns the French-language Institut français record.
- The Hong Kong no-fee filter returns Colours of Humanity.
- The HKBU verification record returns zero artist-facing search results.

## Version-control manifest

The structured ingestion manifest is stored at:

`data/opportunities/2026-07-25-worldwide-opportunities.json`

It preserves external IDs, official source URLs, deadlines, source languages, eligibility scope, financial-verification state, translation state, and the applied Supabase migration names.
