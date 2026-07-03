// KLEIO bilingual translation system — English (en) and Spanish (es)

export type KleioLocale = "en" | "es"

export type TranslationParams = Record<string, string | number>

export const KLEIO_LOCALE_STORAGE_KEY = "kleio-locale"
export const DEFAULT_KLEIO_LOCALE: KleioLocale = "en"
export const KLEIO_LOCALE_CHANGED_EVENT = "kleio-locale-changed"

const enMessages: Record<string, string> = {
  // ── nav ──────────────────────────────────────────────────────────────────
  "nav.about": "About",
  "nav.manifesto": "Manifesto",
  "nav.journal": "Journal",
  "nav.exploreArthouse": "Explore Arthouse",
  "nav.or": "or",

  // ── landing ──────────────────────────────────────────────────────────────
  "landing.hero.line1": "Where artistic vision",
  "landing.hero.line2Italic": "meets institutional memory.",
  "landing.tagline.line1": "A shared workspace for artists and institutions",
  "landing.tagline.line2": "to manage submissions, reviews, opportunities,",
  "landing.tagline.line3": "and cultural records with clarity.",
  "landing.login.title": "Enter your KLEIO workspace",
  "landing.login.subtitle":
    "Use the demo login to explore the artist, institution, or collaborator review flow.",
  "landing.login.emailPlaceholder": "Email address",
  "landing.login.passwordPlaceholder": "Password",
  "landing.login.demoWorkspace": "Demo workspace",
  "landing.login.logIn": "Log in",
  "landing.login.enterInstitutionDemo": "Enter Institution Demo",
  "landing.login.enterArtistDemo": "Enter Artist Demo",
  "landing.login.enterCollaboratorDemo": "Enter Collaborator Demo",
  "landing.choosePath.title": "Choose your KLEIO path",
  "landing.choosePath.subtitle": "Start with an artist passport or an institution workspace.",
  "landing.choosePath.iAmArtist": "I am an artist",
  "landing.choosePath.passport": "Passport",
  "landing.choosePath.iRepresentInstitution": "I represent an institution",
  "landing.choosePath.workspace": "Workspace",
  "landing.importAssist.note":
    "Optional Import Assist can prepare draft fields from materials you already maintain.",
  "landing.quote.line1": "To archive is not to forget.",
  "landing.quote.line2": "It is to shape what will be remembered.",
  "landing.login.error": "Use the demo credentials or choose a demo role to continue.",

  // ── auth ─────────────────────────────────────────────────────────────────
  "auth.artist.heading": "Enter the Artist Workspace",
  "auth.artist.description":
    "Use the demo login to explore how an artist manages a Creative Passport, opportunities, and application materials.",
  "auth.institution.heading": "Enter the Institution Workspace",
  "auth.institution.description":
    "Use the demo login to explore how an institution manages submissions, reviewers, shortlists, and reports.",
  "auth.collaborator.heading": "Enter the Collaborator Review Seat",
  "auth.collaborator.description":
    "Use the demo login to review assigned submissions, guidelines, messages, and review progress without entering the full institution workspace.",
  "auth.generic.heading": "Sign in to continue",
  "auth.generic.description":
    "KLEIO workspaces are private. Use the demo login to enter this workspace.",
  "auth.wrongRole.artistToCollaborator":
    "You are currently in the Artist demo. Switch to the Collaborator demo to view this review seat.",
  "auth.wrongRole.artistToInstitution":
    "You are currently in the Artist demo. Switch to the Institution demo to view this workspace.",
  "auth.wrongRole.collaboratorToArtist":
    "You are currently in the Collaborator demo. Switch to the Artist demo to view this workspace.",
  "auth.wrongRole.collaboratorToInstitution":
    "You are currently in the Collaborator demo. Switch to the Institution demo to view this workspace.",
  "auth.wrongRole.institutionToCollaborator":
    "You are currently in the Institution demo. Switch to the Collaborator demo to view this review seat.",
  "auth.wrongRole.institutionToArtist":
    "You are currently in the Institution demo. Switch to the Artist demo to view this workspace.",
  "auth.switchRole": "Switch demo role",
  "auth.goToDashboard": "Go to {dashboard}",
  "auth.dashboard.artist": "Artist Dashboard",
  "auth.dashboard.institution": "Institution Dashboard",
  "auth.dashboard.collaborator": "Collaborator Review Seat",
  "auth.switchTo.artist": "Switch to Artist Demo",
  "auth.switchTo.institution": "Switch to Institution Demo",
  "auth.switchTo.collaborator": "Switch to Collaborator Demo",
  "auth.returnToKleio": "Return to KLEIO",
  "auth.loading": "Loading workspace…",
  "auth.enterInstitutionDemo": "Enter Institution Demo",
  "auth.enterArtistDemo": "Enter Artist Demo",
  "auth.enterCollaboratorDemo": "Enter Collaborator Demo",

  // ── signup.common ────────────────────────────────────────────────────────
  "signup.common.backToKleio": "← Back to KLEIO",
  "signup.common.stepLabel": "Step {current} of {total} · {label}",
  "signup.common.next": "Next",
  "signup.common.back": "Back",
  "signup.common.createPassport": "Create passport",
  "signup.common.enterInstitutionWorkspace": "Enter Institution Workspace",
  "signup.common.suggested": "Suggested",
  "signup.common.edited": "Edited",
  "signup.common.suggestedNote": "Prepared by KLEIO Assist. Review and edit before continuing.",
  "signup.common.suggestedEditable": "Suggested · editable",
  "signup.common.editedByUser": "Edited by user",
  "signup.common.draftSuggested": "· Draft suggested",

  // ── signup.artist ────────────────────────────────────────────────────────
  "signup.artist.title": "Create your Creative Passport",
  "signup.artist.subtitle":
    "Build one reusable profile for grants, residencies, exhibitions, open calls, and portfolio reviews.",
  "signup.artist.step.profileBasics": "Profile basics",
  "signup.artist.step.practiceMaterials": "Practice & materials",
  "signup.artist.step.materialsSuggestions": "Materials & suggestions",
  "signup.artist.step.review": "Review",
  "signup.artist.profileBasics.title": "Profile basics",
  "signup.artist.profileBasics.description":
    "Start with the details most applications ask for first. You can refine every field before using it.",
  "signup.artist.field.artistName": "Artist name",
  "signup.artist.field.location": "Location",
  "signup.artist.field.discipline": "Discipline / practice type",
  "signup.artist.field.website": "Website or portfolio link",
  "signup.artist.field.shortBio": "Short bio",
  "signup.artist.practiceMaterials.title": "Practice & materials",
  "signup.artist.practiceMaterials.description":
    "Add the language, links, and documents that help reviewers understand your work.",
  "signup.artist.field.artistStatement": "Artist statement",
  "signup.artist.field.mediums": "Mediums",
  "signup.artist.field.themes": "Themes / keywords",
  "signup.artist.field.portfolioLinks": "Portfolio links",
  "signup.artist.field.documents": "CV / document placeholder",
  "signup.artist.field.featuredWorks": "Featured works placeholder",
  "signup.artist.placeholder.website": "https://",
  "signup.artist.placeholder.portfolioLinks": "Separate multiple links with commas",
  "signup.artist.placeholder.documents": "e.g. CV, artist statement, portfolio PDF",
  "signup.artist.placeholder.featuredWorks": "Titles or project names",
  "signup.artist.materialsSuggestions.title": "Materials & suggestions",
  "signup.artist.materialsSuggestions.description":
    "Review suggested fields, documents, and imported materials. You can skip Import Assist and build your passport manually.",
  "signup.artist.materialsSuggestions.noImport":
    "No import used yet. Use Import Assist above to connect materials, or continue to review your manual entries.",
  "signup.artist.materialsSuggestions.preparedFields": "Suggested fields prepared for review",
  "signup.artist.materialsSuggestions.suggestionAvailable":
    "Suggestion available — review before replacing",
  "signup.artist.materialsSuggestions.readyToApply": "Ready to apply to empty field",
  "signup.artist.materialsSuggestions.missingChecklist": "Missing fields checklist",
  "signup.artist.materialsSuggestions.allFieldsEntered": "All profile fields entered",
  "signup.artist.materialsSuggestions.fromConnected": "{field} (from connected materials)",
  "signup.artist.materialsSuggestions.documentChecklist": "Document checklist",
  "signup.artist.review.title": "Review your passport",
  "signup.artist.review.description": "Confirm what is ready before entering your artist workspace.",
  "signup.artist.review.heading.profileBasics": "Profile basics",
  "signup.artist.review.heading.creativePassport": "Creative Passport",
  "signup.artist.review.heading.imported": "Imported / suggested fields",
  "signup.artist.review.importedNote":
    "{count} source connected · rejected suggestions excluded",
  "signup.artist.review.importedNotePlural":
    "{count} sources connected · rejected suggestions excluded",
  "signup.artist.review.stillMissing": "Still missing",
  "signup.artist.createPassport": "Enter Artist Workspace",

  // ── signup.institution ───────────────────────────────────────────────────
  "signup.institution.title": "Set up your institution workspace",
  "signup.institution.subtitle":
    "Configure programs, review workflows, required materials, and your review team in one organized environment.",
  "signup.institution.step.institutionDetails": "Institution details",
  "signup.institution.step.workspaceSetup": "Workspace setup",
  "signup.institution.step.reviewTeam": "Review team",
  "signup.institution.step.materialsSuggestions": "Materials & suggestions",
  "signup.institution.step.review": "Review",
  "signup.institution.institutionDetails.title": "Institution details",
  "signup.institution.institutionDetails.description":
    "Start with the public-facing details and mission context your programs will reference.",
  "signup.institution.field.institutionName": "Institution name",
  "signup.institution.field.institutionType": "Institution type",
  "signup.institution.field.location": "Location",
  "signup.institution.field.website": "Website",
  "signup.institution.field.publicDescription": "Public description",
  "signup.institution.workspaceSetup.title": "Workspace setup",
  "signup.institution.workspaceSetup.description":
    "Define how your team manages programs, review processes, and reporting needs.",
  "signup.institution.field.missionStatement": "Mission statement",
  "signup.institution.field.programType": "Program type",
  "signup.institution.field.reviewProcessType": "Review process type",
  "signup.institution.field.requiredMaterials": "Application materials required",
  "signup.institution.field.reviewerRoles": "Reviewer roles",
  "signup.institution.field.committeeSize": "Committee size",
  "signup.institution.field.reportingNeeds": "Reporting needs",
  "signup.institution.field.importStructure": "Import structure",
  "signup.institution.reviewTeam.title": "Review team",
  "signup.institution.reviewTeam.description":
    "Invite reviewers, jurors, committee members, curators, or advisors into limited review seats. They will only see the programs, submissions, guidelines, and messages assigned to their role.",
  "signup.institution.reviewTeam.optionalNote":
    "Optional setup · You can skip this and invite collaborators later from Committee.",
  "signup.institution.reviewTeam.metric.preparedCollaborators": "Prepared collaborators",
  "signup.institution.reviewTeam.metric.preparedInvites": "Prepared invites",
  "signup.institution.reviewTeam.metric.limitedSeats": "Limited seats",
  "signup.institution.reviewTeam.metric.setupCompleteness": "Setup completeness",
  "signup.institution.reviewTeam.addCollaborator": "Add collaborator",
  "signup.institution.reviewTeam.field.name": "Name",
  "signup.institution.reviewTeam.field.email": "Email",
  "signup.institution.reviewTeam.field.role": "Role",
  "signup.institution.reviewTeam.field.assignedProgram": "Assigned program",
  "signup.institution.reviewTeam.field.accessScope": "Access scope",
  "signup.institution.reviewTeam.field.inviteTiming": "Invite timing",
  "signup.institution.reviewTeam.addMember": "Add to review team",
  "signup.institution.reviewTeam.skip": "Skip for now",
  "signup.institution.reviewTeam.preparedReviewTeam": "Prepared review team",
  "signup.institution.reviewTeam.demoNote":
    "Demo invite records for limited review seats. Collaborators will only see assigned context.",
  "signup.institution.reviewTeam.error.nameRequired": "Enter a collaborator name before adding.",
  "signup.institution.reviewTeam.error.emailInvalid": "Enter a valid email address before adding.",
  "signup.institution.review.summary": "Review workspace setup",
  "signup.institution.review.description": "Confirm what is ready before entering your institution workspace.",
  "signup.institution.review.heading.institutionDetails": "Institution details",
  "signup.institution.review.heading.workspaceSetup": "Workspace setup",
  "signup.institution.review.heading.reviewTeam": "Review team",
  "signup.institution.enterWorkspace": "Enter Institution Workspace",

  // ── importAssist ─────────────────────────────────────────────────────────
  "importAssist.title": "KLEIO Import Assist",
  "importAssist.optional": "Optional",
  "importAssist.connected": "{count} connected",
  "importAssist.artist.intro": "Prepare draft passport fields from materials you already maintain.",
  "importAssist.institution.intro": "Prepare a draft workspace from materials your team already maintains.",
  "importAssist.artist.approval": "You review and approve every detail.",
  "importAssist.institution.approval": "Your team approves what becomes official.",
  "importAssist.use": "Use Import Assist",
  "importAssist.hide": "Hide Import Assist",
  "importAssist.preparedForReview": "Suggested fields prepared for review",
  "importAssist.sourcesConnected": "Sources connected",
  "importAssist.suggestedFields": "Suggested fields",
  "importAssist.readyToApply": "Ready to apply",
  "importAssist.suggestionAvailable": "Suggestion available",
  "importAssist.youApproveOfficial": "You approve what becomes official",
  "importAssist.organizeDraft":
    "KLEIO can help organize a first draft from materials you already maintain. You remain the author. Review and edit every suggestion. Apply suggestions to empty fields only.",

  // ── nav.artist ───────────────────────────────────────────────────────────
  "nav.artist.workspace": "Artist Workspace",
  "nav.artist.overview": "Overview",
  "nav.artist.creativePassport": "Creative Passport",
  "nav.artist.portfolio": "Portfolio",
  "nav.artist.opportunities": "Opportunities",
  "nav.artist.applications": "Applications",
  "nav.artist.collaborators": "Collaborators",
  "nav.artist.calendar": "Calendar",
  "nav.artist.messages": "Messages",
  "nav.artist.funding": "Funding",
  "nav.artist.insights": "Insights",
  "nav.artist.settings": "Settings",
  "nav.artist.tagline.title": "Focus on your art.",
  "nav.artist.tagline.body": "KLEIO keeps the admin organized.",

  // ── nav.institution ──────────────────────────────────────────────────────
  "nav.institution.section.overview": "Overview",
  "nav.institution.section.manage": "Manage",
  "nav.institution.section.collaborate": "Collaborate",
  "nav.institution.section.analyze": "Analyze",
  "nav.institution.section.configure": "Configure",
  "nav.institution.overview": "Overview",
  "nav.institution.programs": "Programs",
  "nav.institution.submissions": "Submissions",
  "nav.institution.artists": "Artists",
  "nav.institution.reviewQueue": "Review Queue",
  "nav.institution.shortlist": "Shortlist",
  "nav.institution.committee": "Committee",
  "nav.institution.messages": "Messages",
  "nav.institution.reports": "Reports",
  "nav.institution.activityLog": "Activity Log",
  "nav.institution.templates": "Templates",
  "nav.institution.settings": "Settings",

  // ── nav.collaborator ─────────────────────────────────────────────────────
  "nav.collaborator.workspace": "Collaborator Review Seat",
  "nav.collaborator.overview": "Overview",
  "nav.collaborator.assignments": "My Assignments",
  "nav.collaborator.reviewQueue": "Review Queue",
  "nav.collaborator.guidelines": "Guidelines",
  "nav.collaborator.messages": "Messages",
  "nav.collaborator.submittedReviews": "Submitted Reviews",
  "nav.collaborator.focusedSeat.title": "Focused review seat",
  "nav.collaborator.focusedSeat.body": "Only assigned review context is visible.",

  // ── artist.workspace ─────────────────────────────────────────────────────
  "artist.workspace.overview.greeting": "Good morning, {name}.",
  "artist.workspace.overview.description":
    "Stay focused on the work. KLEIO keeps your applications, materials, and opportunities in view.",
  "artist.workspace.passport.eyebrow": "Creative Passport",
  "artist.workspace.passport.title": "Creative Passport",
  "artist.workspace.passport.description":
    "Manage your reusable artist profile for grants, residencies, exhibitions, open calls, and institutional review.",
  "artist.workspace.passport.cta.viewPublicProfile": "View Public Profile",
  "artist.workspace.passport.cta.backToOverview": "Back to Artist Overview",
  "artist.workspace.passport.metric.completeness": "Passport completeness",
  "artist.workspace.passport.metric.materialsReady": "Materials ready",
  "artist.workspace.passport.metric.selectedWorks": "Selected works",
  "artist.workspace.passport.metric.activeApplications": "Active applications",
  "artist.workspace.portfolio.eyebrow": "Portfolio library",
  "artist.workspace.portfolio.title": "Portfolio",
  "artist.workspace.portfolio.description":
    "Organize selected works, media, installation views, and portfolio materials for future applications.",
  "artist.workspace.portfolio.cta.viewPassport": "View Creative Passport",
  "artist.workspace.portfolio.cta.viewPublicProfile": "View Public Profile",
  "artist.workspace.opportunities.eyebrow": "Opportunity discovery",
  "artist.workspace.opportunities.title": "Opportunities",
  "artist.workspace.opportunities.description":
    "Discover grants, residencies, exhibitions, and open calls that align with your Creative Passport.",
  "artist.workspace.opportunities.cta.prepareDraft": "Prepare Application Draft",
  "artist.workspace.opportunities.cta.reviewPassport": "Review Passport",
  "artist.workspace.applications.eyebrow": "Application tracker",
  "artist.workspace.applications.title": "Applications",
  "artist.workspace.applications.description":
    "Track drafts, submitted applications, missing materials, responses, and deadlines.",
  "artist.workspace.applications.cta.exploreOpportunities": "Explore Opportunities",
  "artist.workspace.applications.cta.reviewCalendar": "Review Calendar",
  "artist.workspace.applications.metric.draft": "Draft applications",
  "artist.workspace.applications.metric.submitted": "Submitted",
  "artist.workspace.applications.metric.underReview": "Under review",
  "artist.workspace.applications.metric.awarded": "Awarded",
  "artist.workspace.applications.metric.pendingDecisions": "Pending decisions",
  "artist.workspace.applications.column.program": "Program",
  "artist.workspace.applications.column.status": "Status",
  "artist.workspace.applications.column.dueDate": "Due Date",
  "artist.workspace.applications.column.updated": "Updated",
  "artist.workspace.applications.column.nextAction": "Next Action",
  "artist.workspace.applications.nextActions.title": "Next actions",
  "artist.workspace.applications.nextActions.body": "{count} tracked actions across open applications.",
  "artist.workspace.applications.deadlinePressure.title": "Deadline pressure",
  "artist.workspace.applications.deadlinePressure.body":
    "{count} deadlines arrive within the next 14 days. Next: {date}.",
  "artist.workspace.applications.cta.openCalendar": "Open calendar →",
  "artist.workspace.passport.materialsReadiness.title": "Materials readiness",
  "artist.workspace.passport.materialsReadiness.body":
    "Organize your statement, CV, portfolio, work samples, references, and support documents.",
  "artist.workspace.passport.ready": "Ready",
  "artist.workspace.passport.needsReview": "Needs review",
  "artist.workspace.passport.publicPreview.title": "Public Creative Passport preview",
  "artist.workspace.passport.publicPreview.description": "How institutions see your public profile identity.",
  "artist.workspace.passport.cta.openPublicProfile": "Open public profile",
  "artist.workspace.passport.profileBasics.title": "Profile basics",
  "artist.workspace.passport.profileBasics.body":
    "Keep your bio, location, practice language, contact links, and public profile identity current.",
  "artist.workspace.passport.reusableAnswers.title": "Reusable answers",
  "artist.workspace.passport.reusableAnswers.body":
    "{count} application tasks are currently tracked across open programs.",
  "artist.workspace.passport.sharingControls.title": "Sharing controls",
  "artist.workspace.passport.sharingControls.body":
    "Choose what to share publicly, what to keep private, and what to prepare for each opportunity.",
  "artist.workspace.passport.sharing.publicBio": "Public bio",
  "artist.workspace.passport.sharing.privateCvDraft": "Private CV draft",
  "artist.workspace.passport.artistMaterials.title": "Artist materials",
  "artist.workspace.opportunities.searchPlaceholder": "Search opportunities, types, deadlines...",
  "artist.workspace.opportunities.filter.allTypes": "All Types",
  "artist.workspace.opportunities.filter.grants": "Grants",
  "artist.workspace.opportunities.filter.residencies": "Residencies",
  "artist.workspace.opportunities.filter.fitScore": "Fit Score",
  "artist.workspace.opportunities.filter.deadline": "Deadline",
  "artist.workspace.opportunities.deadline": "Deadline {date}",
  "artist.workspace.opportunities.fitScore": "{pct}% fit",
  "artist.workspace.opportunities.missingMaterialOne": "{count} missing material",
  "artist.workspace.opportunities.missingMaterialOther": "{count} missing materials",
  "artist.workspace.opportunities.readinessSummary.title": "Readiness summary",
  "artist.workspace.opportunities.readinessSummary.complete": "Your passport is {pct}% complete.",
  "artist.workspace.opportunities.readinessSummary.gapOne":
    "{count} material still needs review before high-fit applications.",
  "artist.workspace.opportunities.readinessSummary.gapOther":
    "{count} materials still need review before high-fit applications.",
  "artist.workspace.opportunities.cta.reviewPassportLink": "Review passport →",
  "artist.workspace.opportunities.fundingOutlook.title": "Funding outlook",
  "artist.workspace.opportunities.fundingOutlook.body":
    "{count} active opportunities tracked with {amount} in potential funding.",
  "artist.workspace.funding.metric.potentialFunding": "Potential funding",
  "artist.workspace.funding.metric.estimatedFit": "Estimated fit",
  "artist.workspace.funding.metric.completeness": "Completeness",
  "artist.workspace.funding.metric.timelineConfidence": "Timeline confidence",
  "artist.workspace.funding.section.opportunities": "Funding opportunities",
  "artist.workspace.funding.column.program": "Program",
  "artist.workspace.funding.column.amount": "Amount",
  "artist.workspace.funding.column.fit": "Fit",
  "artist.workspace.funding.column.completeness": "Completeness",
  "artist.workspace.funding.column.timeline": "Timeline",
  "artist.workspace.funding.missingRisk.title": "Missing-material risk",
  "artist.workspace.funding.missingRisk.bodyOne":
    "{count} active opportunity depends on materials not yet marked ready in your passport.",
  "artist.workspace.funding.missingRisk.bodyOther":
    "{count} active opportunities depend on materials not yet marked ready in your passport.",
  "artist.workspace.funding.missingChip": "{program}: {count} missing",
  "artist.workspace.funding.cta.reviewPassportMaterials": "Review passport materials →",
  "artist.workspace.collaborators.eyebrow": "Artist spectrum matches",
  "artist.workspace.collaborators.title": "Collaborators",
  "artist.workspace.collaborators.description":
    "Discover artists and collaborators with related practices, themes, locations, or opportunity interests.",
  "artist.workspace.collaborators.cta.openMessages": "Open Messages",
  "artist.workspace.collaborators.cta.exploreOpportunities": "Explore Opportunities",
  "artist.workspace.calendar.eyebrow": "Deadline calendar",
  "artist.workspace.calendar.title": "Calendar",
  "artist.workspace.calendar.description":
    "View upcoming deadlines, application milestones, follow-ups, and decision windows.",
  "artist.workspace.calendar.cta.viewApplications": "View Applications",
  "artist.workspace.calendar.cta.exploreOpportunities": "Explore Opportunities",
  "artist.workspace.messages.eyebrow": "Messaging",
  "artist.workspace.messages.title": "Messages",
  "artist.workspace.messages.description":
    "Keep applicant communication, missing-material requests, collaborator notes, and institution updates in context.",
  "artist.workspace.messages.cta.reviewApplications": "Review Applications",
  "artist.workspace.messages.cta.reviewPassport": "Review Passport",
  "artist.workspace.messages.inbox": "Inbox",
  "artist.workspace.funding.eyebrow": "Funding readiness",
  "artist.workspace.funding.title": "Funding",
  "artist.workspace.funding.description":
    "Understand potential funding, application readiness, and opportunity fit across grants and programs.",
  "artist.workspace.funding.cta.exploreOpportunities": "Explore Opportunities",
  "artist.workspace.funding.cta.reviewPassport": "Review Passport",
  "artist.workspace.insights.eyebrow": "Quiet insights",
  "artist.workspace.insights.title": "Quiet Insights",
  "artist.workspace.insights.description":
    "Review practical signals about your materials, opportunities, deadlines, and application readiness.",
  "artist.workspace.insights.cta.reviewPassport": "Review Passport",
  "artist.workspace.insights.cta.exploreOpportunities": "Explore Opportunities",
  "artist.workspace.settings.eyebrow": "Workspace settings",
  "artist.workspace.settings.title": "Artist Settings",
  "artist.workspace.settings.description":
    "Manage artist workspace preferences, profile visibility, demo settings, and Creative Passport defaults.",
  "artist.workspace.settings.cta.viewPublicProfile": "View Public Profile",
  "artist.workspace.settings.cta.backToOverview": "Back to Artist Overview",

  // ── institution.workspace ────────────────────────────────────────────────
  "institution.workspace.dashboard.greeting": "Good morning, {name}.",
  "institution.workspace.dashboard.description":
    "Manage submissions, reviewer progress, missing materials, shortlists, and reports from one organized workspace.",
  "institution.workspace.dashboard.demoLabel": "Demo workspace",
  "institution.workspace.committee.title": "Committee",
  "institution.workspace.committee.description":
    "Coordinate reviewers, jurors, and collaborators around the same submission context.",
  "institution.workspace.committee.cta.previewCollaboratorSeat": "Preview Collaborator Review Seat",
  "institution.workspace.committee.metric.pendingVote": "Pending committee vote",
  "institution.workspace.committee.metric.pendingActions": "Pending reviewer actions",
  "institution.workspace.committee.metric.completion": "Reviewer completion",
  "institution.workspace.committee.preparedReviewTeam": "Prepared review team",
  "institution.workspace.committee.preparedReviewTeamNote":
    "Collaborators prepared during institution signup. These are demo invite records for limited review seats.",
  "institution.workspace.committee.metric.collaborators": "Collaborators",
  "institution.workspace.committee.metric.preparedInvites": "Prepared invites",
  "institution.workspace.committee.metric.limitedSeats": "Limited seats",
  "institution.workspace.committee.metric.programsCovered": "Programs covered",
  "institution.workspace.committee.invite.prepared": "Prepared invite",
  "institution.workspace.committee.invite.deferred": "Deferred invite",
  "institution.workspace.committee.limitedReviewSeat": "Limited review seat",
  "institution.workspace.committee.scenario.eyebrow": "Scenario · Reviewer bottleneck",
  "institution.workspace.committee.scenario.body":
    "Two reviews complete. One committee vote is still pending before this finalist can advance.",
  "institution.workspace.committee.reviewerProgress":
    "Reviewer progress {completed}/{total} complete · {pending} pending",
  "institution.workspace.committee.section.awaitingVote": "Awaiting vote",
  "institution.workspace.committee.reviewsCompleted": "Reviews completed {completed}/{total}",
  "institution.workspace.committee.reviewsPending": "{pending} pending",
  "institution.workspace.committee.section.reviewerProgress": "Reviewer progress",
  "institution.workspace.committee.cta.previewReviewerSeat": "Preview reviewer seat",
  "institution.workspace.committee.footer.assignmentsOne":
    "{count} open review assignment across active programs.",
  "institution.workspace.committee.footer.assignmentsOther":
    "{count} open review assignments across active programs.",
  "institution.workspace.committee.cta.messagePendingReviewers": "Message pending reviewers",
  "institution.workspace.reports.title": "Reports",
  "institution.workspace.reports.description":
    "Preserve program outcomes, reviewer progress, shortlist decisions, and institutional records.",
  "institution.workspace.reports.prepare.title": "Prepare Report",
  "institution.workspace.reports.prepare.eyebrow": "Report builder",
  "institution.workspace.reports.prepare.description":
    "Start a structured report from program activity, review progress, shortlist decisions, and institutional notes.",
  "institution.workspace.reports.prepare.cta.backToReports": "Back to Reports",
  "institution.workspace.submissions.eyebrow": "Submission database",
  "institution.workspace.submissions.title": "Submissions",
  "institution.workspace.submissions.description":
    "Search, filter, and compare submissions without losing context across files, forms, or review notes.",
  "institution.workspace.submissions.cta.openReviewQueue": "Open Review Queue",
  "institution.workspace.submissions.cta.searchArtists": "Search Artists",
  "institution.workspace.programs.title": "Programs & Open Calls",
  "institution.workspace.programs.description":
    "Manage open calls, grants, residencies, and exhibition programs from draft to final selection.",
  "institution.workspace.activityLog.eyebrow": "Institutional memory",
  "institution.workspace.activityLog.title": "Activity Log",
  "institution.workspace.activityLog.description":
    "Preserve review activity, status changes, messages, shortlist movement, and report history in one institutional record.",
  "institution.workspace.activityLog.cta.prepareReport": "Prepare Report",
  "institution.workspace.activityLog.cta.backToDashboard": "Back to Dashboard",
  "institution.workspace.templates.eyebrow": "Template library",
  "institution.workspace.templates.title": "Templates",
  "institution.workspace.templates.description":
    "Save reusable language, criteria, messages, and review structures for future programs.",
  "institution.workspace.templates.cta.createTemplate": "Create Template",
  "institution.workspace.templates.cta.createOpenCall": "Create Open Call",
  "institution.workspace.settings.eyebrow": "Workspace settings",
  "institution.workspace.settings.title": "Workspace Settings",
  "institution.workspace.settings.description":
    "Manage workspace details, demo preferences, team roles, and review defaults.",
  "institution.workspace.settings.cta.viewProfile": "View Institution Profile",
  "institution.workspace.settings.cta.backToDashboard": "Back to Dashboard",

  // ── collaborator ─────────────────────────────────────────────────────────
  "collaborator.overview.eyebrow": "Collaborator Review Seat",
  "collaborator.overview.title":
    "Review assigned submissions for {institution} without entering the full institution workspace.",
  "collaborator.overview.nextDeadline": "Next deadline: {date}",
  "collaborator.overview.completionRate": "{rate}% complete",
  "collaborator.overview.cta.continueReviewing": "Continue Reviewing",
  "collaborator.overview.cta.viewGuidelines": "View Guidelines",
  "collaborator.overview.metric.assignedReviews": "Assigned Reviews",
  "collaborator.overview.metric.completed": "Completed",
  "collaborator.overview.metric.pending": "Pending",
  "collaborator.overview.metric.completionRate": "Completion Rate",
  "collaborator.overview.metric.nextDeadline": "Next Deadline",
  "collaborator.assignments.eyebrow": "Assigned submissions",
  "collaborator.assignments.title": "My Assignments",
  "collaborator.assignments.description":
    "Only submissions assigned to you for review. No global artist directory or institution-wide queue.",
  "collaborator.assignments.cta.openReviewQueue": "Open Review Queue",
  "collaborator.reviewQueue.eyebrow": "Focused review queue",
  "collaborator.reviewQueue.title": "Review Queue",
  "collaborator.reviewQueue.description":
    "Work through assigned submissions only. Rubric, notes, and recommendation controls are scoped to your review seat.",
  "collaborator.guidelines.eyebrow": "Review criteria",
  "collaborator.guidelines.title": "Guidelines",
  "collaborator.guidelines.description":
    "Program rubrics and required materials for your assigned review work only.",
  "collaborator.guidelines.cta.openReviewQueue": "Open Review Queue",
  "collaborator.messages.eyebrow": "Assignment messages",
  "collaborator.messages.title": "Messages",
  "collaborator.messages.description":
    "Focused reviewer and committee threads related to your assignments.",
  "collaborator.submitted.eyebrow": "Review record",
  "collaborator.submitted.title": "Submitted Reviews",
  "collaborator.submitted.description":
    "Your completed reviews and recommendations for assigned submissions.",
  "collaborator.submitted.cta.backToQueue": "Back to Queue",
  "collaborator.deadline.overdue": "{days} days overdue",
  "collaborator.deadline.dueToday": "Due today",
  "collaborator.deadline.daysLeft": "{days} days left",
  "collaborator.deadline.label": "Deadline {date}",
  "collaborator.overview.section.myReviewQueue": "My Review Queue",
  "collaborator.overview.cta.openQueue": "Open queue →",
  "collaborator.overview.queue.awaitingOne": "{count} submission awaiting your review.",
  "collaborator.overview.queue.awaitingOther": "{count} submissions awaiting your review.",
  "collaborator.overview.queue.dueSoon": "{count} due within 14 days.",
  "collaborator.overview.queue.overdue": "{count} overdue.",
  "collaborator.overview.queue.empty": "All assigned reviews are complete.",
  "collaborator.overview.cta.openReview": "Open Review",
  "collaborator.overview.section.programGuidelines": "Program Guidelines",
  "collaborator.overview.guidelines.summaryOne": "{count} assigned program with rubric and required materials.",
  "collaborator.overview.guidelines.summaryOther": "{count} assigned programs with rubric and required materials.",
  "collaborator.overview.cta.viewAllGuidelines": "View all guidelines →",
  "collaborator.overview.section.messages": "Messages",
  "collaborator.overview.messages.summaryOne": "{count} assignment-related thread · {unread} unread",
  "collaborator.overview.messages.summaryOther": "{count} assignment-related threads · {unread} unread",
  "collaborator.overview.messages.empty": "No collaborator-specific messages in this demo dataset.",
  "collaborator.overview.cta.openMessages": "Open messages →",
  "collaborator.overview.section.completedReviews": "Completed Reviews",
  "collaborator.overview.cta.viewSubmitted": "View submitted →",
  "collaborator.overview.completed.empty": "No completed reviews yet.",
  "collaborator.overview.score": "Score {score}",
  "collaborator.overview.recordedWithoutScore": "Recorded without score",
  "collaborator.assignments.metric.assigned": "Assigned",
  "collaborator.assignments.metric.pendingReview": "Pending review",
  "collaborator.assignments.metric.inProgress": "In progress",
  "collaborator.assignments.metric.completed": "Completed",
  "collaborator.assignments.searchPlaceholder": "Search artist, project, program, or status…",
  "collaborator.assignments.column.artist": "Artist",
  "collaborator.assignments.column.project": "Project",
  "collaborator.assignments.column.program": "Program",
  "collaborator.assignments.column.submission": "Submission",
  "collaborator.assignments.column.review": "Review",
  "collaborator.assignments.column.deadline": "Deadline",
  "collaborator.assignments.column.timing": "Timing",
  "collaborator.assignments.cta.openReview": "Open Review",
  "collaborator.reviewQueue.section.pending": "Pending assignments",
  "collaborator.reviewQueue.queueCountOne": "{count} submission in your queue.",
  "collaborator.reviewQueue.queueCountOther": "{count} submissions in your queue.",
  "collaborator.reviewQueue.empty": "No pending reviews. View submitted work in Submitted Reviews.",
  "collaborator.reviewQueue.selectedReview": "Selected review",
  "collaborator.reviewQueue.rubricPreview": "Rubric preview",
  "collaborator.reviewQueue.noRubric": "No rubric available for this program.",
  "collaborator.reviewQueue.reviewNotes": "Review notes",
  "collaborator.reviewQueue.notesPlaceholder": "Draft review notes for this submission…",
  "collaborator.reviewQueue.notesFootnote": "Foundation field — notes stay private to your review seat in this demo.",
  "collaborator.reviewQueue.recommendation": "Recommendation",
  "collaborator.reviewQueue.recommendation.advance": "Advance",
  "collaborator.reviewQueue.recommendation.shortlist": "Shortlist",
  "collaborator.reviewQueue.recommendation.hold": "Hold",
  "collaborator.reviewQueue.recommendation.decline": "Decline",
  "collaborator.reviewQueue.saveDraftDemo": "Save Draft (Demo)",
  "collaborator.reviewQueue.submitReviewDemo": "Submit Review (Demo)",
  "collaborator.reviewQueue.demoAction": "Demo action",
  "collaborator.reviewQueue.selectAssignment": "Select a pending assignment to open the review workspace.",
  "collaborator.guidelines.conduct.title": "Review conduct",
  "collaborator.guidelines.conduct.body":
    "Review only the materials assigned to you. Use the rubric provided by the institution. Flag conflicts before submitting a recommendation.",
  "collaborator.guidelines.cta.openAssignedReviews": "Open assigned reviews →",
  "collaborator.guidelines.rubric": "Rubric",
  "collaborator.guidelines.requiredMaterials": "Required materials",
  "collaborator.guidelines.conflict.title": "Conflict of interest reminder",
  "collaborator.guidelines.conflict.body":
    "If you have a personal, professional, or financial relationship with an applicant, notify the program team before completing your review. Do not score or recommend on assignments where a conflict exists.",
  "collaborator.messages.metric.scopedThreads": "Scoped threads",
  "collaborator.messages.metric.unread": "Unread",
  "collaborator.messages.inbox": "Inbox",
  "collaborator.messages.empty": "No collaborator-specific messages in this demo dataset.",
  "collaborator.messages.unread": "Unread",
  "collaborator.messages.reminders.title": "Reviewer reminders",
  "collaborator.messages.reminders.body":
    "Assignment-related reminders appear here when the institution or committee needs your input.",
  "collaborator.messages.contact.title": "Institution contact",
  "collaborator.messages.contact.body": "KLEIO Arthouse Program Team · program@kleioarthouse.demo",
  "collaborator.messages.contact.note": "For deadline extensions, conflict disclosures, or access issues.",
  "collaborator.messages.context.title": "Assignment context",
  "collaborator.messages.context.bodyOne": "{reviews} assigned reviews across {programs} program.",
  "collaborator.messages.context.bodyOther": "{reviews} assigned reviews across {programs} programs.",
  "collaborator.messages.cta.viewAssignments": "View assignments →",
  "collaborator.submitted.metric.submitted": "Submitted",
  "collaborator.submitted.metric.completionRate": "Completion rate",
  "collaborator.submitted.metric.pendingVoteContext": "Pending vote context",
  "collaborator.submitted.column.artist": "Artist",
  "collaborator.submitted.column.project": "Project",
  "collaborator.submitted.column.program": "Program",
  "collaborator.submitted.column.score": "Score",
  "collaborator.submitted.column.recommendation": "Recommendation",
  "collaborator.submitted.column.status": "Status",
  "collaborator.submitted.empty": "No submitted reviews yet.",
  "collaborator.submitted.recordedWithoutScore": "Recorded without score",
  "collaborator.submitted.returnToOverview": "Return to overview",

  // ── profile ──────────────────────────────────────────────────────────────
  "profile.creativePassport": "Creative Passport",
  "profile.selectedWorks": "Selected Works",
  "profile.aboutPractice": "About / Practice",
  "profile.materialsReady": "Materials Ready",
  "profile.themes": "Themes",
  "profile.availability": "Availability",
  "profile.publicProfile": "Public Profile",
  "profile.institutionProfile": "Institution Profile",
  "profile.syntheticDemo": "Synthetic demo profile",
  "profile.artistStatement": "Artist Statement",
  "profile.material.bio": "Bio",
  "profile.material.artistStatement": "Artist Statement",
  "profile.material.cvResume": "CV / Resume",
  "profile.material.portfolio": "Portfolio",
  "profile.material.workSamples": "Work Samples",
  "profile.material.references": "References",

  // ── status ───────────────────────────────────────────────────────────────
  "status.draft": "Draft",
  "status.submitted": "Submitted",
  "status.underReview": "Under Review",
  "status.waiting": "Waiting",
  "status.interview": "Interview",
  "status.awarded": "Awarded",
  "status.declined": "Declined",
  "status.complete": "Complete",
  "status.completed": "Completed",
  "status.inProgress": "In Progress",
  "status.pending": "Pending",
  "status.pendingVote": "Pending Vote",
  "status.shortlisted": "Shortlisted",
  "status.materialsComplete": "Materials Complete",
  "status.needsMaterials": "Needs materials",
  "status.ready": "Ready",
  "status.preparedForScoring": "Prepared for scoring",
  "status.notStarted": "Not Started",
  "status.started": "Started",
  "status.requestedInfo": "Requested Info",
  "status.inReview": "In Review",
  "status.pendingInfo": "Pending Info",
  "status.deferred": "Deferred",
  "status.prepared": "Prepared",

  // ── common ───────────────────────────────────────────────────────────────
  "common.demo": "Demo",
  "common.remove": "Remove",
  "common.add": "Add",
  "common.skipForNow": "Skip for now",
  "common.open": "Open",
  "common.viewAll": "View all",
  "common.search": "Search",
  "common.filter": "Filter",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.edit": "Edit",
  "common.optional": "Optional",
  "common.loading": "Loading…",
  "common.back": "Back",
  "common.next": "Next",
  "common.continue": "Continue",
  "common.preview": "Preview",
  "common.prepareDraft": "Prepare Draft",
  "common.viewGuidelines": "View Guidelines",
  "common.continueReviewing": "Continue Reviewing",
  "common.locale.en": "EN",
  "common.locale.es": "ES",
  "common.copyright": "© 2026 KLEIO ARTHOUSE",

  // ── pluralization helpers ────────────────────────────────────────────────
  "plural.source.one": "{count} source connected",
  "plural.source.other": "{count} sources connected",
  "plural.review.one": "{count} review",
  "plural.review.other": "{count} reviews",
  "plural.submission.one": "{count} submission",
  "plural.submission.other": "{count} submissions",
}

const esMessages: Record<string, string> = {
  // ── nav ──────────────────────────────────────────────────────────────────
  "nav.about": "Acerca de",
  "nav.manifesto": "Manifiesto",
  "nav.journal": "Diario",
  "nav.exploreArthouse": "Explorar Arthouse",
  "nav.or": "o",

  // ── landing ──────────────────────────────────────────────────────────────
  "landing.hero.line1": "Donde la visión artística",
  "landing.hero.line2Italic": "se encuentra con la memoria institucional.",
  "landing.tagline.line1": "Un espacio compartido para artistas e instituciones",
  "landing.tagline.line2": "para gestionar postulaciones, revisiones, oportunidades",
  "landing.tagline.line3": "y registros culturales con claridad.",
  "landing.login.title": "Entra a tu espacio KLEIO",
  "landing.login.subtitle":
    "Usa el acceso demo para explorar el flujo de artista, institución o colaborador en revisión.",
  "landing.login.emailPlaceholder": "Correo electrónico",
  "landing.login.passwordPlaceholder": "Contraseña",
  "landing.login.demoWorkspace": "Espacio demo",
  "landing.login.logIn": "Iniciar sesión",
  "landing.login.enterInstitutionDemo": "Entrar al demo institucional",
  "landing.login.enterArtistDemo": "Entrar al demo de artista",
  "landing.login.enterCollaboratorDemo": "Entrar al demo de colaborador",
  "landing.choosePath.title": "Elige tu camino en KLEIO",
  "landing.choosePath.subtitle": "Comienza con un Pasaporte Creativo o un espacio institucional.",
  "landing.choosePath.iAmArtist": "Soy artista",
  "landing.choosePath.passport": "Pasaporte",
  "landing.choosePath.iRepresentInstitution": "Represento una institución",
  "landing.choosePath.workspace": "Espacio",
  "landing.importAssist.note":
    "Import Assist opcional puede preparar borradores de campos a partir de materiales que ya mantienes.",
  "landing.quote.line1": "Archivar no es olvidar.",
  "landing.quote.line2": "Es dar forma a lo que será recordado.",
  "landing.login.error": "Usa las credenciales demo o elige un rol demo para continuar.",

  // ── auth ─────────────────────────────────────────────────────────────────
  "auth.artist.heading": "Entra al Espacio del artista",
  "auth.artist.description":
    "Usa el acceso demo para explorar cómo un artista gestiona su Pasaporte Creativo, oportunidades y materiales de postulación.",
  "auth.institution.heading": "Entra al Espacio institucional",
  "auth.institution.description":
    "Usa el acceso demo para explorar cómo una institución gestiona postulaciones, revisores, listas cortas e informes.",
  "auth.collaborator.heading": "Entra al Espacio de revisión para colaboradores",
  "auth.collaborator.description":
    "Usa el acceso demo para revisar postulaciones asignadas, lineamientos, mensajes y avance sin entrar al espacio institucional completo.",
  "auth.generic.heading": "Inicia sesión para continuar",
  "auth.generic.description":
    "Los espacios de KLEIO son privados. Usa el acceso demo para entrar a este espacio.",
  "auth.wrongRole.artistToCollaborator":
    "Estás en el demo de artista. Cambia al demo de colaborador para ver este espacio de revisión limitado.",
  "auth.wrongRole.artistToInstitution":
    "Estás en el demo de artista. Cambia al demo institucional para ver este espacio.",
  "auth.wrongRole.collaboratorToArtist":
    "Estás en el demo de colaborador. Cambia al demo de artista para ver este espacio.",
  "auth.wrongRole.collaboratorToInstitution":
    "Estás en el demo de colaborador. Cambia al demo institucional para ver este espacio.",
  "auth.wrongRole.institutionToCollaborator":
    "Estás en el demo institucional. Cambia al demo de colaborador para ver este espacio de revisión limitado.",
  "auth.wrongRole.institutionToArtist":
    "Estás en el demo institucional. Cambia al demo de artista para ver este espacio.",
  "auth.switchRole": "Cambiar rol demo",
  "auth.goToDashboard": "Ir a {dashboard}",
  "auth.dashboard.artist": "Panel del artista",
  "auth.dashboard.institution": "Panel institucional",
  "auth.dashboard.collaborator": "Espacio de revisión para colaboradores",
  "auth.switchTo.artist": "Cambiar al demo de artista",
  "auth.switchTo.institution": "Cambiar al demo institucional",
  "auth.switchTo.collaborator": "Cambiar al demo de colaborador",
  "auth.returnToKleio": "Volver a KLEIO",
  "auth.loading": "Cargando espacio…",
  "auth.enterInstitutionDemo": "Entrar al demo institucional",
  "auth.enterArtistDemo": "Entrar al demo de artista",
  "auth.enterCollaboratorDemo": "Entrar al demo de colaborador",

  // ── signup.common ────────────────────────────────────────────────────────
  "signup.common.backToKleio": "← Volver a KLEIO",
  "signup.common.stepLabel": "Paso {current} de {total} · {label}",
  "signup.common.next": "Siguiente",
  "signup.common.back": "Atrás",
  "signup.common.createPassport": "Crear pasaporte",
  "signup.common.enterInstitutionWorkspace": "Entrar al Espacio institucional",
  "signup.common.suggested": "Sugerido",
  "signup.common.edited": "Editado",
  "signup.common.suggestedNote": "Preparado por KLEIO Assist. Revisa y edita antes de continuar.",
  "signup.common.suggestedEditable": "Sugerido · editable",
  "signup.common.editedByUser": "Editado por el usuario",
  "signup.common.draftSuggested": "· Borrador sugerido",

  // ── signup.artist ────────────────────────────────────────────────────────
  "signup.artist.title": "Crea tu Pasaporte Creativo",
  "signup.artist.subtitle":
    "Construye un perfil reutilizable para becas, residencias, exposiciones, convocatorias abiertas y revisiones de portafolio.",
  "signup.artist.step.profileBasics": "Datos básicos del perfil",
  "signup.artist.step.practiceMaterials": "Práctica y materiales",
  "signup.artist.step.materialsSuggestions": "Materiales y sugerencias",
  "signup.artist.step.review": "Revisión",
  "signup.artist.profileBasics.title": "Datos básicos del perfil",
  "signup.artist.profileBasics.description":
    "Comienza con los datos que la mayoría de las convocatorias piden primero. Puedes refinar cada campo antes de usarlo.",
  "signup.artist.field.artistName": "Nombre del artista",
  "signup.artist.field.location": "Ubicación",
  "signup.artist.field.discipline": "Disciplina / tipo de práctica",
  "signup.artist.field.website": "Sitio web o enlace de portafolio",
  "signup.artist.field.shortBio": "Biografía breve",
  "signup.artist.practiceMaterials.title": "Práctica y materiales",
  "signup.artist.practiceMaterials.description":
    "Añade el lenguaje, enlaces y documentos que ayudan a los revisores a entender tu trabajo.",
  "signup.artist.field.artistStatement": "Declaración artística",
  "signup.artist.field.mediums": "Medios",
  "signup.artist.field.themes": "Temas / palabras clave",
  "signup.artist.field.portfolioLinks": "Enlaces de portafolio",
  "signup.artist.field.documents": "CV / documento (marcador)",
  "signup.artist.field.featuredWorks": "Obras destacadas (marcador)",
  "signup.artist.placeholder.website": "https://",
  "signup.artist.placeholder.portfolioLinks": "Separa varios enlaces con comas",
  "signup.artist.placeholder.documents": "p. ej. CV, declaración artística, PDF de portafolio",
  "signup.artist.placeholder.featuredWorks": "Títulos o nombres de proyecto",
  "signup.artist.materialsSuggestions.title": "Materiales y sugerencias",
  "signup.artist.materialsSuggestions.description":
    "Revisa campos sugeridos, documentos y materiales importados. Puedes omitir Import Assist y construir tu pasaporte manualmente.",
  "signup.artist.materialsSuggestions.noImport":
    "Aún no se ha usado importación. Usa Import Assist arriba para conectar materiales, o continúa revisando tus entradas manuales.",
  "signup.artist.materialsSuggestions.preparedFields": "Campos sugeridos preparados para revisión",
  "signup.artist.materialsSuggestions.suggestionAvailable":
    "Sugerencia disponible — revisa antes de reemplazar",
  "signup.artist.materialsSuggestions.readyToApply": "Listo para aplicar a campo vacío",
  "signup.artist.materialsSuggestions.missingChecklist": "Lista de campos faltantes",
  "signup.artist.materialsSuggestions.allFieldsEntered": "Todos los campos del perfil completados",
  "signup.artist.materialsSuggestions.fromConnected": "{field} (de materiales conectados)",
  "signup.artist.materialsSuggestions.documentChecklist": "Lista de documentos",
  "signup.artist.review.title": "Revisa tu pasaporte",
  "signup.artist.review.description": "Confirma lo que está listo antes de entrar a tu espacio de artista.",
  "signup.artist.review.heading.profileBasics": "Datos básicos del perfil",
  "signup.artist.review.heading.creativePassport": "Pasaporte Creativo",
  "signup.artist.review.heading.imported": "Campos importados / sugeridos",
  "signup.artist.review.importedNote":
    "{count} fuente conectada · sugerencias rechazadas excluidas",
  "signup.artist.review.importedNotePlural":
    "{count} fuentes conectadas · sugerencias rechazadas excluidas",
  "signup.artist.review.stillMissing": "Aún faltan",
  "signup.artist.createPassport": "Entrar al Espacio del artista",

  // ── signup.institution ───────────────────────────────────────────────────
  "signup.institution.title": "Configura tu espacio institucional",
  "signup.institution.subtitle":
    "Configura programas, flujos de revisión, materiales requeridos y tu Equipo de revisión en un entorno organizado.",
  "signup.institution.step.institutionDetails": "Datos de la institución",
  "signup.institution.step.workspaceSetup": "Configuración del espacio",
  "signup.institution.step.reviewTeam": "Equipo de revisión",
  "signup.institution.step.materialsSuggestions": "Materiales y sugerencias",
  "signup.institution.step.review": "Revisión",
  "signup.institution.institutionDetails.title": "Datos de la institución",
  "signup.institution.institutionDetails.description":
    "Comienza con los datos públicos y el contexto de misión que tus programas referenciarán.",
  "signup.institution.field.institutionName": "Nombre de la institución",
  "signup.institution.field.institutionType": "Tipo de institución",
  "signup.institution.field.location": "Ubicación",
  "signup.institution.field.website": "Sitio web",
  "signup.institution.field.publicDescription": "Descripción pública",
  "signup.institution.workspaceSetup.title": "Configuración del espacio",
  "signup.institution.workspaceSetup.description":
    "Define cómo tu equipo gestiona programas, procesos de revisión y necesidades de informes.",
  "signup.institution.field.missionStatement": "Declaración de misión",
  "signup.institution.field.programType": "Tipo de programa",
  "signup.institution.field.reviewProcessType": "Tipo de proceso de revisión",
  "signup.institution.field.requiredMaterials": "Materiales de postulación requeridos",
  "signup.institution.field.reviewerRoles": "Roles de revisores",
  "signup.institution.field.committeeSize": "Tamaño del comité",
  "signup.institution.field.reportingNeeds": "Necesidades de informes",
  "signup.institution.field.importStructure": "Estructura de importación",
  "signup.institution.reviewTeam.title": "Equipo de revisión",
  "signup.institution.reviewTeam.description":
    "Invita revisores, jurado invitado, miembros de comité, curadores o asesores a espacios de revisión limitados. Solo verán los programas, postulaciones, lineamientos y mensajes asignados a su rol.",
  "signup.institution.reviewTeam.optionalNote":
    "Configuración opcional · Puedes omitir esto e invitar colaboradores después desde Comité.",
  "signup.institution.reviewTeam.metric.preparedCollaborators": "Colaboradores preparados",
  "signup.institution.reviewTeam.metric.preparedInvites": "Invitaciones preparadas",
  "signup.institution.reviewTeam.metric.limitedSeats": "Espacios limitados",
  "signup.institution.reviewTeam.metric.setupCompleteness": "Completitud de configuración",
  "signup.institution.reviewTeam.addCollaborator": "Añadir colaborador",
  "signup.institution.reviewTeam.field.name": "Nombre",
  "signup.institution.reviewTeam.field.email": "Correo electrónico",
  "signup.institution.reviewTeam.field.role": "Rol",
  "signup.institution.reviewTeam.field.assignedProgram": "Programa asignado",
  "signup.institution.reviewTeam.field.accessScope": "Alcance de acceso",
  "signup.institution.reviewTeam.field.inviteTiming": "Momento de invitación",
  "signup.institution.reviewTeam.addMember": "Añadir al Equipo de revisión",
  "signup.institution.reviewTeam.skip": "Omitir por ahora",
  "signup.institution.reviewTeam.preparedReviewTeam": "Equipo de revisión preparado",
  "signup.institution.reviewTeam.demoNote":
    "Registros demo de invitación para espacios de revisión limitados. Los colaboradores solo verán el contexto asignado.",
  "signup.institution.reviewTeam.error.nameRequired": "Ingresa el nombre del colaborador antes de añadir.",
  "signup.institution.reviewTeam.error.emailInvalid": "Ingresa un correo electrónico válido antes de añadir.",
  "signup.institution.review.summary": "Revisar configuración del espacio",
  "signup.institution.review.description": "Confirma lo que está listo antes de entrar a tu espacio institucional.",
  "signup.institution.review.heading.institutionDetails": "Datos de la institución",
  "signup.institution.review.heading.workspaceSetup": "Configuración del espacio",
  "signup.institution.review.heading.reviewTeam": "Equipo de revisión",
  "signup.institution.enterWorkspace": "Entrar al Espacio institucional",

  // ── importAssist ─────────────────────────────────────────────────────────
  "importAssist.title": "KLEIO Import Assist",
  "importAssist.optional": "Opcional",
  "importAssist.connected": "{count} conectados",
  "importAssist.artist.intro": "Prepara borradores de campos del pasaporte a partir de materiales que ya mantienes.",
  "importAssist.institution.intro": "Prepara un borrador del espacio a partir de materiales que tu equipo ya mantiene.",
  "importAssist.artist.approval": "Tú revisas y apruebas cada detalle.",
  "importAssist.institution.approval": "Tu equipo aprueba lo que se vuelve oficial.",
  "importAssist.use": "Usar Import Assist",
  "importAssist.hide": "Ocultar Import Assist",
  "importAssist.preparedForReview": "Campos sugeridos preparados para revisión",
  "importAssist.sourcesConnected": "Fuentes conectadas",
  "importAssist.suggestedFields": "Campos sugeridos",
  "importAssist.readyToApply": "Listo para aplicar",
  "importAssist.suggestionAvailable": "Sugerencia disponible",
  "importAssist.youApproveOfficial": "Tú apruebas lo que se vuelve oficial",
  "importAssist.organizeDraft":
    "KLEIO puede ayudar a organizar un primer borrador a partir de materiales que ya mantienes. Tú sigues siendo el autor. Revisa y edita cada sugerencia. Aplica sugerencias solo a campos vacíos.",

  // ── nav.artist ───────────────────────────────────────────────────────────
  "nav.artist.workspace": "Espacio del artista",
  "nav.artist.overview": "Resumen",
  "nav.artist.creativePassport": "Pasaporte Creativo",
  "nav.artist.portfolio": "Portafolio",
  "nav.artist.opportunities": "Oportunidades",
  "nav.artist.applications": "Postulaciones",
  "nav.artist.collaborators": "Colaboradores",
  "nav.artist.calendar": "Calendario",
  "nav.artist.messages": "Mensajes",
  "nav.artist.funding": "Financiamiento",
  "nav.artist.insights": "Señales",
  "nav.artist.settings": "Configuración",
  "nav.artist.tagline.title": "Concéntrate en tu arte.",
  "nav.artist.tagline.body": "KLEIO mantiene la administración organizada.",

  // ── nav.institution ──────────────────────────────────────────────────────
  "nav.institution.section.overview": "Resumen",
  "nav.institution.section.manage": "Gestionar",
  "nav.institution.section.collaborate": "Colaborar",
  "nav.institution.section.analyze": "Analizar",
  "nav.institution.section.configure": "Configurar",
  "nav.institution.overview": "Resumen",
  "nav.institution.programs": "Programas",
  "nav.institution.submissions": "Postulaciones",
  "nav.institution.artists": "Artistas",
  "nav.institution.reviewQueue": "Cola de revisión",
  "nav.institution.shortlist": "Lista corta",
  "nav.institution.committee": "Comité",
  "nav.institution.messages": "Mensajes",
  "nav.institution.reports": "Informes",
  "nav.institution.activityLog": "Registro de actividad",
  "nav.institution.templates": "Plantillas",
  "nav.institution.settings": "Configuración",

  // ── nav.collaborator ─────────────────────────────────────────────────────
  "nav.collaborator.workspace": "Espacio de revisión para colaboradores",
  "nav.collaborator.overview": "Resumen",
  "nav.collaborator.assignments": "Mis asignaciones",
  "nav.collaborator.reviewQueue": "Cola de revisión",
  "nav.collaborator.guidelines": "Lineamientos",
  "nav.collaborator.messages": "Mensajes",
  "nav.collaborator.submittedReviews": "Revisiones enviadas",
  "nav.collaborator.focusedSeat.title": "Espacio de revisión limitado",
  "nav.collaborator.focusedSeat.body": "Solo es visible el contexto de revisión asignado.",

  // ── artist.workspace ─────────────────────────────────────────────────────
  "artist.workspace.overview.greeting": "Buenos días, {name}.",
  "artist.workspace.overview.description":
    "Concéntrate en el trabajo. KLEIO mantiene a la vista tus postulaciones, materiales y oportunidades.",
  "artist.workspace.passport.eyebrow": "Pasaporte Creativo",
  "artist.workspace.passport.title": "Pasaporte Creativo",
  "artist.workspace.passport.description":
    "Gestiona tu perfil reutilizable para becas, residencias, exposiciones, convocatorias abiertas y revisión institucional.",
  "artist.workspace.passport.cta.viewPublicProfile": "Ver perfil público",
  "artist.workspace.passport.cta.backToOverview": "Volver al resumen del artista",
  "artist.workspace.passport.metric.completeness": "Completitud del pasaporte",
  "artist.workspace.passport.metric.materialsReady": "Materiales listos",
  "artist.workspace.passport.metric.selectedWorks": "Obras seleccionadas",
  "artist.workspace.passport.metric.activeApplications": "Postulaciones activas",
  "artist.workspace.portfolio.eyebrow": "Biblioteca de portafolio",
  "artist.workspace.portfolio.title": "Portafolio",
  "artist.workspace.portfolio.description":
    "Organiza obras seleccionadas, medios, vistas de instalación y materiales de portafolio para futuras postulaciones.",
  "artist.workspace.portfolio.cta.viewPassport": "Ver Pasaporte Creativo",
  "artist.workspace.portfolio.cta.viewPublicProfile": "Ver perfil público",
  "artist.workspace.opportunities.eyebrow": "Descubrimiento de oportunidades",
  "artist.workspace.opportunities.title": "Oportunidades",
  "artist.workspace.opportunities.description":
    "Descubre becas, residencias, exposiciones y convocatorias abiertas alineadas con tu Pasaporte Creativo.",
  "artist.workspace.opportunities.cta.prepareDraft": "Preparar borrador de postulación",
  "artist.workspace.opportunities.cta.reviewPassport": "Revisar pasaporte",
  "artist.workspace.applications.eyebrow": "Seguimiento de postulaciones",
  "artist.workspace.applications.title": "Postulaciones",
  "artist.workspace.applications.description":
    "Sigue borradores, postulaciones enviadas, materiales faltantes, respuestas y fechas límite.",
  "artist.workspace.applications.cta.exploreOpportunities": "Explorar oportunidades",
  "artist.workspace.applications.cta.reviewCalendar": "Revisar calendario",
  "artist.workspace.applications.metric.draft": "Postulaciones en borrador",
  "artist.workspace.applications.metric.submitted": "Enviadas",
  "artist.workspace.applications.metric.underReview": "En revisión",
  "artist.workspace.applications.metric.awarded": "Otorgadas",
  "artist.workspace.applications.metric.pendingDecisions": "Decisiones pendientes",
  "artist.workspace.applications.column.program": "Programa",
  "artist.workspace.applications.column.status": "Estado",
  "artist.workspace.applications.column.dueDate": "Fecha límite",
  "artist.workspace.applications.column.updated": "Actualizado",
  "artist.workspace.applications.column.nextAction": "Próxima acción",
  "artist.workspace.applications.nextActions.title": "Próximas acciones",
  "artist.workspace.applications.nextActions.body": "{count} acciones registradas en postulaciones abiertas.",
  "artist.workspace.applications.deadlinePressure.title": "Presión de fechas límite",
  "artist.workspace.applications.deadlinePressure.body":
    "{count} fechas límite llegan en los próximos 14 días. Próxima: {date}.",
  "artist.workspace.applications.cta.openCalendar": "Abrir calendario →",
  "artist.workspace.passport.materialsReadiness.title": "Preparación de materiales",
  "artist.workspace.passport.materialsReadiness.body":
    "Organiza tu declaración, CV, portafolio, muestras de obra, referencias y documentos de apoyo.",
  "artist.workspace.passport.ready": "Lista",
  "artist.workspace.passport.needsReview": "Necesita revisión",
  "artist.workspace.passport.publicPreview.title": "Vista previa pública del Pasaporte Creativo",
  "artist.workspace.passport.publicPreview.description": "Cómo las instituciones ven la identidad de tu perfil público.",
  "artist.workspace.passport.cta.openPublicProfile": "Abrir perfil público",
  "artist.workspace.passport.profileBasics.title": "Datos básicos del perfil",
  "artist.workspace.passport.profileBasics.body":
    "Mantén actualizados tu biografía, ubicación, lenguaje de práctica, enlaces de contacto e identidad de perfil público.",
  "artist.workspace.passport.reusableAnswers.title": "Respuestas reutilizables",
  "artist.workspace.passport.reusableAnswers.body":
    "{count} tareas de postulación registradas actualmente en programas abiertos.",
  "artist.workspace.passport.sharingControls.title": "Controles de compartición",
  "artist.workspace.passport.sharingControls.body":
    "Elige qué compartir públicamente, qué mantener privado y qué preparar para cada oportunidad.",
  "artist.workspace.passport.sharing.publicBio": "Biografía pública",
  "artist.workspace.passport.sharing.privateCvDraft": "Borrador de CV privado",
  "artist.workspace.passport.artistMaterials.title": "Materiales del artista",
  "artist.workspace.opportunities.searchPlaceholder": "Buscar oportunidades, tipos, fechas límite...",
  "artist.workspace.opportunities.filter.allTypes": "Todos los tipos",
  "artist.workspace.opportunities.filter.grants": "Becas",
  "artist.workspace.opportunities.filter.residencies": "Residencias",
  "artist.workspace.opportunities.filter.fitScore": "Puntuación de adecuación",
  "artist.workspace.opportunities.filter.deadline": "Fecha límite",
  "artist.workspace.opportunities.deadline": "Fecha límite {date}",
  "artist.workspace.opportunities.fitScore": "{pct}% de adecuación",
  "artist.workspace.opportunities.missingMaterialOne": "{count} material faltante",
  "artist.workspace.opportunities.missingMaterialOther": "{count} materiales faltantes",
  "artist.workspace.opportunities.readinessSummary.title": "Resumen de preparación",
  "artist.workspace.opportunities.readinessSummary.complete": "Tu pasaporte está {pct}% completo.",
  "artist.workspace.opportunities.readinessSummary.gapOne":
    "{count} material aún necesita revisión antes de postulaciones de alta adecuación.",
  "artist.workspace.opportunities.readinessSummary.gapOther":
    "{count} materiales aún necesitan revisión antes de postulaciones de alta adecuación.",
  "artist.workspace.opportunities.cta.reviewPassportLink": "Revisar pasaporte →",
  "artist.workspace.opportunities.fundingOutlook.title": "Perspectiva de financiamiento",
  "artist.workspace.opportunities.fundingOutlook.body":
    "{count} oportunidades activas registradas con {amount} en financiamiento potencial.",
  "artist.workspace.funding.metric.potentialFunding": "Financiamiento potencial",
  "artist.workspace.funding.metric.estimatedFit": "Adecuación estimada",
  "artist.workspace.funding.metric.completeness": "Completitud",
  "artist.workspace.funding.metric.timelineConfidence": "Confianza en el cronograma",
  "artist.workspace.funding.section.opportunities": "Oportunidades de financiamiento",
  "artist.workspace.funding.column.program": "Programa",
  "artist.workspace.funding.column.amount": "Monto",
  "artist.workspace.funding.column.fit": "Adecuación",
  "artist.workspace.funding.column.completeness": "Completitud",
  "artist.workspace.funding.column.timeline": "Cronograma",
  "artist.workspace.funding.missingRisk.title": "Riesgo por materiales faltantes",
  "artist.workspace.funding.missingRisk.bodyOne":
    "{count} oportunidad activa depende de materiales aún no marcados como listos en tu pasaporte.",
  "artist.workspace.funding.missingRisk.bodyOther":
    "{count} oportunidades activas dependen de materiales aún no marcados como listos en tu pasaporte.",
  "artist.workspace.funding.missingChip": "{program}: {count} faltantes",
  "artist.workspace.funding.cta.reviewPassportMaterials": "Revisar materiales del pasaporte →",
  "artist.workspace.collaborators.eyebrow": "Coincidencias en el espectro artístico",
  "artist.workspace.collaborators.title": "Colaboradores",
  "artist.workspace.collaborators.description":
    "Descubre artistas y colaboradores con prácticas, temas, ubicaciones u intereses de oportunidad relacionados.",
  "artist.workspace.collaborators.cta.openMessages": "Abrir mensajes",
  "artist.workspace.collaborators.cta.exploreOpportunities": "Explorar oportunidades",
  "artist.workspace.calendar.eyebrow": "Calendario de fechas límite",
  "artist.workspace.calendar.title": "Calendario",
  "artist.workspace.calendar.description":
    "Consulta fechas límite próximas, hitos de postulación, seguimientos y ventanas de decisión.",
  "artist.workspace.calendar.cta.viewApplications": "Ver postulaciones",
  "artist.workspace.calendar.cta.exploreOpportunities": "Explorar oportunidades",
  "artist.workspace.messages.eyebrow": "Mensajería",
  "artist.workspace.messages.title": "Mensajes",
  "artist.workspace.messages.description":
    "Mantén en contexto la comunicación con convocatorias, solicitudes de materiales faltantes, notas de colaboradores y actualizaciones institucionales.",
  "artist.workspace.messages.cta.reviewApplications": "Revisar postulaciones",
  "artist.workspace.messages.cta.reviewPassport": "Revisar pasaporte",
  "artist.workspace.messages.inbox": "Bandeja de entrada",
  "artist.workspace.funding.eyebrow": "Preparación para financiamiento",
  "artist.workspace.funding.title": "Financiamiento",
  "artist.workspace.funding.description":
    "Comprende el financiamiento potencial, la preparación de postulaciones y la adecuación a becas y programas.",
  "artist.workspace.funding.cta.exploreOpportunities": "Explorar oportunidades",
  "artist.workspace.funding.cta.reviewPassport": "Revisar pasaporte",
  "artist.workspace.insights.eyebrow": "Señales discretas",
  "artist.workspace.insights.title": "Señales discretas",
  "artist.workspace.insights.description":
    "Revisa señales prácticas sobre tus materiales, oportunidades, fechas límite y preparación de postulaciones.",
  "artist.workspace.insights.cta.reviewPassport": "Revisar pasaporte",
  "artist.workspace.insights.cta.exploreOpportunities": "Explorar oportunidades",
  "artist.workspace.settings.eyebrow": "Configuración del espacio",
  "artist.workspace.settings.title": "Configuración del artista",
  "artist.workspace.settings.description":
    "Gestiona preferencias del espacio de artista, visibilidad del perfil, ajustes demo y valores predeterminados del Pasaporte Creativo.",
  "artist.workspace.settings.cta.viewPublicProfile": "Ver perfil público",
  "artist.workspace.settings.cta.backToOverview": "Volver al resumen del artista",

  // ── institution.workspace ────────────────────────────────────────────────
  "institution.workspace.dashboard.greeting": "Buenos días, {name}.",
  "institution.workspace.dashboard.description":
    "Gestiona postulaciones, avance de revisores, materiales faltantes, listas cortas e informes desde un espacio organizado.",
  "institution.workspace.dashboard.demoLabel": "Espacio demo",
  "institution.workspace.committee.title": "Comité",
  "institution.workspace.committee.description":
    "Coordina revisores, jurado invitado y colaboradores alrededor del mismo contexto de postulación.",
  "institution.workspace.committee.cta.previewCollaboratorSeat":
    "Vista previa del Espacio de revisión para colaboradores",
  "institution.workspace.committee.metric.pendingVote": "Voto de comité pendiente",
  "institution.workspace.committee.metric.pendingActions": "Acciones de revisores pendientes",
  "institution.workspace.committee.metric.completion": "Completitud de revisores",
  "institution.workspace.committee.preparedReviewTeam": "Equipo de revisión preparado",
  "institution.workspace.committee.preparedReviewTeamNote":
    "Colaboradores preparados durante el registro institucional. Estos son registros demo de invitación para espacios de revisión limitados.",
  "institution.workspace.committee.metric.collaborators": "Colaboradores",
  "institution.workspace.committee.metric.preparedInvites": "Invitaciones preparadas",
  "institution.workspace.committee.metric.limitedSeats": "Espacios limitados",
  "institution.workspace.committee.metric.programsCovered": "Programas cubiertos",
  "institution.workspace.committee.invite.prepared": "Invitación preparada",
  "institution.workspace.committee.invite.deferred": "Invitación diferida",
  "institution.workspace.committee.limitedReviewSeat": "Espacio de revisión limitado",
  "institution.workspace.committee.scenario.eyebrow": "Escenario · Cuello de botella de revisores",
  "institution.workspace.committee.scenario.body":
    "Dos revisiones completas. Un voto de comité sigue pendiente antes de que esta finalista pueda avanzar.",
  "institution.workspace.committee.reviewerProgress":
    "Avance de revisores {completed}/{total} completas · {pending} pendientes",
  "institution.workspace.committee.section.awaitingVote": "Esperando voto",
  "institution.workspace.committee.reviewsCompleted": "Revisiones completadas {completed}/{total}",
  "institution.workspace.committee.reviewsPending": "{pending} pendientes",
  "institution.workspace.committee.section.reviewerProgress": "Avance de revisores",
  "institution.workspace.committee.cta.previewReviewerSeat": "Vista previa del espacio de revisor",
  "institution.workspace.committee.footer.assignmentsOne":
    "{count} asignación de revisión abierta en programas activos.",
  "institution.workspace.committee.footer.assignmentsOther":
    "{count} asignaciones de revisión abiertas en programas activos.",
  "institution.workspace.committee.cta.messagePendingReviewers": "Enviar mensaje a revisores pendientes",
  "institution.workspace.reports.title": "Informes",
  "institution.workspace.reports.description":
    "Preserva resultados de programas, avance de revisores, decisiones de lista corta y registros institucionales.",
  "institution.workspace.reports.prepare.title": "Preparar informe",
  "institution.workspace.reports.prepare.eyebrow": "Constructor de informes",
  "institution.workspace.reports.prepare.description":
    "Inicia un informe estructurado a partir de actividad del programa, avance de revisión, decisiones de lista corta y notas institucionales.",
  "institution.workspace.reports.prepare.cta.backToReports": "Volver a Informes",
  "institution.workspace.submissions.eyebrow": "Base de datos de postulaciones",
  "institution.workspace.submissions.title": "Postulaciones",
  "institution.workspace.submissions.description":
    "Busca, filtra y compara postulaciones sin perder contexto entre archivos, formularios o notas de revisión.",
  "institution.workspace.submissions.cta.openReviewQueue": "Abrir Cola de revisión",
  "institution.workspace.submissions.cta.searchArtists": "Buscar artistas",
  "institution.workspace.programs.title": "Programas y Convocatorias abiertas",
  "institution.workspace.programs.description":
    "Gestiona convocatorias abiertas, becas, residencias y programas de exposición desde borrador hasta selección final.",
  "institution.workspace.activityLog.eyebrow": "Memoria institucional",
  "institution.workspace.activityLog.title": "Registro de actividad",
  "institution.workspace.activityLog.description":
    "Preserva actividad de revisión, cambios de estado, mensajes, movimiento de lista corta e historial de informes en un registro institucional.",
  "institution.workspace.activityLog.cta.prepareReport": "Preparar informe",
  "institution.workspace.activityLog.cta.backToDashboard": "Volver al panel",
  "institution.workspace.templates.eyebrow": "Biblioteca de plantillas",
  "institution.workspace.templates.title": "Plantillas",
  "institution.workspace.templates.description":
    "Guarda lenguaje reutilizable, criterios, mensajes y estructuras de revisión para futuros programas.",
  "institution.workspace.templates.cta.createTemplate": "Crear plantilla",
  "institution.workspace.templates.cta.createOpenCall": "Crear Convocatoria abierta",
  "institution.workspace.settings.eyebrow": "Configuración del espacio",
  "institution.workspace.settings.title": "Configuración del espacio",
  "institution.workspace.settings.description":
    "Gestiona detalles del espacio, preferencias demo, roles del equipo y valores predeterminados de revisión.",
  "institution.workspace.settings.cta.viewProfile": "Ver perfil institucional",
  "institution.workspace.settings.cta.backToDashboard": "Volver al panel",

  // ── collaborator ─────────────────────────────────────────────────────────
  "collaborator.overview.eyebrow": "Espacio de revisión para colaboradores",
  "collaborator.overview.title":
    "Revisa postulaciones asignadas para {institution} sin entrar al espacio institucional completo.",
  "collaborator.overview.nextDeadline": "Próxima fecha límite: {date}",
  "collaborator.overview.completionRate": "{rate}% completado",
  "collaborator.overview.cta.continueReviewing": "Continuar revisando",
  "collaborator.overview.cta.viewGuidelines": "Ver lineamientos",
  "collaborator.overview.metric.assignedReviews": "Revisiones asignadas",
  "collaborator.overview.metric.completed": "Completadas",
  "collaborator.overview.metric.pending": "Pendientes",
  "collaborator.overview.metric.completionRate": "Tasa de completitud",
  "collaborator.overview.metric.nextDeadline": "Próxima fecha límite",
  "collaborator.assignments.eyebrow": "Postulaciones asignadas",
  "collaborator.assignments.title": "Mis asignaciones",
  "collaborator.assignments.description":
    "Solo postulaciones asignadas a ti para revisión. Sin directorio global de artistas ni cola institucional completa.",
  "collaborator.assignments.cta.openReviewQueue": "Abrir Cola de revisión",
  "collaborator.reviewQueue.eyebrow": "Cola de revisión enfocada",
  "collaborator.reviewQueue.title": "Cola de revisión",
  "collaborator.reviewQueue.description":
    "Trabaja solo postulaciones asignadas. Rúbrica, notas y controles de recomendación están limitados a tu espacio de revisión.",
  "collaborator.guidelines.eyebrow": "Criterios de revisión",
  "collaborator.guidelines.title": "Lineamientos",
  "collaborator.guidelines.description":
    "Rúbricas de programa y materiales requeridos solo para tu trabajo de revisión asignado.",
  "collaborator.guidelines.cta.openReviewQueue": "Abrir Cola de revisión",
  "collaborator.messages.eyebrow": "Mensajes de asignación",
  "collaborator.messages.title": "Mensajes",
  "collaborator.messages.description":
    "Hilos de revisores y comité enfocados en tus asignaciones.",
  "collaborator.submitted.eyebrow": "Registro de revisión",
  "collaborator.submitted.title": "Revisiones enviadas",
  "collaborator.submitted.description":
    "Tus revisiones completadas y recomendaciones para postulaciones asignadas.",
  "collaborator.submitted.cta.backToQueue": "Volver a la cola",
  "collaborator.deadline.overdue": "{days} días de retraso",
  "collaborator.deadline.dueToday": "Vence hoy",
  "collaborator.deadline.daysLeft": "{days} días restantes",
  "collaborator.deadline.label": "Fecha límite {date}",
  "collaborator.overview.section.myReviewQueue": "Mi cola de revisión",
  "collaborator.overview.cta.openQueue": "Abrir cola →",
  "collaborator.overview.queue.awaitingOne": "{count} postulación esperando tu revisión.",
  "collaborator.overview.queue.awaitingOther": "{count} postulaciones esperando tu revisión.",
  "collaborator.overview.queue.dueSoon": "{count} vencen en 14 días.",
  "collaborator.overview.queue.overdue": "{count} vencidas.",
  "collaborator.overview.queue.empty": "Todas las revisiones asignadas están completas.",
  "collaborator.overview.cta.openReview": "Abrir revisión",
  "collaborator.overview.section.programGuidelines": "Lineamientos del programa",
  "collaborator.overview.guidelines.summaryOne": "{count} programa asignado con rúbrica y materiales requeridos.",
  "collaborator.overview.guidelines.summaryOther": "{count} programas asignados con rúbrica y materiales requeridos.",
  "collaborator.overview.cta.viewAllGuidelines": "Ver todos los lineamientos →",
  "collaborator.overview.section.messages": "Mensajes",
  "collaborator.overview.messages.summaryOne": "{count} hilo relacionado con asignaciones · {unread} sin leer",
  "collaborator.overview.messages.summaryOther": "{count} hilos relacionados con asignaciones · {unread} sin leer",
  "collaborator.overview.messages.empty": "No hay mensajes específicos del colaborador en este conjunto demo.",
  "collaborator.overview.cta.openMessages": "Abrir mensajes →",
  "collaborator.overview.section.completedReviews": "Revisiones completadas",
  "collaborator.overview.cta.viewSubmitted": "Ver enviadas →",
  "collaborator.overview.completed.empty": "Aún no hay revisiones completadas.",
  "collaborator.overview.score": "Puntuación {score}",
  "collaborator.overview.recordedWithoutScore": "Registrada sin puntuación",
  "collaborator.assignments.metric.assigned": "Asignadas",
  "collaborator.assignments.metric.pendingReview": "Revisión pendiente",
  "collaborator.assignments.metric.inProgress": "En progreso",
  "collaborator.assignments.metric.completed": "Completadas",
  "collaborator.assignments.searchPlaceholder": "Buscar artista, proyecto, programa o estado…",
  "collaborator.assignments.column.artist": "Artista",
  "collaborator.assignments.column.project": "Proyecto",
  "collaborator.assignments.column.program": "Programa",
  "collaborator.assignments.column.submission": "Postulación",
  "collaborator.assignments.column.review": "Revisión",
  "collaborator.assignments.column.deadline": "Fecha límite",
  "collaborator.assignments.column.timing": "Plazo",
  "collaborator.assignments.cta.openReview": "Abrir revisión",
  "collaborator.reviewQueue.section.pending": "Asignaciones pendientes",
  "collaborator.reviewQueue.queueCountOne": "{count} postulación en tu cola.",
  "collaborator.reviewQueue.queueCountOther": "{count} postulaciones en tu cola.",
  "collaborator.reviewQueue.empty": "No hay revisiones pendientes. Consulta el trabajo enviado en Revisiones enviadas.",
  "collaborator.reviewQueue.selectedReview": "Revisión seleccionada",
  "collaborator.reviewQueue.rubricPreview": "Vista previa de rúbrica",
  "collaborator.reviewQueue.noRubric": "No hay rúbrica disponible para este programa.",
  "collaborator.reviewQueue.reviewNotes": "Notas de revisión",
  "collaborator.reviewQueue.notesPlaceholder": "Borrador de notas de revisión para esta postulación…",
  "collaborator.reviewQueue.notesFootnote":
    "Campo base — las notas permanecen privadas en tu espacio de revisión en este demo.",
  "collaborator.reviewQueue.recommendation": "Recomendación",
  "collaborator.reviewQueue.recommendation.advance": "Avanzar",
  "collaborator.reviewQueue.recommendation.shortlist": "Lista corta",
  "collaborator.reviewQueue.recommendation.hold": "En espera",
  "collaborator.reviewQueue.recommendation.decline": "Declinar",
  "collaborator.reviewQueue.saveDraftDemo": "Guardar borrador (Demo)",
  "collaborator.reviewQueue.submitReviewDemo": "Enviar revisión (Demo)",
  "collaborator.reviewQueue.demoAction": "Acción demo",
  "collaborator.reviewQueue.selectAssignment": "Selecciona una asignación pendiente para abrir el espacio de revisión.",
  "collaborator.guidelines.conduct.title": "Conducta de revisión",
  "collaborator.guidelines.conduct.body":
    "Revisa solo los materiales asignados a ti. Usa la rúbrica proporcionada por la institución. Reporta conflictos antes de enviar una recomendación.",
  "collaborator.guidelines.cta.openAssignedReviews": "Abrir revisiones asignadas →",
  "collaborator.guidelines.rubric": "Rúbrica",
  "collaborator.guidelines.requiredMaterials": "Materiales requeridos",
  "collaborator.guidelines.conflict.title": "Recordatorio de conflicto de interés",
  "collaborator.guidelines.conflict.body":
    "Si tienes una relación personal, profesional o financiera con un solicitante, notifica al equipo del programa antes de completar tu revisión. No califiques ni recomiendes en asignaciones donde exista un conflicto.",
  "collaborator.messages.metric.scopedThreads": "Hilos limitados",
  "collaborator.messages.metric.unread": "Sin leer",
  "collaborator.messages.inbox": "Bandeja de entrada",
  "collaborator.messages.empty": "No hay mensajes específicos del colaborador en este conjunto demo.",
  "collaborator.messages.unread": "Sin leer",
  "collaborator.messages.reminders.title": "Recordatorios para revisores",
  "collaborator.messages.reminders.body":
    "Los recordatorios relacionados con asignaciones aparecen aquí cuando la institución o el comité necesitan tu aporte.",
  "collaborator.messages.contact.title": "Contacto institucional",
  "collaborator.messages.contact.body": "Equipo de programas KLEIO Arthouse · program@kleioarthouse.demo",
  "collaborator.messages.contact.note": "Para extensiones de plazo, declaraciones de conflicto o problemas de acceso.",
  "collaborator.messages.context.title": "Contexto de asignación",
  "collaborator.messages.context.bodyOne": "{reviews} revisiones asignadas en {programs} programa.",
  "collaborator.messages.context.bodyOther": "{reviews} revisiones asignadas en {programs} programas.",
  "collaborator.messages.cta.viewAssignments": "Ver asignaciones →",
  "collaborator.submitted.metric.submitted": "Enviadas",
  "collaborator.submitted.metric.completionRate": "Tasa de completitud",
  "collaborator.submitted.metric.pendingVoteContext": "Contexto de voto pendiente",
  "collaborator.submitted.column.artist": "Artista",
  "collaborator.submitted.column.project": "Proyecto",
  "collaborator.submitted.column.program": "Programa",
  "collaborator.submitted.column.score": "Puntuación",
  "collaborator.submitted.column.recommendation": "Recomendación",
  "collaborator.submitted.column.status": "Estado",
  "collaborator.submitted.empty": "Aún no hay revisiones enviadas.",
  "collaborator.submitted.recordedWithoutScore": "Registrada sin puntuación",
  "collaborator.submitted.returnToOverview": "Volver al resumen",

  // ── profile ──────────────────────────────────────────────────────────────
  "profile.creativePassport": "Pasaporte Creativo",
  "profile.selectedWorks": "Obras seleccionadas",
  "profile.aboutPractice": "Acerca de / Práctica",
  "profile.materialsReady": "Materiales listos",
  "profile.themes": "Temas",
  "profile.availability": "Disponibilidad",
  "profile.publicProfile": "Perfil público",
  "profile.institutionProfile": "Perfil institucional",
  "profile.syntheticDemo": "Perfil demo sintético",
  "profile.artistStatement": "Declaración artística",
  "profile.material.bio": "Biografía",
  "profile.material.artistStatement": "Declaración artística",
  "profile.material.cvResume": "CV / Currículum",
  "profile.material.portfolio": "Portafolio",
  "profile.material.workSamples": "Muestras de obra",
  "profile.material.references": "Referencias",

  // ── status ───────────────────────────────────────────────────────────────
  "status.draft": "Borrador",
  "status.submitted": "Enviada",
  "status.underReview": "En revisión",
  "status.waiting": "En espera",
  "status.interview": "Entrevista",
  "status.awarded": "Otorgada",
  "status.declined": "Declinada",
  "status.complete": "Completa",
  "status.completed": "Completada",
  "status.inProgress": "En progreso",
  "status.pending": "Pendiente",
  "status.pendingVote": "Voto pendiente",
  "status.shortlisted": "En lista corta",
  "status.materialsComplete": "Materiales completos",
  "status.needsMaterials": "Faltan materiales",
  "status.ready": "Lista",
  "status.preparedForScoring": "Preparada para calificación",
  "status.notStarted": "No iniciada",
  "status.started": "Iniciada",
  "status.requestedInfo": "Información solicitada",
  "status.inReview": "En revisión",
  "status.pendingInfo": "Información pendiente",
  "status.deferred": "Diferida",
  "status.prepared": "Preparada",

  // ── common ───────────────────────────────────────────────────────────────
  "common.demo": "Demo",
  "common.remove": "Eliminar",
  "common.add": "Añadir",
  "common.skipForNow": "Omitir por ahora",
  "common.open": "Abrir",
  "common.viewAll": "Ver todo",
  "common.search": "Buscar",
  "common.filter": "Filtrar",
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.close": "Cerrar",
  "common.edit": "Editar",
  "common.optional": "Opcional",
  "common.loading": "Cargando…",
  "common.back": "Atrás",
  "common.next": "Siguiente",
  "common.continue": "Continuar",
  "common.preview": "Vista previa",
  "common.prepareDraft": "Preparar borrador",
  "common.viewGuidelines": "Ver lineamientos",
  "common.continueReviewing": "Continuar revisando",
  "common.locale.en": "EN",
  "common.locale.es": "ES",
  "common.copyright": "© 2026 KLEIO ARTHOUSE",

  // ── pluralization helpers ────────────────────────────────────────────────
  "plural.source.one": "{count} fuente conectada",
  "plural.source.other": "{count} fuentes conectadas",
  "plural.review.one": "{count} revisión",
  "plural.review.other": "{count} revisiones",
  "plural.submission.one": "{count} postulación",
  "plural.submission.other": "{count} postulaciones",
}

export const kleioMessages = {
  en: enMessages,
  es: esMessages,
} as const

const PLACEHOLDER_PATTERN = /\{(\w+)\}/g

function extractPlaceholders(template: string): string[] {
  const matches = template.matchAll(PLACEHOLDER_PATTERN)
  return [...matches].map((m) => m[1]).sort()
}

export type I18nIntegrityResult = {
  englishKeyCount: number
  spanishKeyCount: number
  missingSpanishKeys: string[]
  missingEnglishKeys: string[]
  placeholderMismatches: Array<{ key: string; en: string[]; es: string[] }>
  allChecksPass: boolean
}

export function getI18nIntegrity(): I18nIntegrityResult {
  const enKeys = new Set(Object.keys(enMessages))
  const esKeys = new Set(Object.keys(esMessages))

  const missingSpanishKeys = [...enKeys].filter((key) => !esKeys.has(key)).sort()
  const missingEnglishKeys = [...esKeys].filter((key) => !enKeys.has(key)).sort()

  const placeholderMismatches: I18nIntegrityResult["placeholderMismatches"] = []

  for (const key of enKeys) {
    if (!esKeys.has(key)) continue
    const enPlaceholders = extractPlaceholders(enMessages[key])
    const esPlaceholders = extractPlaceholders(esMessages[key])
    const enStr = enPlaceholders.join(",")
    const esStr = esPlaceholders.join(",")
    if (enStr !== esStr) {
      placeholderMismatches.push({ key, en: enPlaceholders, es: esPlaceholders })
    }
  }

  const allChecksPass =
    missingSpanishKeys.length === 0 &&
    missingEnglishKeys.length === 0 &&
    placeholderMismatches.length === 0

  return {
    englishKeyCount: enKeys.size,
    spanishKeyCount: esKeys.size,
    missingSpanishKeys,
    missingEnglishKeys,
    placeholderMismatches,
    allChecksPass,
  }
}

export function formatMessage(
  locale: KleioLocale,
  key: string,
  params?: TranslationParams,
): string {
  const template = kleioMessages[locale][key] ?? kleioMessages.en[key] ?? key

  if (!params) return template

  return template.replace(PLACEHOLDER_PATTERN, (_, name: string) => {
    const value = params[name]
    return value !== undefined ? String(value) : `{${name}}`
  })
}

const STATUS_KEY_MAP: Record<string, string> = {
  Draft: "status.draft",
  Submitted: "status.submitted",
  "Under Review": "status.underReview",
  Waiting: "status.waiting",
  Interview: "status.interview",
  Awarded: "status.awarded",
  Declined: "status.declined",
  Complete: "status.complete",
  Completed: "status.completed",
  "In Progress": "status.inProgress",
  Pending: "status.pending",
  "Pending Vote": "status.pendingVote",
  Shortlisted: "status.shortlisted",
  "Materials Complete": "status.materialsComplete",
  "Needs materials": "status.needsMaterials",
  Ready: "status.ready",
  "Prepared for scoring": "status.preparedForScoring",
  "Not Started": "status.notStarted",
  Started: "status.started",
  "Requested Info": "status.requestedInfo",
  "In Review": "status.inReview",
  "Pending Info": "status.pendingInfo",
  Deferred: "status.deferred",
  Prepared: "status.prepared",
}

export function translateStatus(locale: KleioLocale, status: string): string {
  const key = STATUS_KEY_MAP[status]
  if (key) return formatMessage(locale, key)
  return status
}

export function formatKleioNumber(locale: KleioLocale, value: number): string {
  const intlLocale = locale === "es" ? "es-MX" : "en-US"
  return new Intl.NumberFormat(intlLocale).format(value)
}

export function formatKleioCurrency(
  locale: KleioLocale,
  value: number,
  currency = "USD",
): string {
  if (locale === "es" && currency === "USD") {
    return `US$${formatKleioNumber(locale, value)}`
  }

  const intlLocale = locale === "es" ? "es-MX" : "en-US"
  return new Intl.NumberFormat(intlLocale, { style: "currency", currency }).format(value)
}

export function formatKleioDate(
  locale: KleioLocale,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const parsed = date instanceof Date ? date : new Date(date)
  const intlLocale = locale === "es" ? "es-MX" : "en-US"
  return new Intl.DateTimeFormat(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(parsed)
}

export function pluralize(
  locale: KleioLocale,
  count: number,
  singularKey: string,
  pluralKey: string,
  params?: TranslationParams,
): string {
  const key = count === 1 ? singularKey : pluralKey
  return formatMessage(locale, key, { ...params, count })
}

if (process.env.NODE_ENV === "development") {
  const integrity = getI18nIntegrity()
  if (!integrity.allChecksPass) {
    console.warn("KLEIO i18n integrity check failed", integrity)
  }
}
