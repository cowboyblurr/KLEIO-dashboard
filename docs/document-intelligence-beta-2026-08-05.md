# KLEIO Artist-Beta Document Intelligence

Date: 2026-08-05  
Branch: `agent/beta-document-intelligence`  
Supabase project: `trekynurdgxgtaaqqtyq`

## Product decision

The initial artist beta uses direct, artist-controlled PDF upload as the primary document import method.

Active beta sources:

- direct PDF upload from the artist’s device;
- reanalysis of an owner-scoped private KLEIO document where safe.

Deferred sources:

- Google Drive;
- Instagram;
- Website Import unless separately authorized;
- Pinterest;
- pasted text and voice as primary import methods.

The deferred foundations remain in the repository. They are not deleted, presented as required, or allowed to compete with direct PDF upload.

## Verified starting architecture

KLEIO already had a strong canonical import and provenance foundation:

- `artist_import_sources` stores owner-scoped source identity, checksum, classification, version and privacy state;
- `artist_extraction_jobs` stores extraction execution, source version, extracted text and review status;
- `artist_import_proposals` stores reviewable source-backed suggestions;
- `artist_passport_records` stores artist-confirmed private Passport records;
- `artist_document_versions` preserves exact source versions used by Passport records and application packages;
- `artist_media_usages` preserves source usage relationships;
- `application_requirement_attachments` preserves application-specific source versions;
- the private `artist-documents` storage bucket accepts PDFs and has a 15 MB limit;
- storage and database RLS already enforce owner scope;
- `extract-artist-materials` already performs native PDF text extraction through `unpdf`, preserves page references in proposals, compares with existing Passport records, and detects image-only PDFs;
- Passport Updates for Review already supported individual confirmation, rejection, deferral, duplicate handling and conflicts;
- `artist_ai_drafts` and `artist_ai_usage_events` already provided a private AI-draft and provider-audit foundation.

The largest gaps were product activation, server validation depth, shared source gating, visible analysis-layer distinctions, cross-document comparison, confirmed-facts-only drafting, and evaluation coverage.

## Canonical beta data flow

```text
Artist chooses a PDF
→ browser MIME, size and PDF-header validation
→ owner-scoped checksum comparison
→ private artist-documents storage
→ canonical artist_import_sources record
→ JWT-protected server file validation
→ native PDF text extraction
→ page-backed artist_import_proposals
→ comparison with confirmed Passport records
→ artist review and correction
→ private artist_passport_records
→ optional cross-document correlations and hypotheses
→ optional confirmed-facts-only biography or practice draft
→ artist edit and approval
→ private Creative Passport field
```

No second document store, parallel Passport database, CV-only model or disconnected review inbox was introduced.

## Upload experience

The active action is **Upload CV or artist document**.

Supported beta file:

- PDF;
- 15 MB maximum;
- 100 pages maximum in the server validator.

The interface supports:

- drag and drop;
- file picker;
- keyboard activation;
- mobile file selection;
- document-type selection;
- analysis consent;
- store-without-analysis;
- precise progress announcements;
- duplicate reuse;
- private signed previews;
- reanalysis;
- removing analysis without deleting the source;
- deleting a source only when confirmed Passport and application dependencies allow it.

Progress language describes actual stages:

- Checking the selected file;
- Confirming the beta upload path;
- Checking for an existing private copy;
- Uploading your document;
- Creating the private source record;
- Checking the file on KLEIO’s server;
- Reading the document structure and identifying career and practice information;
- Preparing updates for your review.

## Server validation

`validate-artist-document` is a JWT-protected Edge Function.

It verifies:

- authenticated KLEIO artist role;
- source ownership;
- private owner-prefixed storage path;
- PDF MIME expectation;
- nonempty source;
- 15 MB limit;
- `%PDF-` file signature;
- SHA-256 checksum agreement;
- parseability;
- password-protected or unsupported PDF errors;
- 100-page limit;
- native-text availability;
- partial-text state;
- image-only state;
- active-content risk markers for JavaScript, launch actions and embedded files.

It does not return or log document text.

### Malware limitation

KLEIO performs structural and active-content risk screening. A dedicated antivirus or malware-scanning provider is not configured. The source record explicitly stores `malware_scanner_configured: false` rather than implying a scan occurred.

## Native PDF extraction and OCR

Native-text PDFs continue through the existing `extract-artist-materials` function.

The existing extractor provides:

- page-aware text extraction;
- document classification support;
- deterministic CV-section handling;
- narrative document suggestions;
- budget and sensitive-document distinctions;
- source-backed evidence excerpts;
- page references;
- duplicate and conflict comparison;
- version preservation;
- owner and role checks.

Image-only PDFs are marked:

- `text_layer_status = unavailable`;
- `ocr_status = not_configured`;
- `ocr_required = true`.

The original remains private. KLEIO does not create extracted text or Passport proposals from an unreadable scan.

### OCR limitation

No OCR provider is configured or claimed. Native-text document analysis remains functional. OCR-required files can be stored, classified manually, previewed privately and reanalyzed after a future approved OCR integration.

## Document classifications

The artist-facing taxonomy includes:

- Artist CV;
- Biography;
- Artist statement;
- Practice description;
- Portfolio document;
- Exhibition history;
- Project proposal;
- Grant application;
- Budget;
- Press or publication;
- Work-sample list;
- Residency material;
- Reference document;
- General artist material;
- Sensitive eligibility document;
- Mixed document;
- Unknown.

Artist selection maps into the existing canonical extraction classifications. The artist may correct the classification and reanalyze the same private source without creating a duplicate file.

## Five-layer review model

### Layer 1 — Verified extracted fact

Direct source-backed records such as education, exhibitions, residencies, awards, dates, media and publications.

Display includes:

- source relationship;
- page when available;
- evidence excerpt;
- extraction method;
- meaningful confidence state.

### Layer 2 — Artist-authored description

Biography, statement, practice and project language remains visibly artist-authored and context-specific. Poetic or project-specific wording does not silently become permanent factual biography.

### Layer 3 — Cross-source correlation

Deterministic comparison requires at least two private sources. It detects repeated evidence and repeated artist-authored language.

Identical fingerprints are marked `inheritance_risk = true`; copied wording is not counted as multiple independent confirmations.

### Layer 4 — Interpretive hypothesis

Repeated practice-related evidence can create a cautious statement such as:

> Across these documents, KLEIO noticed this appears repeatedly and may be relevant to how you describe your practice.

It is explicitly labeled an interpretive hypothesis, shows supporting evidence, and requires confirmation, revision, deferral or dismissal.

It does not state artist intention and cannot enter the factual Passport automatically.

### Layer 5 — Unknown, conflict or insufficient evidence

Conflicting dates, unresolved duplicates, incomplete evidence and ambiguous relationships remain review items. KLEIO does not force a value into the Passport.

## Confidence and provenance

New structured proposal fields include:

- `analysis_layer`;
- `confidence_state`;
- `supporting_evidence`;
- `supporting_source_count`;
- `bulk_confirm_eligible`;
- `interpretation_kind`.

Confidence states are:

- High confidence;
- Moderate confidence;
- Low confidence;
- Artist confirmation required;
- Conflicting evidence;
- Insufficient evidence.

No uncalibrated user-facing confidence percentage is introduced.

Bulk confirmation is limited to:

- Layer 1;
- high confidence;
- factual;
- standard sensitivity;
- non-conflicting;
- new records.

Artist-authored descriptions, hypotheses, conflicts and sensitive information require individual review.

## Cross-document comparison

`artist_document_correlations` stores owner-scoped review records for:

- repeated evidence;
- repeated artist language;
- practice patterns;
- practice evolution;
- geographic connections;
- institutional relationships;
- collaboration patterns;
- possible career highlights;
- duplicates;
- conflicts;
- missing context;
- interpretive hypotheses.

The initial deterministic implementation covers:

- repeated source-backed values across two or more sources;
- copied-language inheritance risk;
- recurring practice-language hypotheses;
- unresolved proposal conflicts.

Deeper chronology, institutional-network and practice-evolution analysis remains a later quality expansion after the beta evaluation set is exercised with representative documents.

## Biography and practice drafting

`generate-artist-document-draft` is a JWT-protected server function using the existing Cloudflare provider pattern.

Available formats:

- short biography, approximately 50–75 words;
- standard biography, approximately 120–160 words;
- extended biography, approximately 220–300 words;
- concise practice description;
- first-person practice introduction.

Drafting rules:

- only active, confirmed, non-sensitive `artist_passport_records` are factual inputs;
- only artist-confirmed useful correlations may shape non-factual language;
- provider storage is disabled where supported through `store: false`;
- output uses strict JSON schema;
- every option must reference supplied evidence records;
- malformed output is rejected;
- prestige, recognition, intention, exhibitions, awards, education, locations and other unsupported claims are prohibited;
- the provider, model, prompt version, request ID and usage are stored privately;
- the artist receives two options;
- the artist may edit, save privately, reject, or approve;
- approved biography and practice text saves only after explicit artist action.

Every draft is labeled **Prepared by KLEIO Assist for review**.

### Provider limitation

Drafting is available only when approved Cloudflare AI credentials are configured in the Edge Function environment. Direct upload, deterministic PDF extraction, review, conflict handling and correlations do not depend on generative drafting credentials.

## Privacy and consent

The workflow states before analysis that:

- the document remains private;
- analysis prepares editable Passport suggestions;
- nothing publishes automatically;
- nothing is attached to an application automatically;
- every suggestion may be rejected;
- interpretations are not verified facts;
- sensitive classifications use restricted handling.

Artists can:

- store without analysis;
- remove unconfirmed analysis while retaining the source;
- reanalyze;
- privately preview through a ten-minute signed URL;
- delete the source when no confirmed Passport or application dependency blocks deletion.

Institutions receive no access to source uploads, extraction jobs, rejected proposals, correlations, interpretations or private drafts through this architecture.

## Analytics

The privacy-safe event vocabulary includes:

- `document_upload_started`;
- `document_upload_completed`;
- `document_upload_failed`;
- `document_analysis_started`;
- `document_analysis_completed`;
- `document_analysis_partial`;
- `document_analysis_failed`;
- `document_ocr_required`;
- `document_classification_corrected`;
- `passport_proposal_confirmed`;
- `passport_proposal_edited`;
- `passport_proposal_rejected`;
- `passport_conflict_resolved`;
- `interpretation_confirmed`;
- `interpretation_dismissed`;
- `biography_draft_requested`;
- `biography_draft_saved`.

The analytics sanitizer continues to reject document text, filenames, evidence excerpts, biography content, artist identity, URLs, tokens and raw errors.

## Synthetic evaluation dataset

`tests/fixtures/document-intelligence/synthetic-artist-cases.json` contains 14 synthetic cases:

- emerging one-page CV;
- mid-career long CV;
- multidisciplinary artist;
- performance artist;
- filmmaker;
- photographer with copied biography text;
- ceramic artist;
- digital artist;
- socially engaged artist;
- bilingual documents;
- inconsistent CV versions;
- scanned document;
- sparse documentation;
- dense academic and publication history.

Each case defines:

- expected classifications;
- expected facts;
- unsupported claims that must not appear;
- expected conflicts;
- expected correlations;
- Passport mappings;
- permitted draft inputs.

The dataset is synthetic and includes no real artist documents.

## Evaluation status

Completed structural evaluation:

- source-gating audit;
- validation-control audit;
- five-layer review audit;
- provider and evidence contract audit;
- privacy-safe analytics audit;
- synthetic-case completeness audit.

Not yet completed:

- measured factual precision and recall against generated PDF binaries;
- calibrated evidence-page accuracy across diverse real-world layouts;
- OCR accuracy because OCR is not configured;
- biography quality scoring by beta artists;
- physical assistive-technology review.

The release optimizes for precision and transparent abstention before extraction volume.

## Security model

- private storage only;
- owner-prefixed storage paths;
- browser and server PDF validation;
- server-side role and ownership checks;
- checksum-based duplicate detection;
- RLS on canonical sources, jobs, proposals, Passport records, document versions, drafts and correlations;
- no browser AI secret;
- no public source URL;
- short-lived signed previews;
- no document content in product analytics;
- sensitive sources excluded from drafting;
- confirmed facts required for drafting;
- dependent application versions preserved.

## Accessibility

Implemented in code:

- keyboard-accessible file picker;
- drag-and-drop alternative;
- visible focus styles;
- screen-reader labels;
- `aria-live` progress, completion and error messages;
- controls that do not depend on hover;
- mobile-responsive layouts;
- long filename wrapping;
- semantic buttons, labels, sections and details;
- non-color status icons and text;
- no required motion.

Still requiring physical verification:

- VoiceOver;
- NVDA;
- Safari keyboard behavior;
- Firefox;
- iPhone Safari;
- Android Chrome;
- 200% zoom;
- complete dialog focus trapping, where future dialogs are introduced.

## Rollback

The implementation is additive.

Rollback controls:

1. Set `device_document` and `pdf` to `artist_beta_enabled = false` in `kleio_import_source_availability`.
2. Restore the prior UI source availability defaults.
3. Leave existing private source files and confirmed Passport records intact.
4. Disable the two new Edge Functions if needed.
5. Retain the new columns and tables until dependent records are safely reviewed; schema removal is not required for product rollback.
6. Existing Google Drive and Instagram foundations remain preserved and disabled rather than deleted.

## Release-decision framework for deferred sources

Connected sources should be reconsidered only after product approval based on evidence such as:

- stable direct-document analysis completion;
- acceptable factual precision and unsupported-claim rate;
- evidence-page accuracy;
- artist review completion;
- activated-artist retention;
- operational support readiness;
- validated artist demand for a specific connected source.

No arbitrary public activation threshold is hard-coded.

## Honest beta verdict criteria

The code can be considered **Ready with documented restrictions** only after:

- the migrations are applied and verified;
- both Edge Functions deploy successfully;
- authenticated owner-isolation tests pass;
- native-text PDF upload and extraction are exercised in the connected environment;
- TypeScript, ESLint, static build and relevant GitHub Actions pass.

It must remain **Not ready** if direct upload, private analysis, artist review or Passport save cannot be demonstrated in the connected environment.
