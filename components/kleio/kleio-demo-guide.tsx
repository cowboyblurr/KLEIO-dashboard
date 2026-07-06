"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import type { KleioLocale } from "@/lib/kleio-i18n"
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
  type DemoGuideStep,
} from "@/lib/kleio-demo-guide"
import { cn } from "@/lib/utils"

type KleioDemoGuideProps = {
  /** workspace shows minimized orb; landing only shows panel when explicitly opened */
  variant?: "workspace" | "landing"
}

type ScenarioSpanishCopy = {
  title: string
  summary: string
  roleLabel: string
  completionMessage: string
}

const scenarioEs: Record<DemoGuideScenarioId, ScenarioSpanishCopy> = {
  "artist-passport-setup": {
    title: "Crea tu Pasaporte Creativo",
    summary: "Inicia un perfil de artista y prepara materiales reutilizables.",
    roleLabel: "Artista",
    completionMessage:
      "El recorrido del Pasaporte Creativo está completo. El artista vio cómo KLEIO convierte materiales repetidos en una base reutilizable y lista para revisión.",
  },
  "find-first-grant": {
    title: "Encuentra tu primera beca o convocatoria abierta",
    summary: "Pasa de las señales del perfil a la búsqueda y preparación de oportunidades.",
    roleLabel: "Artista",
    completionMessage:
      "El recorrido de búsqueda de becas está completo. El artista vio cómo KLEIO conecta la preparación del perfil con una búsqueda de oportunidades más clara.",
  },
  "create-open-call": {
    title: "Crea tu primera convocatoria abierta",
    summary: "Prepara una convocatoria estructurada desde el espacio institucional.",
    roleLabel: "Institución",
    completionMessage:
      "El recorrido de convocatoria abierta está completo. La institución vio cómo KLEIO convierte la configuración de un programa en un flujo de recepción claro y estructurado.",
  },
  "review-and-shortlist": {
    title: "Revisa postulaciones y crea una lista corta",
    summary: "Pasa de postulaciones recibidas a revisión y decisión.",
    roleLabel: "Institución",
    completionMessage:
      "El recorrido de revisión y lista corta está completo. La persona vio cómo KLEIO conserva el contexto desde la postulación hasta la decisión.",
  },
}

const stepEs: Record<string, { title: string; body: string; primaryActionLabel?: string }> = {
  "artist-passport-setup-1": {
    title: "Comienza el perfil de artista",
    body:
      "Comienza en la página de registro de artista. Es el primer paso correcto para crear un Pasaporte Creativo porque inicia con los datos básicos del perfil, no con un panel ya terminado.",
  },
  "artist-passport-setup-2": {
    title: "Prepara borradores con Import Assist",
    body:
      "KLEIO Import Assist aparece desde el Paso 1. Prepara campos sugeridos a partir de materiales que el artista ya mantiene, y el artista revisa qué pasa a ser oficial.",
  },
  "artist-passport-setup-3": {
    title: "Revisa la preparación del Pasaporte Creativo",
    body:
      "Después de crear el perfil, la vista del Pasaporte muestra materiales reutilizables como biografía, declaración artística, CV, portafolio, muestras de obra, referencias y controles para compartir.",
  },
  "find-first-grant-1": {
    title: "Comienza con las señales del perfil artístico",
    body:
      "La búsqueda de becas debe comenzar con el perfil artístico porque KLEIO necesita práctica, ubicación, materiales y temas para que la vista de oportunidades sea útil.",
  },
  "find-first-grant-2": {
    title: "Abre Oportunidades",
    body:
      "Pasa al directorio de oportunidades para artistas. Las oportunidades del demo usan datos sintéticos, no una base de datos de becas en vivo.",
  },
  "find-first-grant-3": {
    title: "Lee señales de afinidad y preparación",
    body:
      "Muestra porcentaje de afinidad, urgencia de fecha límite, materiales faltantes y esfuerzo de postulación como señales sugeridas preparadas para revisión.",
  },
  "create-open-call-1": {
    title: "Comienza el espacio institucional",
    body:
      "Comienza en la página de registro institucional. Es el primer paso más claro antes de crear una convocatoria porque el espacio define la organización y el entorno de revisión.",
  },
  "create-open-call-2": {
    title: "Abre Programas / Convocatorias abiertas",
    body:
      "Entra al área donde becas, residencias, exposiciones y convocatorias abiertas se gestionan desde borrador hasta revisión.",
  },
  "create-open-call-3": {
    title: "Crea un nuevo borrador de convocatoria",
    body:
      "Prepara la estructura de la convocatoria: título, tipo de programa, fecha límite, elegibilidad, materiales requeridos y etapas de revisión.",
  },
  "create-open-call-4": {
    title: "Guarda la convocatoria como borrador demo",
    body:
      "Termina con la convocatoria preparada como borrador. No implica que se haya publicado ante postulantes reales.",
  },
  "review-and-shortlist-1": {
    title: "Entra primero al flujo institucional",
    body:
      "Comienza por la ruta institucional para que la persona entienda quién gestiona las postulaciones antes de ver la cola de revisión.",
  },
  "review-and-shortlist-2": {
    title: "Abre la cola de revisión",
    body:
      "Muestra la cola donde se reúnen postulaciones, preparación, fechas límite, avance de revisión y señales de prioridad.",
  },
  "review-and-shortlist-3": {
    title: "Revisa con contexto",
    body:
      "Mantén la atención en materiales del artista, afinidad con el programa, notas internas y preparación de rúbrica sin enviarlo todavía a un rol separado de revisor.",
  },
  "review-and-shortlist-4": {
    title: "Mueve una candidatura fuerte a la lista corta",
    body:
      "Termina mostrando cómo las postulaciones prometedoras pasan a un espacio de decisión enfocado para la revisión final.",
  },
}

function scenarioCopy(scenario: DemoGuideScenario, locale: KleioLocale) {
  if (locale !== "es") return scenario
  return { ...scenario, ...scenarioEs[scenario.id] }
}

function stepCopy(step: DemoGuideStep, locale: KleioLocale) {
  if (locale !== "es") return step
  return {
    ...step,
    ...stepEs[step.id],
    primaryActionLabel: stepEs[step.id]?.primaryActionLabel ?? "Llévame allí",
  }
}

function roleMismatchMessage(requiredRole: DemoGuideRole | undefined, locale: KleioLocale): string | null {
  if (!requiredRole) return null
  const session = getDemoSession()
  if (!session || session.role === requiredRole) return null

  if (requiredRole === "collaborator") {
    return locale === "es"
      ? "Este paso abre el asiento de revisión para colaboradores. Cambia al rol demo de revisor si la página lo solicita."
      : "This step opens the collaborator review seat. Switch demo role if the page asks for reviewer access."
  }

  if (requiredRole === "artist") {
    return locale === "es"
      ? "Este paso abre el espacio demo de artista. Cambia al rol de artista si la página lo solicita."
      : "This step opens the Artist demo workspace. Switch demo role if the page asks for artist access."
  }

  return locale === "es"
    ? "Este paso abre el espacio demo institucional. Cambia al rol de institución si la página lo solicita."
    : "This step opens the Institution demo workspace. Switch demo role if the page asks for institution access."
}

function ScenarioButton({
  scenario,
  locale,
  onStart,
}: {
  scenario: DemoGuideScenario
  locale: KleioLocale
  onStart: (scenarioId: DemoGuideScenarioId) => void
}) {
  const copy = scenarioCopy(scenario, locale)

  return (
    <button
      type="button"
      onClick={() => onStart(scenario.id)}
      className="w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5 text-left transition-colors hover:border-[#D8D0F2] hover:bg-[#F7F4FF]"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-[#292631]">{copy.title}</p>
        <span className="shrink-0 rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-wide text-[#5B4B8A]">
          {copy.timeEstimate}
        </span>
      </div>
      <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">{copy.summary}</p>
    </button>
  )
}

export function KleioDemoGuide({ variant = "workspace" }: KleioDemoGuideProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { locale } = useKleioLocale()
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
  const activeStepCopy = activeStep ? stepCopy(activeStep, locale) : undefined
  const activeScenario = getScenarioById(state.activeScenarioId)
  const activeScenarioCopy = activeScenario ? scenarioCopy(activeScenario, locale) : undefined
  const completedScenario = getScenarioById(state.completedScenarioId)
  const completedScenarioCopy = completedScenario ? scenarioCopy(completedScenario, locale) : undefined
  const scenarioSteps = state.activeScenarioId ? getScenarioSteps(state.activeScenarioId) : []
  const nextStep = getNextGuideStep(state.activeStepId)
  const previousStep = getPreviousGuideStep(state.activeStepId)
  const hasNext = Boolean(nextStep)
  const hasPrevious = Boolean(previousStep)
  const roleNote = roleMismatchMessage(activeStep?.requiredRole, locale)

  const displayScenarios = useMemo(() => getRecommendedScenariosForPath(pathname), [pathname])
  const nextRecommendations = useMemo(
    () => getRecommendedNextScenarios(state.completedScenarioId),
    [state.completedScenarioId],
  )

  const progressLabel = useMemo(() => {
    if (!activeStep || scenarioSteps.length === 0) return null
    return locale === "es"
      ? `Paso ${activeStep.stepNumber} de ${scenarioSteps.length}`
      : `Step ${activeStep.stepNumber} of ${scenarioSteps.length}`
  }, [activeStep, locale, scenarioSteps.length])

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
          aria-label={locale === "es" ? "Abrir guía KLEIO" : "Open KLEIO guide"}
        >
          <KleioAssistObjectVisual size="sm" mode="idle" />
          <span className="pr-1 text-[0.7rem] font-medium text-[#5B4B8A]">
            {locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}
          </span>
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
      aria-label={locale === "es" ? "Demo guiado de KLEIO" : "KLEIO guided demo"}
    >
      <div className="kleio-demo-guide-panel overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">
        <div className="flex items-start gap-3 border-b border-[#E7E1F7] px-4 py-3">
          <KleioAssistObjectVisual size="sm" mode={completedScenario ? "complete" : "reviewing"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#292631]">
              {locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}
            </p>
            <p className="mt-0.5 text-[0.65rem] text-[#7F7890]">
              {activeScenarioCopy?.title ??
                completedScenarioCopy?.title ??
                (locale === "es" ? "Elige un recorrido por flujo" : "Choose a workflow walkthrough")}
            </p>
          </div>
          <button
            type="button"
            onClick={minimizeGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            {locale === "es" ? "Ocultar" : "Hide"}
          </button>
        </div>

        <div className="px-4 py-3">
          {!state.activeScenarioId && completedScenarioCopy ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#A997E8]">
                  {locale === "es" ? "Recorrido completo" : "Walkthrough complete"}
                </p>
                <p className="mt-1 text-sm font-medium text-[#292631]">{completedScenarioCopy.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">
                  {completedScenarioCopy.completionMessage}
                </p>
              </div>
              {nextRecommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#292631]">
                    {locale === "es" ? "Siguiente recomendado" : "Recommended next"}
                  </p>
                  <div className="mt-2 space-y-2">
                    {nextRecommendations.slice(0, 2).map((scenario) => (
                      <ScenarioButton
                        key={scenario.id}
                        scenario={scenario}
                        locale={locale}
                        onStart={handleScenarioSelect}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : !state.activeScenarioId ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#292631]">
                {locale === "es" ? "Elige un recorrido de KLEIO" : "Choose a KLEIO walkthrough"}
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[#7F7890]">
                {locale === "es"
                  ? "Elige una de las cuatro rutas principales. La guía abrirá la primera página correcta para ese flujo."
                  : "Pick one of the four core paths. The guide will open the right first page for that workflow."}
              </p>
              <ul className="mt-2 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                {displayScenarios.map((scenario) => (
                  <li key={scenario.id}>
                    <ScenarioButton scenario={scenario} locale={locale} onStart={handleScenarioSelect} />
                  </li>
                ))}
              </ul>
            </div>
          ) : activeStepCopy ? (
            <div className="space-y-2">
              {progressLabel && (
                <p className="text-[0.65rem] font-medium uppercase tracking-wide text-[#A997E8]">
                  {progressLabel}
                </p>
              )}
              <p className="text-sm font-medium text-[#292631]">{activeStepCopy.title}</p>
              <p className="text-xs leading-relaxed text-[#7F7890]">{activeStepCopy.body}</p>
              {roleNote && (
                <p className="rounded-lg border border-[#E7E1F7] bg-white px-2.5 py-2 text-[0.65rem] text-[#6F6882]">
                  {roleNote}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {state.activeScenarioId && activeStepCopy && (
          <div className="flex flex-wrap gap-2 border-t border-[#E7E1F7] px-4 py-3">
            <button
              type="button"
              onClick={handleTakeMeThere}
              className="inline-flex h-8 flex-1 items-center justify-center rounded-xl bg-[#5B4B8A] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#5B4B8A]/90"
            >
              {locale === "es" ? "Llévame allí" : activeStepCopy.primaryActionLabel}
            </button>
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={!hasPrevious}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locale === "es" ? "Atrás" : "Back"}
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]"
            >
              {hasNext ? (locale === "es" ? "Siguiente" : "Next") : locale === "es" ? "Finalizar" : "Finish"}
            </button>
            <button
              type="button"
              onClick={handleSkipStep}
              className="inline-flex h-8 items-center justify-center rounded-xl border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#6F6882] transition-colors hover:bg-[#F7F4FF]"
            >
              {locale === "es" ? "Omitir" : "Skip"}
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
              {locale === "es" ? "Recorridos" : "Playlist"}
            </button>
            <button
              type="button"
              onClick={restartScenario}
              className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]"
            >
              {locale === "es" ? "Reiniciar" : "Restart"}
            </button>
          </div>
          <button
            type="button"
            onClick={dismissGuide}
            className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            {locale === "es" ? "Salir del demo" : "Exit Demo"}
          </button>
        </div>
      </div>
    </div>
  )
}
