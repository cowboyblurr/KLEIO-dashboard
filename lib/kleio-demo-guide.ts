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
    summary: "Start an artist profile and prepare reusable materials for future applications.",
    roleLabel: "Artist",
    roleGroup: "Artists",
    requiredRole: "artist",
    timeEstimate: "3–5 min",
    outcome: "Create the reusable profile that makes future applications easier.",
    firstStepId: "artist-passport-setup-1",
    previewSteps: [
      "Start on artist signup",
      "Use Import Assist while the artist still controls the profile",
      "Land inside the reusable Creative Passport",
    ],
    completionMessage:
      "The Artist Passport walkthrough is complete. The viewer has seen how KLEIO turns repeated artist materials into one reusable, reviewable foundation.",
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
      "Begin with the artist profile foundation",
      "Open the Opportunities workspace",
      "Read fit, deadline urgency, missing materials, and effort",
    ],
    completionMessage:
      "The grant search walkthrough is complete. The viewer has seen how KLEIO connects artist readiness to a clearer opportunity search.",
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
      "Start with institution workspace setup",
      "Move into Programs & Open Calls",
      "Prepare the open call structure as a draft",
    ],
    completionMessage:
      "The open call walkthrough is complete. The viewer has seen how KLEIO turns program setup into a clear, structured intake flow.",
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
      "Move a strong applicant to Shortlist",
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
        "This first screen tells a new viewer that KLEIO begins with the artist, not with institutional extraction. The artist starts with basic identity and practice information.",
      screenLabel: "Artist signup · Step 1 profile basics",
      screenCue:
        "You should see the artist onboarding form with KLEIO Import Assist sitting above the first profile fields.",
      viewerAction:
        "Notice that the artist can type manually or let Import Assist prepare suggested profile material. Nothing becomes official until the artist reviews it.",
      nextPreview: "Next, focus on Import Assist and why it matters.",
      primaryActionLabel: "Next: Import Assist",
      requiredRole: "artist",
    },
    {
      route: "/signup/artist/",
      title: "Explain Import Assist before the dashboard",
      body:
        "This is the key trust moment. KLEIO can help prepare a short bio, statement, tags, links, documents, and featured works, but the artist remains the editor and final authority.",
      screenLabel: "Artist signup · Import Assist",
      screenCue:
        "Stay on the artist signup page and look at the compact Import Assist card above the form.",
      viewerAction:
        "Frame this as draft preparation, not automated identity creation. The demo should make artists feel supported, not replaced.",
      nextPreview: "Next, the guide opens the finished Creative Passport workspace.",
      primaryActionLabel: "Next: Creative Passport",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/passport/",
      title: "Review Creative Passport readiness",
      body:
        "The Passport is the reusable artist foundation. It gathers the materials artists repeatedly rebuild for grants, residencies, exhibitions, and open calls.",
      screenLabel: "Artist workspace · Creative Passport",
      screenCue:
        "You should see a reusable artist profile with bio, statement, CV, portfolio, works, references, and sharing/readiness context.",
      viewerAction:
        "Point out that this is not a social profile. It is an application-ready cultural record the artist can reuse and control.",
      nextPreview: "Finish this walkthrough or continue into grant discovery.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("find-first-grant", [
    {
      route: "/signup/artist/",
      title: "Begin with the artist profile foundation",
      body:
        "Grant discovery only becomes useful after KLEIO understands the artist's practice, materials, location, themes, and readiness.",
      screenLabel: "Artist signup · Profile signals",
      screenCue:
        "You should see the artist onboarding form where the Creative Passport begins collecting profile and practice signals.",
      viewerAction:
        "Explain that KLEIO uses the Passport to reduce search noise and surface opportunities that are actually relevant.",
      nextPreview: "Next, open the Opportunities workspace.",
      primaryActionLabel: "Next: Opportunities",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Open Opportunities",
      body:
        "The Opportunities view turns the Passport into action: grants, residencies, exhibitions, and open calls can be compared by fit and readiness.",
      screenLabel: "Artist workspace · Opportunities",
      screenCue:
        "You should see opportunity cards or analytics with match/readiness context. Demo opportunities are synthetic, not live scraped grant data.",
      viewerAction:
        "Call out that this is the artist acquisition pillar: artists get value before an institution pilot is converted.",
      nextPreview: "Next, read the signals that help an artist decide what to apply for.",
      primaryActionLabel: "Next: Readiness signals",
      requiredRole: "artist",
    },
    {
      route: "/artist-dashboard/opportunities/",
      title: "Read fit and readiness signals",
      body:
        "This screen should answer the artist's real question: what is worth my time, what is due soon, and what material is missing?",
      screenLabel: "Artist workspace · Match and readiness",
      screenCue:
        "Stay on Opportunities and look for match percentage, deadline urgency, missing materials, application effort, and funding context.",
      viewerAction:
        "Position KLEIO as a preparation layer. It recommends and drafts, but the artist reviews before applying or exporting.",
      nextPreview: "Finish this walkthrough or return to Artist Passport.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "artist",
    },
  ]),
  ...buildSteps("create-open-call", [
    {
      route: "/signup/institution/",
      title: "Start with institution setup",
      body:
        "A clean institutional workflow starts by defining the organization, review environment, team needs, and program structure before any applications arrive.",
      screenLabel: "Institution signup · Workspace setup",
      screenCue:
        "You should see the institution onboarding form with Import Assist available above the first fields.",
      viewerAction:
        "Explain that KLEIO replaces scattered PDFs, email folders, and spreadsheets with one structured review environment.",
      nextPreview: "Next, open Programs & Open Calls.",
      primaryActionLabel: "Next: Programs",
      requiredRole: "institution",
    },
    {
      route: "/programs/",
      title: "Open Programs & Open Calls",
      body:
        "This is where an institution sees its grants, residencies, exhibitions, and open calls as managed programs instead of loose intake folders.",
      screenLabel: "Institution workspace · Programs",
      screenCue:
        "You should see active programs, statuses, deadlines, submission counts, incomplete materials, and assigned reviewers.",
      viewerAction:
        "Point out that the institution is not just receiving files; it is managing a full review cycle with structure.",
      nextPreview: "Next, create a new open call draft.",
      primaryActionLabel: "Next: New open call",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Create a new open call draft",
      body:
        "The open call builder should make the intake structure visible: title, type, deadline, eligibility, materials, questions, and review stages.",
      screenLabel: "Institution workspace · New program draft",
      screenCue:
        "You should see the program creation screen where the institution prepares the call before publishing or receiving applicants.",
      viewerAction:
        "Emphasize draft safety: this is a demo setup flow, not a live published call.",
      nextPreview: "Next, finish on the prepared draft state.",
      primaryActionLabel: "Next: Draft ready",
      requiredRole: "institution",
    },
    {
      route: "/programs/new/",
      title: "Close on draft readiness",
      body:
        "The purpose is not just a form. The purpose is a repeatable intake structure that reviewers, collaborators, and reports can use later.",
      screenLabel: "Institution workspace · Draft readiness",
      screenCue:
        "Stay on the new program screen and treat the configured call as a controlled draft in the demo environment.",
      viewerAction:
        "Say clearly that synthetic demo data is being used and that this does not imply a real public open call has been launched.",
      nextPreview: "Finish this walkthrough or continue into review and shortlist.",
      primaryActionLabel: "Finish walkthrough",
      requiredRole: "institution",
    },
  ]),
  ...buildSteps("review-and-shortlist", [
    {
      route: "/dashboard/",
      title: "Begin in the institution workspace",
      body:
        "Before the queue, orient the viewer to the institution home base: status, volume, incomplete materials, reviewer progress, and decision pressure.",
      screenLabel: "Institution workspace · Overview",
      screenCue:
        "You should see the main institution dashboard overview for the synthetic KLEIO Arthouse review cycle.",
      viewerAction:
        "Explain that KLEIO gives administrators and committees a shared operating picture before individual reviews begin.",
      nextPreview: "Next, open the Review Queue.",
      primaryActionLabel: "Next: Review Queue",
      requiredRole: "institution",
    },
    {
      route: "/review-queue/",
      title: "Open Review Queue",
      body:
        "The queue is where submission work becomes manageable: readiness, priority, reviewer progress, deadlines, and applicant context are visible together.",
      screenLabel: "Institution workspace · Review Queue",
      screenCue:
        "You should see submissions organized for review instead of scattered across email, PDFs, and spreadsheets.",
      viewerAction:
        "Point to the information that would normally be fragmented: status, completeness, reviewer assignment, priority, and decision stage.",
      nextPreview: "Next, explain what reviewers need to evaluate with context.",
      primaryActionLabel: "Next: Review context",
      requiredRole: "institution",
      targetAction: "open_submission",
    },
    {
      route: "/review-queue/",
      title: "Review with context",
      body:
        "A strong review workflow keeps artist materials, program fit, internal notes, rubric readiness, and committee context together.",
      screenLabel: "Institution workspace · Applicant context",
      screenCue:
        "Stay in Review Queue and focus on how submissions can be understood without opening disconnected files one by one.",
      viewerAction:
        "Frame KLEIO as decision support, not automated selection. The committee still makes the decision.",
      nextPreview: "Next, open the Shortlist decision space.",
      primaryActionLabel: "Next: Shortlist",
      requiredRole: "institution",
    },
    {
      route: "/shortlist/",
      title: "Move strong applicants into Shortlist",
      body:
        "The Shortlist view turns review work into a cleaner decision room. Strong applicants, notes, and next actions can be preserved for final selection.",
      screenLabel: "Institution workspace · Shortlist",
      screenCue:
        "You should see shortlisted artists or decision-ready submissions separated from the larger review queue.",
      viewerAction:
        "End by showing that KLEIO preserves the review history instead of losing context after a committee meeting.",
      nextPreview: "Finish this walkthrough or return to open-call setup.",
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
