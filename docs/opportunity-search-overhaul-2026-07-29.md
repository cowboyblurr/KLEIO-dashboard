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

The migrations add:

- `artistic_taxonomy_terms`
- `artistic_taxonomy_aliases`
- `opportunity_taxonomy_mappings`
- `opportunity_search_stop_terms`

The structures are versionable, protected by RLS, and administratively maintainable without scattering hard-coded conditionals through interface components. Public and authenticated reads use one policy per table; administrator INSERT, UPDATE, and DELETE permissions are separated to avoid redundant permissive SELECT paths.

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
4. Exact structured intent when the catalog can satisfy the requested practice, type, location, format, and fee combination.
5. A verified-practice fallback when the exact combination does not exist.
6. Residual full-text search.
7. Conservative edit-distance correction.
8. Type, location, format, fee, and text relevance boosts.
9. Verified visual priority only after relevance.
10. Deadline and title ordering after relevance and visual tie-breaking.

A recognized practice is a mandatory relevance boundary. A pottery query cannot return an unrelated music-only record.

Exact-first behavior means:

- `clay residencies` returns the verified ceramics residency rather than every ceramics record.
- `porcelain competitions` returns the two verified ceramics prizes.
- `ceramics grants` safely falls back to verified ceramics opportunities because no exact ceramics grant is currently available.

### Country and global eligibility safety

A specific-country search may fall back only to:

- an opportunity explicitly matching that country, or
- an opportunity that explicitly states `Worldwide`, `Global`, `All countries`, or `All nationalities` eligibility.

Generic labels such as `International` and `Cross-border` are not treated as proof that every nationality may apply. Consequently, `opportunities for a filmmaker in Jamaica` returns Berlinale Talents, which explicitly accepts applicants worldwide, while excluding region-restricted film programmes.

### Phrase-overlap protection

A longer verified alias takes precedence over an overlapping shorter alias. For example, `ceramic sculpture` remains a ceramics practice phrase and is not automatically broadened into every opportunity tagged `Sculpture`.

### Diagnostics and analytics

- `interpret_opportunity_search_query(text)` exposes normalized intent, canonical disciplines, residual text, expanded labels, and typo explanations.
- `private.diagnose_opportunity_search(text)` explains visible and excluded related records without being exposed through the public PostgREST API.
- `record_opportunity_event` automatically adds the server interpretation to `search` and `zero_results` metadata.
- The existing `application_prepare` analytics event is now accepted by the database constraint.
- No sensitive Creative Passport data are added to query analytics.

### Performance

The initial correct implementation took approximately **2.17 seconds** for `looking for pottery opportunities` because PostgreSQL repeatedly inlined interpretation and candidate-ranking CTEs.

Materializing the interpretation, context, candidate, and availability stages reduced the same production query to approximately **52 milliseconds**, a roughly **42× improvement**, with the same three verified results and no temporary disk I/O.

## Regression validation

The live production RPC returns the three verified ceramics records for broad practice searches including:

- `pottery`
- `pottery opportunities`
- `looking for pottery opportunities`
- `ceramic opportunities`
- `ceramics grants`
- `grants for potters`
- `potery opportunities`
- `cermaics grants`
- Spanish `alfarería oportunidades`
- Japanese `陶芸`

Exact intent validations:

- `clay residencies` returns only Confluence of Myths.
- French `poterie résidence` returns only Confluence of Myths.
- `porcelain competitions` returns only the two FONART prize records.
- `ceramic sculpture open calls` remains inside the verified Ceramics taxonomy rather than broadening to unrelated sculpture calls.
- `opportunities for a filmmaker in Jamaica` recognizes both Film and Jamaica and returns only explicitly worldwide fallback results.

Trust validations:

- Protected, expired, rejected, duplicated, and inactive-source records remain excluded.
- Current explicit refinement filters continue to work.
- Career-stage and funding controls remain absent from the visible filter interface and are not silently restored from persisted state.
- Search relevance remains ahead of visual availability.
- Public search diagnostics do not exist.
- Each new taxonomy table has exactly one authenticated SELECT policy.

## Automated audit

Run:

```bash
pnpm audit:opportunity-search
```

The script checks the live public RPC using the configured Supabase publishable key and fails when:

- expected ceramics records disappear,
- a non-ceramics record enters pottery results,
- exact residency or competition behavior regresses,
- typo explanation stops working,
- phrase overlap reintroduces unrelated sculpture results,
- a country search returns a region-restricted false fallback, or
- a protected record becomes visible.

## Boundaries

- Search expansion improves discovery; it does not prove applicant eligibility.
- KLEIO still evaluates eligibility separately using source-backed rules and Creative Passport data.
- No application is submitted without explicit artist review and approval.
- Taxonomy aliases must remain grounded in genuine artistic-practice relationships.
- Existing project-wide database-advisor warnings outside this search scope remain separate remediation work.
