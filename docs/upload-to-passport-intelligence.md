# KLEIO Upload-to-Passport Intelligence

## Product contract

KLEIO treats an artist-controlled upload as a private source of potential Creative Passport information, not as a decorative file card.

The implemented flow is:

```text
Original private source
  → classification
  → extraction job
  → structured claims with evidence
  → duplicate and conflict review
  → artist decision
  → confirmed private Passport record
  → opportunity requirement assessment
  → application package inclusion
  → final artist approval
```

No extraction silently overwrites confirmed information. No source becomes public or enters an application package merely because it was uploaded.

## Canonical source layer

`artist_import_sources` remains the canonical private source record for device, Google Drive, and KLEIO Library media.

The source record now preserves:

- owner
- storage path
- original filename
- MIME type and byte size
- SHA-256 checksum
- provider/source information
- document classification and confidence
- extraction state and extractor version
- sensitivity and privacy state
- document version and current-version state
- review summary and failure category
- usage associations

The original source is stored once and reused through explicit associations.

## Extraction layer

`artist_extraction_jobs` provides an idempotent job boundary keyed by canonical source and extractor version.

The authenticated `extract-artist-materials` Edge Function:

- requires a valid artist JWT
- reads the canonical private source
- validates PDF signatures
- uses direct PDF text extraction when an accessible text layer exists
- classifies the source deterministically from destination context, artist input, filename, MIME type, and document headings
- creates normalized review claims instead of directly writing the Passport
- caches extraction by source and extractor version
- records honest partial/failure states

### Current deterministic extraction coverage

#### Artwork

The existing visual Import Studio continues to extract technical image facts and prepare artist-reviewable artwork records. It does not confirm year, physical dimensions, medium, meaning, ownership, authenticity, or copyright.

#### Artist CV

The extractor recognizes section headings and prepares structured candidates for:

- education
- solo, group, and general exhibitions
- residencies
- awards
- grants
- fellowships
- publications
- press
- collections
- commissions
- professional experience
- teaching
- talks
- panels
- bibliography
- memberships

Each claim retains the source, page, evidence excerpt, method, confidence, and relationship to existing Passport data.

#### Biography and statement

The extractor preserves source text, recognizes common headings, and creates grounded candidates for biography, statement, practice description, disciplines, and media. Discipline and medium suggestions use explicit term occurrences in the artist's source rather than unsupported semantic inference.

#### Proposal

The extractor recognizes summary, description, objectives, timeline, collaborators, materials, technical requirements, accessibility, and audience headings. Proposal-specific claims remain in project-material sections and do not automatically become permanent general artist facts.

#### Budget

The extractor identifies line-item amounts, currency signals, stated totals, calculated totals, and arithmetic inconsistencies. It flags discrepancies rather than silently changing the artist's budget.

#### Sensitive eligibility documents

Proof-of-residency and identification documents use minimal extraction. KLEIO may prepare a document category, broad state or region, issue date, expiration date, and review status. It does not retain full extracted text in the generic job record for sensitive sources.

#### Reference letters

KLEIO extracts only limited metadata such as possible referee, organization, date, and document purpose. Subjective praise is not converted into verified Passport facts.

### OCR limit

No OCR service is enabled in this implementation. Image-only PDFs are preserved securely and marked `ocr_required`. The interface explains that the source is safe but needs OCR or manual review. KLEIO does not simulate successful extraction.

## Review and Passport layer

`artist_import_proposals` now functions as the structured claim layer. `artist_passport_records` stores artist-confirmed records with:

- normalized and display values
- source claim and source file
- page and evidence excerpt
- provenance state
- private/application/public visibility
- version and superseded relationship
- sensitivity state
- confirmation and review timestamps

The `Passport Updates for Review` inbox supports:

- source classification correction
- evidence review
- editing before confirmation
- private confirmation
- rejection
- deferral
- duplicate merge
- conflict replacement
- grouped high-confidence confirmation that excludes sensitive, duplicate, and conflicting claims

Confirmed records default to private.

## Document versioning

`artist_document_versions` links CVs, statements, biographies, proposals, budgets, work-sample lists, residency documents, identification, references, and application materials into explicit version families.

A newly extracted version can become current without deleting confirmed historical records derived from older versions. Application packages preserve the specific selected source version.

## Requirement assessment and application evidence

`artist_requirement_assessments` stores deterministic comparisons between a structured opportunity requirement and current artist evidence.

`application_requirement_attachments` links:

- artist
- opportunity
- exact requirement
- application/package
- canonical source
- source version
- validation checks
- inclusion state
- artist confirmation

The current deterministic file checks include:

- accepted MIME type
- maximum file size
- filename pattern when safely evaluable
- artist confirmation
- requirement-source verification state

Application preparation displays named requirement slots rather than a generic attachment bucket.

Saved application packages now preserve source IDs, document versions, checksums, classifications, validation results, package inclusion, and artist confirmation.

For external opportunities, KLEIO states that checks are based on the instructions currently stored in KLEIO and that the external portal remains the final authority.

## Security and privacy

- Private `artist-assets` storage
- Expiring signed previews
- JWT-protected extraction Edge Function
- Artist-role verification
- Owner-scoped RLS for jobs, claims, Passport records, versions, assessments, and requirement attachments
- No access-token logging
- No full filenames, document text, artwork, statements, addresses, or sensitive values in product analytics
- Full extracted text omitted from generic job records for sensitive classifications
- Sensitive sources default to restricted privacy
- Institutions cannot browse the private source library or extracted claims

## Analytics

The review workflow records only allowlisted structured events, counts, edit flags, and duplicate/conflict relationships. Source text and identity data are excluded.

## Current release limits

- Google OAuth, Google Picker, Drive API, browser-key restrictions, and authorized origins still need deployment configuration and authenticated end-to-end testing.
- OCR is not enabled.
- No external AI extraction provider is enabled.
- Instagram remains an inactive post-beta adapter.
- KLEIO does not automatically submit to external portals.
- External portals may introduce hidden or changed requirements.
- Physical Safari, Firefox, iPhone/iOS, Android, keyboard-only, VoiceOver/NVDA, 200% zoom, reduced-motion, mobile-keyboard, interrupted OAuth, offline, and expired-session testing remains required.

## Beta verdict

**Ready for a limited extraction beta after final repository checks, with documented configuration and physical-testing gates.**

The system supports canonical private sources, deterministic text extraction for supported documents, structured claims, artist-controlled confirmation, provenance, versioning, requirement-specific evidence, and package inclusion. It does not claim OCR, semantic AI interpretation, external submission automation, or unverified portal acceptance.
