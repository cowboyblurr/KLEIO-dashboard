"use client"

import { useEffect, useMemo, useRef } from "react"
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

type ScenarioSpanishCopy = Pick<DemoGuideScenario, "title" | "summary" | "roleLabel" | "completionMessage">
type StepSpanishCopy = Partial<Pick<DemoGuideStep, "title" | "body" | "screenLabel" | "screenCue" | "viewerAction" | "nextPreview" | "primaryActionLabel">>

const ATTENTION_ROUTE_PREFIXES = ["/artist-dashboard/passport", "/artist-dashboard/applications/prepare", "/artist-dashboard/portfolio", "/programs/new", "/signup", "/onboarding", "/application-review"]
function routeNeedsUnobstructedFocus(pathname: string) { return ATTENTION_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix)) }

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
      "Este recorrido está completo. Has visto cómo KLEIO convierte la configuración de un programa en un flujo ordenado.",
  },
  "review-and-shortlist": {
    title: "Revisa postulaciones y crea una lista corta",
    summary: "Sigue el flujo institucional desde resumen, cola de revisión y lista corta.",
    roleLabel: "Institución",
    completionMessage:
      "Este recorrido está completo. Has visto cómo KLEIO mantiene visible el contexto de revisión hasta la decisión.",
  },
}

const stepEs: Record<string, StepSpanishCopy> = {
  "artist-passport-setup-1": {
    title: "Comienza en la ruta de artista",
    body:
      "Esta pantalla inicia la configuración del artista. Reúne los datos que muchas aplicaciones piden primero: nombre, ubicación, práctica, enlaces y una bio corta.",
    screenLabel: "Registro de artista · Datos básicos",
    screenCue:
      "Observa el formulario de perfil y la tarjeta de Import Assist encima. El formulario se puede completar manualmente, con o sin asistencia.",
    viewerAction:
      "Este paso mantiene al artista como autor del registro. KLEIO puede preparar borradores, pero el artista revisa y edita antes de incorporarlos al Pasaporte.",
    nextPreview: "Después, la guía se queda en esta pantalla y enfoca Import Assist.",
    primaryActionLabel: "Siguiente: Import Assist",
  },
  "artist-passport-setup-2": {
    title: "Revisa Import Assist",
    body:
      "Import Assist aparece aquí para que el artista pueda pedir ayuda antes de llenar cada campo desde cero. Es opcional y solo prepara borradores.",
    screenLabel: "Registro de artista · Import Assist",
    screenCue:
      "Mira la tarjeta compacta de Import Assist encima de los campos. Está dentro del flujo de onboarding y no saca al artista del formulario.",
    viewerAction:
      "Ayuda a reducir repetición. El artista puede traer materiales existentes al proceso y decidir qué conservar, editar o ignorar.",
    nextPreview: "Después, la guía abre el Pasaporte Creativo para ver dónde viven esos materiales.",
    primaryActionLabel: "Siguiente: Pasaporte Creativo",
  },
  "artist-passport-setup-3": {
    title: "Abre el Pasaporte Creativo",
    body:
      "Este espacio muestra el registro reutilizable después de la configuración. Aquí se mantiene lenguaje de perfil, contexto de portafolio, documentos y materiales listos para aplicaciones.",
    screenLabel: "Espacio de artista · Pasaporte Creativo",
    screenCue: "Busca preparación del pasaporte, materiales, datos de perfil, controles de compartir y documentos del artista.",
    viewerAction:
      "Esto importa por continuidad. El artista no tiene que reconstruir el mismo registro profesional para cada beca, residencia, exposición o convocatoria.",
    nextPreview: "Finaliza este recorrido o continúa hacia oportunidades.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "find-first-grant-1": {
    title: "Comienza con señales del perfil",
    body:
      "La búsqueda de oportunidades es más clara cuando el perfil contiene práctica, ubicación, materiales, temas, enlaces y preparación.",
    screenLabel: "Registro de artista · Señales del perfil",
    screenCue: "Observa los campos que describen la práctica del artista. Esos datos ayudan después a ordenar oportunidades y preparación.",
    viewerAction:
      "La idea no es mostrar más oportunidades; es ayudar al artista a preparar las más adecuadas.",
    nextPreview: "Después, la guía abre Oportunidades.",
    primaryActionLabel: "Siguiente: Oportunidades",
  },
  "find-first-grant-2": {
    title: "Abre Oportunidades",
    body:
      "Esta página usa el Pasaporte Creativo para ordenar becas, residencias, exposiciones y convocatorias por afinidad, fondos, fecha y materiales faltantes.",
    screenLabel: "Espacio de artista · Oportunidades",
    screenCue: "Busca tarjetas de oportunidad, afinidad, preparación, fechas, materiales faltantes y esfuerzo de aplicación. Los datos del demo son sintéticos.",
    viewerAction:
      "Ayuda al artista a decidir qué preparar ahora, qué necesita más material y qué puede esperar.",
    nextPreview: "Después, permanece en esta página para leer las señales de preparación.",
    primaryActionLabel: "Siguiente: Preparación",
  },
  "find-first-grant-3": {
    title: "Lee las señales de preparación",
    body:
      "Esta vista responde una pregunta práctica: ¿esta oportunidad encaja, la fecha es manejable y qué falta preparar?",
    screenLabel: "Espacio de artista · Afinidad y preparación",
    screenCue: "Busca porcentaje de afinidad, completitud del pasaporte, materiales faltantes, urgencia de fecha y contexto de fondos.",
    viewerAction:
      "KLEIO funciona como una capa de preparación. Puede sugerir próximos pasos y borradores, pero el artista revisa, aprueba y decide cuándo enviar.",
    nextPreview: "Finaliza este recorrido o vuelve al Pasaporte Creativo.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "create-open-call-1": {
    title: "Comienza la configuración institucional",
    body:
      "Esta pantalla inicia el espacio institucional. Antes de recibir postulaciones, la organización define programas, roles de revisión, materiales requeridos e informes.",
    screenLabel: "Registro institucional · Configuración",
    screenCue: "Observa los campos de onboarding institucional y la tarjeta de Import Assist encima del formulario.",
    viewerAction:
      "Esto ayuda a empezar con una estructura organizada en vez de crear el proceso entre correos, PDFs y hojas de cálculo.",
    nextPreview: "Después, la guía abre Programas y Convocatorias.",
    primaryActionLabel: "Siguiente: Programas",
  },
  "create-open-call-2": {
    title: "Abre Programas y Convocatorias",
    body:
      "Los programas contienen convocatorias, becas, residencias, exposiciones o ciclos de revisión. Esta página mantiene esas iniciativas visibles.",
    screenLabel: "Espacio institucional · Programas",
    screenCue: "Busca estado del programa, fechas, número de postulaciones, materiales incompletos y revisores asignados.",
    viewerAction:
      "Ayuda al equipo a ver dónde está cada programa antes de entrar a postulaciones individuales.",
    nextPreview: "Después, la guía abre el borrador de nueva convocatoria.",
    primaryActionLabel: "Siguiente: Nueva convocatoria",
  },
  "create-open-call-3": {
    title: "Crea un borrador de convocatoria",
    body:
      "Esta pantalla define la estructura de recepción: título, descripción, elegibilidad, fecha, materiales requeridos y flujo de revisión.",
    screenLabel: "Espacio institucional · Nuevo borrador",
    screenCue: "Busca campos que definen la convocatoria antes de recibir postulaciones. Es un borrador demo, no una publicación real.",
    viewerAction:
      "Una estructura clara da mejores instrucciones a artistas y mejor información a revisores.",
    nextPreview: "Después, permanece en el borrador para cerrar este recorrido.",
    primaryActionLabel: "Siguiente: Borrador listo",
  },
  "create-open-call-4": {
    title: "Confirma el borrador",
    body:
      "La convocatoria sigue siendo un borrador. La estructura queda preparada para que revisión, comité e informes usen la misma información después.",
    screenLabel: "Espacio institucional · Borrador listo",
    screenCue: "Permanece en la pantalla de nuevo programa y trata la convocatoria como borrador demo.",
    viewerAction:
      "Esto mantiene claridad: KLEIO muestra el flujo sin sugerir que una oportunidad pública real fue lanzada.",
    nextPreview: "Finaliza este recorrido o continúa hacia revisión y lista corta.",
    primaryActionLabel: "Finalizar recorrido",
  },
  "review-and-shortlist-1": {
    title: "Comienza en el resumen",
    body: "El resumen da a la institución una lectura compartida del ciclo antes de abrir una postulación individual.",
    screenLabel: "Espacio institucional · Resumen",
    screenCue: "Busca aplicaciones totales, estado de revisión, materiales incompletos, progreso de revisores, fechas y lista corta.",
    viewerAction: "Ayuda a administradores y comité a ver qué necesita atención antes de tomar decisiones.",
    nextPreview: "Después, la guía abre Cola de revisión.",
    primaryActionLabel: "Siguiente: Cola",
  },
  "review-and-shortlist-2": {
    title: "Abre Cola de revisión",
    body: "La Cola de revisión organiza postulaciones que necesitan atención y reúne preparación, prioridad, revisor asignado y estado.",
    screenLabel: "Espacio institucional · Cola de revisión",
    screenCue: "Busca tabla de postulaciones, completitud, revisores asignados, prioridades y filtros de estado.",
    viewerAction: "Reduce cambios de contexto entre correos, PDFs, hojas de cálculo y notas separadas.",
    nextPreview: "Después, permanece en la cola y enfoca el contexto de revisión.",
    primaryActionLabel: "Siguiente: Contexto",
  },
  "review-and-shortlist-3": {
    title: "Lee el contexto de revisión",
    body: "Un buen flujo mantiene materiales del artista, afinidad con programa, notas, rúbrica y progreso del comité cerca de la postulación.",
    screenLabel: "Espacio institucional · Contexto del postulante",
    screenCue: "Permanece en Cola de revisión y observa cómo se puede revisar sin perder el contexto alrededor.",
    viewerAction: "KLEIO apoya el proceso; no decide. El comité evalúa la obra, registra notas y aprueba próximos pasos.",
    nextPreview: "Después, la guía abre Lista corta.",
    primaryActionLabel: "Siguiente: Lista corta",
  },
  "review-and-shortlist-4": {
    title: "Abre Lista corta",
    body: "La Lista corta reúne postulaciones listas para una decisión más cercana. Notas y estado permanecen conectados mientras el grupo se reduce.",
    screenLabel: "Espacio institucional · Lista corta",
    screenCue: "Busca artistas preseleccionados, estado finalista, contexto de comité y acciones de exportación o informe.",
    viewerAction: "Ayuda a conservar por qué una postulación avanzó, para que el historial no se pierda después de la reunión.",
    nextPreview: "Finaliza este recorrido o vuelve a crear una convocatoria.",
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

function stepCopy(step: DemoGuideStep, locale: KleioLocale): DemoGuideStep {
  if (locale !== "es") return step
  return { ...step, ...stepEs[step.id], primaryActionLabel: stepEs[step.id]?.primaryActionLabel ?? step.primaryActionLabel }
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
    en: { screen: "You’re seeing", look: "Look for", action: "Why it helps", next: "Next", notHere: "Open the matching screen before continuing" },
    es: { screen: "Estás viendo", look: "Busca", action: "Cómo ayuda", next: "Siguiente", notHere: "Abre la pantalla correcta antes de continuar" },
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

function ScenarioButton({ scenario, locale, onStart }: { scenario: DemoGuideScenario; locale: KleioLocale; onStart: (scenarioId: DemoGuideScenarioId) => void }) {
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
  const { state, openGuide, minimizeGuide, startScenario, goToNextStep, goToPreviousStep, restartScenario, dismissGuide, returnToPlaylist } = useDemoGuide()
  const focusRouteSeenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!routeNeedsUnobstructedFocus(pathname)) { focusRouteSeenRef.current = null; return }
    if (focusRouteSeenRef.current === pathname || !state.isOpen) return
    focusRouteSeenRef.current = pathname
    if (!state.activeScenarioId) minimizeGuide()
  }, [minimizeGuide, pathname, state.activeScenarioId, state.isOpen])

  const activeStep = getGuideStep(state.activeStepId)
  const activeStepCopy = activeStep ? stepCopy(activeStep, locale) : undefined
  const completedScenario = getScenarioById(state.completedScenarioId)
  const completedScenarioCopy = completedScenario ? scenarioCopy(completedScenario, locale) : undefined
  const scenarioSteps = state.activeScenarioId ? getScenarioSteps(state.activeScenarioId) : []
  const nextStep = getNextGuideStep(state.activeStepId)
  const previousStep = getPreviousGuideStep(state.activeStepId)
  const hasPrevious = Boolean(previousStep)
  const roleNote = roleMismatchMessage(activeStep?.requiredRole, locale)
  const isOnActiveStepRoute = activeStep ? pathsMatch(pathname, activeStep.route) : false
  const currentPageGuide = useMemo(() => getKleioPageGuide(pathname, locale), [pathname, locale])
  const displayScenarios = useMemo(() => getRecommendedScenariosForPath(pathname), [pathname])
  const nextRecommendations = useMemo(() => getRecommendedNextScenarios(state.completedScenarioId), [state.completedScenarioId])

  const progressLabel = useMemo(() => {
    if (!activeStep || scenarioSteps.length === 0) return null
    return locale === "es" ? `Paso ${activeStep.stepNumber} de ${scenarioSteps.length}` : `Step ${activeStep.stepNumber} of ${scenarioSteps.length}`
  }, [activeStep, locale, scenarioSteps.length])

  const guideItems = activeStepCopy
    ? [
        { key: "screen", label: labelFor("screen", locale), body: activeStepCopy.screenLabel, Icon: Eye },
        { key: "look", label: labelFor("look", locale), body: activeStepCopy.screenCue, Icon: Search },
        { key: "action", label: labelFor("action", locale), body: activeStepCopy.viewerAction, Icon: MessageSquareText },
        { key: "next", label: labelFor("next", locale), body: activeStepCopy.nextPreview ?? "", Icon: MousePointerClick },
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
    ? locale === "es" ? "Continuar" : "Continue"
    : !isOnActiveStepRoute
      ? locale === "es" ? "Abrir esta pantalla" : "Open this screen"
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
          <span className="pr-1 text-[0.7rem] font-medium text-[#5B4B8A]">{activeStep ? progressLabel : locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="kleio-demo-guide-anchor fixed bottom-4 right-4 z-40 w-[min(100vw-1.5rem,21rem)] max-md:bottom-3 max-md:right-3" role="complementary" aria-label={locale === "es" ? "Demo guiado de KLEIO" : "KLEIO guided demo"}>
      <style>{`
        @keyframes kleioGuideMessageIn {
          from { opacity: 0; transform: translate3d(10px, 10px, 0) scale(0.985); filter: blur(2px); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        .kleio-guide-message { opacity: 0; animation: kleioGuideMessageIn 460ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        @media (prefers-reduced-motion: reduce) { .kleio-guide-message { opacity: 1; animation: none; } }
      `}</style>

      <div className="kleio-demo-guide-panel max-h-[min(72dvh,38rem)] overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/95 shadow-[0_12px_40px_rgba(82,64,130,0.12)] backdrop-blur-sm">
        <div className="flex items-start gap-3 border-b border-[#E7E1F7] px-3.5 py-3">
          <KleioAssistObjectVisual size="sm" mode={completedScenario ? "complete" : "reviewing"} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-[#292631]">{activeStep ? "KLEIO Assist" : currentPageGuide ? currentPageGuide.title : locale === "es" ? "Guía KLEIO" : "KLEIO Guide"}</p>
            <p className="mt-0.5 text-[0.65rem] leading-snug text-[#7F7890]">
              {activeStep ? (locale === "es" ? "Ayuda guiada para esta pantalla" : "Guided help for this screen") : currentPageGuide ? roleLabel(currentPageGuide.role, locale) : locale === "es" ? "Elige un recorrido por flujo" : "Choose a workflow walkthrough"}
            </p>
          </div>
          <button type="button" onClick={minimizeGuide} className="rounded-full border border-[#E7E1F7] bg-white/80 px-3 py-1.5 text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]">
            {locale === "es" ? "Ocultar" : "Hide"}
          </button>
        </div>

        <div className="max-h-[min(54dvh,29rem)] overflow-y-auto px-3.5 py-3">
          {!state.activeScenarioId ? (
            <div className="space-y-3">
              {currentPageGuide && (
                <div className="rounded-[1.1rem] border border-[#E7E1F7] bg-white px-3 py-3 shadow-[0_10px_26px_rgba(82,64,130,0.08)]">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Esta página" : "This page"}</p>
                  <h3 className="mt-1 text-sm font-semibold text-[#292631]">{currentPageGuide.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#6F6882]">{currentPageGuide.description}</p>
                  <div className="mt-3 grid gap-2">
                    <div className="rounded-xl bg-[#F7F4FF] px-3 py-2">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">{locale === "es" ? "Cómo ayuda" : "How it helps"}</p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-[#292631]">{currentPageGuide.benefit}</p>
                    </div>
                    <div className="rounded-xl bg-[#F7F4FF] px-3 py-2">
                      <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">{locale === "es" ? "En la práctica" : "In practice"}</p>
                      <p className="mt-0.5 text-[0.72rem] leading-snug text-[#292631]">{currentPageGuide.realWorld}</p>
                    </div>
                  </div>
                </div>
              )}

              {completedScenarioCopy && !currentPageGuide && (
                <div className="rounded-xl border border-[#E7E1F7] bg-white px-3 py-2.5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-[#A997E8]">{locale === "es" ? "Recorrido completo" : "Walkthrough complete"}</p>
                  <p className="mt-1 text-sm font-medium text-[#292631]">{completedScenarioCopy.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7F7890]">{completedScenarioCopy.completionMessage}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-[#292631]">{locale === "es" ? "Recorridos guiados" : "Guided walkthroughs"}</p>
                <p className="mt-1 text-[0.7rem] leading-relaxed text-[#7F7890]">
                  {locale === "es" ? "Elige una ruta completa cuando quieras ver cómo varias pantallas se conectan." : "Choose a full path when you want to see how several screens connect."}
                </p>
                <ul className="mt-2 max-h-[18rem] space-y-2 overflow-y-auto pr-1">
                  {displayScenarios.map((scenario) => (
                    <li key={scenario.id}>
                      <ScenarioButton scenario={scenario} locale={locale} onStart={handleScenarioSelect} />
                    </li>
                  ))}
                </ul>
              </div>

              {nextRecommendations.length > 0 && !currentPageGuide && (
                <div>
                  <p className="text-xs font-medium text-[#292631]">{locale === "es" ? "Siguiente recomendado" : "Recommended next"}</p>
                  <div className="mt-2 space-y-2">
                    {nextRecommendations.slice(0, 2).map((scenario) => <ScenarioButton key={scenario.id} scenario={scenario} locale={locale} onStart={handleScenarioSelect} />)}
                  </div>
                </div>
              )}
            </div>
          ) : activeStepCopy ? (
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {progressLabel && <p className="text-[0.62rem] font-semibold uppercase tracking-wide text-[#A997E8]">{progressLabel}</p>}
                <span className={cn("rounded-full px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide", isOnActiveStepRoute ? "bg-white text-[#5B4B8A]" : "border border-[#E7E1F7] bg-white text-[#7F7890]")}>{isOnActiveStepRoute ? (locale === "es" ? "Pantalla correcta" : "Screen matched") : labelFor("notHere", locale)}</span>
              </div>

              <div className="flex gap-1.5" aria-hidden>{scenarioSteps.map((step) => <span key={step.id} className={cn("h-1.5 flex-1 rounded-full", step.id === activeStep?.id ? "bg-[#5B4B8A]" : step.stepNumber < (activeStep?.stepNumber ?? 0) ? "bg-[#A997E8]" : "bg-white")} />)}</div>

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
                      <div key={`${activeStep?.id}-${item.key}`} className="kleio-guide-message relative rounded-[1.05rem] border border-[#E7E1F7] bg-white px-2.5 py-2 shadow-[0_10px_26px_rgba(82,64,130,0.08)]" style={{ animationDelay: `${index * 90}ms` }}>
                        <span className="absolute -left-8 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full border border-[#E7E1F7] bg-[#F0ECFF] text-[0.7rem] font-semibold text-[#5B4B8A] shadow-sm">{index + 1}</span>
                        <div className="flex gap-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#6E52CC]"><Icon className="size-4" /></span>
                          <div className="min-w-0">
                            <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">{item.label}</p>
                            <p className="mt-0.5 text-[0.74rem] leading-snug text-[#292631]">{item.body}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {roleNote && <p className="rounded-lg border border-[#E7E1F7] bg-white px-2.5 py-2 text-[0.65rem] text-[#6F6882]">{roleNote}</p>}
            </div>
          ) : null}
        </div>

        {state.activeScenarioId && activeStepCopy && (
          <div className="flex gap-2 border-t border-[#E7E1F7] px-3.5 py-2.5">
            <button type="button" onClick={handlePrimaryGuideAction} className="inline-flex h-9 flex-1 items-center justify-center rounded-full bg-[#5B4B8A] px-3 text-xs font-semibold text-white shadow-[0_8px_18px_rgba(82,64,130,0.18)] transition-colors hover:bg-[#5B4B8A]/90">{primaryButtonLabel}</button>
            <button type="button" onClick={handlePreviousStep} disabled={!hasPrevious} className="inline-flex h-9 min-w-20 items-center justify-center rounded-full border border-[#E7E1F7] bg-white px-3 text-xs font-semibold text-[#7F7890] transition-colors hover:bg-[#F7F4FF] hover:text-[#292631] disabled:cursor-not-allowed disabled:opacity-40">{locale === "es" ? "Atrás" : "Back"}</button>
            {!isOnActiveStepRoute && <button type="button" onClick={handleNextStep} className="inline-flex h-9 items-center justify-center rounded-full border border-[#E7E1F7] bg-white px-3 text-xs font-medium text-[#6F6882] transition-colors hover:bg-[#F7F4FF]">{nextStep ? (locale === "es" ? "Saltar" : "Skip") : locale === "es" ? "Finalizar" : "Finish"}</button>}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#E7E1F7] px-3.5 py-2">
          <div className="flex gap-3">
            <button type="button" onClick={returnToPlaylist} className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]">{locale === "es" ? "Recorridos" : "Playlist"}</button>
            <button type="button" onClick={restartScenario} className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#5B4B8A]">{locale === "es" ? "Reiniciar" : "Restart"}</button>
          </div>
          <button type="button" onClick={dismissGuide} className="text-[0.65rem] font-medium text-[#7F7890] transition-colors hover:text-[#292631]">{locale === "es" ? "Salir del demo" : "Exit Demo"}</button>
        </div>
      </div>
    </div>
  )
}
