# KLEIO Gemini Document Intelligence

## Root cause

The previous PDF path extracted embedded text with `unpdf`, then depended on exact headings and small keyword dictionaries. A visually structured or partial-text CV could therefore finish with one weak keyword and still be labeled ready for review. The upload surface showed only a proposal count while the actual evidence was hidden in a separate inbox.

## Architecture

- Private PDF validation and owner-scoped storage remain unchanged.
- The original PDF bytes are sent server-side to Gemini for native visual document understanding.
- Gemini 3.6 Flash is the normal model; Gemini 2.5 Pro is an optional escalation for complex documents with limited first-pass coverage.
- Gemini returns versioned structured JSON.
- KLEIO independently validates page numbers, evidence excerpts, field names, confidence ceilings, sensitivity, and source support.
- Deterministic PDF text remains a verification and fallback layer.
- Thin multi-page results become `limited_analysis`, not successful analysis.
- Sensitive eligibility documents use minimum processing and are excluded from general drafting.

## Artist experience

The upload screen now displays a persistent analysis report with document type, pages perceived, text and layout quality, section and claim counts, grouped findings, conflicts, duplicates, unresolved items, limitations, and representative page-supported evidence. Nothing is added to the Creative Passport without artist confirmation.

## Drafting

Document-derived drafting now uses Gemini rather than Cloudflare-hosted Gemma/Llama. Draft input is restricted to active, artist-confirmed, non-sensitive Passport records and artist-approved correlations. Every option carries evidence references. Unsupported years, URLs, email addresses, currency amounts, and named factual claims are rejected when absent from the approved evidence corpus.

## Privacy and operations

- `GEMINI_API_KEY` remains a Supabase Edge Function secret.
- No private PDF content, filenames, private URLs, excerpts, or model output are written to product analytics.
- Usage events store only provider/model, token counts, latency, stable error codes, source UUID, page count, version, quality, and aggregate counts.
- Requests are cached by checksum, document version, prompt, schema, model, and classification.
- A daily owner-scoped analysis limit prevents accidental cost spikes.
- Provider failure preserves the private PDF and returns an honest retry state.

## Verification boundary

Automated source audits and service tests cover the security contract, quality-state rules, original-PDF provider path, evidence validation, immediate result display, approved-only drafting, and 17 acceptance conditions. A final authenticated reanalysis of the existing private seven-page CV remains the decisive manual acceptance test because the agent does not possess the artist's browser session.
