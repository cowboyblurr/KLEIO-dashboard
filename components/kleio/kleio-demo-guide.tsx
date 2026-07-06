"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import {
  getFirstStepForScenario,
  getGuideStep,
  getNextGuideStep,
  getPreviousGuideStep,
  getRecommendedNextScenarios,
  getRecommendedScenariosForPath,
  getScenarioById,
  getScenarioSteps,
  type DemoGuideRole,
  type DemoGuideScenario,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"
import { cn } from "@/lib/utils"

type KleioDemoGuideProps = {
  /** workspace shows minimized orb; landing only shows panel when explicitly opened */
  variant?: "workspace" | "landing"
}

function roleMismatchMessage(requiredRole?: DemoGuideRole): string | null {
  if (!requiredRole) return null
  const session = getDemoSession()
  if (!session || session.role === requiredRole) return null

  if (requiredRole === "collaborator") {
    return "This step opens the collaborator review seat. Switch demo role if the page asks for reviewer access."
  }

  if (requiredRole === "artist") {
    return "This step opens the Artist demo workspace. Switch demo role if the page asks for artist access."
  }

  return "This step opens the Institution demo workspace. Switch demo role if the page asks for institution access."
}

function ScenarioButton({
  scenario,
  onStart,
}: {
  scenario: DemoGuideScenario
  onStart: (scenarioId: DemoGuideScenarioId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onStart(scenario.id)}
      className="w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#D8D0F2] hover:bg-[#F7F4FF]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#292631]">{scenario.title}</p>
        <span className="shrink-0 rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide text-[#5B4B8A]">
          {scenario.timeEstimate}
        </span>
      </div>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">{scenario.summary}</p>
    </button>
  )
}

export function KleioDemoGuide({ variant = "workspace" }: KleioDemoGuideProps) {
  const router = useRouter()
  const pathname = usePathname()
  const {
    state,
    openGuide,
    minimizeGuide,
    startScenario,
    goToNextStep,
    goToPreviousStep,
    skipStep,
    restartScenario,
    dismissGuide,
    returnToPlaylist,
  } = useDemoGuide()

  const activeStep = getGuideStep(state.activeStepId)
  const activeScenario = getScenarioById(state.activeScenarioId)
  const completedScenario = getScenarioById(state.completedScenarioId)
  const scenarioSteps = state.activeScenarioId ? getScenarioSteps(state.activeScenarioId) : []
  const nextStep = getNextGuideStep(state.activeStepId)
  const previousStep = getPreviousGuideStep(state.activeStepId)
  const hasNext = Boolean(nextStep)
  const hasPrevious = Boolean(previousStep)
  const roleNote = roleMismatchMessage(activeStep?.requiredRole)

  const displayScenarios = useMemo(() => getRecommendedScenariosForPath(pathname), [pathname])
  const nextRecommendations = useMemo(
    () => getRecommendedNextScenarios(state.completedScenarioId),
    [state.completedScenarioId],
  )

  const progressLabel = useMemo(() => {
    if (!activeStep || scenarioSteps.length === 0) return null
    return `Step ${activeStep.stepNumber} of ${scenarioSteps.length}`
  }, [activeStep, scenarioSteps.length])

  if (variant === "landing" && !state.isOpen) return null
  if (variant === "workspace" && state.dismissed && !state.isOpen) return null

  function handleTakeMeThere() {
    if (!activeStep) return
    router.push(activeStep.route)
    minimizeGuide()
  }

  function handleScenarioSelect(scenarioId: DemoGuideScenarioId) {
    startScenario(scenarioId)
    const firstStep = getFirstStepForScenario(scenarioId)
    if (firstStep?.route) router.push(firstStep.route)
  }

  function handleNextStep() {
    if (nextStep?.route) {
      goToNextStep()
      router.push(nextStep.route)
      return
    }

    goToNextStep()
  }

  function handlePreviousStep() {
    if (!previousStep) return
    goToPreviousStep()
    router.push(previousStep.route)
  }

  function handleSkipStep() {
    if (nextStep?.route) {
      skipStep()
      router.push(nextStep.route)
      return
    }

    skipStep()
  }

  if (!state.isOpen) {
    return (
      <div className="kleio-demo-guide-anchor pointer-events-none fixed bottom-4 right-4 z-40 max-md:bottom-3 max-md:right-3">
        <button
          type="button"
          onClick={openGuide}
          className="kleio-demo-guide-minimized pointer-events-auto flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_28px_rgba(82,64,130,0.1)] backdrop-blur-sm transition-opacity hover:opacity-90"
          aria-label="Open KLEIO guide"
        >
          <KleioAssistObjectVisual size="sm" mode="idle" />
          <span className="pr-1 text-[0.7rem] font-medium text-[#5B4B8A]">KLEIO Guide</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "kleio-demo-guide-anchor fixed z-40 w-[min(100vw-1.5rem,22rem)]",
        "bottom-4 right-4 max-md:bottom-3 max-md:right-3",
      )}
      role="complementary"
      aria-label="KLEIO guided demo"
    >
      <div className="kleio-demo-guide-panel overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">
        <div className="flex items-start gap-3 border-b border-[#E7E1F7] px-4 py-3">
          <KleioAssistObjectVisual size="sm" mode={completedScenario ? "complete" : "reviewing"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#292631]">KLEIO Guide</p>
            <p className="mt-0.5 text-[0.65rem] text-[#7F7890]">
              {activeScenario?.title ?? completedScenario?.title ?? "Choose a workflow walkthrough"}
            </p>
          </div>
          <button
            type="button"
            onClick={minimizeGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            Hide
          </button>
        </div>

        <div className="px-4 py-3">
          {!state.activeScenarioId && completedScenario ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#A997E8]">
                  Walkthrough complete
                </p>
                <p className="mt-1 text-sm font-medium text-[#292631]">{completedScenario.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">
                  {completedScenario.completionMessage}
                </p>
              </div>
              {nextRecommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#292631]">Recommended next</p>
                  <div className="mt-2 space-y-2">
                    {nextRecommendations.slice(0, 2).map((scenario) => (
                      <ScenarioButton key={scenario.id} scenario={scenario} onStart={handleScenarioSelect} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !state.activeScenarioId ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#292631]">Choose a KLEIO walkthrough</p>
              <p className="text-[0.7rem] leading-relaxed text-[#7F7890]">
                Pick one of the four core paths. The guide will open the right first page for that workflow.
              </p>
              <ul className="mt-2 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                {displayScenarios.map((scenario) => (
                  <li key={scenario.id}>
                    <ScenarioButton scenario={scenario} onStart={handleScenarioSelect} />
                  </li>
                ))}
              </ul>
            </div>
          ) : activeStep ? (
            <div className="space-y-2">
              {progressLabel && (
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-[#A997E8]">
                  {progressLabel}
                </p>
              )}
              <p className="text-sm font-medium text-[#292631]">{activeStep.title}</p>
              <p className="text-xs leading-relaxed text-[#7F7890]">{activeStep.body}</p>
              {roleNote && (
                <p className="rounded-lg border border-[#E7E1F7] bg-white px-2.5 py-2 text-[0.65rem] text-[#6F6882]">
                  {roleNote}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {state.activeScenarioId && activeStep && (
          <div className="flex flex-wrap gap-2 border-t border-[#E7E1F7] px-4 py-3">
            <button
              type="button"
              onClick={handleTakeMeThere}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-xl bg-[#5B4B8A] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#5B4B8A]/90"
            >
              {activeStep.primaryActionLabel}
            </button>
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={!hasPrevious}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]"
            >
              {hasNext ? "Next" : "Finish"}
            </button>
            <button
              type="button"
              onClick={handleSkipStep}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#6F6882] transition-colors hover:bg-[#F7F4FF]"
            >
              Skip
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E1F7] px-4 py-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={returnToPlaylist}
              className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]"
            >
              Playlist
            </button>
            <button
              type="button"
              onClick={restartScenario}
              className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]"
            >
              Restart
            </button>
          </div>
          <button
            type="button"
            onClick={dismissGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            Exit Demo
          </button>
        </div>
      </div>
    </div>
  )
}
