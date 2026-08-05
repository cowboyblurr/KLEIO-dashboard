export type KleioProductArea =
  | "acquisition"
  | "authentication"
  | "onboarding"
  | "creative_passport"
  | "media_library"
  | "opportunities"
  | "applications"
  | "reliability"
  | "institution"
  | "legacy"

export type KleioEventOrigin = "client" | "server" | "derived"

const PROHIBITED_METADATA = [
  "artist names, email addresses, phone numbers or physical addresses",
  "artwork titles, captions, biographies, statements, CV contents or application answers",
  "uploaded filenames, file contents, document text, website text or social captions",
  "private URLs, signed URLs, authentication tokens, OAuth tokens or raw API responses",
  "raw error messages, stack traces or unrestricted search text",
] as const

const COMMON_METADATA = [
  "source",
  "status",
  "reason",
  "step",
  "mode",
  "viewport",
  "count",
  "result_count",
  "filter_count",
  "edited",
  "reduced_motion",
  "section",
  "error_code",
  "provider",
  "completion_state",
] as const

type DefinitionOptions = {
  publicAllowed?: boolean
  origin?: KleioEventOrigin
  deduplication?: "none" | "workflow" | "durable_milestone"
  metadata?: readonly string[]
  owner?: string
  version?: number
  status?: "active" | "legacy"
}

function define(
  productArea: KleioProductArea,
  definition: string,
  trigger: string,
  metric: string,
  decision: string,
  options: DefinitionOptions = {},
) {
  return {
    productArea,
    definition,
    trigger,
    metric,
    decision,
    expectedMetadata: options.metadata ?? COMMON_METADATA,
    prohibitedMetadata: PROHIBITED_METADATA,
    owner: options.owner ?? "KLEIO product",
    version: options.version ?? 1,
    origin: options.origin ?? "client",
    publicAllowed: options.publicAllowed ?? false,
    deduplication: options.deduplication ?? "none",
    status: options.status ?? "active",
  } as const
}

export const KLEIO_PRODUCT_EVENT_DICTIONARY = {
  landing_viewed: define("acquisition", "A visitor renders the public KLEIO landing experience.", "Once per anonymous browser session after the landing page becomes usable.", "Qualified public visitors", "Evaluate acquisition quality and landing-to-signup conversion.", { publicAllowed: true, deduplication: "workflow" }),
  artist_signup_selected: define("acquisition", "A visitor chooses the artist account path.", "The artist signup path is intentionally selected.", "Artist signup intent", "Assess whether artist positioning creates signup intent.", { publicAllowed: true }),
  creative_passport_selected: define("acquisition", "A visitor selects the public Creative Passport entry point.", "The public Creative Passport action is selected.", "Creative Passport interest", "Refine public explanation of the Passport.", { publicAllowed: true }),
  explore_opportunities_selected: define("acquisition", "A visitor selects public opportunity discovery.", "The public opportunities action is selected.", "Opportunity discovery intent", "Determine whether opportunities attract qualified artists.", { publicAllowed: true }),
  public_directory_viewed: define("acquisition", "The public opportunity directory becomes usable.", "Once per session when the public directory loads.", "Public directory visitors", "Measure acquisition through opportunity discovery.", { publicAllowed: true, deduplication: "workflow" }),
  opportunity_opened: define("opportunities", "An opportunity detail is intentionally opened.", "A verified opportunity card or detail link is activated.", "Opportunity detail viewers", "Improve opportunity relevance and presentation.", { publicAllowed: true, metadata: ["source", "viewport", "mode"] }),

  signup_started: define("authentication", "The artist signup form becomes an active workflow.", "The first meaningful signup interaction occurs.", "Signup starts", "Locate abandonment before submission.", { publicAllowed: true, deduplication: "workflow" }),
  signup_validation_failed: define("authentication", "Signup cannot continue because a safe validation rule failed.", "Client or server validation returns a stable non-sensitive code.", "Signup validation failure rate", "Repair confusing or overly strict signup requirements.", { publicAllowed: true, metadata: ["step", "reason", "error_code", "viewport"] }),
  signup_submitted: define("authentication", "A valid signup request is submitted.", "Immediately before the approved authentication request.", "Signup submissions", "Separate form completion from account creation failures.", { publicAllowed: true, deduplication: "workflow" }),
  account_created: define("authentication", "An artist account and KLEIO profile exist in durable application state.", "Derived after the profile row exists.", "Created artist accounts", "Measure signup completion from authoritative state.", { origin: "derived", deduplication: "durable_milestone" }),
  confirmation_required: define("authentication", "The account requires email confirmation before product access.", "Authentication returns a valid unconfirmed account state.", "Confirmation-required accounts", "Improve confirmation instructions and delivery reliability.", { publicAllowed: true, deduplication: "workflow" }),
  confirmation_completed: define("authentication", "An email-confirmed account successfully enters KLEIO.", "A confirmed user session resolves to a valid KLEIO profile.", "Confirmed artist accounts", "Measure confirmation completion and related loss.", { deduplication: "durable_milestone" }),
  login_completed: define("authentication", "A confirmed user session is established.", "Authentication and profile resolution both succeed.", "Successful logins", "Measure return usage and authentication health.", { deduplication: "workflow" }),
  login_failed: define("authentication", "Login fails with a stable sanitized reason.", "Authentication rejects the attempt without exposing provider details.", "Login failure rate", "Repair authentication confusion or outages.", { publicAllowed: true, metadata: ["reason", "error_code", "viewport"] }),
  session_expired: define("reliability", "An active workflow discovers that authentication has expired.", "A protected action receives the stable session-expired condition.", "Session interruptions", "Reduce work loss from expired sessions.", { metadata: ["surface", "step", "viewport"] }),
  session_recovered: define("reliability", "A user resumes work after an expired or interrupted session.", "Authentication is restored and the saved workflow is reopened.", "Session recovery rate", "Validate recovery design and autosave coverage.", { deduplication: "workflow" }),

  onboarding_started: define("onboarding", "A confirmed artist begins onboarding.", "The first onboarding step becomes usable.", "Onboarding starts", "Measure confirmation-to-onboarding continuation.", { deduplication: "workflow" }),
  onboarding_step_viewed: define("onboarding", "A specific onboarding step becomes active.", "Once per workflow-step combination.", "Step reach", "Locate the first step users never reach.", { metadata: ["step", "mode", "viewport"], deduplication: "workflow" }),
  onboarding_step_completed: define("onboarding", "An onboarding step passes validation and persists.", "The authoritative save completes.", "Step completion", "Identify step-level completion friction.", { metadata: ["step", "mode", "viewport"], deduplication: "workflow" }),
  onboarding_step_skipped: define("onboarding", "An optional onboarding step is deliberately skipped.", "The skip action persists without storing the answer.", "Step skips", "Distinguish intentional skipping from abandonment.", { metadata: ["step", "mode", "viewport"] }),
  onboarding_validation_failed: define("onboarding", "An onboarding step cannot continue because validation failed.", "A stable validation code is displayed.", "Step validation failures", "Simplify confusing onboarding requirements.", { metadata: ["step", "reason", "error_code", "viewport"] }),
  onboarding_save_failed: define("onboarding", "A valid onboarding step fails to persist.", "The save request returns a sanitized failure code.", "Onboarding save reliability", "Prioritize blocking persistence defects.", { metadata: ["step", "reason", "error_code", "viewport"] }),
  onboarding_saved_and_exited: define("onboarding", "An artist deliberately saves onboarding progress and exits.", "Save-and-exit succeeds.", "Planned onboarding exits", "Design appropriate return reminders without treating exits as failure.", { deduplication: "workflow" }),
  onboarding_resumed: define("onboarding", "An artist returns to an incomplete saved onboarding workflow.", "Saved onboarding state is restored.", "Onboarding resumptions", "Assess whether save-and-return works.", { deduplication: "workflow" }),
  onboarding_completed: define("onboarding", "The profile onboarding flag is durably complete.", "Derived when profiles.onboarding_completed becomes true.", "Onboarding completions", "Measure the complete signup-to-onboarding funnel.", { origin: "derived", deduplication: "durable_milestone" }),

  passport_started: define("creative_passport", "An artist begins a Creative Passport workflow.", "The Passport workspace becomes active for an incomplete Passport.", "Passport starts", "Measure onboarding-to-Passport continuation.", { deduplication: "workflow" }),
  passport_mode_selected: define("creative_passport", "An artist chooses a supported Passport entry mode.", "Guided, manual or approved import mode is selected.", "Passport mode adoption", "Decide which entry modes deserve refinement.", { metadata: ["mode", "viewport"] }),
  passport_section_started: define("creative_passport", "An artist begins a meaningful Passport section.", "The section is intentionally opened for editing or review.", "Passport section starts", "Find sections artists avoid.", { metadata: ["section", "mode", "viewport"], deduplication: "workflow" }),
  passport_section_completed: define("creative_passport", "A meaningful Passport section reaches a persisted completion rule.", "The required section state is saved successfully.", "Passport section completion", "Improve low-completion sections.", { metadata: ["section", "mode", "edited", "viewport"], deduplication: "workflow" }),
  passport_save_failed: define("creative_passport", "A valid Passport change fails to persist.", "The save returns a stable sanitized error code.", "Passport save reliability", "Prioritize work-loss risks.", { metadata: ["section", "reason", "error_code", "viewport"] }),
  proposal_review_opened: define("creative_passport", "An artist opens a source-backed proposal review.", "A proposal review surface becomes active.", "Proposal review starts", "Assess whether assistive proposals are understandable.", { metadata: ["source", "section", "count"] }),
  proposal_approved: define("creative_passport", "An artist approves a source-backed proposal.", "The proposal status persists as approved or edited-approved.", "Proposal approval rate", "Improve evidence quality without replacing artist judgment.", { metadata: ["source", "section", "edited"] }),
  proposal_rejected: define("creative_passport", "An artist rejects a source-backed proposal.", "The proposal status persists as rejected.", "Proposal rejection rate", "Find weak extraction or classification behavior.", { metadata: ["source", "section", "reason"] }),
  passport_record_confirmed: define("creative_passport", "A meaningful Passport record is confirmed in durable state.", "A confirmed active artist_passport_records row exists.", "Confirmed Passport records", "Measure first value and Passport usefulness.", { origin: "server", deduplication: "workflow" }),
  document_upload_started: define("creative_passport", "An artist begins a private document upload.", "A validated PDF is deliberately selected for the document-intelligence workflow.", "Document upload starts", "Measure direct document-beta adoption without storing filenames or contents.", { metadata: ["source", "mode", "viewport"], deduplication: "workflow" }),
  document_upload_completed: define("creative_passport", "A PDF is stored as an owner-scoped private source without automatic publication.", "The storage object and canonical source record both persist.", "Private document upload completion", "Measure core direct-upload reliability.", { metadata: ["source", "status", "viewport"] }),
  document_upload_failed: define("creative_passport", "A document upload fails with a stable non-sensitive code.", "Validation, storage, or source persistence fails.", "Document upload failure rate", "Repair blocking PDF-upload defects.", { metadata: ["source", "step", "reason", "error_code", "viewport"] }),
  document_analysis_started: define("creative_passport", "A validated private document enters analysis.", "Server-side validation succeeds and extraction begins.", "Document analysis starts", "Separate storage success from analysis continuation.", { metadata: ["source", "mode", "viewport"], deduplication: "workflow" }),
  document_analysis_completed: define("creative_passport", "A private document produces reviewable evidence-backed proposals.", "Native-text extraction completes and the review inbox becomes available.", "Document analysis completion", "Evaluate analysis reliability and review supply.", { metadata: ["source", "status", "result_count", "viewport"] }),
  document_analysis_partial: define("creative_passport", "Document analysis completes with an explicit limitation.", "Only part of the source is readable or OCR is required.", "Partial analysis rate", "Prioritize weak document types and OCR decisions.", { metadata: ["source", "reason", "result_count", "viewport"] }),
  document_analysis_failed: define("creative_passport", "Document analysis fails with a stable non-sensitive code.", "The original private source is preserved but no trustworthy analysis result is produced.", "Document analysis failure rate", "Repair extraction and provider failures without exposing content.", { metadata: ["source", "step", "error_code", "viewport"] }),
  document_ocr_required: define("creative_passport", "A PDF has no usable native text layer.", "Server-side inspection determines OCR is required and unavailable or deferred.", "OCR-required document rate", "Decide whether and when to add a secure OCR provider.", { metadata: ["source", "status", "viewport"] }),
  document_classification_corrected: define("creative_passport", "An artist corrects a private document classification.", "The corrected category persists and the same source is reanalyzed.", "Classification correction rate", "Improve deterministic classification and review clarity.", { metadata: ["source", "status", "viewport"] }),
  passport_proposal_confirmed: define("creative_passport", "An artist confirms a document-backed Passport proposal.", "The private confirmed record persists.", "Document proposal confirmation", "Evaluate factual usefulness and review burden.", { origin: "server", metadata: ["source", "section", "edited"] }),
  passport_proposal_edited: define("creative_passport", "An artist edits a document-backed proposal before confirmation.", "The edited private confirmed record persists.", "Proposal edit rate", "Identify extraction that is useful but needs correction.", { metadata: ["source", "section", "edited"] }),
  passport_proposal_rejected: define("creative_passport", "An artist rejects a document-backed proposal.", "The rejection decision persists without changing the Passport.", "Document proposal rejection", "Identify unsupported or poorly framed suggestions.", { metadata: ["source", "section", "reason"] }),
  passport_conflict_resolved: define("creative_passport", "An artist resolves a conflict between a source proposal and existing Passport information.", "Replace, keep-both, or merge evidence persists.", "Conflict resolution", "Evaluate versioning and contradiction support.", { metadata: ["source", "outcome", "section"] }),
  interpretation_confirmed: define("creative_passport", "An artist marks a correlation or interpretation as useful language.", "The private decision persists without creating a verified fact.", "Useful interpretation decisions", "Assess whether pattern-reading supports artists responsibly.", { metadata: ["source", "status", "section"] }),
  interpretation_dismissed: define("creative_passport", "An artist dismisses or marks an interpretation inaccurate.", "The private feedback decision persists.", "Dismissed interpretations", "Improve cautious pattern analysis.", { metadata: ["source", "reason", "section"] }),
  biography_draft_requested: define("creative_passport", "An artist requests a draft from confirmed private Passport facts.", "The confirmed-facts-only drafting function is invoked.", "Biography drafting demand", "Evaluate whether reviewed evidence creates writing value.", { metadata: ["mode", "provider", "viewport"] }),
  biography_draft_saved: define("creative_passport", "An artist approves an edited KLEIO Assist biography or practice draft.", "The reviewed text saves privately to the Passport.", "Approved document-derived drafts", "Measure downstream value without storing draft text in analytics.", { metadata: ["mode", "edited", "status"] }),

  import_source_selected: define("media_library", "An artist selects an available import source.", "A functional source—not a coming-soon item—is selected.", "Import source intent", "Compare source demand with completion.", { metadata: ["source", "viewport"] }),
  upload_started: define("media_library", "A permitted file upload begins.", "Validation passes and transfer starts.", "Upload starts", "Measure upload completion and latency.", { metadata: ["source", "count", "viewport"], deduplication: "workflow" }),
  upload_succeeded: define("media_library", "A file is validated and stored privately.", "The private source record and storage object are confirmed.", "Upload success rate", "Protect the core artwork-ingestion path.", { metadata: ["source", "count", "viewport"] }),
  upload_failed: define("media_library", "A file upload fails with a stable non-sensitive code.", "Validation, transfer or persistence fails.", "Upload failure rate", "Repair blocking upload failures.", { metadata: ["source", "step", "reason", "error_code", "viewport"] }),
  import_started: define("media_library", "An import workflow begins.", "A functional source workflow opens or receives a selection.", "Import starts", "Measure end-to-end import completion.", { metadata: ["source", "mode", "viewport"], deduplication: "workflow" }),
  import_completed: define("media_library", "All confirmed import items are privately available.", "The confirmed source records persist successfully.", "Import completion rate", "Decide whether the active import source is beta-ready.", { metadata: ["source", "result_count", "count", "viewport"], deduplication: "workflow" }),
  import_partially_completed: define("media_library", "At least one import item succeeds and at least one fails.", "The final result contains both successful and failed items.", "Partial import rate", "Improve per-item failure recovery.", { metadata: ["source", "result_count", "failed_count", "duplicate_count", "viewport"], deduplication: "workflow" }),
  import_failed: define("media_library", "No selected import item becomes available.", "The import ends without a successful private record.", "Import failure rate", "Prioritize blocking source or authorization failures.", { metadata: ["source", "step", "reason", "error_code", "count", "viewport"], deduplication: "workflow" }),
  artwork_record_saved: define("media_library", "A completed artwork record persists.", "A valid portfolio_works row is created or meaningfully completed.", "Completed artwork records", "Measure first value and portfolio progress.", { origin: "server", deduplication: "workflow" }),
  artwork_record_save_failed: define("media_library", "A valid artwork record fails to persist.", "The save returns a stable sanitized code.", "Artwork save reliability", "Repair first-value blockers.", { metadata: ["source", "step", "reason", "error_code", "viewport"] }),
  portfolio_inclusion_confirmed: define("media_library", "An artist explicitly includes private media in the Portfolio.", "The approved destination association persists.", "Portfolio inclusion", "Measure conversion from private media to visible portfolio work.", { origin: "server", deduplication: "workflow" }),
  draft_restored: define("reliability", "A saved workflow draft is restored after interruption.", "Remote or local recovery state is successfully applied.", "Draft restoration rate", "Validate interruption resilience.", { metadata: ["source", "mode", "step"], deduplication: "workflow" }),
  autosave_succeeded: define("reliability", "A meaningful workflow revision autosaves.", "The persisted revision is acknowledged.", "Autosave success rate", "Protect artists from lost work.", { metadata: ["source", "step", "mode"], deduplication: "workflow" }),
  autosave_failed: define("reliability", "Autosave fails with a stable sanitized code.", "A local or remote autosave attempt fails.", "Autosave failure rate", "Repair work-loss and offline recovery risks.", { metadata: ["source", "step", "reason", "error_code"] }),

  opportunity_directory_viewed: define("opportunities", "An authenticated artist opens the complete opportunity directory.", "The directory data becomes usable.", "Authenticated directory viewers", "Measure opportunity engagement after signup.", { deduplication: "workflow" }),
  search_performed: define("opportunities", "An artist performs a normalized opportunity search.", "A search request completes; raw query text is never recorded.", "Search users", "Improve search interpretation and result quality.", { metadata: ["result_count", "viewport", "mode"] }),
  filter_applied: define("opportunities", "An artist applies opportunity filters.", "The filtered result set updates.", "Filter users", "Determine which structured filters matter.", { metadata: ["filter_count", "result_count", "viewport"] }),
  search_no_results: define("opportunities", "A normalized search or filter combination returns no results.", "The completed result count is zero.", "No-result rate", "Identify taxonomy or inventory gaps without storing queries.", { metadata: ["filter_count", "mode", "viewport"] }),
  official_source_opened: define("opportunities", "An artist opens an opportunity's official source.", "The verified external-source action is selected.", "Official source opens", "Measure whether KLEIO builds enough trust to continue.", { publicAllowed: true, metadata: ["source", "mode", "viewport"] }),
  opportunity_saved: define("opportunities", "An artist saves an opportunity in durable state.", "A saved_opportunities row is created.", "Saved opportunities", "Measure meaningful opportunity intent.", { origin: "server", deduplication: "workflow" }),
  opportunity_unsaved: define("opportunities", "An artist removes a saved opportunity.", "The saved relationship is deleted.", "Opportunity unsaves", "Investigate relevance or deadline changes.", { origin: "server" }),
  readiness_viewed: define("opportunities", "An artist views a calculated readiness assessment.", "The readiness result is displayed successfully.", "Readiness usage", "Assess whether readiness supports decisions.", { metadata: ["status", "mode", "viewport"] }),
  prepare_selected: define("applications", "An artist chooses to prepare an application.", "The preparation action is selected.", "Preparation intent", "Measure opportunity-to-application conversion.", { metadata: ["source", "mode", "viewport"] }),
  application_preparation_started: define("applications", "A durable application preparation package exists.", "An application_packages row is created.", "Application preparation starts", "Measure the deepest artist-beta value action.", { origin: "server", deduplication: "workflow" }),

  user_visible_error: define("reliability", "A product error is shown to the user.", "A stable error code reaches a blocking or meaningful error state.", "User-visible error rate", "Prioritize real workflow blockers.", { metadata: ["error_code", "step", "source", "viewport", "retryable"] }),
  workflow_recovery_offered: define("reliability", "KLEIO offers a safe recovery action after interruption.", "A supported recovery option is rendered.", "Recovery offer coverage", "Ensure failures have an understandable next action.", { metadata: ["reason", "step", "source"] }),
  workflow_recovered: define("reliability", "A failed or interrupted workflow resumes successfully.", "The recovery action restores a usable state.", "Workflow recovery rate", "Evaluate whether recovery controls work.", { metadata: ["reason", "step", "source"], deduplication: "workflow" }),
  support_selected: define("reliability", "A user intentionally opens support from a product problem.", "A support action is selected.", "Support demand", "Identify unresolved product friction.", { metadata: ["surface", "reason", "viewport"] }),
  feedback_started: define("reliability", "A user begins the structured feedback flow.", "The feedback surface becomes active.", "Feedback starts", "Measure willingness to provide product feedback.", { metadata: ["surface", "mode"] }),
  feedback_submitted: define("reliability", "Structured feedback is submitted without storing its text in analytics.", "The feedback record persists separately.", "Feedback completion", "Improve the feedback mechanism and follow-up.", { metadata: ["surface", "mode", "status"], deduplication: "workflow" }),

  first_value_reached: define("creative_passport", "An artist saves one completed artwork record or confirms one meaningful Passport record.", "Derived from authoritative portfolio_works or artist_passport_records state.", "Artists reaching first value", "Measure whether KLEIO produces a meaningful saved outcome.", { origin: "derived", deduplication: "durable_milestone" }),
  artist_activated: define("creative_passport", "An artist satisfies KLEIO's durable beta activation definition.", "Derived from artist_activation_status when onboarding, three works, Passport, reusable material and opportunity action are complete.", "Activated artists", "Evaluate acquisition quality and beta product value.", { origin: "derived", deduplication: "durable_milestone" }),

  institution_section_viewed: define("institution", "A visitor reaches the public institution section.", "The section becomes meaningfully visible once per session.", "Institution interest", "Prepare future institution acquisition measurement.", { publicAllowed: true, status: "legacy" }),
  institution_signup_selected: define("institution", "A visitor selects institution signup.", "The institution signup action is selected.", "Institution signup intent", "Prepare future institution funnel measurement.", { publicAllowed: true }),

  carousel_viewed: define("legacy", "Legacy landing carousel impression.", "Existing landing implementation records the carousel becoming visible.", "Legacy carousel reach", "Retain historical interpretability; do not use as a core KPI.", { publicAllowed: true, status: "legacy" }),
  carousel_manual_advanced: define("legacy", "Legacy manual carousel navigation.", "A visitor advances the public carousel.", "Legacy carousel interaction", "Retain historical compatibility only.", { publicAllowed: true, status: "legacy" }),
  carousel_card_selected: define("legacy", "Legacy carousel card selection.", "A public carousel card is selected.", "Legacy carousel conversion", "Retain historical compatibility only.", { publicAllowed: true, status: "legacy" }),
  login_selected: define("legacy", "Legacy login-intent event.", "The public login action is selected.", "Login intent", "Retain historical compatibility while login_completed becomes authoritative.", { publicAllowed: true, status: "legacy" }),
  check_fit_selected: define("legacy", "Legacy readiness intent.", "A check-fit action is selected.", "Legacy readiness intent", "Retain historical compatibility while readiness_viewed becomes preferred.", { publicAllowed: true, status: "legacy" }),
  save_selected: define("legacy", "Legacy save intent.", "A save action is selected before durable persistence.", "Legacy save intent", "Retain compatibility; use opportunity_saved for decisions.", { status: "legacy" }),
  signup_prompted: define("legacy", "Legacy signup prompt display.", "A protected public action shows signup guidance.", "Legacy signup prompts", "Retain historical compatibility only.", { publicAllowed: true, status: "legacy" }),
  opportunity_restoration_completed: define("legacy", "Legacy opportunity state restoration success.", "A pre-signup opportunity intent is restored.", "Restoration success", "Retain historical compatibility.", { status: "legacy" }),
  opportunity_restoration_failed: define("legacy", "Legacy opportunity state restoration failure.", "A pre-signup intent cannot be restored.", "Restoration failure", "Retain historical compatibility.", { status: "legacy" }),
  guided_step_completed: define("legacy", "Legacy guided Passport step completion.", "A guided step completes.", "Legacy guided completion", "Map to passport_section_completed in new instrumentation.", { status: "legacy" }),
  guided_step_skipped: define("legacy", "Legacy guided Passport step skip.", "A guided step is skipped.", "Legacy guided skips", "Map to onboarding or Passport step events in new instrumentation.", { status: "legacy" }),
  review_opened: define("legacy", "Legacy proposal review open.", "A review interface opens.", "Legacy review starts", "Use proposal_review_opened for new instrumentation.", { status: "legacy" }),
  claim_confirmed: define("legacy", "Legacy extracted claim confirmation.", "A claim is confirmed.", "Legacy claim confirmation", "Use passport_record_confirmed or proposal_approved for decisions.", { status: "legacy" }),
  claim_rejected: define("legacy", "Legacy extracted claim rejection.", "A claim is rejected.", "Legacy claim rejection", "Use proposal_rejected for decisions.", { status: "legacy" }),
  claim_deferred: define("legacy", "Legacy extracted claim deferral.", "A claim is deferred.", "Legacy claim deferral", "Retain historical compatibility.", { status: "legacy" }),
  duplicate_merged: define("legacy", "Legacy duplicate claim merge.", "Duplicate proposals are merged.", "Duplicate merges", "Monitor extraction quality only.", { status: "legacy" }),
  claims_bulk_confirmed: define("legacy", "Legacy bulk claim confirmation.", "A reviewed claim group is confirmed.", "Bulk confirmations", "Retain historical compatibility.", { status: "legacy" }),
  voice_capability_detected: define("legacy", "Legacy browser voice capability signal.", "The browser reports supported speech input.", "Voice capability", "Do not treat as adoption.", { status: "legacy" }),
  voice_started: define("legacy", "Legacy voice workflow start.", "A voice input flow begins.", "Voice starts", "Retain only if voice returns to active scope.", { status: "legacy" }),
  voice_completed: define("legacy", "Legacy voice workflow completion.", "A voice input flow completes without recording transcript content.", "Voice completions", "Retain only if voice returns to active scope.", { status: "legacy" }),
  conflict_detected: define("legacy", "Legacy autosave conflict signal.", "A revision conflict is detected.", "Draft conflicts", "Use stable recovery events for current decisions.", { status: "legacy" }),
} as const

export type KleioProductEventName = keyof typeof KLEIO_PRODUCT_EVENT_DICTIONARY

export const KLEIO_PRODUCT_EVENT_NAMES = Object.freeze(
  Object.keys(KLEIO_PRODUCT_EVENT_DICTIONARY) as KleioProductEventName[],
)

export function productEventDefinition(eventName: KleioProductEventName) {
  return KLEIO_PRODUCT_EVENT_DICTIONARY[eventName]
}
