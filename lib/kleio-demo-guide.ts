export type DemoGuideScenarioId =
  | "deadline-triage"
  | "reviewer-bottleneck"
  | "strong-shortlist"
  | "artist-opportunity-prep"

export type DemoGuideRole = "artist" | "institution" | "collaborator"

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
  titleKey: string
  bodyKey: string
  primaryActionKey: string
  secondaryActionKey?: string
  requiredRole?: DemoGuideRole
  targetAction?: DemoGuideTargetAction
  targetSubmissionId?: string
  nextStepId?: string
}

export type DemoGuideScenario = {
  id: DemoGuideScenarioId
  titleKey: string
  summaryKey: string
  requiredRole: DemoGuideRole
  firstStepId: string
}

export const demoGuideScenarios: DemoGuideScenario[] = [
  {
    id: "deadline-triage",
    titleKey: "demoGuide.scenario.deadlineTriage.title",
    summaryKey: "demoGuide.scenario.deadlineTriage.summary",
    requiredRole: "institution",
    firstStepId: "deadline-triage-1",
  },
  {
    id: "reviewer-bottleneck",
    titleKey: "demoGuide.scenario.reviewerBottleneck.title",
    summaryKey: "demoGuide.scenario.reviewerBottleneck.summary",
    requiredRole: "institution",
    firstStepId: "reviewer-bottleneck-1",
  },
  {
    id: "strong-shortlist",
    titleKey: "demoGuide.scenario.strongShortlist.title",
    summaryKey: "demoGuide.scenario.strongShortlist.summary",
    requiredRole: "institution",
    firstStepId: "strong-shortlist-1",
  },
  {
    id: "artist-opportunity-prep",
    titleKey: "demoGuide.scenario.artistOpportunityPrep.title",
    summaryKey: "demoGuide.scenario.artistOpportunityPrep.summary",
    requiredRole: "artist",
    firstStepId: "artist-opportunity-prep-1",
  },
]

const demoGuideSteps: DemoGuideStep[] = [
  {
    id: "deadline-triage-1",
    scenarioId: "deadline-triage",
    stepNumber: 1,
    route: "/review-queue/",
    titleKey: "demoGuide.step.deadlineTriage.1.title",
    bodyKey: "demoGuide.step.deadlineTriage.1.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "open_submission",
    targetSubmissionId: "mei-lin-zhang",
    nextStepId: "deadline-triage-2",
  },
  {
    id: "deadline-triage-2",
    scenarioId: "deadline-triage",
    stepNumber: 2,
    route: "/messages/",
    titleKey: "demoGuide.step.deadlineTriage.2.title",
    bodyKey: "demoGuide.step.deadlineTriage.2.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "request_info",
    targetSubmissionId: "mei-lin-zhang",
    nextStepId: "deadline-triage-3",
  },
  {
    id: "deadline-triage-3",
    scenarioId: "deadline-triage",
    stepNumber: 3,
    route: "/activity-log/",
    titleKey: "demoGuide.step.deadlineTriage.3.title",
    bodyKey: "demoGuide.step.deadlineTriage.3.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
  },
  {
    id: "reviewer-bottleneck-1",
    scenarioId: "reviewer-bottleneck",
    stepNumber: 1,
    route: "/committee/",
    titleKey: "demoGuide.step.reviewerBottleneck.1.title",
    bodyKey: "demoGuide.step.reviewerBottleneck.1.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "send_reviewer_reminder",
    targetSubmissionId: "sofia-karim",
    nextStepId: "reviewer-bottleneck-2",
  },
  {
    id: "reviewer-bottleneck-2",
    scenarioId: "reviewer-bottleneck",
    stepNumber: 2,
    route: "/collaborator-dashboard/review-queue/",
    titleKey: "demoGuide.step.reviewerBottleneck.2.title",
    bodyKey: "demoGuide.step.reviewerBottleneck.2.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "collaborator",
    targetAction: "submit_review",
    targetSubmissionId: "sofia-karim",
    nextStepId: "reviewer-bottleneck-3",
  },
  {
    id: "reviewer-bottleneck-3",
    scenarioId: "reviewer-bottleneck",
    stepNumber: 3,
    route: "/activity-log/",
    titleKey: "demoGuide.step.reviewerBottleneck.3.title",
    bodyKey: "demoGuide.step.reviewerBottleneck.3.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
  },
  {
    id: "strong-shortlist-1",
    scenarioId: "strong-shortlist",
    stepNumber: 1,
    route: "/dashboard/",
    titleKey: "demoGuide.step.strongShortlist.1.title",
    bodyKey: "demoGuide.step.strongShortlist.1.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "open_submission",
    targetSubmissionId: "amina-el-badri",
    nextStepId: "strong-shortlist-2",
  },
  {
    id: "strong-shortlist-2",
    scenarioId: "strong-shortlist",
    stepNumber: 2,
    route: "/shortlist/",
    titleKey: "demoGuide.step.strongShortlist.2.title",
    bodyKey: "demoGuide.step.strongShortlist.2.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "move_to_shortlist",
    targetSubmissionId: "amina-el-badri",
    nextStepId: "strong-shortlist-3",
  },
  {
    id: "strong-shortlist-3",
    scenarioId: "strong-shortlist",
    stepNumber: 3,
    route: "/reports/",
    titleKey: "demoGuide.step.strongShortlist.3.title",
    bodyKey: "demoGuide.step.strongShortlist.3.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "institution",
    targetAction: "prepare_report",
  },
  {
    id: "artist-opportunity-prep-1",
    scenarioId: "artist-opportunity-prep",
    stepNumber: 1,
    route: "/artist-dashboard/opportunities/",
    titleKey: "demoGuide.step.artistOpportunityPrep.1.title",
    bodyKey: "demoGuide.step.artistOpportunityPrep.1.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "artist",
    nextStepId: "artist-opportunity-prep-2",
  },
  {
    id: "artist-opportunity-prep-2",
    scenarioId: "artist-opportunity-prep",
    stepNumber: 2,
    route: "/artist-dashboard/applications/",
    titleKey: "demoGuide.step.artistOpportunityPrep.2.title",
    bodyKey: "demoGuide.step.artistOpportunityPrep.2.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "artist",
    targetAction: "prepare_opportunity_draft",
    nextStepId: "artist-opportunity-prep-3",
  },
  {
    id: "artist-opportunity-prep-3",
    scenarioId: "artist-opportunity-prep",
    stepNumber: 3,
    route: "/artist-dashboard/passport/",
    titleKey: "demoGuide.step.artistOpportunityPrep.3.title",
    bodyKey: "demoGuide.step.artistOpportunityPrep.3.body",
    primaryActionKey: "demoGuide.takeMeThere",
    requiredRole: "artist",
  },
]

const stepById = new Map(demoGuideSteps.map((step) => [step.id, step]))

export function getScenarioSteps(scenarioId: DemoGuideScenarioId): DemoGuideStep[] {
  return demoGuideSteps
    .filter((step) => step.scenarioId === scenarioId)
    .sort((a, b) => a.stepNumber - b.stepNumber)
}

export function getFirstStepForScenario(scenarioId: DemoGuideScenarioId): DemoGuideStep | undefined {
  const scenario = demoGuideScenarios.find((entry) => entry.id === scenarioId)
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

export function getScenarioById(scenarioId: DemoGuideScenarioId): DemoGuideScenario | undefined {
  return demoGuideScenarios.find((entry) => entry.id === scenarioId)
}
