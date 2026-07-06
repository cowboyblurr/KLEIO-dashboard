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
    summary: "Start an artist profile and prepare reusable materials for future applications.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Create the reusable profile that makes future applications easier.",
    firstStepId: "artist-passport-setup-1",
    previewSteps: [
      "Start artist profile basics",
      "Use Import Assist for draft material",
      "Review Creative Passport readiness",
    ],
    completionMessage:
      "The Artist Passport walkthrough is complete. The artist has seen how KLEIO turns repeated profile materials into one reusable, reviewable foundation.",
    recommendedNextScenarioIds: ["find-first-grant"],
  },
  {
    id: "find-first-grant",
    title: "Find Your First Grant / Open Call",
    summary: "Move from profile signals into opportunity search, match, and readiness.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Search opportunities and understand which grant or open call is a strong fit.",
    firstStepId: "find-first-grant-1",
    previewSteps: [
      "Start with artist profile signals",
      "Open Opportunities",
      "Review fit, deadline urgency, and missing materials",
    ],
    completionMessage:
      "The grant search walkthrough is complete. The artist has seen how KLEIO connects profile readiness to a clearer opportunity search.",
    recommendedNextScenarioIds: ["artist-passport-setup"],
  },
  {
    id: "create-open-call",
    title: "Create Your First Open Call",
    summary: "Start an institution workspace and prepare a structured open call draft.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "Prepare a structured open call, grant, residency, or exhibition intake flow.",
    firstStepId: "create-open-call-1",
    previewSteps: [
      "Start institution workspace setup",
      "Open Programs / Open Calls",
      "Add eligibility, deadlines, and required materials",
    ],
    completionMessage:
      "The open call walkthrough is complete. The institution has seen how KLEIO turns program setup into a clear, structured intake flow.",
    recommendedNextScenarioIds: ["review-and-shortlist"],
  },
  {
    id: "review-and-shortlist",
    title: "Review and Shortlist Applicants",
    summary: "Move from submitted applications into review, notes, shortlist, and reporting.",
    roleLabel: "Institution",
    roleGroup: "Institutions",
    requiredRole: "institution",
    timeEstimate: "4–6 min",
    outcome: "Review submissions with structure and move strong applicants into a shortlist.",
    firstStepId: "review-and-shortlist-1",
    previewSteps: [
      "Enter the institution workspace",
      "Open Review Queue",
      "Move a strong applicant to shortlist",
    ],
    completionMessage:
      "The review and shortlist walkthrough is complete. The viewer has seen how KLEIO preserves review context from submission to decision.",
    recommendedNextScenarioIds: ["create-open-call"],
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
      title: "Start the artist profile",
      body: "Begin on the artist signup page. This is the right first page for creating a Creative Passport because it starts with profile basics instead of dropping the viewer into a finished dashboard.",
      requiredRole: "artist",
    },
    {
      route: "/signup/artist/",
      title: "Prepare draft material with Import Assist",
      body: "KLEIO Import Assist is visible from Step 1. It prepares suggested fields from material the artist already maintains, and the artist reviews what becomes official.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "Review Creative Passport readiness",
      body: "After the profile is created, the Passport view shows reusable materials like bio, statement, CV, portfolio, work samples, references, and sharing controls.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("find-first-grant", [
    {
      route: "/signup/artist/",
      title: "Start with the artist profile signals",
      body: "A grant search should begin with the artist profile because KLEIO needs practice type, location, materials, and themes to make the opportunity view useful.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Open Opportunities",
      body: "Move into the artist opportunity directory. Demo opportunities use synthetic data, not a live grant database.",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Read fit and readiness signals",
      body: "Show match percentage, deadline urgency, missing materials, and application effort as suggested signals prepared for review.",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("create-open-call", [
    {
      route: "/signup/institution/",
      title: "Start the institution workspace",
      body: "Begin on the institution signup page. This is the clean first step before creating an open call because the workspace defines the organization and review environment.",
      requiredRole: "institution",
    },
    {
      route: "/programs/",
      title: "Open Programs / Open Calls",
      body: "Move into the area where grants, residencies, exhibitions, and open calls are managed from draft to review.",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Create a new open call draft",
      body: "Prepare the call structure: title, program type, deadline, eligibility, required materials, and review stages.",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Save the call as a demo draft",
      body: "End with the call prepared as a draft. Do not imply it has been published to a live marketplace or real applicant pool.",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("review-and-shortlist", [
    {
      route: "/signup/institution/",
      title: "Enter the institution workflow first",
      body: "Start through the institution path so the viewer understands who is managing the submissions before seeing the review queue.",
      requiredRole: "institution",
    },
    {
      route: "/review-queue/",
      title: "Open Review Queue",
      body: "Show the queue where submissions, readiness, deadlines, reviewer progress, and priority signals come together.",
      requiredRole: "institution",
      targetAction: "open_submission",
    },
    {
      route: "/review-queue/",
      title: "Review with context",
      body: "Keep the viewer focused on artist materials, program fit, internal notes, and rubric readiness without sending them into a separate reviewer role yet.",
      requiredRole: "institution",
    },
    {
      route: "/shortlist/",
      title: "Move a strong applicant to shortlist",
      body: "End by showing how promising submissions move into a focused decision space for final review.",
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
