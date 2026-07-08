export type DemoGuideScenarioId =
  | "artist-passport-setup"
  | "find-first-grant"
  | "create-open-call"
  | "invite-reviewers-resolve-materials"
  | "review-and-shortlist"

export type DemoGuideRole = "artist" | "institution" | "collaborator"
export type DemoGuideRoleGroup = "Artists" | "Institutions"
export type DemoGuideFilter = "All" | DemoGuideRoleGroup

export type DemoGuideTargetAction =
  | "open_submission"
  | "request_info"
  | "mark_materials_ready"
  | "send_reviewer_reminder"
  | "submit_review"
  | "move_to_shortlist"
  | "prepare_opportunity_draft"
  | "prepare_report"

export type DemoGuideStep = {
  id: string
  scenarioId: DemoGuideScenarioId
  stepNumber: number
  route: string
  title: string
  body: string
  screenLabel: string
  screenCue: string
  viewerAction: string
  nextPreview?: string
  primaryActionLabel: string
  secondaryActionLabel?: string
  requiredRole?: DemoGuideRole
  targetAction?: DemoGuideTargetAction
  targetSubmissionId?: string
  nextStepId?: string
}

export type DemoGuideScenario = {
  id: DemoGuideScenarioId
  title: string
  summary: string
  roleLabel: string
  roleGroup: DemoGuideRoleGroup
  requiredRole?: DemoGuideRole
  timeEstimate: string
  outcome: string
  firstStepId: string
  previewSteps: string[]
  completionMessage: string
  recommendedNextScenarioIds: DemoGuideScenarioId[]
}

type StepSeed = Omit<DemoGuideStep, "id" | "scenarioId" | "stepNumber" | "primaryActionLabel" | "nextStepId"> & { primaryActionLabel?: string }

export const demoGuideFilters: DemoGuideFilter[] = ["All", "Artists", "Institutions"]

export const demoGuideScenarios: DemoGuideScenario[] = [
  {
    id: "artist-passport-setup",
    title: "Set Up the Artist Passport",
    summary: "Follow the first artist setup path and see where reusable materials begin.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "See how an artist starts one reusable record instead of rebuilding the same materials for every opportunity.",
    firstStepId: "artist-passport-setup-1",
    previewSteps: ["Start on artist signup", "Review Import Assist", "Open the Creative Passport"],
    completionMessage: "This walkthrough is complete. You have seen how KLEIO starts with a reusable artist record and keeps the artist in control of what becomes official.",
    recommendedNextScenarioIds: ["find-first-grant"],
  },
  {
    id: "find-first-grant",
    title: "Use the Passport to Read Opportunities",
    summary: "Move from profile context into opportunity readiness, deadlines, and missing materials.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Understand how an artist can decide what to prepare first and what still needs work.",
    firstStepId: "find-first-grant-1",
    previewSteps: ["Begin with profile signals", "Open Opportunities", "Read readiness signals"],
    completionMessage: "This walkthrough is complete. You have seen how KLEIO helps an artist understand which opportunities are worth preparing for first.",
    recommendedNextScenarioIds: ["artist-passport-setup"],
  },
  {
    id: "create-open-call",
    title: "Set Up an Institution Call",
    summary: "Move from institution setup into a structured program or open-call draft.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "See how requirements, materials, deadlines, and review structure can be organized before submissions arrive.",
    firstStepId: "create-open-call-1",
    previewSteps: ["Start institution setup", "Open Programs & Open Calls", "Prepare the call as a draft"],
    completionMessage: "This walkthrough is complete. You have seen how KLEIO turns program setup into a structured intake flow before the review cycle begins.",
    recommendedNextScenarioIds: ["invite-reviewers-resolve-materials"],
  },
  {
    id: "invite-reviewers-resolve-materials",
    title: "Coordinate Reviewers and Missing Materials",
    summary: "Follow how an institution invites reviewers, tracks incomplete submissions, and keeps follow-up attached to the review record.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "See how reviewer coordination and material follow-up can stay connected instead of spreading across email and spreadsheets.",
    firstStepId: "invite-reviewers-resolve-materials-1",
    previewSteps: ["Start from Programs", "Open Committee", "Resolve incomplete materials", "Check activity history"],
    completionMessage: "This walkthrough is complete. You have seen how KLEIO keeps reviewer coordination and missing-material follow-up close to the review workflow.",
    recommendedNextScenarioIds: ["review-and-shortlist"],
  },
  {
    id: "review-and-shortlist",
    title: "Review and Shortlist Applicants",
    summary: "Follow the institution review flow from dashboard priorities to queue, Review Room, shortlist, and report readiness.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "5–7 min",
    outcome: "See how applicant context, reviewer progress, committee discussion, shortlist movement, and reporting stay connected without crowding the dashboard.",
    firstStepId: "review-and-shortlist-1",
    previewSteps: ["Start with dashboard priorities", "Open Review Queue", "Enter Review Room", "Move into Shortlist", "Open Reports"],
    completionMessage: "This walkthrough is complete. You have seen how KLEIO orients the team first, then moves into queue work, committee discussion, shortlist, and report readiness.",
    recommendedNextScenarioIds: ["create-open-call"],
  },
]

function buildSteps(scenarioId: DemoGuideScenarioId, steps: StepSeed[]): DemoGuideStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: `${scenarioId}-${index + 1}`,
    scenarioId,
    stepNumber: index + 1,
    primaryActionLabel: step.primaryActionLabel ?? "Next",
    nextStepId: index < steps.length - 1 ? `${scenarioId}-${index + 2}` : undefined,
  }))
}

const demoGuideSteps: DemoGuideStep[] = [
  ...buildSteps("artist-passport-setup", [
    { route: "/signup/artist/", title: "Start on the artist path", body: "This screen starts the artist setup flow. It gathers the first details many applications ask for: name, location, practice area, links, and a short bio.", screenLabel: "Artist signup · Step 1 profile basics", screenCue: "Look at the profile form and the Import Assist card above it. The form can be completed manually, with or without assistance.", viewerAction: "This keeps the artist as the author of the record. KLEIO can help prepare drafts, but the artist reviews and edits before anything becomes part of the Passport.", nextPreview: "Next, the guide stays on this screen and focuses on Import Assist.", primaryActionLabel: "Next: Import Assist", requiredRole: "artist" },
    { route: "/signup/artist/", title: "Review Import Assist", body: "Import Assist is placed here so the artist can choose help before filling every field from scratch. It is optional and only prepares draft material.", screenLabel: "Artist signup · Import Assist", screenCue: "Look at the compact Import Assist card above the profile fields. It supports the form instead of taking the artist away from setup.", viewerAction: "This reduces repetition. The artist can bring existing materials into the setup process, then decide what to keep, edit, or ignore.", nextPreview: "Next, the guide opens the Creative Passport so you can see where these materials live after setup.", primaryActionLabel: "Next: Creative Passport", requiredRole: "artist" },
    { route: "/artist-dashboard/passport/", title: "Open the Creative Passport", body: "This workspace shows the reusable artist record after setup. It is where profile language, portfolio context, documents, and application-ready materials can be maintained over time.", screenLabel: "Artist workspace · Creative Passport", screenCue: "Look for passport completeness, materials readiness, profile basics, sharing controls, and artist materials.", viewerAction: "This helps with continuity. The artist does not have to rebuild the same professional record for every grant, residency, exhibition, or open call.", nextPreview: "Finish this walkthrough, or continue into the opportunity discovery flow.", primaryActionLabel: "Finish walkthrough", requiredRole: "artist" },
  ]),
  ...buildSteps("find-first-grant", [
    { route: "/signup/artist/", title: "Begin with profile signals", body: "Opportunity sorting is clearer when the artist profile has enough context: practice area, location, materials, themes, links, and readiness.", screenLabel: "Artist signup · Profile signals", screenCue: "Look at the fields that describe the artist's practice. These details become useful later when KLEIO organizes opportunities and preparation needs.", viewerAction: "The goal is not just to show more opportunities. The goal is to help the artist prepare the ones that make sense first.", nextPreview: "Next, the guide opens the Opportunities workspace.", primaryActionLabel: "Next: Opportunities", requiredRole: "artist" },
    { route: "/artist-dashboard/opportunities/", title: "Open Opportunities", body: "This page uses the Creative Passport to make grants, residencies, exhibitions, and open calls easier to sort by fit, funding, deadline, and preparation gaps.", screenLabel: "Artist workspace · Opportunities", screenCue: "Look for opportunity cards, match/readiness context, deadline timing, missing materials, and application effort. Demo opportunities are sample records.", viewerAction: "This helps the artist decide what to prepare now, what needs more material, and what can wait.", nextPreview: "Next, stay on this page and read the readiness signals more closely.", primaryActionLabel: "Next: Readiness signals", requiredRole: "artist" },
    { route: "/artist-dashboard/opportunities/", title: "Read readiness signals", body: "This view answers a practical question: does this opportunity fit, is the deadline manageable, and what still needs to be prepared?", screenLabel: "Artist workspace · Match and readiness", screenCue: "Look for fit percentage, passport completeness, missing materials, deadline urgency, and funding context.", viewerAction: "KLEIO is acting as a preparation layer. It can suggest next steps and draft materials, while the artist remains responsible for review, approval, and submission.", nextPreview: "Finish this walkthrough, or return to the Artist Passport flow.", primaryActionLabel: "Finish walkthrough", requiredRole: "artist" },
  ]),
  ...buildSteps("create-open-call", [
    { route: "/signup/institution/", title: "Start institution setup", body: "This screen begins the institution workspace. Before submissions arrive, the organization needs a basic structure for programs, review roles, required materials, and reporting needs.", screenLabel: "Institution signup · Workspace setup", screenCue: "Look at the institution onboarding fields and the Import Assist card above the form.", viewerAction: "This helps the institution start with one organized workspace instead of building the process across email folders, PDFs, and spreadsheets.", nextPreview: "Next, the guide opens Programs & Open Calls.", primaryActionLabel: "Next: Programs", requiredRole: "institution" },
    { route: "/programs/", title: "Open Programs & Open Calls", body: "Programs are the containers for open calls, grants, residencies, exhibitions, or review cycles. This page keeps those initiatives visible in one place.", screenLabel: "Institution workspace · Programs", screenCue: "Look for program status, deadlines, submission counts, incomplete materials, and assigned reviewers.", viewerAction: "This helps the team see where each program stands before entering individual submissions.", nextPreview: "Next, the guide opens the new open-call draft screen.", primaryActionLabel: "Next: New open call", requiredRole: "institution" },
    { route: "/programs/new/", title: "Create a draft open call", body: "This screen is where the institution begins shaping the intake structure: title, description, eligibility, deadline, required materials, and review flow.", screenLabel: "Institution workspace · New program draft", screenCue: "Look for fields that define the call before applicants submit materials. This is a controlled demo draft, not a live published call.", viewerAction: "A structured call gives artists clearer requirements and gives reviewers cleaner information later.", nextPreview: "Next, stay on the draft state and close the setup walkthrough.", primaryActionLabel: "Next: Draft ready", requiredRole: "institution" },
    { route: "/programs/new/", title: "Confirm draft readiness", body: "At this point, the open call is still a draft. The structure is prepared so review, committee work, and reporting can use the same information later.", screenLabel: "Institution workspace · Draft readiness", screenCue: "Stay on the new program screen and treat the configured call as a demo-only draft.", viewerAction: "This keeps the demo clear. KLEIO is showing the workflow without implying that a real public opportunity has been launched.", nextPreview: "Finish this walkthrough, or continue into reviewer coordination.", primaryActionLabel: "Finish walkthrough", requiredRole: "institution" },
  ]),
  ...buildSteps("invite-reviewers-resolve-materials", [
    { route: "/programs/", title: "Start from active programs", body: "This page shows which programs are active and where review coordination is needed.", screenLabel: "Institution workspace · Programs", screenCue: "Look for program status, submission counts, incomplete materials, deadlines, and assigned reviewers.", viewerAction: "This helps the institution see which call needs administrative attention before reviewers begin or decisions are made.", nextPreview: "Next, open Committee to look at reviewer coordination.", primaryActionLabel: "Next: Committee", requiredRole: "institution" },
    { route: "/committee/", title: "Check reviewer coordination", body: "Committee shows reviewer seats, pending assignments, and places where a reminder or role check may be needed.", screenLabel: "Institution workspace · Committee", screenCue: "Look for reviewers, role coverage, pending actions, and completion progress.", viewerAction: "This keeps reviewer coordination visible so the team does not rely on memory or separate email follow-ups.", nextPreview: "Next, open Review Queue to locate incomplete materials.", primaryActionLabel: "Next: Review Queue", requiredRole: "institution", targetAction: "send_reviewer_reminder" },
    { route: "/review-queue/", title: "Locate incomplete submissions", body: "Review Queue helps the team see which applications are ready and which still need missing materials or clarification.", screenLabel: "Institution workspace · Review Queue", screenCue: "Look for completeness indicators, material status, reviewer assignment, and priority filters.", viewerAction: "This makes follow-up specific: the team can see what is missing before asking the artist or reviewer for an update.", nextPreview: "Next, open Messages to see where follow-up belongs.", primaryActionLabel: "Next: Messages", requiredRole: "institution", targetAction: "request_info" },
    { route: "/messages/", title: "Keep follow-up near the work", body: "Messages keeps program and review communication close to the submission or workflow it affects.", screenLabel: "Institution workspace · Messages", screenCue: "Look for threads related to missing materials, reviewer timing, and application follow-up.", viewerAction: "This prevents important updates from living only in outside inboxes where the review team may lose context.", nextPreview: "Next, open Activity Log to see how the record is preserved.", primaryActionLabel: "Next: Activity Log", requiredRole: "institution" },
    { route: "/activity-log/", title: "Confirm the record is preserved", body: "Activity Log keeps a trace of review movement, messages, material updates, and status changes.", screenLabel: "Institution workspace · Activity Log", screenCue: "Look for recorded actions tied to artists, programs, messages, and decisions.", viewerAction: "This helps the institution answer what changed, when it changed, and why the next step happened.", nextPreview: "Finish this walkthrough, or continue into review and shortlist decisions.", primaryActionLabel: "Finish walkthrough", requiredRole: "institution" },
  ]),
  ...buildSteps("review-and-shortlist", [
    { route: "/dashboard/", title: "Start at the dashboard priorities", body: "The workflow now begins where the user lands: the top of the institution dashboard. First orient around the cycle path, then use the priority cards to decide what needs action.", screenLabel: "Institution workspace · Dashboard priorities", screenCue: "Look at the workflow path and the three priority cards at the top: Needs attention, Reviewer follow-up, and Ready for decision.", viewerAction: "This makes the sequence feel intentional. The dashboard orients the team first; deeper work happens in the queue, room, shortlist, and reports after that.", nextPreview: "Next, the guide opens Review Queue.", primaryActionLabel: "Next: Review Queue", requiredRole: "institution" },
    { route: "/review-queue/", title: "Open Review Queue", body: "Review Queue is the working layer for applications that need attention before deeper committee conversation.", screenLabel: "Institution workspace · Review Queue", screenCue: "Look for readiness, missing materials, assigned reviewers, priorities, and status filters.", viewerAction: "This helps the team clean the intake layer before asking the committee to make decisions.", nextPreview: "Next, move into Review Room for discussion.", primaryActionLabel: "Next: Review Room", requiredRole: "institution", targetAction: "open_submission" },
    { route: "/review-room/", title: "Enter Review Room", body: "Review Room is the calmer decision space. It keeps enough applicant and reviewer context nearby for meaningful conversation without crowding the main dashboard.", screenLabel: "Institution workspace · Review Room", screenCue: "Look for the open call context, applicant readiness, reviewer progress, decision lanes, and report readiness.", viewerAction: "This is where the committee can discuss what is ready, what still needs care, and what should move toward shortlist or report.", nextPreview: "Next, open Shortlist to see what moved forward.", primaryActionLabel: "Next: Shortlist", requiredRole: "institution" },
    { route: "/shortlist/", title: "Open Shortlist", body: "Shortlist gathers applicants ready for closer decision-making. Notes and status context stay attached as the group narrows.", screenLabel: "Institution workspace · Shortlist", screenCue: "Look for shortlisted artists, finalist status, committee vote context, and export or reporting actions.", viewerAction: "This helps preserve why an applicant moved forward, so review history is not lost after the meeting.", nextPreview: "Next, open Reports to see how the decision story is preserved.", primaryActionLabel: "Next: Reports", requiredRole: "institution", targetAction: "move_to_shortlist" },
    { route: "/reports/", title: "Open Reports", body: "Reports turns the cycle into institutional memory. It gathers outcomes, reviewer progress, shortlist movement, and decision history without requiring the team to rebuild the story later.", screenLabel: "Institution workspace · Reports", screenCue: "Look for the Program Report Draft, decision history, reviewer completion, and supporting analytics.", viewerAction: "This is the benefit of keeping the workflow connected: the institution can explain what happened and why.", nextPreview: "Finish this walkthrough, or return to open-call setup.", primaryActionLabel: "Finish walkthrough", requiredRole: "institution", targetAction: "prepare_report" },
  ]),
]

const stepById = new Map(demoGuideSteps.map((step) => [step.id, step]))
const scenarioById = new Map(demoGuideScenarios.map((scenario) => [scenario.id, scenario]))

export function getScenarioSteps(scenarioId: DemoGuideScenarioId): DemoGuideStep[] {
  return demoGuideSteps.filter((step) => step.scenarioId === scenarioId).sort((a, b) => a.stepNumber - b.stepNumber)
}

export function getFirstStepForScenario(scenarioId: DemoGuideScenarioId): DemoGuideStep | undefined {
  const scenario = scenarioById.get(scenarioId)
  if (!scenario) return undefined
  return stepById.get(scenario.firstStepId)
}

export function getGuideStep(stepId: string | null | undefined): DemoGuideStep | undefined {
  if (!stepId) return undefined
  return stepById.get(stepId)
}

export function getNextGuideStep(currentStepId: string | null | undefined): DemoGuideStep | undefined {
  const current = getGuideStep(currentStepId)
  if (!current?.nextStepId) return undefined
  return stepById.get(current.nextStepId)
}

export function getPreviousGuideStep(currentStepId: string | null | undefined): DemoGuideStep | undefined {
  const current = getGuideStep(currentStepId)
  if (!current) return undefined
  const steps = getScenarioSteps(current.scenarioId)
  const index = steps.findIndex((step) => step.id === current.id)
  if (index <= 0) return undefined
  return steps[index - 1]
}

export function getScenarioById(scenarioId: DemoGuideScenarioId | null | undefined): DemoGuideScenario | undefined {
  if (!scenarioId) return undefined
  return scenarioById.get(scenarioId)
}

export function isDemoGuideScenarioId(value: string | null | undefined): value is DemoGuideScenarioId {
  if (!value) return false
  return scenarioById.has(value as DemoGuideScenarioId)
}

export function getRecommendedScenariosForPath(pathname: string | null | undefined): DemoGuideScenario[] {
  const path = pathname ?? ""
  const artistScenarios = demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists")
  const institutionScenarios = demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions")
  if (path.startsWith("/artist-dashboard") || path.startsWith("/signup/artist")) return [...artistScenarios, ...institutionScenarios]
  if (path.startsWith("/dashboard") || path.startsWith("/signup/institution") || path.startsWith("/programs") || path.startsWith("/committee") || path.startsWith("/review-queue") || path.startsWith("/review-room") || path.startsWith("/messages") || path.startsWith("/activity-log") || path.startsWith("/shortlist") || path.startsWith("/reports")) return [...institutionScenarios, ...artistScenarios]
  return demoGuideScenarios
}

export function getRecommendedNextScenarios(scenarioId: DemoGuideScenarioId | null | undefined): DemoGuideScenario[] {
  const scenario = getScenarioById(scenarioId)
  if (!scenario) return []
  return scenario.recommendedNextScenarioIds.map((nextId) => getScenarioById(nextId)).filter((entry): entry is DemoGuideScenario => Boolean(entry))
}
