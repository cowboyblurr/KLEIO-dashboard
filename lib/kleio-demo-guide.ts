export type DemoGuideScenarioId =
  | "artist-passport-setup"
  | "find-first-grant"
  | "prepare-application-draft"
  | "track-application-progress"
  | "discover-artist-collaborators"
  | "start-institutional-workspace"
  | "create-open-call"
  | "invite-reviewers-committee"
  | "review-and-shortlist"
  | "resolve-incomplete-applications"
  | "generate-report"
  | "investor-partner-flywheel"

export type DemoGuideRole = "artist" | "institution" | "collaborator" | "partner"
export type DemoGuideRoleGroup = "Artists" | "Institutions" | "Reviewers" | "Partners / Investors"
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

type StepSeed = Omit<
  DemoGuideStep,
  "id" | "scenarioId" | "stepNumber" | "primaryActionLabel" | "nextStepId"
> & {
  primaryActionLabel?: string
}

export const demoGuideFilters: DemoGuideFilter[] = [
  "All",
  "Artists",
  "Institutions",
  "Reviewers",
  "Partners / Investors",
]

export const demoGuideScenarios: DemoGuideScenario[] = [
  {
    id: "artist-passport-setup",
    title: "Artist Passport Setup",
    summary: "Build a reusable artist profile that can support future applications.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Build a reusable artist profile that can support future applications.",
    firstStepId: "artist-passport-setup-1",
    previewSteps: ["Start artist profile basics", "Use Import Assist for draft material", "Review Passport readiness"],
    completionMessage:
      "Your Creative Passport walkthrough is complete. The artist can see what is ready, what needs review, and what can support future applications.",
    recommendedNextScenarioIds: ["find-first-grant", "prepare-application-draft"],
  },
  {
    id: "find-first-grant",
    title: "Find Your First Grant / Open Call",
    summary: "Search opportunities and identify a strong-fit grant or open call.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Search opportunities and identify a strong-fit grant or open call.",
    firstStepId: "find-first-grant-1",
    previewSteps: ["Open Opportunities", "Filter by discipline and deadline", "Review fit, urgency, and readiness"],
    completionMessage:
      "The opportunity search walkthrough is complete. The artist has seen how KLEIO turns scattered searching into a readiness-aware workflow.",
    recommendedNextScenarioIds: ["prepare-application-draft", "track-application-progress"],
  },
  {
    id: "prepare-application-draft",
    title: "Prepare an Application Draft",
    summary: "Use Artist Passport materials to prepare a draft application for review.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "4–6 min",
    outcome: "Use Artist Passport materials to prepare a draft application.",
    firstStepId: "prepare-application-draft-1",
    previewSteps: ["Select a matched opportunity", "Review required materials", "Prepare draft answers for approval"],
    completionMessage:
      "The application draft walkthrough is complete. KLEIO prepares structure and suggested material for review while the artist approves what becomes official.",
    recommendedNextScenarioIds: ["track-application-progress", "artist-passport-setup"],
  },
  {
    id: "track-application-progress",
    title: "Track Application Progress",
    summary: "See active opportunities, deadlines, and missing tasks in one place.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "2–4 min",
    outcome: "See active opportunities, deadlines, and missing tasks.",
    firstStepId: "track-application-progress-1",
    previewSteps: ["Open application tracker", "Review urgent deadlines", "Mark one task prepared"],
    completionMessage:
      "The application tracking walkthrough is complete. The artist can see what is active, what is urgent, and what still needs attention.",
    recommendedNextScenarioIds: ["find-first-grant", "discover-artist-collaborators"],
  },
  {
    id: "discover-artist-collaborators",
    title: "Discover Artist Collaborators",
    summary: "Find aligned artists based on medium, themes, location, and opportunity goals.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Find aligned artists based on practice spectrum and opportunity goals.",
    firstStepId: "discover-artist-collaborators-1",
    previewSteps: ["Open Collaborator Matching", "Review artist spectrum tags", "Save an aligned collaborator"],
    completionMessage:
      "The collaborator discovery walkthrough is complete. The artist has seen how KLEIO can surface aligned creative practices without becoming a cold directory.",
    recommendedNextScenarioIds: ["find-first-grant", "track-application-progress"],
  },
  {
    id: "start-institutional-workspace",
    title: "Start an Institutional Workspace",
    summary: "Create a demo workspace for managing submissions and review activity.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "3–5 min",
    outcome: "Create a demo workspace for managing submissions.",
    firstStepId: "start-institutional-workspace-1",
    previewSteps: ["Start institution onboarding", "Add organization basics", "Enter the workspace dashboard"],
    completionMessage:
      "The institutional workspace walkthrough is complete. The institution has entered a structured demo environment for submissions, reviews, and reports.",
    recommendedNextScenarioIds: ["create-open-call", "invite-reviewers-committee"],
  },
  {
    id: "create-open-call",
    title: "Create Your First Open Call",
    summary: "Prepare a structured open call, grant, residency, or exhibition intake flow.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "Prepare a structured open call or residency intake flow.",
    firstStepId: "create-open-call-1",
    previewSteps: ["Open Programs / Open Calls", "Add eligibility and materials", "Save the call as a draft"],
    completionMessage:
      "The open call walkthrough is complete. The institution has seen how KLEIO turns program setup into structured intake instead of scattered forms and files.",
    recommendedNextScenarioIds: ["invite-reviewers-committee", "review-and-shortlist"],
  },
  {
    id: "invite-reviewers-committee",
    title: "Invite Reviewers / Committee",
    summary: "Assign reviewers, jurors, or collaborators to a program.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "3–5 min",
    outcome: "Assign reviewers, jurors, or collaborators to a program.",
    firstStepId: "invite-reviewers-committee-1",
    previewSteps: ["Open Committee", "Add sample reviewers", "Connect reviewers to an open call"],
    completionMessage:
      "The reviewer invitation walkthrough is complete. The institution has seen how review seats can stay scoped to assigned submissions and program context.",
    recommendedNextScenarioIds: ["review-and-shortlist", "generate-report"],
  },
  {
    id: "review-and-shortlist",
    title: "Review and Shortlist Applicants",
    summary: "Move from submitted applications to organized review decisions.",
    roleLabel: "Institution / Reviewer",
    roleGroup: "Reviewers",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "Move from submissions to organized review decisions.",
    firstStepId: "review-and-shortlist-1",
    previewSteps: ["Open Review Queue", "Score with rubric context", "Move an applicant to shortlist"],
    completionMessage:
      "The review and shortlist walkthrough is complete. The review path now shows how submissions become decisions with context, notes, and preserved history.",
    recommendedNextScenarioIds: ["generate-report", "resolve-incomplete-applications"],
  },
  {
    id: "resolve-incomplete-applications",
    title: "Resolve Incomplete Applications",
    summary: "Identify missing applicant materials and prepare follow-up.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "3–5 min",
    outcome: "Identify incomplete submissions and prepare follow-up.",
    firstStepId: "resolve-incomplete-applications-1",
    previewSteps: ["Open Submissions", "Filter incomplete materials", "Prepare follow-up message"],
    completionMessage:
      "The incomplete application walkthrough is complete. The institution has seen how missing materials can be surfaced and handled without losing applicant context.",
    recommendedNextScenarioIds: ["review-and-shortlist", "generate-report"],
  },
  {
    id: "generate-report",
    title: "Generate a Report",
    summary: "Convert review activity into a clean internal report.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "3–5 min",
    outcome: "Convert review activity into a clean internal report.",
    firstStepId: "generate-report-1",
    previewSteps: ["Open Reports / Analytics", "Review shortlist summary", "Preview synthetic report"],
    completionMessage:
      "The report walkthrough is complete. KLEIO has shown how review activity, shortlist movement, and program context can become an internal record.",
    recommendedNextScenarioIds: ["create-open-call", "investor-partner-flywheel"],
  },
  {
    id: "investor-partner-flywheel",
    title: "Investor / Partner Flywheel Walkthrough",
    summary: "Show how artist acquisition, opportunity matching, institutional workflows, and reporting connect.",
    roleLabel: "Partner / Investor",
    roleGroup: "Partners / Investors",
    timeEstimate: "4–6 min",
    outcome: "Understand the platform loop connecting artist value, institution workflow, and review/reporting value.",
    firstStepId: "investor-partner-flywheel-1",
    previewSteps: ["Start with Artist Passport", "Move into opportunity matching", "Close with institution review and reporting"],
    completionMessage:
      "The partner flywheel walkthrough is complete. The demo now shows KLEIO as a connected lifecycle: artist materials, opportunity matching, institutional intake, review, shortlist, and reporting.",
    recommendedNextScenarioIds: ["artist-passport-setup", "create-open-call", "generate-report"],
  },
]

function buildSteps(scenarioId: DemoGuideScenarioId, steps: StepSeed[]): DemoGuideStep[] {
  return steps.map((step, index) => ({
    ...step,
    id: `${scenarioId}-${index + 1}`,
    scenarioId,
    stepNumber: index + 1,
    primaryActionLabel: step.primaryActionLabel ?? "Take me there",
    nextStepId: index < steps.length - 1 ? `${scenarioId}-${index + 2}` : undefined,
  }))
}

const demoGuideSteps: DemoGuideStep[] = [
  ...buildSteps("artist-passport-setup", [
    {
      route: "/signup/artist/",
      title: "Start with profile basics",
      body: "Begin where most applications begin: name, location, discipline, portfolio link, and short bio. This is prototype onboarding, not production account creation.",
      requiredRole: "artist",
    },
    {
      route: "/signup/artist/",
      title: "Use Import Assist for draft material",
      body: "KLEIO Import Assist can prepare suggested fields from materials the artist already maintains. The artist reviews, edits, and approves what becomes official.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "Review Creative Passport readiness",
      body: "The Passport gathers bio, statement, CV, portfolio, work samples, references, and reusable answers into one reviewable profile.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "See what is ready and what needs review",
      body: "End by showing which materials are ready, which are still drafts, and what can support future opportunities.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("find-first-grant", [
    {
      route: "/artist-dashboard/opportunities/",
      title: "Open Opportunities",
      body: "Start from the artist opportunity directory. Demo opportunities use synthetic data so the flow can be tested without implying a live grant database.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Filter by fit and deadline",
      body: "Guide the artist through discipline, deadline, location, funding type, and effort filters so the search feels focused instead of overwhelming.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Review match and readiness",
      body: "Show match percentage, deadline urgency, missing materials, and application effort. These are suggested signals prepared for review, not automatic decisions.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Open a recommended opportunity",
      body: "End with one strong-fit opportunity so the artist can understand why it is relevant and what still needs to be prepared.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("prepare-application-draft", [
    {
      route: "/artist-dashboard/opportunities/",
      title: "Select a matched opportunity",
      body: "Begin from a high-fit synthetic opportunity and show how the artist moves from discovery into preparation.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/applications/",
      title: "Review required materials",
      body: "Show requirements side-by-side with Passport readiness: bio, statement, CV, portfolio, proposal, work samples, and references.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/applications/",
      title: "Identify missing items",
      body: "Surface missing or weak materials before the artist spends energy applying. Keep the signal practical and reviewable.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "Prepare draft answers from Passport material",
      body: "KLEIO can prepare suggested application language from approved Passport material. The artist still reviews and approves what becomes official.",
      requiredRole: "artist",
      targetAction: "prepare_opportunity_draft",
    },
    {
      route: "/artist-dashboard/applications/",
      title: "Save the application draft",
      body: "End with the draft saved for later review instead of implying that KLEIO submits automatically.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("track-application-progress", [
    {
      route: "/artist-dashboard/applications/",
      title: "Open the application tracker",
      body: "Show active applications, drafts, upcoming deadlines, waiting statuses, and decision windows from one calm workspace.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/calendar/",
      title: "Review deadline pressure",
      body: "Use the calendar to show what is due soon and what has enough time for careful preparation.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/applications/",
      title: "Find the next missing task",
      body: "Point the artist to one practical next action: review a statement, attach a CV, update work samples, or prepare a proposal answer.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/applications/",
      title: "Mark one task prepared",
      body: "End with a clear sense of progress. The artist should know what moved forward and what still needs attention.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("discover-artist-collaborators", [
    {
      route: "/artist-dashboard/collaborators/",
      title: "Open Collaborator Matching",
      body: "Begin with artists whose medium, themes, location, or opportunity goals overlap with the current Creative Passport.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/collaborators/",
      title: "Review artist spectrum tags",
      body: "Show why a collaborator is suggested: shared themes, adjacent mediums, overlapping deadlines, or complementary project direction.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/collaborators/",
      title: "Save one collaborator",
      body: "End by saving a collaborator to the artist network. Keep this as a demo action, not a real outbound message.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("start-institutional-workspace", [
    {
      route: "/signup/institution/",
      title: "Start institution onboarding",
      body: "Begin with institution profile and workspace setup. This is prototype onboarding using demo workspace language.",
      requiredRole: "institution",
    },
    {
      route: "/signup/institution/",
      title: "Add organization basics",
      body: "Collect the core information needed to shape a review environment: organization name, program focus, review type, and team structure.",
      requiredRole: "institution",
    },
    {
      route: "/dashboard/",
      title: "Enter the institution workspace",
      body: "End inside the dashboard where submissions, reviewer progress, missing materials, shortlists, and reports can be managed.",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("create-open-call", [
    {
      route: "/programs/",
      title: "Open Programs / Open Calls",
      body: "Start from the institution program area where grants, residencies, exhibitions, and open calls are managed.",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Create a new call",
      body: "Prepare the call structure: title, program type, deadline, eligibility, required materials, and review stages.",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Add eligibility and required materials",
      body: "Define what applicants need to submit so incomplete applications can be identified before review.",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Preview applicant-facing structure",
      body: "Show the open call as an organized intake experience, not as a loose PDF or email instruction thread.",
      requiredRole: "institution",
    },
    {
      route: "/programs/",
      title: "Save as draft",
      body: "End with the call prepared as a draft. Do not imply it has been published to a live public marketplace.",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("invite-reviewers-committee", [
    {
      route: "/committee/",
      title: "Open Committee",
      body: "Start with the institution review team area where reviewers, jurors, collaborators, and limited review seats are organized.",
      requiredRole: "institution",
    },
    {
      route: "/committee/",
      title: "Add sample reviewers",
      body: "Use synthetic demo reviewers and prepared invitations. Do not imply real invitations have been sent.",
      requiredRole: "institution",
      targetAction: "send_reviewer_reminder",
    },
    {
      route: "/committee/",
      title: "Assign roles and permissions",
      body: "Show the difference between an institution admin and a limited review seat. Reviewers should see only assigned work.",
      requiredRole: "institution",
    },
    {
      route: "/collaborator-dashboard/",
      title: "Preview the collaborator review seat",
      body: "End by showing the scoped reviewer view so institutions understand how committee access can stay focused.",
      requiredRole: "collaborator",
    },
  ]),
  ...buildSteps("review-and-shortlist", [
    {
      route: "/review-queue/",
      title: "Open Review Queue",
      body: "Start where institution teams need clarity: assigned submissions, readiness, deadlines, reviewer progress, and priority signals.",
      requiredRole: "institution",
      targetAction: "open_submission",
    },
    {
      route: "/review-queue/",
      title: "View a synthetic applicant submission",
      body: "Show artist context, program fit, required materials, internal notes, and rubric readiness in one place.",
      requiredRole: "institution",
    },
    {
      route: "/collaborator-dashboard/review-queue/",
      title: "Score with rubric context",
      body: "Preview the reviewer seat so the scoring experience feels focused and tied to the institution rubric.",
      requiredRole: "collaborator",
      targetAction: "submit_review",
    },
    {
      route: "/review-queue/",
      title: "Add an internal note",
      body: "Show how the institution preserves decision context without relying on private spreadsheets or scattered emails.",
      requiredRole: "institution",
    },
    {
      route: "/shortlist/",
      title: "Move applicant to shortlist",
      body: "End by moving a strong candidate into a shortlist view where the committee can continue final review.",
      requiredRole: "institution",
      targetAction: "move_to_shortlist",
    },
  ]),
  ...buildSteps("resolve-incomplete-applications", [
    {
      route: "/submissions/",
      title: "Open the submissions database",
      body: "Start from the database view where institutions can search, filter, and compare application records.",
      requiredRole: "institution",
    },
    {
      route: "/submissions/",
      title: "Filter incomplete materials",
      body: "Surface applications that need materials before review so staff can address gaps early.",
      requiredRole: "institution",
    },
    {
      route: "/messages/",
      title: "Prepare a follow-up message",
      body: "Use a prepared follow-up message to ask for missing materials. Keep it as a demo action until the user approves.",
      requiredRole: "institution",
      targetAction: "request_info",
    },
    {
      route: "/activity-log/",
      title: "Preserve the follow-up record",
      body: "End with the issue recorded as pending applicant response so the institution does not lose context.",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("generate-report", [
    {
      route: "/reports/",
      title: "Open Reports / Analytics",
      body: "Start from the reporting area where submission volume, review progress, shortlist movement, and pending actions are summarized.",
      requiredRole: "institution",
    },
    {
      route: "/reports/",
      title: "Review program summary",
      body: "Show total applications, in-review count, shortlist count, pending vote, and incomplete materials.",
      requiredRole: "institution",
    },
    {
      route: "/reports/",
      title: "Preview synthetic report",
      body: "End with a report preview using synthetic demo data. Do not imply a production export or live integration.",
      requiredRole: "institution",
      targetAction: "prepare_report",
    },
  ]),
  ...buildSteps("investor-partner-flywheel", [
    {
      route: "/signup/artist/",
      title: "Start with artist acquisition",
      body: "The flywheel begins with immediate artist value: a reusable Creative Passport that reduces repeated application labor.",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Show opportunity matching",
      body: "Once the Passport exists, KLEIO can suggest opportunities, readiness gaps, and next application actions from synthetic demo data.",
    },
    {
      route: "/programs/new/",
      title: "Move into institution workflow",
      body: "Institutions create structured open calls, required materials, eligibility, review stages, and committee assignments.",
    },
    {
      route: "/review-queue/",
      title: "Show review and shortlist value",
      body: "The institution receives organized submissions while reviewers get focused context, scoring, and decision history.",
    },
    {
      route: "/reports/",
      title: "Close with reporting and memory",
      body: "The loop ends with preserved review activity, shortlist decisions, and reports — showing KLEIO as infrastructure, not just a dashboard.",
    },
  ]),
]

const stepById = new Map(demoGuideSteps.map((step) => [step.id, step]))
const scenarioById = new Map(demoGuideScenarios.map((scenario) => [scenario.id, scenario]))

export function getScenarioSteps(scenarioId: DemoGuideScenarioId): DemoGuideStep[] {
  return demoGuideSteps
    .filter((step) => step.scenarioId === scenarioId)
    .sort((a, b) => a.stepNumber - b.stepNumber)
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

export function getScenarioById(
  scenarioId: DemoGuideScenarioId | null | undefined,
): DemoGuideScenario | undefined {
  if (!scenarioId) return undefined
  return scenarioById.get(scenarioId)
}

export function isDemoGuideScenarioId(value: string | null | undefined): value is DemoGuideScenarioId {
  if (!value) return false
  return scenarioById.has(value as DemoGuideScenarioId)
}

export function getRecommendedScenariosForPath(pathname: string | null | undefined): DemoGuideScenario[] {
  const path = pathname ?? ""

  if (path.startsWith("/artist-dashboard") || path.startsWith("/signup/artist")) {
    return [
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup !== "Artists"),
    ]
  }

  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/signup/institution") ||
    path.startsWith("/programs") ||
    path.startsWith("/review-queue") ||
    path.startsWith("/submissions") ||
    path.startsWith("/committee") ||
    path.startsWith("/shortlist") ||
    path.startsWith("/reports")
  ) {
    return [
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Reviewers"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Partners / Investors"),
    ]
  }

  if (path.startsWith("/collaborator-dashboard")) {
    return [
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Reviewers"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists"),
      ...demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Partners / Investors"),
    ]
  }

  return demoGuideScenarios
}

export function getRecommendedNextScenarios(
  scenarioId: DemoGuideScenarioId | null | undefined,
): DemoGuideScenario[] {
  const scenario = getScenarioById(scenarioId)
  if (!scenario) return []
  return scenario.recommendedNextScenarioIds
    .map((nextId) => getScenarioById(nextId))
    .filter((entry): entry is DemoGuideScenario => Boolean(entry))
}
