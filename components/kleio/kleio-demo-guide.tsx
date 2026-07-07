"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Eye, MessageSquareText, MousePointerClick, Search } from "lucide-react"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { getDemoSession } from "@/lib/kleio-demo-auth"
import type { KleioLocale } from "@/lib/kleio-i18n"
import { getKleioPageGuide } from "@/lib/kleio-page-guide"
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
  variant?: "workspace" | "landing"
}

type ScenarioSpanishCopy = {
  title: string
  summary: string
  roleLabel: string
  completionMessage: string
}

const scenarioEs: Partial<Record<DemoGuideScenarioId, ScenarioSpanishCopy>> = {
  "artist-passport-setup": {
    title: "Crea tu Pasaporte Creativo",
    summary: "Recorre el inicio del perfil de artista y la preparación de materiales reutilizables.",
    roleLabel: "Artista",
    completionMessage:
      "Este recorrido está completo. Has visto cómo KLEIO comienza con un registro artístico reutilizable que el artista controla.",
  },
  "find-first-grant": {
    title: "Encuentra tu primera beca o convocatoria abierta",
    summary: "Observa cómo el espacio de artista conecta preparación con oportunidades relevantes.",
    roleLabel: "Artista",
    completionMessage:
      "Este recorrido está completo. Has visto cómo KLEIO ayuda al artista a entender qué oportunidades vale la pena preparar primero.",
  },
  "create-open-call": {
    title: "Crea tu primera convocatoria abierta",
    summary: "Recorre cómo una institución prepara un flujo de recepción estructurado.",
    roleLabel: "Institución",
    completionMessage:
      "Este recorrido está completo. Has visto cómo KLEIO convierte la configuración de un programa en un flujo estructurado.",
  },
  "review-and-shortlist": {
    title: "Revisa postulaciones y crea una lista corta",
    summary: "Sigue el flujo institucional desde resumen, cola de revisión y lista corta.",
    roleLabel: "Institución",
    completionMessage:
      "Este recorrido está completo. Has visto cómo KLEIO mantiene visible el contexto de revisión hasta la decisión.",
  },
}

function normalizePath(path: string | null | undefined) {
  if (!path) return "/"
  if (path === "/") return "/"
  return path.endsWith("/") ? path : `${path}/`
}

function pathsMatch(pathname: string | null, targetRoute: string) {
  return normalizePath(pathname) === normalizePath(targetRoute)
}

function scenarioCopy(scenario: DemoGuideScenario, locale: KleioLocale) {
  if (locale !== "es") return scenario
  return { ...scenario, ...scenarioEs[scenario.id] }
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

function labelFor(key: "screen" | "look" | "action" | "next" | "notHere", locale: KleioLocale) {
  const labels = {
    en: {
      screen: "You’re seeing",
      look: "Look for",
      action: "Why it helps",
      next: "Next",
      notHere: "Open the matching screen before continuing",
    },
    es: {
      screen: "Estás viendo",
      look: "Busca",
      action: "Cómo ayuda",
      next: "Siguiente",
      notHere: "Abre la pantalla correcta antes de continuar",
    },
  }

  return labels[locale === "es" ? "es" : "en"][key]
}

function roleLabel(role: string, locale: KleioLocale) {
  if (locale !== "es") {
    if (role === "artist") return "Artist workspace"
    if (role === "collaborator") return "Collaborator review seat"
    return "Institution workspace"
  }
  if (role === "artist") return "Espacio de artista"
  if (role === "collaborator") return "Asiento de revisión"
  return "Espacio institucional"
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
    restartScenario,
    dismissGuide,
    returnToPlaylist,
  } = useDemoGuide()

  const activeStep = getGuideStep(state.activeStepId)
  const activeStepCopy = activeStep
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
  const isOnActiveStepRoute = activeStep ? pathsMatch(pathname, activeStep.route) : false
  const currentPageGuide = useMemo(() => getKleioPageGuide(pathname), [pathname])

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

  const guideItems = activeStepCopy
    ? [
        {
          key: "screen",
          label: labelFor("screen", locale),
          body: activeStepCopy.screenLabel,
          Icon: Eye,
        },
        {
          key: "look",
          label: labelFor("look", locale),
          body: activeStepCopy.screenCue,
          Icon: Search,
        },
        {
          key: "action",
          label: labelFor("action", locale),
          body: activeStepCopy.viewerAction,
          Icon: MessageSquareText,
        },
        {
          key: "next",
          label: labelFor("next", locale),
          body: activeStepCopy.nextPreview ?? "",
          Icon: MousePointerClick,
        },
      ].filter((item) => item.body)
    : []

  if (variant === "landing" && !state.isOpen) return null
  if (variant === "workspace" && state.dismissed && !state.isOpen) return null

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

  function handlePrimaryGuideAction() {
    if (!activeStep) return

    if (!isOnActiveStepRoute) {
      router.push(activeStep.route)
      return
    }

    handleNextStep()
  }

  function handlePreviousStep() {
    if (!previousStep) return
    goToPreviousStep()
    router.push(previousStep.route)
  }

  const primaryButtonLabel = !activeStepCopy
    ? locale === "es"
      ? "Continuar"
      : "Continue"
    : !isOnActiveStepRoute
      ? locale === "es"
        ? "Abrir esta pantalla"
        : "Open this screen"
      : activeStepCopy.primaryActionLabel

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
            {activeStep ? progressLabel : locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}
          </span>
        </button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "kleio-demo-guide-anchor fixed z-40 w-[min(100vw-1.5rem,24rem)]",
        "bottom-4 right-4 max-md:bottom-3 max-md:right-3",
      )}
      role="complementary"
      aria-label={locale === "es" ? "Demo guiado de KLEIO" : "KLEIO guided demo"}
    >
      <style>{`
        @keyframes kleioGuideMessageIn {
          from {
            opacity: 0;
            transform: translate3d(10px, 10px, 0) scale(0.985);
            filter: blur(2px);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
            filter: blur(0);
          }
        }

        .kleio-guide-message {
          opacity: 0;
          animation: kleioGuideMessageIn 460ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          .kleio-guide-message {
            opacity: 1;
            animation: none;
          }
        }
      `}</style>

      <div className="kleio-demo-guide-panel max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">
        <div className="flex items-start gap-3 border-b border-[#E7E1F7] px-3.5 py-3">
          <KleioAssistObjectVisual size="sm" mode={completedScenario ? "complete" : "reviewing"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#292631]">
              {activeStep ? "KLEIO Assist" : currentPageGuide ? currentPageGuide.title : locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}
            </p>
            <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">
              {activeStep
                ? locale === "es"
                  ? "Ayuda guiada para esta pantalla"
                  : "Guided help for this screen"
                : currentPageGuide
                  ? roleLabel(currentPageGuide.role, locale)
                  : activeScenarioCopy?.title ??
                    completedScenarioCopy?.title ??
                    (locale === "es" ? "Elige un recorrido por flujo" : "Choose a workflow walkthrough")}
            </p>
          </div>
          <button
            type="button"
            onClick={minimizeGuide}
            className="rounded-full border border-[#E7E1F7] bg-white/80 px-3 py-1.5 text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]"
          >
            {locale === "es" ? "Ocultar" : "Hide"}
          </button>
        </div>

        <div className="max-h-[min(64dvh,34rem)] overflow-y-auto px-3.5 py-3">
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
            <div className="space-y-3">
              {currentPageGuide && (
                <div className="rounded-[1.1rem] border border-[#E7E1F7] bg-white px-3 py-3 shadow-[0_10px_26px_rgba(82,64,130,0.08)]">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">
                    {locale === "es" ? "Esta página" : "This page"}
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-[#292631]">{currentPageGuide.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#6F6882]">{currentPageGuide.description}</p>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-xl bg-[#F7F4FF] px-3 py-2">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">
                        {locale === "es" ? "Cómo ayuda" : "How it helps"}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-[#292631]">{currentPageGuide.benefit}</p>
                    </div>
                    <div className="rounded-xl bg-[#F7F4FF] px-3 py-2">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">
                        {locale === "es" ? "En la práctica" : "In practice"}
                      </p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-[#292631]">{currentPageGuide.realWorld}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-[#292631]">
                  {locale === "es" ? "Recorridos guiados" : "Guided walkthroughs"}
                </p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-[#7F7890]">
                  {locale === "es"
                    ? "Elige una ruta completa cuando quieras ver cómo varias pantallas se conectan."
                    : "Choose a full path when you want to see how several screens connect."}
                </p>
                <ul className="mt-2 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                  {displayScenarios.map((scenario) => (
                    <li key={scenario.id}>
                      <ScenarioButton scenario={scenario} locale={locale} onStart={handleScenarioSelect} />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : activeStepCopy ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {progressLabel && (
                  <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-[#A997E8]">
                    {progressLabel}
                  </p>
                )}
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide",
                    isOnActiveStepRoute
                      ? "bg-white text-[#5B4B8A]"
                      : "border border-[#E7E1F7] bg-white text-[#7F7890]",
                  )}
                >
                  {isOnActiveStepRoute
                    ? locale === "es"
                      ? "Pantalla correcta"
                      : "Screen matched"
                    : labelFor("notHere", locale)}
                </span>
              </div>

              <div className="flex gap-1.5" aria-hidden>
                {scenarioSteps.map((step) => (
                  <span
                    key={step.id}
                    className={cn(
                      "h-1.5 flex-1 rounded-full",
                      step.id === activeStep.id
                        ? "bg-[#5B4B8A]"
                        : step.stepNumber < activeStep.stepNumber
                          ? "bg-[#A997E8]"
                          : "bg-white",
                    )}
                  />
                ))}
              </div>

              <div className="rounded-xl border border-[#E7E1F7] bg-white/70 px-3 py-2">
                <p className="text-sm font-semibold leading-tight text-[#292631]">{activeStepCopy.title}</p>
                <p className="mt-1 text-[0.72rem] leading-relaxed text-[#6F6882]">{activeStepCopy.body}</p>
              </div>

              <div className="relative pl-8">
                <div className="absolute left-[0.875rem] top-5 bottom-5 border-l border-dashed border-[#D8D0F2]" aria-hidden />
                <div className="space-y-2">
                  {guideItems.map((item, index) => {
                    const Icon = item.Icon
                    return (
                      <div
                        key={`${activeStep.id}-${item.key}`}
                        className="kleio-guide-message relative rounded-[1.05rem] border border-[#E7E1F7] bg-white px-2.5 py-2 shadow-[0_10px_26px_rgba(82,64,130,0.08)]"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        <span className="absolute -left-8 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-[#E7E1F7] bg-[#F0ECFF] text-[0.7rem] font-semibold text-[#5B4B8A] shadow-sm">
                          {index + 1}
                        </span>
                        <div className="flex gap-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#6E52CC]">
                            <Icon className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">
                              {item.label}
                            </p>
                            <p className="mt-0.5 text-[0.74rem] leading-snug text-[#292631]">{item.body}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {roleNote && (
                <p className="rounded-lg border border-[#E7E1F7] bg-white px-2.5 py-2 text-[0.65rem] text-[#6F6882]">
                  {roleNote}
                </p>
              )}
            </div>
          ) : null}
        </div>

        {state.activeScenarioId && activeStepCopy && (
          <div className="flex gap-2 border-t border-[#E7E1F7] px-3.5 py-2.5">
            <button
              type="button"
              onClick={handlePrimaryGuideAction}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#5B4B8A] px-3 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(82,64,130,0.18)] transition-colors hover:bg-[#5B4B8A]/90"
            >
              {primaryButtonLabel}
            </button>
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={!hasPrevious}
              className="inline-flex h-9 min-w-20 items-center justify-center rounded-full border border-[#E7E1F7] bg-white px-3 text-xs font-semibold text-[#7F7890] transition-colors hover:bg-[#F7F4FF] hover:text-[#292631] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locale === "es" ? "Atrás" : "Back"}
            </button>
            {!isOnActiveStepRoute && (
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex h-9 items-center justify-center rounded-full border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#6F6882] transition-colors hover:bg-[#F7F4FF]"
              >
                {hasNext ? (locale === "es" ? "Saltar" : "Skip") : locale === "es" ? "Finalizar" : "Finish"}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E1F7] px-3.5 py-2">
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
