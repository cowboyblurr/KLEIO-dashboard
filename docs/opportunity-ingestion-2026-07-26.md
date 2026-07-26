# KLEIO Opportunity Ingestion — July 26, 2026

## Production result

The connected KLEIO Supabase catalog now contains 63 total opportunity and verification records, with 58 currently artist-facing.

This run added seven artist-facing opportunities, enriched two existing Singapore records, and created one protected Portuguese-language verification hold.

## New artist-facing opportunities

1. Goethe-Institut Africa–Europe Partnerships for Culture — Mobility Grants for Artists and Cultural Professionals.
2. Goethe-Institut Africa–Europe Partnerships for Culture — Southern Africa Audience Development Grants.
3. Creative Australia — Venice Biennale 2028 Australia Pavilion Expressions of Interest.
4. Creative Australia — Arts Projects for Individuals and Groups, September 2026 round.
5. Nordic Culture Fund — NEMO Northern European Mobility Opportunity.
6. Arts Council of Ireland / Create — Artist in the Community Scheme, Round 2.
7. Singapore National Arts Council and Sangam House — NAC–Sangam House Residency 2026.

## Existing records enriched

### NAC Cultural Fellowship 2026

- Set citizenship-based eligibility scope.
- Added accepted application language.
- Added availability and career-stage evidence.
- Added CV, 300–500-word statement, and programme-availability requirements.
- Refreshed the current source snapshot.

### Presentation and Participation Grant — August 2026

- Set country-specific eligibility scope.
- Clarified that SGD 100,000 is an annual cap rather than a likely award.
- Added current-guideline eligibility, project, budget, support-material, and financial-reporting requirements.
- Refreshed the current source snapshot.

## Protected verification hold

The Sergipe `Arte e Cultura na Educação em Tempo Integral` listing is stored as `draft` and `needs_review`. It is excluded from artist-facing search.

The official Portuguese listing confirms:

- Publishing authority.
- Application dates.
- Broad reading, music, and visual-arts categories.

It does not yet provide enough verified indexed information for:

- Compensation or award amount.
- Applicant-residency or operating rules.
- Number of positions.
- Required documents and annexes.
- Safeguarding.
- Intellectual-property terms.
- Tax or employment classification.

The listing also displays a placeholder public-notice number. Its English translation is marked `machine_review_required` and is not treated as legally authoritative.

## Trust decisions

- Sangam House is fully supported, but the official guidelines do not explicitly state an application fee. KLEIO therefore stores the fee as unknown rather than labeling the application free.
- Date-only Goethe deadlines retain visible exact-time confirmation notes.
- NEMO and the Artist in the Community Scheme are stored as upcoming because their portals open in August.
- NEMO matching requires an emerging individual artist and a new partner in the opposing Nordic or UK/Ireland region.
- Southern Africa Audience Development is not treated as a generic regional grant; programme-history connection is a required eligibility rule.
- Creative Australia records require Australian citizenship or permanent residence and retain First Nations protocol review requirements where applicable.
- Sangam House requires Singapore status, publication in Tamil, English communication ability, and full-month residency availability.

## Structured evidence added

The run added or refreshed:

- Source-backed eligibility rules for nine artist-facing records.
- Structured application requirements for Goethe, Creative Australia, NEMO, Ireland, Sangam House, and the two existing NAC records.
- One current source snapshot for every added or enriched record and for the Sergipe hold.
- One English Sergipe translation marked for human review.

## Applied Supabase migrations

- `seed_july26_worldwide_sources`
- `seed_goethe_aep_july26_opportunities_v2`
- `seed_creative_australia_july26_opportunities`
- `seed_nemo_community_sangam_july26`
- `enrich_nac_and_hold_sergipe_july26`
- `seed_july26_opportunity_eligibility_rules`
- `seed_july26_application_requirements_core_v2`
- `seed_july26_singapore_requirements`
- `seed_sergipe_review_translation_july26`
- `snapshot_july26_opportunity_updates`

Two earlier migration attempts failed safely before writing rows because PostgreSQL could not infer nullable values across combined records. Corrected typed migrations were applied under the `_v2` names shown above.

## Validation completed

- Total records: 63.
- Artist-facing records: 58.
- New artist-facing records from this run: 7.
- Existing records enriched: 2.
- Verification holds added: 1.
- Goethe mobility search returns both relevant new Goethe records.
- Venice Biennale search returns the Creative Australia EOI.
- Australia country filtering returns both Creative Australia records.
- NEMO appears as upcoming with its future opening date.
- Sergipe returns zero artist-facing search results.
- Sangam House application fee remains null.
- Every target record has one current source snapshot.
