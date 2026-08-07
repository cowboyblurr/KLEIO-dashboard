import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8")

const source = {
  prepare: read("app/artist-dashboard/applications/prepare/page.tsx"),
  opportunities: read("components/kleio/production-artist-opportunity-directory.tsx"),
  applications: read("components/kleio/unified-artist-applications.tsx"),
  composer: read("components/kleio/application-composer-workspace.tsx"),
  media: read("components/kleio/application-media-import-bar.tsx"),
  requirementMedia: read("components/kleio/application-requirement-media.tsx"),
  sidebar: read("components/kleio/artist-sidebar.tsx"),
  shell: read("components/kleio/artist-shell.tsx"),
  timeline: read("components/kleio/application-timeline-panel.tsx"),
  conversation: read("components/kleio/artist-recipient-conversation.tsx"),
  recipientPanel: read("components/kleio/application-recipient-loop-panel.tsx"),
}

function expect(condition, message) {
  if (!condition) throw new Error(message)
}

function contains(content, pattern) {
  return pattern instanceof RegExp ? pattern.test(content) : content.includes(pattern)
}

function requireText(content, pattern, message) {
  expect(contains(content, pattern), message)
}

function forbidText(content, pattern, message) {
  expect(!contains(content, pattern), message)
}

function requireOrder(content, labels) {
  let cursor = -1
  for (const label of labels) {
    const next = content.indexOf(label)
    expect(next >= 0, `Missing ordered surface: ${label}`)
    expect(next > cursor, `${label} appears out of the intended artist workflow order.`)
    cursor = next
  }
}

const simulations = [
  {
    id: "S01",
    name: "Opportunity card starts preparation directly",
    run() {
      requireText(source.opportunities, /href=\{`\/artist-dashboard\/applications\/prepare\/\?opportunity=/, "Prepare application must be a direct action from the opportunity card.")
      requireText(source.opportunities, />Prepare application<FileText/, "The primary opportunity action must be clearly labeled Prepare application.")
    },
  },
  {
    id: "S02",
    name: "Opportunity details are optional, not a gate",
    run() {
      const prepareIndex = source.opportunities.indexOf("Prepare application")
      const expandedIndex = source.opportunities.indexOf("{isExpanded &&")
      expect(prepareIndex >= 0 && expandedIndex >= 0 && prepareIndex < expandedIndex, "The artist must not be forced to expand details before starting an application.")
    },
  },
  {
    id: "S03",
    name: "Application work remains on one internal route",
    run() {
      requireText(source.prepare, "<ApplicationMediaImportBar", "Artwork quick-add must remain inside the application route.")
      requireText(source.prepare, "<ApplicationRequirementMedia", "Requirement files must remain inside the application route.")
      requireText(source.prepare, "<ApplicationComposerWorkspace", "The composer must remain on the preparation route.")
      requireText(source.prepare, "<ApplicationTimelinePanel", "Application history must remain on the preparation route.")
      requireText(source.prepare, "<ArtistRecipientConversation", "Application conversation must remain on the preparation route.")
    },
  },
  {
    id: "S04",
    name: "Preparation page has one vertical scroll owner",
    run() {
      const count = (source.prepare.match(/overflow-y-auto/g) || []).length
      expect(count === 1, `Preparation page should have one vertical scroll owner; found ${count}.`)
      requireText(source.shell, /overflow-y-hidden/, "ArtistShell must delegate scrolling to the active page rather than creating nested page scroll.")
    },
  },
  {
    id: "S05",
    name: "Decorative identity strip removed from application work",
    run() {
      forbidText(source.prepare, "ApplicationArtistIdentityBar", "The preparation route should not repeat artist identity above the composer.")
    },
  },
  {
    id: "S06",
    name: "Decorative submission cover removed from application work",
    run() {
      forbidText(source.prepare, "ApplicationSubmissionCover", "Institution cover art should not push application work below the fold.")
    },
  },
  {
    id: "S07",
    name: "Recipient workflow no longer floats over preparation",
    run() {
      requireText(source.prepare, /\[&>button\]:!static/, "Recipient workflow trigger must be forced into normal document flow.")
      requireOrder(source.prepare, ["<ApplicationComposerWorkspace", "<ApplicationRecipientLoopPanel", "<ApplicationTimelinePanel"])
    },
  },
  {
    id: "S08",
    name: "Artwork can be added without leaving application",
    run() {
      requireText(source.media, /ArtistImportStudio/, "Application route must expose the existing artwork import studio.")
      requireText(source.media, /without leaving this application|return you to this application/i, "Artwork quick-add copy must explain route continuity.")
    },
  },
  {
    id: "S09",
    name: "Generic duplicate requirement upload removed",
    run() {
      forbidText(source.media, /QuickMediaImport/, "The generic artwork bar must not also expose a second requirement-file uploader.")
      forbidText(source.media, /Add requirement file/i, "The application route must not ask for requirement files twice.")
      requireText(source.requirementMedia, /QuickMediaImport/, "Requirement uploads must exist only at the exact named requirement.")
    },
  },
  {
    id: "S10",
    name: "Requirement upload is status-first and compact",
    run() {
      requireText(source.requirementMedia, /Attach files once, to the exact requirement/, "Requirement file section must communicate single-source attachment clearly.")
      requireText(source.requirementMedia, /readyCount/, "Requirement files must summarize ready state before listing details.")
      requireText(source.requirementMedia, /attentionCount/, "Requirement files must summarize items needing attention.")
      requireText(source.requirementMedia, /Validation details/, "Deep validation evidence should be progressively disclosed rather than always expanded.")
    },
  },
  {
    id: "S11",
    name: "Wrong or uncertain requirement file remains visible",
    run() {
      requireText(source.requirementMedia, /Fix needed/, "Invalid requirement files need an explicit correction state.")
      requireText(source.requirementMedia, /Confirm/, "Likely-satisfied requirement files need a confirmation state.")
      requireText(source.requirementMedia, /Review/, "Uncertain requirement files need an artist-review state.")
    },
  },
  {
    id: "S12",
    name: "Requirement replacement stays in context",
    run() {
      requireText(source.requirementMedia, /label=\{current \? "Replace" : "Add file"\}/, "Artists must replace a requirement file from the same row rather than visit Media Library.")
      requireText(source.requirementMedia, /continue the application without leaving this page/i, "Successful replacement must confirm same-page continuity.")
    },
  },
  {
    id: "S13",
    name: "Creative Passport reuse is explained before new writing",
    run() {
      requireText(source.composer, /What KLEIO already knows/, "Composer must show reused Passport information before application questions.")
      requireText(source.composer, /Finish only the information this application uniquely needs/, "Composer must frame the experience around reduced artist labor.")
    },
  },
  {
    id: "S14",
    name: "Exact application questions are editable in place",
    run() {
      requireText(source.composer, /id="application-questions"/, "Application questions need a stable in-page section.")
      requireText(source.composer, /<textarea[\s\S]*updateAnswer/, "Application answers must be directly editable in the composer.")
    },
  },
  {
    id: "S15",
    name: "AI drafting does not overwrite artist text",
    run() {
      requireText(source.composer, /Suggested drafts — choose only if useful/, "AI options must require artist choice.")
      requireText(source.composer, /Use this draft/, "Draft insertion must be explicit.")
      requireText(source.composer, /Restore previous/, "The artist must be able to recover replaced answer text.")
    },
  },
  {
    id: "S16",
    name: "AI rationale is progressive disclosure",
    run() {
      requireText(source.composer, /Why this draft\?/, "Evidence explanation must remain available on demand.")
      forbidText(source.composer, /Why this draft\?[\s\S]{0,80}open=/, "Evidence explanation should not be forced open by default.")
    },
  },
  {
    id: "S17",
    name: "Word limits are visible while writing",
    run() {
      requireText(source.composer, /words[\s\S]*max/, "Question editor must show source maximum word limits.")
      requireText(source.composer, /words[\s\S]*min/, "Question editor must show source minimum word limits when present.")
    },
  },
  {
    id: "S18",
    name: "Portfolio selection is visual and in place",
    run() {
      requireText(source.composer, /id="portfolio-selection"/, "Portfolio selection needs a stable same-page section.")
      requireText(source.composer, /aria-pressed=\{selected\}/, "Work selection must expose clear selected state to assistive technology.")
      requireText(source.composer, /aspect-\[4\/3\]/, "Portfolio selection must show visual work previews instead of title-only checkboxes.")
    },
  },
  {
    id: "S19",
    name: "Empty portfolio has an on-page recovery action",
    run() {
      requireText(source.media, /Add your first artwork/, "The application route must offer a recovery action when portfolio is empty.")
      requireText(source.media, /loadPortfolioWorks/, "Artwork quick-add should adapt to existing portfolio state.")
    },
  },
  {
    id: "S20",
    name: "Preflight blocks known incomplete applications",
    run() {
      requireText(source.composer, /id="preflight"/, "Composer must expose explicit preflight.")
      requireText(source.composer, /blocking issue/, "Preflight must communicate blocking issue count.")
      requireText(source.composer, /disabled=\{busy \|\| !preflight\.ready\}/, "Finalization must stay disabled until blocking issues are resolved.")
    },
  },
  {
    id: "S21",
    name: "Preflight issues are actionable",
    run() {
      requireText(source.composer, /onClick=\{\(\) => jumpTo\(issue\.anchor\)\}/, "Each preflight issue must jump back toward the relevant in-page section.")
      requireText(source.composer, /scrollIntoView/, "Preflight correction must use in-page movement rather than navigation to another route.")
    },
  },
  {
    id: "S22",
    name: "Interrupted sessions are recoverable",
    run() {
      requireText(source.composer, /Saving changes…/, "Composer needs visible autosave feedback.")
      requireText(source.composer, /Application saved\. You can close KLEIO and return without losing these edits/, "Explicit save must confirm interruption recovery.")
      requireText(source.composer, /Save application/, "Artists need a manual save fallback in addition to autosave.")
    },
  },
  {
    id: "S23",
    name: "Finalization is explicit and immutable",
    run() {
      requireText(source.composer, /Finalize & preserve version/, "Artist must deliberately finalize the exact version.")
      requireText(source.composer, /Future Creative Passport edits will not change this application/, "Finalization must explain historical immutability.")
    },
  },
  {
    id: "S24",
    name: "Email preparation is one same-page action",
    run() {
      requireText(source.composer, /Open email client/, "Email applications must hand off directly from the composer after finalization.")
      requireText(source.composer, /mailto:/, "Default email handoff must use the artist's email client without another KLEIO route.")
    },
  },
  {
    id: "S25",
    name: "Email opening is not mislabeled as sending",
    run() {
      requireText(source.composer, /not proof the email was sent/i, "Opening an email client must not be represented as a send.")
      requireText(source.composer, /I sent this application/, "Artist-reported send needs a separate explicit action.")
      requireText(source.composer, /does not claim “Institution received your application\.”/, "Artist-reported send must remain distinct from receipt evidence.")
    },
  },
  {
    id: "S26",
    name: "Portal submission exits only at official destination",
    run() {
      requireText(source.composer, /Open official destination/, "Portal applications need a direct official-destination action after KLEIO finalization.")
      requireText(source.composer, /target="_blank"/, "Official external destinations should not destroy the KLEIO working state in the current tab.")
    },
  },
  {
    id: "S27",
    name: "Application list is a source of truth after submission",
    run() {
      requireText(source.applications, /KLEIO-hosted, email, portal, and downloaded application packages/, "Applications page must combine hosted and external application history.")
      requireText(source.applications, /Next relevant action/, "Each application must tell the artist what to do next.")
    },
  },
  {
    id: "S28",
    name: "Resume application is a single click",
    run() {
      requireText(source.applications, /href=\{`\/artist-dashboard\/applications\/prepare\/\?opportunity=/, "Applications page must reopen the exact composer directly.")
      requireText(source.applications, />Open application<\//, "Resume action must be plainly labeled.")
    },
  },
  {
    id: "S29",
    name: "Outcome updates stay lightweight",
    run() {
      for (const label of ["Shortlisted", "Interview requested", "Accepted", "Declined", "Withdrawn"]) requireText(source.applications, label, `Applications page is missing lightweight outcome: ${label}`)
      requireText(source.applications, /artist update/i, "Manual outcomes must remain labeled as artist-reported rather than institution-confirmed.")
    },
  },
  {
    id: "S30",
    name: "Mobile nav does not require horizontal hunting",
    run() {
      forbidText(source.sidebar, /overflow-x-auto/, "Mobile artist navigation must not require horizontal scrolling.")
      requireText(source.sidebar, /mobilePrimaryHrefs/, "Mobile navigation must define a focused primary set.")
      requireText(source.sidebar, /artist-mobile-more-menu/, "Secondary destinations must remain reachable through a labeled More menu.")
    },
  },
  {
    id: "S31",
    name: "Mobile keeps core beta destinations visible",
    run() {
      for (const href of ["/artist-dashboard/", "/artist-dashboard/opportunities/", "/artist-dashboard/applications/", "/artist-dashboard/passport/"]) requireText(source.sidebar, `"${href}"`, `Mobile primary navigation is missing ${href}`)
      requireText(source.sidebar, /More artist navigation/, "Mobile secondary navigation needs an accessible label.")
    },
  },
  {
    id: "S32",
    name: "Applications nav remains active on preparation subroute",
    run() {
      requireText(source.sidebar, /activeMatch: "\/artist-dashboard\/applications"/, "Applications navigation must cover preparation subroutes.")
      requireText(source.sidebar, /pathname\.startsWith\(match\)/, "Nested application routes must inherit active navigation state.")
    },
  },
  {
    id: "S33",
    name: "Secondary mobile destinations keep visible labels",
    run() {
      requireText(source.sidebar, /<span>\{labelFor\(item\)\}<\/span>/, "Mobile More menu must show text labels, not icon-only mystery actions.")
      requireText(source.sidebar, /AccountSignOutButton[\s\S]*w-full justify-start/, "Sign out should live in the labeled More menu rather than crowd the primary mobile rail.")
    },
  },
  {
    id: "S34",
    name: "Keyboard semantics remain native",
    run() {
      requireText(source.composer, /<button type="button"/, "Composer actions must use native buttons.")
      requireText(source.requirementMedia, /<details/, "Optional validation expansion must use native disclosure semantics.")
      requireText(source.sidebar, /aria-expanded=\{mobileMoreOpen\}/, "Mobile More control must expose expanded state.")
    },
  },
  {
    id: "S35",
    name: "Source verification stays available without interrupting KLEIO",
    run() {
      requireText(source.composer, />Verify source<ExternalLink/, "Artists need source verification from the composer.")
      requireText(source.composer, /target="_blank" rel="noreferrer"/, "Source verification must preserve the in-progress KLEIO tab.")
    },
  },
  {
    id: "S36",
    name: "Recipient activity remains evidence-labeled",
    run() {
      requireText(source.timeline, /Evidence labels show what KLEIO actually knows/, "Timeline must explain evidence semantics.")
      requireText(source.timeline, /does not prove the application was read in full|Neither event is represented as proof/, "Recipient activity must not become false read surveillance.")
    },
  },
  {
    id: "S37",
    name: "Recipient conversation stays application-specific",
    run() {
      requireText(source.conversation, /application-specific|application conversation/i, "Replies must remain attached to the application rather than becoming a generic inbox detour.")
      requireText(source.conversation, /Reply sent and preserved with this application conversation/, "Artist reply should stay inside the application record.")
    },
  },
  {
    id: "S38",
    name: "Secure recipient review functionality is preserved",
    run() {
      requireText(source.recipientPanel, /createRecipientReviewAccess/, "Convenience changes must not remove secure recipient access creation.")
      requireText(source.recipientPanel, /revokeRecipientReviewAccess/, "Artists must retain control to revoke recipient access.")
      requireText(source.prepare, /Recipient access and replies/, "Secure review should be presented as an after-review utility, not a competing preparation step.")
    },
  },
  {
    id: "S39",
    name: "Preparation hierarchy puts core work before follow-up tools",
    run() {
      requireOrder(source.prepare, ["<ApplicationMediaImportBar", "<ApplicationRequirementMedia", "<ApplicationComposerWorkspace", "<ApplicationRecipientLoopPanel", "<ApplicationTimelinePanel", "<ArtistRecipientConversation"])
    },
  },
  {
    id: "S40",
    name: "No second application editor exists on the production opportunity page",
    run() {
      forbidText(source.opportunities, /ApplicationEditor/, "Production opportunity directory must route into the canonical composer rather than embedding a second editor.")
    },
  },
]

const failures = []
let passed = 0
for (const simulation of simulations) {
  try {
    simulation.run()
    passed += 1
    console.log(`✓ ${simulation.id} ${simulation.name}`)
  } catch (reason) {
    failures.push(`${simulation.id} ${simulation.name}: ${reason instanceof Error ? reason.message : String(reason)}`)
    console.error(`✗ ${simulation.id} ${simulation.name}`)
  }
}

console.log(`\nArtist beta convenience simulations: ${passed}/${simulations.length} passed.`)

if (failures.length) {
  console.error("\nFailures:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("KLEIO artist beta convenience gate passed: application work stays concentrated on the canonical route, duplicate upload and navigation friction are constrained, mobile core actions remain visible, recovery paths stay in context, and external exits are reserved for the artist's actual submission destination.")
