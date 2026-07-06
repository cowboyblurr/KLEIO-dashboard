"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import type { KleioLocale } from "@/lib/kleio-i18n"
import {
  demoGuideFilters,
  demoGuideScenarios,
  getFirstStepForScenario,
  isDemoGuideScenarioId,
  type DemoGuideFilter,
  type DemoGuideScenario,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"

const scenarioEs: Record<DemoGuideScenarioId, {
  title: string
  summary: string
  roleLabel: string
  outcome: string
  previewSteps: string[]
}> = {
  "artist-passport-setup": {
    title: "Crea tu Pasaporte Creativo",
    summary: "Inicia un perfil de artista y prepara materiales reutilizables para futuras postulaciones.",
    roleLabel: "Artista",
    outcome: "Crea el perfil reutilizable que facilita futuras postulaciones.",
    previewSteps: [
      "Comienza con los datos básicos del perfil",
      "Usa Import Assist para preparar borradores",
      "Revisa la preparación del Pasaporte Creativo",
    ],
  },
  "find-first-grant": {
    title: "Encuentra tu primera beca o convocatoria abierta",
    summary: "Pasa de las señales del perfil a búsqueda de oportunidades, coincidencia y preparación.",
    roleLabel: "Artista",
    outcome: "Busca oportunidades y entiende qué beca o convocatoria abierta encaja mejor.",
    previewSteps: [
      "Comienza con las señales del perfil artístico",
      "Abre Oportunidades",
      "Revisa encaje, urgencia de fecha límite y materiales faltantes",
    ],
  },
  "create-open-call": {
    title: "Crea tu primera convocatoria abierta",
    summary: "Inicia un espacio institucional y prepara un borrador estructurado de convocatoria abierta.",
    roleLabel: "Institución",
    outcome: "Prepara un flujo estructurado para una convocatoria, beca, residencia o exposición.",
    previewSteps: [
      "Comienza la configuración del espacio institucional",
      "Abre Programas / Convocatorias abiertas",
      "Agrega elegibilidad, fechas límite y materiales requeridos",
    ],
  },
  "review-and-shortlist": {
    title: "Revisa postulaciones y crea una lista corta",
    summary: "Pasa de postulaciones recibidas a revisión, notas, lista corta e informes.",
    roleLabel: "Institución",
    outcome: "Revisa postulaciones con estructura y mueve candidaturas fuertes a una lista corta.",
    previewSteps: [
      "Entra al espacio institucional",
      "Abre la Cola de revisión",
      "Mueve una candidatura fuerte a la lista corta",
    ],
  },
}

function scenarioCopy(scenario: DemoGuideScenario, locale: KleioLocale) {
  if (locale !== "es") return scenario
  return {
    ...scenario,
    ...scenarioEs[scenario.id],
    timeEstimate: scenario.timeEstimate,
  }
}

function filterLabel(filter: DemoGuideFilter, locale: KleioLocale) {
  if (locale !== "es") return filter
  if (filter === "All") return "Todos"
  if (filter === "Artists") return "Artistas"
  return "Instituciones"
}

function ScenarioCard({
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
    <article className="flex h-full flex-col rounded-[1.35rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#A997E8]">
            {copy.roleLabel}
          </p>
          <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.02em] text-[#292631]">
            {copy.title}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-[#E7E1F7] bg-[#F7F4FF] px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A]">
          {copy.timeEstimate}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{copy.outcome}</p>

      <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/70 p-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
          {locale === "es" ? "Ruta del recorrido" : "Walkthrough path"}
        </p>
        <ul className="mt-2 space-y-1.5">
          {copy.previewSteps.map((step) => (
            <li key={step} className="flex gap-2 text-xs leading-relaxed text-[#6F6882]">
              <span className="mt-1 size-1.5 rounded-full bg-[#A997E8]" aria-hidden />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => onStart(scenario.id)}
        className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#5B4B8A]/90"
      >
        {locale === "es" ? "Comenzar aquí" : "Start here"}
        <ArrowRight className="size-3.5" />
      </button>
    </article>
  )
}

function ScenarioGroup({
  title,
  description,
  scenarios,
  locale,
  onStart,
}: {
  title: string
  description: string
  scenarios: DemoGuideScenario[]
  locale: KleioLocale
  onStart: (scenarioId: DemoGuideScenarioId) => void
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF]/55 p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-xl font-semibold tracking-[-0.02em] text-[#292631]">
            {title}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6F6882]">{description}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {scenarios.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} locale={locale} onStart={onStart} />
        ))}
      </div>
    </section>
  )
}

export function ScenarioPlaylistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useKleioLocale()
  const { startScenario } = useDemoGuide()
  const [activeFilter, setActiveFilter] = useState<DemoGuideFilter>("All")

  const visibleScenarios = useMemo(() => {
    if (activeFilter === "All") return demoGuideScenarios
    return demoGuideScenarios.filter((scenario) => scenario.roleGroup === activeFilter)
  }, [activeFilter])

  const artistScenarios = visibleScenarios.filter((scenario) => scenario.roleGroup === "Artists")
  const institutionScenarios = visibleScenarios.filter((scenario) => scenario.roleGroup === "Institutions")

  function handleStartScenario(scenarioId: DemoGuideScenarioId) {
    startScenario(scenarioId)
    const firstStep = getFirstStepForScenario(scenarioId)
    if (firstStep?.route) {
      router.push(firstStep.route)
    }
  }

  useEffect(() => {
    const requestedScenario = searchParams.get("scenario")
    if (!isDemoGuideScenarioId(requestedScenario)) return

    startScenario(requestedScenario)
    const firstStep = getFirstStepForScenario(requestedScenario)
    if (firstStep?.route) {
      router.push(firstStep.route)
    }
  }, [router, searchParams, startScenario])

  return (
    <main className="min-h-dvh bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
          <KleioWordmarkLink
            href="/"
            imageClassName="h-8 w-auto"
            imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
          />
          <nav className="flex items-center gap-2 text-xs font-medium text-[#6F6882] max-sm:hidden">
            <Link href="/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              {locale === "es" ? "Inicio" : "Home"}
            </Link>
            <Link href="/signup/artist/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              {locale === "es" ? "Inicio artista" : "Artist start"}
            </Link>
            <Link href="/signup/institution/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              {locale === "es" ? "Inicio institución" : "Institution start"}
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-10">
        <div className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
            {locale === "es" ? "Playlist de demo guiado" : "Guided demo playlist"}
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292631] max-md:text-3xl">
            {locale === "es" ? "Elige un recorrido de KLEIO" : "Choose one KLEIO walkthrough"}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
            {locale === "es"
              ? "Comienza con uno de los cuatro recorridos principales. Cada recorrido abre la primera página correcta para esa tarea y mantiene la guía disponible mientras avanzas por el demo."
              : "Start with one of four core paths. Each walkthrough opens the correct first page for that task and keeps the guide available as you move through the demo."}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {demoGuideFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors ${
                activeFilter === filter
                  ? "border-[#5B4B8A] bg-[#5B4B8A] text-white"
                  : "border-[#E7E1F7] bg-white text-[#5B4B8A] hover:bg-[#F7F4FF]"
              }`}
            >
              {filterLabel(filter, locale)}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {artistScenarios.length > 0 && (
            <ScenarioGroup
              title={locale === "es" ? "Para artistas" : "For artists"}
              description={
                locale === "es"
                  ? "Comienza con el perfil artístico y luego pasa a descubrir becas y convocatorias abiertas."
                  : "Start with the artist profile, then move into grant and open-call discovery."
              }
              scenarios={artistScenarios}
              locale={locale}
              onStart={handleStartScenario}
            />
          )}

          {institutionScenarios.length > 0 && (
            <ScenarioGroup
              title={locale === "es" ? "Para instituciones" : "For institutions"}
              description={
                locale === "es"
                  ? "Comienza con la configuración del espacio, luego avanza a crear convocatorias y tomar decisiones de revisión."
                  : "Start with workspace setup, then move into open-call creation and review decisions."
              }
              scenarios={institutionScenarios}
              locale={locale}
              onStart={handleStartScenario}
            />
          )}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <div className="grid gap-4 md:grid-cols-[1.25fr_1fr_1fr]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#A997E8]">
                {locale === "es" ? "Mejores rutas iniciales" : "Best first demo paths"}
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">
                {locale === "es" ? "Usa estas rutas para mostrar KLEIO rápido." : "Use these when showing KLEIO quickly."}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">
                {locale === "es"
                  ? "Estas dos rutas comunican la plataforma con mayor claridad: artistas crean un Pasaporte reutilizable e instituciones preparan una convocatoria estructurada."
                  : "These two paths communicate the platform fastest: artists create a reusable Passport, and institutions prepare a structured open call."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartScenario("artist-passport-setup")}
              className="group rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-left transition-colors hover:bg-[#F7F4FF]/70"
            >
              <p className="text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Artista" : "Artist"}</p>
              <p className="mt-1 font-serif text-base font-semibold text-[#292631]">
                {locale === "es" ? "Crear Pasaporte Creativo" : "Create Artist Passport"}
              </p>
              <p className="mt-2 flex items-center text-xs font-semibold text-[#A997E8]">
                {locale === "es" ? "Comienza en registro" : "Start on signup"}
                <ChevronRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleStartScenario("create-open-call")}
              className="group rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-left transition-colors hover:bg-[#F7F4FF]/70"
            >
              <p className="text-xs font-semibold text-[#5B4B8A]">{locale === "es" ? "Institución" : "Institution"}</p>
              <p className="mt-1 font-serif text-base font-semibold text-[#292631]">
                {locale === "es" ? "Preparar convocatoria" : "Prepare Open Call"}
              </p>
              <p className="mt-2 flex items-center text-xs font-semibold text-[#A997E8]">
                {locale === "es" ? "Comienza en registro" : "Start on signup"}
                <ChevronRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </button>
          </div>
        </section>
      </section>

      <KleioDemoGuide variant="workspace" />
    </main>
  )
}
