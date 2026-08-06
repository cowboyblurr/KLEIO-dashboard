import fs from "node:fs"

const failures = []

function read(path) {
  if (!fs.existsSync(path)) {
    failures.push(`${path}: missing required layout source`)
    return ""
  }
  return fs.readFileSync(path, "utf8")
}

function requirePattern(source, pattern, message) {
  if (!pattern.test(source)) failures.push(message)
}

function forbidPattern(source, pattern, message) {
  if (pattern.test(source)) failures.push(message)
}

const passportPanel = read("components/kleio/creative-passport-media-panel.tsx")
requirePattern(passportPanel, /SupportingTaskDisclosure/, "Creative Passport document assistance must remain progressively disclosed.")
forbidPattern(passportPanel, /bg-\[linear-gradient|grid gap-3 sm:grid-cols-2/, "Creative Passport document guidance must not return as a decorative hero with secondary feature cards.")

const dashboard = read("components/kleio/artist-dashboard-view.tsx")
forbidPattern(dashboard, /ArtistReadinessNextSteps|ReadinessWidget/, "Artist Dashboard must not render a second readiness system below the primary overview.")

const applicationsPage = read("app/artist-dashboard/applications/page.tsx")
requirePattern(applicationsPage, /FocusedArtistApplications/, "Applications must use the applications-first live workspace.")
forbidPattern(applicationsPage, /LiveArtistApplications/, "The legacy notification-first Applications layout must not return.")

const applications = read("components/kleio/focused-artist-applications.tsx")
const applicationsPosition = applications.indexOf("Your applications")
const notificationsPosition = applications.indexOf("Supporting updates")
if (applicationsPosition < 0 || notificationsPosition < 0 || applicationsPosition > notificationsPosition) {
  failures.push("Applications must appear before the collapsed notification surface.")
}
requirePattern(applications, /<details[\s\S]*Notifications/, "Notifications must remain a collapsed supporting surface.")

const portfolioPage = read("app/artist-dashboard/portfolio/page.tsx")
requirePattern(portfolioPage, /FocusedVisualArtistPortfolioStudio/, "Portfolio must use the artwork-first live workspace.")
forbidPattern(portfolioPage, /\bVisualArtistPortfolioStudio\b/, "The decorative Portfolio hero implementation must not return to the live route.")

const portfolio = read("components/kleio/focused-visual-artist-portfolio-studio.tsx")
requirePattern(portfolio, /title="Portfolio"[\s\S]*Add artwork/, "Portfolio must move directly from the page purpose to artwork controls.")
forbidPattern(portfolio, /bg-\[linear-gradient/, "Portfolio must not place a decorative gradient hero above artwork controls.")

const mediaPage = read("app/artist-dashboard/media/page.tsx")
requirePattern(mediaPage, /FocusedArtistMediaLibrary/, "Media Library must use the utility-first live workspace.")

const mediaLibrary = read("components/kleio/focused-artist-media-library.tsx")
requirePattern(mediaLibrary, /primaryCta=\{\{ label: "Upload document"/, "Media Library must keep its primary upload action in the page header.")
requirePattern(mediaLibrary, /SupportingTaskDisclosure[\s\S]*How private media moves through KLEIO/, "Media Library privacy methodology must remain available through progressive disclosure.")
forbidPattern(mediaLibrary, /One private library for material you bring into KLEIO/, "Media Library must not restore the oversized explanatory hero.")

const importHub = read("components/kleio/import-source-hub.tsx")
requirePattern(importHub, /Upload a CV or artist document/, "Import must lead with the active artist task.")
requirePattern(importHub, /SupportingTaskDisclosure[\s\S]*Connected import sources/, "Deferred providers must remain progressively disclosed.")
forbidPattern(importHub, /mt-6 grid gap-4 md:grid-cols-2[\s\S]*min-h-48/, "Import methodology cards must not dominate before the upload workspace.")

const preparation = read("app/artist-dashboard/applications/prepare/page.tsx")
const primaryPosition = preparation.indexOf("<ApplicationPreparationWorkspace")
for (const component of ["ApplicationRequirementMedia", "ApplicationMediaImportBar", "ApplicationSubmissionCover", "ArtistRecipientConversation", "ApplicationRecipientLoopPanel", "PracticeSubmissionResetControl"]) {
  const position = preparation.indexOf(`<${component}`)
  if (primaryPosition < 0 || position < 0 || primaryPosition > position) {
    failures.push(`Prepare application must place ${component} after the primary application workspace.`)
  }
}
requirePattern(preparation, /overflow-y-auto/, "Prepare application must expose one page-level scroll owner.")
requirePattern(preparation, /\[&>main\]:!overflow-visible/, "The nested ApplicationPreparationWorkspace scroller must remain disabled when embedded.")
requirePattern(preparation, /\[&>button\]:!static/, "The recipient workflow trigger must remain inline instead of floating over the artist's work.")

const cover = read("components/kleio/application-submission-cover.tsx")
requirePattern(cover, /SupportingTaskDisclosure/, "Application cover art must remain supporting context rather than a persistent hero.")

const mediaBar = read("components/kleio/application-media-import-bar.tsx")
requirePattern(mediaBar, /SupportingTaskDisclosure/, "Application media import must remain contextual and closed by default.")
forbidPattern(mediaBar, /shrink-0 border-b/, "Application media import must not return as a persistent page banner.")

const opportunityFilters = read("components/kleio/opportunity-filter-visibility-guard.tsx")
requirePattern(opportunityFilters, /active filter/, "Opportunity filters must remain visible through a compact status row.")
forbidPattern(opportunityFilters, /Filtered opportunity view|These filters are reducing/, "Opportunity filter status must not return as a two-line explanatory banner.")

const profilePreview = read("components/kleio/live-artist-profile-preview.tsx")
forbidPattern(profilePreview, /actions=\{/, "Profile preview must not duplicate edit and portfolio actions inside the profile presentation.")

const messagesPage = read("app/artist-dashboard/messages/page.tsx")
requirePattern(messagesPage, /FocusedLiveMessages/, "Messages must wrap the live inbox in a focused page-flow layout.")
requirePattern(messagesPage, /\[&>div>button\]:!static/, "The institution invitation control must remain inside the Messages flow instead of floating over conversations.")

const disclosure = read("components/kleio/supporting-task-disclosure.tsx")
requirePattern(disclosure, /<details/, "The shared supporting-task pattern must use native progressive disclosure.")
requirePattern(disclosure, /focus-visible/, "The shared supporting-task pattern must retain visible keyboard focus.")

if (failures.length) {
  console.error("KLEIO artist layout hierarchy audit failed:\n" + failures.map((failure) => `- ${failure}`).join("\n"))
  process.exit(1)
}

console.log("KLEIO artist layout hierarchy audit passed: primary work leads, supporting guidance is progressive, persistent controls are constrained, and duplicate priority systems remain removed.")
