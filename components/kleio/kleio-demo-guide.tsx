"use client"

import { useMemo } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Eye, MessageSquareText, MousePointerClick, Search } from "lucide-react"
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

type StepSpanishCopy = Partial<
  Pick<
    DemoGuideStep,
    "title" | "body" | "screenLabel" | "screenCue" | "viewerAction" | "nextPreview" | "primaryActionLabel"
  >
>

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

const stepEs: Record<string, StepSpanishCopy> = {
  "artist-passport-setup-1": {
    title: "Comienza en la ruta de artista",
    body:
      "Esta primera pantalla muestra que KLEIO empieza con el artista, no con extracción institucional. El artista inicia con identidad básica e información de práctica.",
    screenLabel: "Registro de artista · Datos básicos",
    screenCue:
      "Deberías ver el formulario de onboarding de artista con KLEIO Import Assist encima de los primeros campos.",
    viewerAction:
      "Explica que el artista puede escribir manualmente o usar Import Assist para preparar material sugerido. Nada se vuelve oficial sin revisión del artista.",
    nextPreview: "Luego, enfoca Import Assist y por qué importa.",
    primaryActionLabel: "Siguiente: Import Assist",
  },
  "artist-passport-setup-2": {
    title: "Explica Import Assist antes del panel",
    body:
      "Este es el momento de confianza. KLEIO puede preparar bio, statement, etiquetas, enlaces, documentos y obras destacadas, pero el artista sigue siendo editor y autoridad final.",
    screenLabel: "Registro de artista · Import Assist",
    screenCue:
      "Permanece en la página de registro de artista y mira la tarjeta compacta de Import Assist encima del formulario.",
    viewerAction:
      "Preséntalo como preparación de borradores, no como identidad automatizada. El demo debe hacer que los artistas se sientan apoyados, no reemplazados.",
    nextPreview: "Luego, la guía abre el Pasaporte Creativo terminado.",
    primaryActionLabel: "Siguiente: Pasaporte",
  },
  "artist-passport-setup-3": {
    title: "Revisa la preparación del Pasaporte Creativo",
    body:
      "El Pasaporte es la base reutilizable del artista. Reúne los materiales que los artistas reconstruyen para becas, residencias, exposiciones y convocatorias.",
    screenLabel: "Espacio de artista · Pasaporte Creativo",
    screenCue:
      "Deberías ver un perfil reutilizable con bio, statement, CV, portafolio, obras, referencias y contexto de preparación.",
    viewerAction:
      "Aclara que no es un perfil social. Es un registro cultural listo para postulación que el artista puede reutilizar y controlar.",
    nextPreview: "Finaliza este recorrido o continúa hacia búsqueda de becas.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "find-first-grant-1": {
    title: "Comienza con la base del perfil artístico",
    body:
      "La búsqueda de becas solo se vuelve útil después de que KLEIO entiende la práctica, materiales, ubicación, temas y preparación del artista.",
    screenLabel: "Registro de artista · Señales del perfil",
    screenCue:
      "Deberías ver el formulario de artista donde el Pasaporte Creativo empieza a recoger señales del perfil y la práctica.",
    viewerAction:
      "Explica que KLEIO usa el Pasaporte para reducir ruido y mostrar oportunidades relevantes.",
    nextPreview: "Luego, abre el espacio de Oportunidades.",
    primaryActionLabel: "Siguiente: Oportunidades",
  },
  "find-first-grant-2": {
    title: "Abre Oportunidades",
    body:
      "La vista de Oportunidades convierte el Pasaporte en acción: becas, residencias, exposiciones y convocatorias pueden compararse por afinidad y preparación.",
    screenLabel: "Espacio de artista · Oportunidades",
    screenCue:
      "Deberías ver tarjetas o analíticas de oportunidades con afinidad y preparación. Los datos del demo son sintéticos.",
    viewerAction:
      "Nombra esto como pilar de adquisición de artistas: el artista recibe valor antes de convertir un piloto institucional.",
    nextPreview: "Luego, lee las señales que ayudan a decidir dónde aplicar.",
    primaryActionLabel: "Siguiente: Preparación",
  },
  "find-first-grant-3": {
    title: "Lee señales de afinidad y preparación",
    body:
      "Esta pantalla debe responder la pregunta real del artista: qué vale mi tiempo, qué vence pronto y qué material me falta.",
    screenLabel: "Espacio de artista · Afinidad y preparación",
    screenCue:
      "Permanece en Oportunidades y busca porcentaje de afinidad, urgencia de fecha, materiales faltantes, esfuerzo y contexto de fondos.",
    viewerAction:
      "Posiciona KLEIO como una capa de preparación. Recomienda y redacta, pero el artista revisa antes de aplicar o exportar.",
    nextPreview: "Finaliza este recorrido o vuelve al Pasaporte.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "create-open-call-1": {
    title: "Comienza con la configuración institucional",
    body:
      "Un flujo institucional claro empieza definiendo organización, entorno de revisión, equipo y estructura del programa antes de recibir postulaciones.",
    screenLabel: "Registro institucional · Configuración",
    screenCue:
      "Deberías ver el formulario institucional con Import Assist disponible encima de los primeros campos.",
    viewerAction:
      "Explica que KLEIO reemplaza PDFs dispersos, carpetas de email y hojas de cálculo con un entorno estructurado.",
    nextPreview: "Luego, abre Programas y Convocatorias.",
    primaryActionLabel: "Siguiente: Programas",
  },
  "create-open-call-2": {
    title: "Abre Programas y Convocatorias",
    body:
      "Aquí la institución ve becas, residencias, exposiciones y convocatorias como programas gestionados, no como carpetas sueltas.",
    screenLabel: "Espacio institucional · Programas",
    screenCue:
      "Deberías ver programas activos, estados, fechas límite, conteos, materiales incompletos y revisores asignados.",
    viewerAction:
      "Muestra que la institución no solo recibe archivos; gestiona un ciclo completo de revisión.",
    nextPreview: "Luego, crea un borrador de convocatoria.",
    primaryActionLabel: "Siguiente: Nueva convocatoria",
  },
  "create-open-call-3": {
    title: "Crea un borrador de convocatoria",
    body:
      "El constructor debe mostrar la estructura de intake: título, tipo, fecha límite, elegibilidad, materiales, preguntas y etapas de revisión.",
    screenLabel: "Espacio institucional · Nuevo borrador",
    screenCue:
      "Deberías ver la pantalla donde la institución prepara la convocatoria antes de publicar o recibir postulantes.",
    viewerAction:
      "Enfatiza seguridad de borrador: es un flujo demo, no una convocatoria publicada en vivo.",
    nextPreview: "Luego, termina en el estado de borrador preparado.",
    primaryActionLabel: "Siguiente: Borrador listo",
  },
  "create-open-call-4": {
    title: "Cierra en preparación de borrador",
    body:
      "El propósito no es solo un formulario. Es una estructura repetible que revisores, colaboradores e informes pueden usar después.",
    screenLabel: "Espacio institucional · Borrador listo",
    screenCue:
      "Permanece en la pantalla de nuevo programa y trata la convocatoria como borrador controlado del demo.",
    viewerAction:
      "Di claramente que se usan datos sintéticos y que esto no implica una convocatoria pública real.",
    nextPreview: "Finaliza este recorrido o continúa a revisión y lista corta.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "review-and-shortlist-1": {
    title: "Empieza en el espacio institucional",
    body:
      "Antes de la cola, orienta a la persona: estado, volumen, materiales incompletos, progreso de revisores y presión de decisión.",
    screenLabel: "Espacio institucional · Resumen",
    screenCue:
      "Deberías ver el panel institucional principal del ciclo demo sintético de KLEIO Arthouse.",
    viewerAction:
      "Explica que KLEIO da al equipo una vista compartida antes de revisar postulaciones individuales.",
    nextPreview: "Luego, abre la Cola de revisión.",
    primaryActionLabel: "Siguiente: Cola",
  },
  "review-and-shortlist-2": {
    title: "Abre la Cola de revisión",
    body:
      "La cola hace manejable el trabajo: preparación, prioridad, progreso de revisores, fechas límite y contexto aparecen juntos.",
    screenLabel: "Espacio institucional · Cola de revisión",
    screenCue:
      "Deberías ver postulaciones organizadas para revisión en vez de emails, PDFs y hojas de cálculo dispersas.",
    viewerAction:
      "Señala la información que normalmente está fragmentada: estado, completitud, revisor, prioridad y etapa.",
    nextPreview: "Luego, explica el contexto que necesitan los revisores.",
    primaryActionLabel: "Siguiente: Contexto",
  },
  "review-and-shortlist-3": {
    title: "Revisa con contexto",
    body:
      "Un buen flujo mantiene materiales del artista, afinidad con el programa, notas internas, rúbrica y contexto de comité juntos.",
    screenLabel: "Espacio institucional · Contexto del postulante",
    screenCue:
      "Permanece en Cola de revisión y enfoca cómo se entiende una postulación sin abrir archivos desconectados uno por uno.",
    viewerAction:
      "Presenta KLEIO como apoyo a la decisión, no selección automatizada. El comité decide.",
    nextPreview: "Luego, abre el espacio de Lista corta.",
    primaryActionLabel: "Siguiente: Lista corta",
  },
  "review-and-shortlist-4": {
    title: "Mueve candidaturas fuertes a Lista corta",
    body:
      "Lista corta convierte el trabajo de revisión en una sala de decisión clara. Candidatos fuertes, notas y próximos pasos se conservan para selección final.",
    screenLabel: "Espacio institucional · Lista corta",
    screenCue:
      "Deberías ver artistas preseleccionados o postulaciones listas para decisión separadas de la cola grande.",
    viewerAction:
      "Termina mostrando que KLEIO conserva el historial de revisión en vez de perder contexto después de una reunión.",
    nextPreview: "Finaliza este recorrido o vuelve a crear convocatoria.",
    primaryActionLabel: "Finalizar recorrido",
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

function stepCopy(step: DemoGuideStep, locale: KleioLocale) {
  if (locale !== "es") return step
  return {
    ...step,
    ...stepEs[step.id],
    primaryActionLabel: stepEs[step.id]?.primaryActionLabel ?? "Siguiente",
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

function labelFor(key: "screen" | "look" | "action" | "next" | "notHere", locale: KleioLocale) {
  const labels = {
    en: {
      screen: "You’re seeing",
      look: "Look for",
      action: "What to explain",
      next: "Next click",
      notHere: "Open the matching screen before continuing",
    },
    es: {
      screen: "Estás viendo",
      look: "Busca",
      action: "Qué explicar",
      next: "Siguiente clic",
      notHere: "Abre la pantalla correcta antes de continuar",
    },
  }

  return labels[locale === "es" ? "es" : "en"][key]
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
  const isOnActiveStepRoute = activeStep ? pathsMatch(pathname, activeStep.route) : false

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
              {activeStep ? (locale === "es" ? "KLEIO Assist" : "KLEIO Assist") : locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}
            </p>
            <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">
              {activeStep
                ? locale === "es"
                  ? "Ayuda guiada para esta pantalla"
                  : "Guided help for this screen"
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
            <div className="space-y-2">
              <p className="text-xs font-medium text-[#292631]">
                {locale === "es" ? "Elige un recorrido de KLEIO" : "Choose a KLEIO walkthrough"}
              </p>
              <p className="text-[0.7rem] leading-relaxed text-[#7F7890]">
                {locale === "es"
                  ? "Elige una ruta. La guía abrirá cada pantalla y el botón principal avanzará el recorrido paso a paso."
                  : "Pick a path. The guide opens each screen and the main button advances the walkthrough step by step."}
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
