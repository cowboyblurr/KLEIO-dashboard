import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (file) => fs.readFileSync(path.join(root, file), "utf8")
const s = {
  prepare: read("app/artist-dashboard/applications/prepare/page.tsx"),
  opportunities: read("components/kleio/production-artist-opportunity-directory.tsx"),
  applications: read("components/kleio/unified-artist-applications.tsx"),
  composer: read("components/kleio/application-composer-workspace.tsx"),
  composerLib: read("lib/kleio-application-composer.ts"),
  readiness: read("lib/kleio-opportunity-presentation.ts"),
  media: read("components/kleio/application-media-import-bar.tsx"),
  requirementMedia: read("components/kleio/application-requirement-media.tsx"),
  requirementPicker: read("components/kleio/application-requirement-file-picker.tsx"),
  sidebar: read("components/kleio/artist-sidebar.tsx"),
  shell: read("components/kleio/artist-shell.tsx"),
  timeline: read("components/kleio/application-timeline-panel.tsx"),
  conversation: read("components/kleio/artist-recipient-conversation.tsx"),
  recipientPanel: read("components/kleio/application-recipient-loop-panel.tsx"),
}

function has(content, pattern) { return pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern) }
function must(content, pattern, message) { if (!has(content, pattern)) throw new Error(message) }
function never(content, pattern, message) { if (has(content, pattern)) throw new Error(message) }
function ordered(content, labels) { let cursor = -1; for (const label of labels) { const next = content.indexOf(label); if (next < 0 || next <= cursor) throw new Error(`${label} is missing or out of workflow order.`); cursor = next } }

const simulations = [
  ["S01", "Opportunity card starts preparation directly", () => { must(s.opportunities, /applications\/prepare\/\?opportunity=/, "Prepare application must link directly to the canonical composer."); must(s.opportunities, /Prepare application/, "Primary opportunity CTA needs a clear label.") }],
  ["S02", "Opportunity details are optional, not a gate", () => { const c = s.opportunities.indexOf("Prepare application"); const d = s.opportunities.indexOf("{isExpanded &&"); if (c < 0 || d < 0 || c >= d) throw new Error("Artist should not need to expand details before applying.") }],
  ["S03", "Application work remains on one internal route", () => ["ApplicationMediaImportBar","ApplicationRequirementMedia","ApplicationComposerWorkspace","ApplicationTimelinePanel","ArtistRecipientConversation"].forEach((name) => must(s.prepare, name, `${name} must remain on the preparation route.`))],
  ["S04", "Preparation page has one vertical scroll owner", () => { if ((s.prepare.match(/overflow-y-auto/g) || []).length !== 1) throw new Error("Preparation route must have one vertical scroll owner."); must(s.shell, /overflow-y-hidden/, "Artist shell must delegate page scrolling.") }],
  ["S05", "Repeated artist identity strip is removed", () => never(s.prepare, "ApplicationArtistIdentityBar", "Do not repeat artist identity above application work.")],
  ["S06", "Decorative submission cover is removed", () => never(s.prepare, "ApplicationSubmissionCover", "Decorative cover must not push application work below the fold.")],
  ["S07", "Recipient workflow no longer floats over preparation", () => { must(s.prepare, /\[&>button\]:!static/, "Recipient workflow trigger must be normal document flow."); ordered(s.prepare, ["ApplicationComposerWorkspace","ApplicationRecipientLoopPanel","ApplicationTimelinePanel"]) }],
  ["S08", "Artwork can be added without leaving application", () => { must(s.media, /QuickMediaImport/, "Artwork quick-add must use the shared private media picker."); must(s.media, /context="application_portfolio_selection"/, "Application quick-add must use the application portfolio-selection contract."); must(s.media, /createPortfolioWorkFromMedia/, "Selected private media must become a real Portfolio work before application use."); must(s.media, /without leaving this application|return the new work to the Portfolio selection in this application/i, "Artwork recovery must explain route continuity."); must(s.media, /kleio:application-portfolio-changed/, "Artwork quick-add must notify the application composer."); must(s.composer, /kleio:application-portfolio-changed/, "Composer must refresh newly added Portfolio work without a page reload."); must(s.composer, /setSelectedWorkIds[\s\S]*workIds/, "Newly added works must become selected in the current application.") }],
  ["S09", "Generic duplicate requirement upload is removed", () => { never(s.media, /context="application_material"|Add requirement file/i, "Artwork bar must not duplicate requirement-file upload."); must(s.requirementMedia, /ApplicationRequirementFilePicker/, "Exact requirement row must own its file picker.") }],
  ["S10", "Requirement uploads are status-first and compact", () => { must(s.requirementMedia, /Attach files once, to the exact requirement/, "Requirement file section needs single-attachment framing."); must(s.requirementMedia, /includedCount/, "Show included count."); must(s.requirementMedia, /requiredMissingCount/, "Show required missing count."); must(s.requirementMedia, /Validation details/, "Deep validation should be progressive disclosure.") }],
  ["S11", "Invalid or uncertain files remain explicit", () => ["Fix needed","Confirm","Review"].forEach((label) => must(s.requirementMedia, label, `Missing requirement file state: ${label}`))],
  ["S12", "Requirement replacement stays in context", () => { must(s.requirementMedia, /current \? "Replace" : "Add file"/, "Replace must happen on the same requirement row."); must(s.requirementMedia, /continue the application without leaving this page/i, "Success must confirm same-page continuity.") }],
  ["S13", "Creative Passport reuse is explained before new writing", () => { must(s.composer, /What KLEIO already knows/, "Show reused Passport context first."); must(s.composer, /Finish only the information this application uniquely needs/, "Frame composer around reduced artist labor.") }],
  ["S14", "Exact application questions are editable in place", () => { must(s.composer, /id="application-questions"/, "Questions need stable in-page section."); must(s.composer, /<textarea[\s\S]*updateAnswer/, "Answers must remain editable in place.") }],
  ["S15", "AI drafting never silently overwrites artist text", () => ["Suggested drafts — choose only if useful","Use this draft","Restore previous"].forEach((copy) => must(s.composer, copy, `Missing artist-controlled AI action: ${copy}`))],
  ["S16", "AI rationale uses progressive disclosure", () => { must(s.composer, /Why this draft\?/, "AI source explanation must be available."); never(s.composer, /Why this draft\?[\s\S]{0,80}open=/, "AI rationale should not be forced open.") }],
  ["S17", "Word limits stay visible while writing", () => { must(s.composer, /words[\s\S]*max/, "Maximum words must be visible."); must(s.composer, /words[\s\S]*min/, "Minimum words must be visible when sourced.") }],
  ["S18", "Portfolio selection is visual and same-page", () => { must(s.composer, /id="portfolio-selection"/, "Portfolio selection needs stable section."); must(s.composer, /aria-pressed=\{selected\}/, "Selected state must be accessible."); must(s.composer, /aspect-\[4\/3\]/, "Work thumbnails must be visual.") }],
  ["S19", "Empty portfolio has an on-page recovery action", () => { must(s.media, /Add your first artwork/, "Empty portfolio needs recovery CTA."); must(s.media, /loadPortfolioWorks/, "Artwork prompt must adapt to portfolio state.") }],
  ["S20", "Preflight blocks known incomplete applications", () => { must(s.composer, /id="preflight"/, "Explicit preflight required."); must(s.composer, /blocking issue/, "Blocking count must be visible."); must(s.composer, /disabled=\{busy \|\| !preflight\.ready\}/, "Known blockers must disable finalization.") }],
  ["S21", "Preflight issues jump to the fix", () => { must(s.composer, /jumpTo\(issue\.anchor\)/, "Issues must link to in-page fixes."); must(s.composer, /scrollIntoView/, "Correction should not route elsewhere.") }],
  ["S22", "Interrupted sessions are recoverable", () => ["Saving changes…","Application saved. You can close KLEIO and return without losing these edits","Save application"].forEach((copy) => must(s.composer, copy, `Missing interruption recovery state: ${copy}`))],
  ["S23", "Finalization is explicit and immutable", () => { must(s.composer, /Finalize & preserve version/, "Finalization must be deliberate."); must(s.composer, /Future Creative Passport edits will not change this application/, "Explain immutable history.") }],
  ["S24", "Email handoff is one same-page action", () => { must(s.composer, /Open email client/, "Email handoff should be direct."); must(s.composer, /mailto:/, "Beta email fallback should use artist email client.") }],
  ["S25", "Opening email is not mislabeled as sending", () => { must(s.composer, /not proof the email was sent/i, "Email open must not equal sent."); must(s.composer, /I sent this application/, "Artist-reported send needs separate action."); must(s.composer, /does not claim “Institution received your application\.”/, "Do not infer institution receipt.") }],
  ["S26", "Portal submission exits only at official destination", () => { must(s.composer, /Open official destination/, "Portal CTA required after KLEIO prep."); must(s.composer, /target="_blank"/, "External destination should preserve KLEIO tab.") }],
  ["S27", "Applications remains the source of truth", () => { must(s.applications, /KLEIO-hosted, email, portal, and downloaded application packages/, "Applications page must combine submission channels."); must(s.applications, /Next relevant action/, "Each application needs next action.") }],
  ["S28", "Resume application is one click", () => { must(s.applications, /applications\/prepare\/\?opportunity=/, "Resume must reopen exact composer."); must(s.applications, />Open application<\//, "Resume label should be explicit.") }],
  ["S29", "Outcome updates stay lightweight", () => { ["Shortlisted","Interview requested","Accepted","Declined","Withdrawn"].forEach((label) => must(s.applications, label, `Missing outcome ${label}`)); must(s.applications, /artist update/i, "Manual outcomes must remain artist-reported.") }],
  ["S30", "Mobile navigation avoids horizontal hunting", () => { never(s.sidebar, /overflow-x-auto/, "Primary mobile nav must not horizontally scroll."); must(s.sidebar, /mobilePrimaryHrefs/, "Mobile needs focused core set."); must(s.sidebar, /artist-mobile-more-menu/, "Secondary pages need labeled More menu.") }],
  ["S31", "Core beta destinations stay visible on mobile", () => ["/artist-dashboard/","/artist-dashboard/opportunities/","/artist-dashboard/applications/","/artist-dashboard/passport/"].forEach((href) => must(s.sidebar, `"${href}"`, `Missing mobile core destination ${href}`))],
  ["S32", "Applications nav stays active on preparation subroute", () => { must(s.sidebar, /activeMatch: "\/artist-dashboard\/applications"/, "Applications nav must own prepare subroute."); must(s.sidebar, /pathname\.startsWith\(match\)/, "Nested route active state required.") }],
  ["S33", "Secondary mobile destinations have labels", () => { must(s.sidebar, /<span>\{labelFor\(item\)\}<\/span>/, "More menu needs text labels."); must(s.sidebar, /AccountSignOutButton[\s\S]*w-full justify-start/, "Sign out belongs in labeled More menu.") }],
  ["S34", "Keyboard semantics remain native", () => { must(s.composer, /<button type="button"/, "Composer actions should be native buttons."); must(s.requirementMedia, /<details/, "Validation disclosure should use native details."); must(s.sidebar, /aria-expanded=\{mobileMoreOpen\}/, "More menu needs expanded state.") }],
  ["S35", "Source verification preserves in-progress KLEIO", () => { must(s.composer, />Verify source<ExternalLink/, "Source verification action required."); must(s.composer, /target="_blank" rel="noreferrer"/, "Source verification should preserve KLEIO tab.") }],
  ["S36", "Recipient activity remains evidence-labelled", () => { must(s.timeline, /Evidence labels show what KLEIO actually knows/, "Timeline must explain evidence model."); must(s.timeline, /does not prove the application was read in full|Neither event is represented as proof/, "Do not imply read surveillance.") }],
  ["S37", "Recipient conversation stays application-specific", () => { must(s.conversation, /application-specific|application conversation/i, "Conversation must stay attached to application."); must(s.conversation, /Reply sent and preserved with this application conversation/, "Replies need application history continuity.") }],
  ["S38", "Secure recipient review controls remain available", () => { must(s.recipientPanel, /createRecipientReviewAccess/, "Recipient access creation must remain."); must(s.recipientPanel, /revokeRecipientReviewAccess/, "Recipient access revocation must remain."); must(s.prepare, /Recipient access and replies/, "Recipient tools should sit after preparation.") }],
  ["S39", "Preparation hierarchy puts core work before follow-up tools", () => ordered(s.prepare, ["ApplicationMediaImportBar","ApplicationRequirementMedia","ApplicationComposerWorkspace","ApplicationRecipientLoopPanel","ApplicationTimelinePanel","ArtistRecipientConversation"])],
  ["S40", "No second application editor exists on opportunity page", () => never(s.opportunities, /ApplicationEditor/, "Production opportunity page must route to canonical composer.")],
  ["S41", "Explicit written source input wins over document-like label", () => { must(s.requirementMedia, /EXPLICIT_WRITTEN_INPUTS/, "File surface must know explicit written inputs."); must(s.requirementMedia, /if \(EXPLICIT_WRITTEN_INPUTS\.includes\(requirement\.input_type\)\) return false/, "Long text should not become duplicate upload task.") }],
  ["S42", "Explicit file input suppresses semantic textarea", () => { must(s.composerLib, /explicitFileInputTypes/, "Composer must know file inputs."); must(s.composerLib, /if \(explicitFileInputTypes\.has\(inputType\)\) return false/, "Document-only budget/proposal must not become textarea.") }],
  ["S43", "Source-declared mixed input may use both channels", () => { must(s.composerLib, /inputType === "mixed"/, "Mixed requirements must stay eligible for writing."); must(s.requirementMedia, /"mixed"/, "Mixed requirements must stay eligible for file attachment.") }],
  ["S44", "Manual procedural steps do not become dead-end blockers", () => { must(s.readiness, /legal_declaration \|\| requirement\.requires_artist_confirmation \|\| requirement\.payment_required \|\| requirement\.human_verification_required/, "Manual procedural requirements must stay review items."); must(s.readiness, /blockingCount = required\.filter\(\(requirement\) => \["missing", "limit_error", "unverified"\]/, "Manual review must not become impossible blocker.") }],
  ["S45", "Unknown source requirements are never invented", () => { must(s.composer, /KLEIO did not find source-structured written questions/, "No-question state must be explicit."); must(s.composer, /unknown requirements are not silently invented/i, "Unknown source structure must not be fabricated.") }],
]

const failures = []
let passed = 0
for (const [id, name, run] of simulations) {
  try { run(); passed += 1; console.log(`✓ ${id} ${name}`) }
  catch (error) { const detail = error instanceof Error ? error.message : String(error); failures.push(`${id} ${name}: ${detail}`); console.error(`✗ ${id} ${name}`) }
}
console.log(`\nArtist beta convenience simulations: ${passed}/${simulations.length} passed.`)
if (failures.length) { console.error("\nFailures:"); failures.forEach((failure) => console.error(`- ${failure}`)); process.exit(1) }
console.log("KLEIO artist beta convenience gate passed: application work stays on the canonical route; missing artwork can be added through the shared private-media contract without leaving the application; requirement uploads remain requirement-specific; mobile core actions stay visible; recovery remains in context; and external exits are reserved for the artist's actual submission destination.")