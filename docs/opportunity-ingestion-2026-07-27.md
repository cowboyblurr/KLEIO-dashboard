# KLEIO Opportunity Ingestion — July 27, 2026

## Production result

The connected KLEIO Supabase catalog now contains 71 total opportunity and verification records, of which 64 are currently artist-facing.

This ingestion added seven artist-facing or upcoming records and one protected institution-only record:

- Culture Resource Production Awards 2026.
- Movimentos à Beira — Veras Artistic Residency 2026.
- TaDA Residency Programme 2027.
- BADA 2026 federal young visual-artist call.
- Argentina National Prizes for Production 2020–2023.
- Berlinale Talents 2027.
- Goethe-Institut Jordan Layali Al Sayfiya 2026.
- Institut français VILLÆ, protected from the artist directory.

## Structured data added

- Twenty-seven source-backed eligibility rules.
- Thirty-five application requirements.
- Eight current source snapshots.
- Five English translation records marked `machine_review_required`.
- Six new official or source-attributed provider records.

## Matching and trust decisions

### Culture Resource age conflict

The official overview states applicants were born between January 1992 and December 2011. The detailed eligibility guidance states January 1991 through December 2010.

KLEIO stores the two ranges in one `birth_date_conflict` evidence record with `verification_status = ambiguous`. It does not populate `age_min` or `age_max` and must not generate an age-based match until the organizer confirms the rule.

### Unknown fees

Veras, TaDA, BADA, Argentina National Prizes, Layali Al Sayfiya, and VILLÆ retain `application_fee = NULL` because their reviewed public pages do not explicitly state an application fee.

A null fee is not presented as free.

### Berlinale cost model

Berlinale Talents stores the standard EUR 15 service fee. The EUR 10 early-bird rate is preserved in instructions and requirements. The record also states that selected participants normally pay their own travel, accommodation, and daily expenses.

### Layali benefits

The Goethe-Institut Jordan call is public and searchable because the organizer, deadline, categories, and selection terms are verified. Funding and logistical benefits remain `not_stated`; KLEIO must not imply artist fees or covered travel.

### Institution-only VILLÆ routing

VILLÆ is stored as `draft / needs_review`, with an institution-only routing note. It returns zero artist-directory search results until KLEIO supports an explicit opportunity-audience field.

## Translation handling

English discovery translations were added for the Portuguese, German, Spanish, and French records. They remain marked `machine_review_required` and do not claim legal verification.

Original titles, source languages, official links, currencies, deadlines, declarations, and contractual terms remain authoritative.

## Validation completed

- Veras returns through full-text search.
- TaDA returns through full-text search.
- Both Argentina records return under the Argentina eligibility filter.
- Berlinale returns with EUR 15 as the standard application fee.
- Layali returns as an open opportunity with funding not stated.
- Culture Resource returns as upcoming and retains the ambiguous age-conflict evidence.
- VILLÆ returns zero artist-facing search results.
- Every target record has one current source snapshot.

## Applied production migrations

- `seed_july27_worldwide_opportunity_sources`
- `seed_culture_resource_production_awards_2026`
- `seed_veras_and_tada_residencies_2026_2027`
- `seed_argentina_bada_and_national_prizes_2026`
- `seed_berlinale_layali_and_villae_2026`
- `seed_july27_worldwide_eligibility_rules`
- `seed_july27_worldwide_application_requirements_v2`
- `seed_july27_worldwide_translations`
- `snapshot_july27_worldwide_opportunities`
