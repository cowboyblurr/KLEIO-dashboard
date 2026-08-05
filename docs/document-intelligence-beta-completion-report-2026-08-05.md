# KLEIO Document Intelligence Beta — Completion Report

Date: 2026-08-05  
Release branch: `agent/beta-document-intelligence`  
Draft pull request: `#96`  
Connected Supabase project: `trekynurdgxgtaaqqtyq`

## Final verdict

**Not ready for open artist beta.**

The implementation is ready for controlled internal QA with a real authenticated artist account. The production feature gate, additive schema, owner-isolated correlation records, protected correlation RPC, server PDF validator and confirmed-facts drafting function are deployed. The code path passes the principal TypeScript, ESLint, static-export, authentication-isolation, GitHub Pages and document-intelligence checks observed during this implementation.

KLEIO should not yet invite artists into this workflow because an authenticated synthetic PDF has not been exercised end to end through:

```text
browser selection
→ private storage
→ canonical source record
→ server validation
→ native text extraction
→ proposal review
→ private Passport confirmation
→ confirmed-facts draft
```

The inherited product-analytics privacy workflow also requires reconciliation with approved bounded metadata keys before the complete repository suite can be called green.

## Verified starting state

### Existing upload architecture

KLEIO already had a canonical, owner-scoped import architecture:

- private `artist-documents` storage;
- `artist_import_sources` for source identity, checksum, version and privacy;
- `artist_extraction_jobs` for processing state and extracted material;
- `artist_import_proposals` for reviewable source-backed suggestions;
- `artist_passport_records` for artist-confirmed Passport records;
- `artist_document_versions` for versioned source provenance;
- `artist_media_usages` and application attachment records for downstream-use provenance;
- Passport Updates for Review;
- private AI drafts and AI usage records.

### Existing analysis capability

The existing `extract-artist-materials` Edge Function already supported native PDF extraction through `unpdf`, page-aware evidence, deterministic document parsing, duplicate/conflict comparison, versioning, owner checks and OCR-required detection.

### Existing limitations

- direct PDF upload was not the primary artist-beta flow;
- Google Drive copy still dominated several beta surfaces and audits;
- stored PDFs lacked a separate pre-extraction server validation boundary;
- facts, artist-authored language, correlations, hypotheses and conflicts were not visibly separated;
- cross-document comparison was incomplete;
- biography drafting was not constrained to artist-confirmed evidence;
- OCR and dedicated malware scanning were not configured;
- the synthetic document-evaluation suite was missing.

### Previous beta source state

The live source gate was Google Drive-first. This implementation changes the active beta state to:

- direct device PDF: enabled;
- PDF analysis: enabled;
- private KLEIO document reanalysis: enabled;
- Google Drive: deferred;
- Instagram: deferred;
- Website Import: deferred;
- Pinterest: deferred;
- pasted text and voice as primary sources: deferred.

## Product changes

### Upload experience

Added a premium document-first workspace with:

- **Upload CV or artist document**;
- drag and drop;
- device file picker;
- keyboard activation;
- mobile file selection;
- PDF-only guidance;
- 15 MB maximum;
- 100-page server limit;
- artist-selected document type;
- explicit analysis consent;
- store-without-analysis;
- exact progress stages;
- duplicate reuse;
- private signed preview;
- reanalysis;
- analysis deletion independent of source deletion;
- dependency-aware source deletion.

### Extraction improvements

Added a protected server validator before the existing extractor. It checks:

- authenticated artist role;
- source ownership;
- private owner-prefixed storage path;
- expected PDF MIME;
- `%PDF-` header;
- SHA-256 checksum;
- 15 MB size limit;
- 100-page limit;
- parseability;
- encrypted/corrupt PDF states;
- native, partial or unavailable text layer;
- active-content markers including embedded JavaScript, launch actions and embedded files.

Native-text extraction continues through the proven canonical extractor.

### OCR behavior

Image-only PDFs are preserved privately and marked `ocr_required` / `not_configured`. KLEIO does not fabricate extracted content. No OCR provider is configured or claimed.

### Correlation system

Added owner-scoped `artist_document_correlations` and a protected RPC for:

- Layer 3 repeated evidence;
- repeated artist-authored language;
- copied-language inheritance risk;
- Layer 4 cautious practice-language hypotheses;
- Layer 5 conflicts and insufficient evidence.

At least two private sources are required for correlations. Matching fingerprints are treated as possible copied language, not independent proof.

### Interpretation layers

The review interface now separates:

1. verified extracted fact;
2. artist-authored description;
3. cross-source correlation;
4. interpretive hypothesis;
5. conflict, unknown or insufficient evidence.

Interpretations remain private review objects and cannot become factual Passport records automatically.

### Creative Passport mapping and review

Passport Updates for Review now supports:

- evidence/page review;
- meaningful confidence states rather than percentages;
- edit before confirmation;
- private confirmation;
- reject;
- defer;
- merge duplicate evidence;
- replace an existing record;
- keep both privately;
- individual handling of sensitive or interpretive records;
- bulk confirmation only for high-confidence, non-sensitive Layer 1 facts.

### Biography and practice drafting

Added confirmed-facts-only drafting for:

- short biography;
- standard biography;
- extended biography;
- practice description;
- first-person practice introduction.

The server function:

- accepts only active, confirmed, non-sensitive Passport records as facts;
- allows artist-confirmed correlations only as non-factual language support;
- uses strict JSON-schema output;
- requires evidence references;
- rejects malformed output;
- prohibits invented prestige, recognition, intent, exhibitions, awards, grants, education, residencies, publications, locations and collaborators;
- disables provider storage where supported;
- stores provider/model/prompt/version/usage privately;
- requires artist edit and approval before Passport save.

### Feature-gating changes

Frontend defaults and the production database gate now agree on direct PDF as the active beta source. Connected provider foundations remain preserved but unmounted, noninteractive and marked deferred.

## Technical changes

### New or materially changed files

- `components/kleio/artist-document-intelligence.tsx`
- `components/kleio/document-draft-studio.tsx`
- `components/kleio/artist-import-studio-page.tsx`
- `components/kleio/import-source-hub.tsx`
- `components/kleio/creative-passport-media-panel.tsx`
- `components/kleio/passport-updates-inbox.tsx`
- `components/kleio/artist-media-library.tsx`
- `components/kleio/media-import/quick-media-import.tsx`
- `lib/kleio-document-intelligence.ts`
- `lib/kleio-document-drafting.ts`
- `lib/kleio-import-source-availability.ts`
- `lib/kleio-product-event-dictionary.ts`
- `supabase/functions/validate-artist-document/index.ts`
- `supabase/functions/generate-artist-document-draft/index.ts`
- document-intelligence migrations and evaluation/audit files.

### Database structures reused

- `artist_import_sources`
- `artist_extraction_jobs`
- `artist_import_proposals`
- `artist_passport_records`
- `artist_document_versions`
- `artist_media_usages`
- `application_requirement_attachments`
- `artist_ai_drafts`
- `artist_ai_usage_events`
- `product_events`

### New database structure

- `artist_document_correlations`

### New source fields

- artist-selected document type;
- analysis stage;
- text-layer status;
- OCR status;
- page count;
- analysis consent/deletion timestamps;
- keep-without-analysis state.

### New job/proposal fields

- page text and structural analysis containers;
- analysis version and warnings;
- analysis layer;
- confidence state;
- supporting evidence/source count;
- bulk-confirm eligibility;
- interpretation kind.

### Edge Functions deployed

- `validate-artist-document` — active, JWT verification enabled;
- `generate-artist-document-draft` — active, JWT verification enabled.

### AI provider

The drafting function follows KLEIO's existing Cloudflare provider pattern and uses server-side credentials only. Drafting availability depends on approved Cloudflare credentials in the connected Edge Function environment.

### Security controls

- browser PDF validation for immediate feedback;
- independent server validation;
- private storage;
- owner-prefix and owner-record checks;
- checksum duplicate behavior;
- short-lived signed previews;
- role enforcement;
- RLS on correlations;
- anon execution revoked from correlation RPC;
- sensitive records excluded from drafting;
- no document text or filenames in analytics;
- no automatic publication or application attachment.

### Analytics events

Document-specific event names were added to the repository event dictionary and the connected production `product_events` constraint, including upload, analysis, OCR, classification, proposal, conflict, interpretation and biography-draft events.

The connected database does not yet contain the newer private product-event definition registry present in repository migrations, so production was updated against the schema that actually exists rather than claiming the newer registry was live.

## Evaluation

### Synthetic cases

A 14-case synthetic dataset covers:

- emerging one-page CV;
- mid-career long CV;
- multidisciplinary artist;
- performance artist;
- filmmaker;
- photographer with copied biography language;
- ceramic artist;
- digital artist;
- socially engaged artist;
- bilingual documents;
- inconsistent CV versions;
- scanned PDF;
- sparse documentation;
- dense academic/publication history.

Each case defines expected classifications, supported facts, forbidden unsupported claims, conflicts, correlations, Passport mappings and allowed draft inputs.

### Accuracy findings

Completed:

- structural source-gating audit;
- file-validation contract audit;
- five-layer review audit;
- evidence-reference drafting audit;
- unsupported-claim expectations for all synthetic cases.

Not completed:

- generated binary PDF fixtures for all cases;
- measured factual precision and recall;
- measured page-reference accuracy;
- calibrated unsupported-claim rate;
- measured artist review burden;
- biography quality scoring by artists.

### Known weak document types

- image-only PDFs, because OCR is not configured;
- heavily designed or table-complex PDFs until binary evaluation is run;
- bilingual and mixed-layout documents requiring more extraction benchmarking;
- sensitive reference and eligibility documents, which intentionally remain restricted and excluded from drafting.

## Validation

### Completed

- TypeScript passed after correcting the uniform document-type sensitivity contract;
- ESLint passed on the principal verification run;
- static export passed;
- GitHub Pages build/publishing validation passed;
- authentication and role-isolation audit passed;
- document-intelligence validation passed;
- source feature gate read back from production;
- new database fields read back from production;
- correlation table and protected RPC verified;
- anon correlation-RPC access revoked;
- authenticated correlation-RPC access granted;
- owner-only correlation RLS verified with two artist identities;
- synthetic database test records rolled back and zero remaining verified;
- both Edge Functions deployed with JWT verification.

### Reconciled inherited tests

The prior Instagram, Website Import and artist-import audits encoded the previous Google Drive-first product decision. They were updated to preserve all fail-closed OAuth, SSRF, RLS, secret-handling and future-foundation requirements while asserting the new approved direct-PDF beta gate.

### Still unresolved

- the inherited product-analytics privacy audit flags bounded metadata keys in older media/Drive/public-carousel code that predate this feature;
- latest full-suite rerun after all source-audit reconciliations must be observed;
- authenticated end-to-end PDF upload has not been run through the rendered application;
- no automated binary PDF extraction benchmark has been executed;
- no physical-browser or assistive-technology testing has been completed.

## Honest remaining limitations

### Completed

- document-first product architecture;
- direct PDF UI and canonical client flow;
- server validation function;
- native extraction integration;
- honest OCR fallback;
- five-layer review;
- owner-scoped correlations;
- confirmed-facts drafting architecture;
- shared source gating;
- synthetic evaluation specification;
- production source gate and core backend deployment.

### Automated but not physically tested

- responsive layouts;
- keyboard-accessible controls;
- progress/error live regions;
- static build;
- source audits;
- RLS tests.

### Configured but awaiting proof or credentials

- generative biography/practice drafting requires verified provider credentials and a live request;
- the server validator is deployed but needs a real authenticated source smoke test.

### Deferred

- OCR provider;
- dedicated antivirus/malware provider;
- Google Drive;
- Instagram;
- Website Import;
- Pinterest;
- DOCX;
- deeper chronology, institutional-network and practice-evolution models;
- arbitrary public release benchmark.

### Unsupported during this beta

- image-only PDF content extraction without OCR;
- automatic publication;
- automatic institution access;
- automatic application attachment;
- automatic conversion of interpretations into facts.

## Required next release gate

Before changing the verdict, complete one controlled synthetic workflow with an authenticated artist account:

1. upload a native-text synthetic CV PDF;
2. verify private storage and source ownership;
3. verify server signature, checksum and page count;
4. verify page-backed proposals;
5. edit and confirm one record privately;
6. verify duplicate/conflict behavior with a second synthetic version;
7. verify the private correlation RPC;
8. request and review a confirmed-facts draft if provider credentials are configured;
9. run desktop Chrome and mobile responsive walkthroughs;
10. close or explicitly waive the inherited analytics privacy audit findings.

Only after those checks should the verdict move to **Ready with documented restrictions**.
