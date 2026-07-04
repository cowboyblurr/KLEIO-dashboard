"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import {
  demoGuideScenarios,
  getGuideStep,
  getNextGuideStep,
  getPreviousGuideStep,
  getScenarioSteps,
  type DemoGuideRole,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"
import { cn } from "@/lib/utils"

type KleioDemoGuideProps = {
  /** workspace shows minimized orb; landing only shows panel when explicitly opened */
  variant?: "workspace" | "landing"
}

function roleMismatchKey(requiredRole?: DemoGuideRole): string | null {
  if (!requiredRole) return null
  const session = getDemoSession()
  if (!session || session.role === requiredRole) return null
  if (requiredRole === "collaborator") return "demoGuide.roleMismatch.collaborator"
  if (requiredRole === "artist") return "demoGuide.roleMismatch.artist"
  return "demoGuide.roleMismatch.institution"
}

export function KleioDemoGuide({ variant = "workspace" }: KleioDemoGuideProps) {
  const router = useRouter()
  const { t } = useKleioLocale()
  const {
    state,
    openGuide,
    minimizeGuide,
    startScenario,
    goToNextStep,
    goToPreviousStep,
    resetGuide,
    dismissGuide,
  } = useDemoGuide()

  const activeStep = getGuideStep(state.activeStepId)
  const scenarioSteps = state.activeScenarioId ? getScenarioSteps(state.activeScenarioId) : []
  const hasNext = Boolean(getNextGuideStep(state.activeStepId))
  const hasPrevious = Boolean(getPreviousGuideStep(state.activeStepId))
  const roleNoteKey = roleMismatchKey(activeStep?.requiredRole)

  const progressLabel = useMemo(() => {
    if (!activeStep || scenarioSteps.length === 0) return null
    return t("demoGuide.progress", {
      current: activeStep.stepNumber,
      total: scenarioSteps.length,
    })
  }, [activeStep, scenarioSteps.length, t])

  if (variant === "landing" && !state.isOpen) return null
  if (variant === "workspace" && state.dismissed && !state.isOpen) return null

  function handleTakeMeThere() {
    if (!activeStep) return
    router.push(activeStep.route)
    minimizeGuide()
  }

  function handleScenarioSelect(scenarioId: DemoGuideScenarioId) {
    startScenario(scenarioId)
  }

  if (!state.isOpen) {
    return (
      <div className="kleio-demo-guide-anchor pointer-events-none fixed bottom-4 right-4 z-40 max-md:bottom-3 max-md:right-3">
        <button
          type="button"
          onClick={openGuide}
          className="kleio-demo-guide-minimized pointer-events-auto flex items-center gap-2 rounded-full border border-[#E7E1F7] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_28px_rgba(82,64,130,0.1)] backdrop-blur-sm transition-opacity hover:opacity-90"
          aria-label={t("demoGuide.openGuide")}
        >
          <KleioAssistObjectVisual size="sm" mode="idle" />
          <span className="pr-1 text-[0.7rem] font-medium text-[#5B4B8A]">{t("demoGuide.label")}</span>
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
      aria-label={t("demoGuide.title")}
    >
      <div className="kleio-demo-guide-panel overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">
        <div className="flex items-start gap-3 border-b border-[#E7E1F7] px-4 py-3">
          <KleioAssistObjectVisual size="sm" mode="reviewing" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#292631]">{t("demoGuide.title")}</p>
            {state.activeScenarioId && (
              <p className="mt-0.5 text-[0.65rem] text-[#7F7890]">
                {t(demoGuideScenarios.find((s) => s.id === state.activeScenarioId)!.titleKey)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={minimizeGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            {t("demoGuide.hide")}
          </button>
        </div>

        <div className="px-4 py-3">
          {!state.activeScenarioId ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#292631]">{t("demoGuide.chooseScenario")}</p>
              <p className="text-[0.7rem] leading-relaxed text-[#7F7890]">{t("demoGuide.loginHint")}</p>
              <ul className="mt-2 space-y-2">
                {demoGuideScenarios.map((scenario) => (
                  <li key={scenario.id}>
                    <button
                      type="button"
                      onClick={() => handleScenarioSelect(scenario.id)}
                      className="w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#D8D0F2] hover:bg-[#F7F4FF]"
                    >
                      <p className="text-xs font-medium text-[#292631]">{t(scenario.titleKey)}</p>
                      <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">
                        {t(scenario.summaryKey)}
                      </p>
                    </button>
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
              <p className="text-sm font-medium text-[#292631]">{t(activeStep.titleKey)}</p>
              <p className="text-xs leading-relaxed text-[#7F7890]">{t(activeStep.bodyKey)}</p>
              {roleNoteKey && (
                <p className="rounded-lg border border-[#E7E1F7] bg-white px-2.5 py-2 text-[0.65rem] text-[#6F6882]">
                  {t(roleNoteKey)}
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
              {t("demoGuide.takeMeThere")}
            </button>
            {hasPrevious && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]"
              >
                {t("demoGuide.back")}
              </button>
            )}
            {hasNext && (
              <button
                type="button"
                onClick={goToNextStep}
                className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]"
              >
                {t("demoGuide.next")}
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-[#E7E1F7] px-4 py-2">
          <button
            type="button"
            onClick={() => {
              resetGuide()
              openGuide()
            }}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]"
          >
            {t("demoGuide.reset")}
          </button>
          <button
            type="button"
            onClick={dismissGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            {t("demoGuide.dismiss")}
          </button>
        </div>
      </div>
    </div>
  )
}
