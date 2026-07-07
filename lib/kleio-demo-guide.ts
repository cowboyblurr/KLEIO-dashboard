export type DemoGuideScenarioId =
  | "artist-passport-setup"
  | "find-first-grant"
  | "create-open-call"
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

type StepSeed = Omit<
  DemoGuideStep,
  "id" | "scenarioId" | "stepNumber" | "primaryActionLabel" | "nextStepId"
> & {
  primaryActionLabel?: string
}

export const demoGuideFilters: DemoGuideFilter[] = ["All", "Artists", "Institutions"]

export const demoGuideScenarios: DemoGuideScenario[] = [
  {
    id: "artist-passport-setup",
    title: "Create Your Artist Passport",
    summary: "Walk through the first artist setup flow and see how reusable materials begin.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "See how an artist starts one reusable profile instead of rebuilding the same materials for each opportunity.",
    firstStepId: "artist-passport-setup-1",
    previewSteps: [
      "Start on artist signup",
      "Review where Import Assist appears",
      "Open the Creative Passport workspace",
    ],
    completionMessage:
      "This walkthrough is complete. You have seen how KLEIO starts with a reusable artist record and keeps the artist in control of what becomes official.",
    recommendedNextScenarioIds: ["find-first-grant"],
  },
  {
    id: "find-first-grant",
    title: "Find Your First Grant / Open Call",
    summary: "See how the artist workspace connects profile readiness to relevant opportunities.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Understand how an artist can compare opportunities by fit, readiness, deadline pressure, and missing materials.",
    firstStepId: "find-first-grant-1",
    previewSteps: [
      "Begin with the artist profile foundation",
      "Open Opportunities",
      "Read match and readiness signals",
    ],
    completionMessage:
      "This walkthrough is complete. You have seen how KLEIO helps an artist understand which opportunities are worth preparing for first.",
    recommendedNextScenarioIds: ["artist-passport-setup"],
  },
  {
    id: "create-open-call",
    title: "Create Your First Open Call",
    summary: "Walk through how an institution starts a structured program intake flow.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "See how program information, requirements, and review structure can be organized before submissions arrive.",
    firstStepId: "create-open-call-1",
    previewSteps: [
      "Start with institution setup",
      "Open Programs & Open Calls",
      "Prepare the call as a draft",
    ],
    completionMessage:
      "This walkthrough is complete. You have seen how KLEIO turns program setup into a structured intake flow before the review cycle begins.",
    recommendedNextScenarioIds: ["review-and-shortlist"],
  },
  {
    id: "review-and-shortlist",
    title: "Review and Shortlist Applicants",
    summary: "Follow the institution review flow from overview to queue to shortlist.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "See how submissions, reviewer context, committee progress, and shortlist decisions stay connected.",
    firstStepId: "review-and-shortlist-1",
    previewSteps: [
      "Begin in the institution overview",
      "Open Review Queue",
      "Move into Shortlist",
    ],
    completionMessage:
      "This walkthrough is complete. You have seen how KLEIO keeps review context visible from intake through shortlist decisions.",
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
    {
      route: "/signup/artist/",
      title: "Start on the artist path",
      body:
        "This screen is the beginning of the artist setup flow. It collects the first details most applications ask for: name, location, practice area, links, and a short bio.",
      screenLabel: "Artist signup · Step 1 profile basics",
      screenCue:
        "Look at the profile form and the Import Assist card above it. The form can be completed manually, with or without assistance.",
      viewerAction:
        "This step keeps the artist as the author of the record. KLEIO can help prepare drafts, but the artist reviews and edits the information before it becomes part of the passport.",
      nextPreview: "Next, the guide stays on this screen and focuses on Import Assist.",
      primaryActionLabel: "Next: Import Assist",
      requiredRole: "artist",
    },
    {
      route: "/signup/artist/",
      title: "Review Import Assist",
      body:
        "Import Assist is placed here so the artist can choose help before filling every field from scratch. It is optional and supports draft preparation only.",
      screenLabel: "Artist signup · Import Assist",
      screenCue:
        "Look at the compact Import Assist card above the profile fields. It sits inside the onboarding flow rather than taking the artist away from the form.",
      viewerAction:
        "The benefit is reduced repetition. An artist can bring existing materials into the setup process, then decide what to keep, edit, or ignore.",
      nextPreview: "Next, the guide opens the Creative Passport workspace so you can see where these materials live after setup.",
      primaryActionLabel: "Next: Creative Passport",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "Open the Creative Passport",
      body:
        "This workspace shows the reusable artist record after setup. It is where profile language, portfolio context, documents, and application-ready materials can be maintained over time.",
      screenLabel: "Artist workspace · Creative Passport",
      screenCue:
        "Look for passport completeness, materials readiness, profile basics, sharing controls, and artist materials.",
      viewerAction:
        "The reason this matters is continuity. The artist does not have to rebuild the same professional record for every grant, residency, exhibition, or open call.",
      nextPreview: "Finish this walkthrough, or continue into the opportunity discovery flow.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("find-first-grant", [
    {
      route: "/signup/artist/",
      title: "Begin with profile signals",
      body:
        "Opportunity matching is clearer when the artist profile has enough context: practice area, location, materials, themes, links, and readiness.",
      screenLabel: "Artist signup · Profile signals",
      screenCue:
        "Look at the fields that describe the artist's practice. These details become useful later when KLEIO organizes opportunities and application readiness.",
      viewerAction:
        "This keeps discovery connected to the artist's actual materials. The goal is not more opportunities; it is clearer preparation for the right ones.",
      nextPreview: "Next, the guide opens the Opportunities workspace.",
      primaryActionLabel: "Next: Opportunities",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Open Opportunities",
      body:
        "This page turns the Creative Passport into a practical discovery tool. Opportunities can be reviewed by fit, funding, deadline pressure, and preparation gaps.",
      screenLabel: "Artist workspace · Opportunities",
      screenCue:
        "Look for opportunity cards, match/readiness context, deadline timing, missing materials, and application effort. Demo opportunities are synthetic.",
      viewerAction:
        "The benefit is prioritization. An artist can see what is worth preparing now, what needs more material, and what can wait.",
      nextPreview: "Next, stay on this page and read the readiness signals more closely.",
      primaryActionLabel: "Next: Readiness signals",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Read readiness signals",
      body:
        "This view should help answer a practical question: is this opportunity aligned, is the deadline manageable, and what still needs to be prepared?",
      screenLabel: "Artist workspace · Match and readiness",
      screenCue:
        "Look for fit percentage, passport completeness, missing materials, deadline urgency, and funding context.",
      viewerAction:
        "KLEIO is acting as a preparation layer. It can suggest next steps and draft materials, while the artist remains responsible for review, approval, and submission.",
      nextPreview: "Finish this walkthrough, or return to the Artist Passport flow.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("create-open-call", [
    {
      route: "/signup/institution/",
      title: "Start institution setup",
      body:
        "This screen begins the institution workspace. Before submissions arrive, the organization needs a basic structure for programs, review roles, required materials, and reporting needs.",
      screenLabel: "Institution signup · Workspace setup",
      screenCue:
        "Look at the institution onboarding fields and the Import Assist card above the form.",
      viewerAction:
        "This step exists to reduce scattered setup work. Instead of building a process through email folders, PDFs, and spreadsheets, the institution starts with one organized workspace.",
      nextPreview: "Next, the guide opens Programs & Open Calls.",
      primaryActionLabel: "Next: Programs",
      requiredRole: "institution",
    },
    {
      route: "/programs/",
      title: "Open Programs & Open Calls",
      body:
        "Programs are the containers for open calls, grants, residencies, exhibitions, or review cycles. This page keeps those initiatives visible in one place.",
      screenLabel: "Institution workspace · Programs",
      screenCue:
        "Look for program status, deadlines, submission counts, incomplete materials, and assigned reviewers.",
      viewerAction:
        "The benefit is operational clarity. A team can see where each program stands before entering individual submissions.",
      nextPreview: "Next, the guide opens the new open-call draft screen.",
      primaryActionLabel: "Next: New open call",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Create a draft open call",
      body:
        "This screen is where the institution begins shaping the intake structure: title, description, eligibility, deadline, required materials, and review flow.",
      screenLabel: "Institution workspace · New program draft",
      screenCue:
        "Look for fields that define the call before applicants submit materials. This is a controlled demo draft, not a live published call.",
      viewerAction:
        "The reason this matters is consistency. A structured call gives artists clearer requirements and gives reviewers cleaner information later.",
      nextPreview: "Next, stay on the draft state and close the setup walkthrough.",
      primaryActionLabel: "Next: Draft ready",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Confirm draft readiness",
      body:
        "At this point, the open call is still a draft. The structure is prepared so review, committee work, and reporting can use the same information later.",
      screenLabel: "Institution workspace · Draft readiness",
      screenCue:
        "Stay on the new program screen and treat the configured call as a demo-only draft.",
      viewerAction:
        "This protects clarity. KLEIO is showing the workflow without implying that a real public opportunity has been launched.",
      nextPreview: "Finish this walkthrough, or continue into review and shortlist.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("review-and-shortlist", [
    {
      route: "/dashboard/",
      title: "Begin in the overview",
      body:
        "The overview gives the institution a shared read on the review cycle before anyone opens an individual application.",
      screenLabel: "Institution workspace · Overview",
      screenCue:
        "Look for total applications, review status, incomplete materials, reviewer progress, deadlines, and shortlist activity.",
      viewerAction:
        "The benefit is orientation. Administrators and committee members can see where attention is needed before decisions are made.",
      nextPreview: "Next, the guide opens Review Queue.",
      primaryActionLabel: "Next: Review Queue",
      requiredRole: "institution",
    },
    {
      route: "/review-queue/",
      title: "Open Review Queue",
      body:
        "The Review Queue organizes submissions that need attention. It brings readiness, priority, reviewer assignment, and status into one working view.",
      screenLabel: "Institution workspace · Review Queue",
      screenCue:
        "Look for the submission table, completeness indicators, assigned reviewers, priorities, and status filters.",
      viewerAction:
        "This reduces context switching. The reviewer does not have to search across email, PDFs, spreadsheets, and separate notes to understand what needs review.",
      nextPreview: "Next, stay in the queue and focus on the review context.",
      primaryActionLabel: "Next: Review context",
      requiredRole: "institution",
      targetAction: "open_submission",
    },
    {
      route: "/review-queue/",
      title: "Read review context",
      body:
        "A strong review flow keeps artist materials, program fit, notes, rubric context, and committee progress close to the submission.",
      screenLabel: "Institution workspace · Applicant context",
      screenCue:
        "Stay in Review Queue and look at how the submission can be reviewed without losing surrounding context.",
      viewerAction:
        "KLEIO supports the decision process; it does not make the decision. The committee still evaluates the work, records notes, and approves next steps.",
      nextPreview: "Next, the guide opens Shortlist.",
      primaryActionLabel: "Next: Shortlist",
      requiredRole: "institution",
    },
    {
      route: "/shortlist/",
      title: "Open Shortlist",
      body:
        "The Shortlist gathers the submissions that are ready for closer decision-making. Notes and status context stay attached as the group narrows.",
      screenLabel: "Institution workspace · Shortlist",
      screenCue:
        "Look for shortlisted artists, finalist status, committee vote context, and export/reporting actions.",
      viewerAction:
        "The value is continuity. KLEIO helps preserve why a submission moved forward, so the review history is not lost after the meeting.",
      nextPreview: "Finish this walkthrough, or return to the open-call setup flow.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "institution",
      targetAction: "move_to_shortlist",
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
  const artistScenarios = demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists")
  const institutionScenarios = demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions")

  if (path.startsWith("/artist-dashboard") || path.startsWith("/signup/artist")) {
    return [...artistScenarios, ...institutionScenarios]
  }

  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/signup/institution") ||
    path.startsWith("/programs") ||
    path.startsWith("/review-queue") ||
    path.startsWith("/shortlist") ||
    path.startsWith("/reports")
  ) {
    return [...institutionScenarios, ...artistScenarios]
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
