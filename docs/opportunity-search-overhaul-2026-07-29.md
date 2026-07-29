# KLEIO Natural-Language Opportunity Search Overhaul

**Production audit date:** July 29, 2026  
**Production Supabase project:** `trekynurdgxgtaaqqtyq`

## Failure reproduced

The query `looking for pottery opportunities` returned zero records even though three active, artist-facing records contained the verified canonical discipline `Ceramics`:

1. Confluence of Myths Residency 2026.
2. XIII Edición del Concurso Nacional Grandes Maestras y Maestros del Patrimonio Artesanal de México 2026.
3. XXX Edición del Concurso Nacional de Nacimientos Mexicanos 2026.

The records were not stale and their search documents already contained `ceramics`.

## Confirmed root cause

KLEIO had two disconnected search layers:

- The client intent parser already interpreted `pottery`, `potter`, and `clay` as the canonical discipline `Ceramics`.
- The production directory sent the untouched sentence to `search_opportunities_v2`, which performed literal full-text search and exact discipline-filter matching.

The parser was used only to render the “KLEIO understood” chips. Its canonical interpretation never reached database retrieval. Consequently, `ceramics` worked while `pottery`, conversational phrases, translations, and misspellings failed.

## Production correction

The database is now the authoritative interpretation layer for every client.

### Maintainable taxonomy

The migration adds:

- `artistic_taxonomy_terms`
- `artistic_taxonomy_aliases`
- `opportunity_taxonomy_mappings`
- `opportunity_search_stop_terms`

The structures are versionable, protected by RLS, and administratively maintainable without scattering hard-coded conditionals through interface components.

### Ceramics language coverage

The initial canonical `Ceramics` term includes:

- pottery, potter, ceramic, ceramicist, clay, clay artist
- ceramic sculpture, earthenware, stoneware, porcelain
- wheel throwing, hand-built ceramics, kiln, functional pottery, studio pottery
- conservative misspellings including `potery`, `cermaics`, and `porcelin`
- verified search translations in Spanish, Portuguese, French, German, Italian, Arabic, Japanese, Korean, and Chinese

The original opportunity records remain unchanged unless the official source genuinely supports ceramics. Search aliases do not fabricate discipline eligibility.

### Layered retrieval

`search_opportunities_v2` retains its existing function signature, so current clients continue working without a breaking deployment. It now applies:

1. Canonical structured-practice matching.
2. Alias and translation expansion.
3. Stop-phrase removal for conversational language.
4. Residual full-text search.
5. Conservative edit-distance correction.
6. Type, location, format, fee, and text relevance boosts.
7. Verified visual priority only after relevance.
8. Deadline and title ordering after relevance and visual tie-breaking.

A recognized practice is a mandatory relevance boundary. A pottery query cannot return an unrelated music-only record. Opportunity-type words such as `residencies` and `competitions` improve ranking but do not create a false dead end if the catalog contains only a broader verified ceramics opportunity.

### Phrase-overlap protection

A longer verified alias takes precedence over an overlapping shorter alias. For example, `ceramic sculpture` remains a ceramics practice phrase and is not automatically broadened into every opportunity tagged `Sculpture`.

### Diagnostics and analytics

- `interpret_opportunity_search_query(text)` exposes normalized intent, canonical disciplines, residual text, expanded labels, and typo explanations.
- `diagnose_opportunity_search(text)` is restricted to KLEIO administrators and explains visible and excluded related records.
- `record_opportunity_event` automatically adds the server interpretation to `search` and `zero_results` metadata.
- No sensitive Creative Passport data are added to query analytics.

## Regression validation

The live production RPC now returns the three verified ceramics records for:

- `pottery`
- `pottery opportunities`
- `looking for pottery opportunities`
- `ceramic opportunities`
- `ceramics grants`
- `grants for potters`
- `porcelain competitions`
- `potery opportunities`
- `cermaics grants`
- Spanish `alfarería oportunidades`
- French `poterie résidence`
- Japanese `陶芸`

Ranking validations:

- `clay residencies` ranks Confluence of Myths first.
- `porcelain competitions` ranks a FONART prize first.
- `ceramic sculpture open calls` stays inside verified ceramics results rather than broadening to every sculpture call.

Trust validations:

- Protected, expired, rejected, duplicated, and inactive-source records remain excluded.
- Current explicit refinement filters continue to work.
- Career-stage and funding controls remain absent from the visible filter interface and are not silently restored from persisted state.
- Search relevance remains ahead of visual availability.

## Automated audit

Run:

```bash
pnpm audit:opportunity-search
```

The script checks the live public RPC using the configured Supabase publishable key and fails when:

- expected ceramics records disappear,
- a non-ceramics record enters pottery results,
- residency or competition ranking regresses,
- typo explanation stops working,
- phrase overlap reintroduces unrelated sculpture results, or
- a protected record becomes visible.

## Boundaries

- Search expansion improves discovery; it does not prove applicant eligibility.
- KLEIO still evaluates eligibility separately using source-backed rules and Creative Passport data.
- No application is submitted without explicit artist review and approval.
- Taxonomy aliases must remain grounded in genuine artistic-practice relationships.
