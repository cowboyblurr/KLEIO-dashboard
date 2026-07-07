"use client"

import { useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import type { KleioLocale } from "@/lib/kleio-i18n"
import { demoGuideScenarios, getFirstStepForScenario, isDemoGuideScenarioId, type DemoGuideScenario, type DemoGuideScenarioId } from "@/lib/kleio-demo-guide"

type ScenarioCopy = { title: string; summary: string; roleLabel: string; outcome: string; previewSteps: string[] }

const scenarioEs: Partial<Record<DemoGuideScenarioId, ScenarioCopy>> = {
  "artist-passport-setup": { title: "Crea tu Pasaporte Creativo", summary: "Inicia un perfil de artista y prepara materiales reutilizables para futuras postulaciones.", roleLabel: "Artista", outcome: "Crea el perfil reutilizable que facilita futuras postulaciones.", previewSteps: ["Datos básicos del perfil", "Import Assist prepara borradores", "Revisión del Pasaporte Creativo"] },
  "find-first-grant": { title: "Lee oportunidades con tu Pasaporte", summary: "Pasa de las señales del perfil a afinidad, fechas y materiales faltantes.", roleLabel: "Artista", outcome: "Entiende qué oportunidad vale la pena preparar primero.", previewSteps: ["Señales del perfil", "Oportunidades", "Afinidad, urgencia y materiales faltantes"] },
  "create-open-call": { title: "Configura una convocatoria institucional", summary: "Inicia el espacio institucional y prepara una convocatoria estructurada.", roleLabel: "Institución", outcome: "Prepara un flujo claro para una convocatoria, beca, residencia o exposición.", previewSteps: ["Configuración institucional", "Programas y convocatorias", "Elegibilidad, fechas y materiales"] },
  "invite-reviewers-resolve-materials": { title: "Coordina revisores y materiales faltantes", summary: "Sigue cómo una institución revisa asignaciones, materiales incompletos y seguimiento.", roleLabel: "Institución", outcome: "Mantén la coordinación de revisores y solicitudes de materiales cerca del registro de revisión.", previewSteps: ["Programas activos", "Comité", "Cola de revisión", "Mensajes", "Registro de actividad"] },
  "review-and-shortlist": { title: "Revisa postulaciones y crea lista corta", summary: "Pasa de revisión a contexto, notas, lista corta e informes.", roleLabel: "Institución", outcome: "Revisa postulaciones con estructura y conserva el historial de decisión.", previewSteps: ["Resumen institucional", "Cola de revisión", "Contexto del postulante", "Lista corta"] },
}

function scenarioCopy(scenario: DemoGuideScenario, locale: KleioLocale) {
  if (locale !== "es") return scenario
  return { ...scenario, ...scenarioEs[scenario.id], timeEstimate: scenario.timeEstimate }
}

function ScenarioCard({ scenario, locale, onStart, recommended = false }: { scenario: DemoGuideScenario; locale: KleioLocale; onStart: (scenarioId: DemoGuideScenarioId) => void; recommended?: boolean }) {
  const copy = scenarioCopy(scenario, locale)
  return (
    <article className="flex h-full flex-col rounded-[1.35rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#A997E8]">{copy.roleLabel}</p>
          <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.02em] text-[#292631]">{copy.title}</h2>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {recommended && <span className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.52rem] font-bold uppercase tracking-wide text-[#5B4B8A]">{locale === "es" ? "Empieza aquí" : "Start here"}</span>}
          <span className="rounded-full border border-[#E7E1F7] bg-[#F7F4FF] px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A]">{copy.timeEstimate}</span>
        </div>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{copy.outcome}</p>
      <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/70 p-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Ruta" : "Path"}</p>
        <ul className="mt-2 space-y-1.5">
          {copy.previewSteps.map((step) => <li key={step} className="flex gap-2 text-xs leading-relaxed text-[#6F6882]"><span className="mt-1 size-1.5 rounded-full bg-[#A997E8]" aria-hidden /><span>{step}</span></li>)}
        </ul>
      </div>
      <button type="button" onClick={() => onStart(scenario.id)} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5B4B8A]/90">
        {locale === "es" ? "Comenzar" : "Start walkthrough"}<ArrowRight className="size-3.5" />
      </button>
    </article>
  )
}

function StartRecommendation({ scenario, label, body, locale, onStart }: { scenario: DemoGuideScenario; label: string; body: string; locale: KleioLocale; onStart: (scenarioId: DemoGuideScenarioId) => void }) {
  const copy = scenarioCopy(scenario, locale)
  return (
    <button type="button" onClick={() => onStart(scenario.id)} className="group rounded-2xl border border-[#E7E1F7] bg-white p-4 text-left shadow-[0_12px_34px_rgba(82,64,130,0.06)] transition-colors hover:bg-[#F7F4FF]">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">{label}</p>
      <h3 className="mt-1 font-serif text-base font-semibold text-[#292631]">{copy.title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-[#6F6882]">{body}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#5B4B8A]">
        {locale === "es" ? "Empezar esta ruta" : "Start this path"}<ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  )
}

function ScenarioGroup({ title, description, scenarios, locale, onStart }: { title: string; description: string; scenarios: DemoGuideScenario[]; locale: KleioLocale; onStart: (scenarioId: DemoGuideScenarioId) => void }) {
  return (
    <section className="rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF]/55 p-4">
      <div className="mb-4">
        <h2 className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#292631]">{title}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6F6882]">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {scenarios.map((scenario, index) => <ScenarioCard key={scenario.id} scenario={scenario} locale={locale} onStart={onStart} recommended={index === 0} />)}
      </div>
    </section>
  )
}

export function ScenarioPlaylistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useKleioLocale()
  const { startScenario } = useDemoGuide()

  const artistScenarios = useMemo(() => demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists"), [])
  const institutionScenarios = useMemo(() => demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions"), [])
  const artistStart = artistScenarios[0]
  const institutionStart = institutionScenarios[0]

  function handleStartScenario(scenarioId: DemoGuideScenarioId) {
    startScenario(scenarioId)
    const firstStep = getFirstStepForScenario(scenarioId)
    if (firstStep?.route) router.push(firstStep.route)
  }

  useEffect(() => {
    const requestedScenario = searchParams.get("scenario")
    if (!isDemoGuideScenarioId(requestedScenario)) return
    startScenario(requestedScenario)
    const firstStep = getFirstStepForScenario(requestedScenario)
    if (firstStep?.route) router.push(firstStep.route)
  }, [router, searchParams, startScenario])

  return (
    <main className="min-h-dvh bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
          <KleioWordmarkLink href="/" imageClassName="h-8 w-auto" imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }} />
          <nav className="flex items-center gap-2 text-xs font-medium text-[#6F6882] max-sm:hidden">
            <Link href="/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">{locale === "es" ? "Inicio" : "Home"}</Link>
            <Link href="/signup/artist/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">{locale === "es" ? "Inicio artista" : "Artist start"}</Link>
            <Link href="/signup/institution/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">{locale === "es" ? "Inicio institución" : "Institution start"}</Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto w-full max-w-[1120px] px-5 py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">{locale === "es" ? "Recorridos guiados" : "Guided demo"}</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292631] max-md:text-3xl">{locale === "es" ? "Elige una ruta para empezar" : "Choose one path to begin"}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
              {locale === "es" ? "Cada recorrido abre la primera pantalla correcta y mantiene KLEIO Assist visible mientras avanzas. Si estás evaluando KLEIO por primera vez, usa una recomendación de abajo." : "Each walkthrough opens the right first screen and keeps KLEIO Assist visible as you move. If you are evaluating KLEIO for the first time, use one of the recommendations below."}
            </p>
          </div>
          <DemoEnvironmentBadge className="mt-1" />
        </div>

        <div className="mt-6 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF]/65 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">{locale === "es" ? "Nuevo en KLEIO" : "New to KLEIO"}</p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{locale === "es" ? "Empieza con una de estas dos rutas" : "Start with one of these two paths"}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
                {locale === "es" ? "Si estás viendo KLEIO como institución, empieza con la convocatoria. Si quieres entender el valor para artistas, empieza con el Pasaporte Creativo." : "If you are reviewing KLEIO as an institution, start with the call setup. If you want to understand the artist-side value, start with the Creative Passport."}
              </p>
            </div>
            <div className="rounded-full border border-[#E7E1F7] bg-white px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-wide text-[#7F7890]">
              {locale === "es" ? "Prototipo clicable" : "Clickable prototype"}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 max-md:grid-cols-1">
            {institutionStart && <StartRecommendation scenario={institutionStart} label={locale === "es" ? "Institución / Piloto" : "Institution / Pilot"} body={locale === "es" ? "La mejor ruta para ver cómo KLEIO organiza una convocatoria antes de recibir postulaciones." : "The best first path for seeing how KLEIO organizes an open call before submissions arrive."} locale={locale} onStart={handleStartScenario} />}
            {artistStart && <StartRecommendation scenario={artistStart} label={locale === "es" ? "Artista / Valor" : "Artist / Value"} body={locale === "es" ? "La mejor ruta para ver cómo un artista empieza un registro reutilizable y mantiene control sobre sus materiales." : "The best first path for seeing how an artist starts a reusable record and keeps control of their materials."} locale={locale} onStart={handleStartScenario} />}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#7F7890]">
            {locale === "es" ? "Este demo usa datos sintéticos. Muestra el flujo previsto, no cuentas institucionales reales ni postulaciones en vivo." : "This demo uses synthetic data. It shows the intended workflow, not live institutional accounts or real submissions."}
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <ScenarioGroup title={locale === "es" ? "Para artistas" : "For artists"} description={locale === "es" ? "Empieza con el Pasaporte Creativo y luego usa ese contexto para leer oportunidades." : "Start with the Creative Passport, then use that context to read opportunities."} scenarios={artistScenarios} locale={locale} onStart={handleStartScenario} />
          <ScenarioGroup title={locale === "es" ? "Para instituciones" : "For institutions"} description={locale === "es" ? "Empieza con la estructura de una convocatoria; luego coordina revisión, materiales y decisiones." : "Start with call structure, then coordinate reviewers, materials, and decisions."} scenarios={institutionScenarios} locale={locale} onStart={handleStartScenario} />
        </div>
      </section>
      <KleioDemoGuide variant="workspace" />
    </main>
  )
}
