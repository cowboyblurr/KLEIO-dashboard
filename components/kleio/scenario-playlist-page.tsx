"use client"

import Link from "next/link"
import { useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import type { KleioLocale } from "@/lib/kleio-i18n"
import {
  demoGuideScenarios,
  getFirstStepForScenario,
  isDemoGuideScenarioId,
  type DemoGuideScenario,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"
import { clearDemoSession, loginDemoUser } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

type ScenarioCopy = {
  title: string
  summary: string
  roleLabel: string
  outcome: string
  previewSteps: string[]
}

const scenarioEs: Partial<Record<DemoGuideScenarioId, ScenarioCopy>> = {
  "artist-passport-setup": {
    title: "Crea tu Pasaporte Creativo",
    summary: "Inicia un perfil de artista y prepara materiales reutilizables para futuras postulaciones.",
    roleLabel: "Artista",
    outcome: "Crea el perfil reutilizable que facilita futuras postulaciones.",
    previewSteps: ["Datos básicos del perfil", "Import Assist prepara borradores", "Revisión del Pasaporte Creativo"],
  },
  "find-first-grant": {
    title: "Lee oportunidades con tu Pasaporte",
    summary: "Pasa de las señales del perfil a afinidad, fechas y materiales faltantes.",
    roleLabel: "Artista",
    outcome: "Entiende qué oportunidad vale la pena preparar primero.",
    previewSteps: ["Señales del perfil", "Oportunidades", "Afinidad, urgencia y materiales faltantes"],
  },
  "create-open-call": {
    title: "Configura una convocatoria institucional",
    summary: "Inicia el espacio institucional y prepara una convocatoria estructurada.",
    roleLabel: "Institución",
    outcome: "Prepara un flujo claro para una convocatoria, beca, residencia o exposición.",
    previewSteps: ["Configuración institucional", "Programas y convocatorias", "Elegibilidad, fechas y materiales"],
  },
  "invite-reviewers-resolve-materials": {
    title: "Coordina revisores y materiales faltantes",
    summary: "Sigue cómo una institución revisa asignaciones, materiales incompletos y seguimiento.",
    roleLabel: "Institución",
    outcome: "Mantén la coordinación de revisores y solicitudes de materiales cerca del registro de revisión.",
    previewSteps: ["Programas activos", "Comité", "Cola de revisión", "Mensajes", "Registro de actividad"],
  },
  "review-and-shortlist": {
    title: "Revisa postulaciones y crea lista corta",
    summary: "Pasa de revisión a contexto, notas, lista corta e informes.",
    roleLabel: "Institución",
    outcome: "Revisa postulaciones con estructura y conserva el historial de decisión.",
    previewSteps: ["Resumen institucional", "Cola de revisión", "Contexto del postulante", "Lista corta"],
  },
}

function scenarioCopy(scenario: DemoGuideScenario, locale: KleioLocale) {
  if (locale !== "es") return scenario
  return { ...scenario, ...scenarioEs[scenario.id], timeEstimate: scenario.timeEstimate }
}

function AudiencePathCard({
  scenario,
  locale,
  eyebrow,
  title,
  description,
  buttonLabel,
  onStart,
}: {
  scenario: DemoGuideScenario
  locale: KleioLocale
  eyebrow: string
  title: string
  description: string
  buttonLabel: string
  onStart: (scenarioId: DemoGuideScenarioId) => void
}) {
  const copy = scenarioCopy(scenario, locale)

  return (
    <article className="flex h-full flex-col rounded-[1.75rem] border border-[#E7E1F7] bg-white p-6 shadow-[0_24px_70px_rgba(82,64,130,0.09)] max-sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[#A997E8]">{eyebrow}</p>
        <span className="shrink-0 rounded-full border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-1 text-[0.62rem] font-semibold text-[#5B4B8A]">
          {copy.timeEstimate}
        </span>
      </div>

      <h2 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.025em] text-[#292631]">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-[#6F6882]">{description}</p>

      <ol className="mt-6 space-y-3 border-t border-[#EEEAF8] pt-5">
        {copy.previewSteps.slice(0, 3).map((step, index) => (
          <li key={step} className="flex items-center gap-3 text-sm text-[#514B60]">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#F7F4FF] text-[0.68rem] font-bold text-[#5B4B8A]">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => onStart(scenario.id)}
        className="mt-7 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#4F4179] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/30"
      >
        {buttonLabel}
        <ArrowRight className="size-4" />
      </button>
    </article>
  )
}

function CompactScenarioButton({
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
      className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-[#E7E1F7] bg-white px-4 py-3 text-left transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
    >
      <span>
        <span className="block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-[#A997E8]">{copy.roleLabel}</span>
        <span className="mt-1 block text-sm font-semibold text-[#292631]">{copy.title}</span>
        <span className="mt-1 block text-xs leading-relaxed text-[#6F6882]">{copy.outcome}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-[#5B4B8A] transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

const artistWorkspaceLinks = [
  ["Sample Creative Passport", "/artist-dashboard/passport/"],
  ["Synthetic portfolio", "/artist-dashboard/portfolio/"],
  ["Sample opportunities", "/artist-dashboard/opportunities/"],
  ["Sample applications", "/artist-dashboard/applications/"],
] as const

const institutionWorkspaceLinks = [
  ["Demo institution dashboard", "/dashboard/"],
  ["Sample opportunities", "/programs/"],
  ["Sample submissions", "/submissions/"],
  ["Sample reviews", "/review-queue/"],
  ["Demo shortlist", "/shortlist/"],
  ["Sample reports", "/reports/"],
  ["Demo messaging", "/messages/"],
] as const

export function ScenarioPlaylistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useKleioLocale()
  const { startScenario } = useDemoGuide()

  const artistScenarios = useMemo(() => demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Artists"), [])
  const institutionScenarios = useMemo(() => demoGuideScenarios.filter((scenario) => scenario.roleGroup === "Institutions"), [])
  const artistStart = artistScenarios[0]
  const institutionStart = institutionScenarios[0]
  const additionalScenarios = [...artistScenarios.slice(1), ...institutionScenarios.slice(1)]

  function handleStartScenario(scenarioId: DemoGuideScenarioId) {
    setKleioMode("demo")
    startScenario(scenarioId)
    const firstStep = getFirstStepForScenario(scenarioId)
    if (firstStep?.route) router.push(firstStep.route)
  }

  function openDemoWorkspace(role: "artist" | "institution", route: string) {
    setKleioMode("demo")
    loginDemoUser(role)
    router.push(route)
  }

  function openRealAccount(role: "artist" | "institution") {
    clearDemoSession()
    setKleioMode("live")
    router.push(`/signup/${role}/`)
  }

  function returnToKleio() {
    clearDemoSession()
    setKleioMode("live")
    router.push("/")
  }

  useEffect(() => {
    setKleioMode("demo")
    const requestedScenario = searchParams.get("scenario")
    if (!isDemoGuideScenarioId(requestedScenario)) return
    startScenario(requestedScenario)
    const firstStep = getFirstStepForScenario(requestedScenario)
    if (firstStep?.route) router.push(firstStep.route)
  }, [router, searchParams, startScenario])

  return (
    <main className="min-h-dvh bg-[#FCFBFE] text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between gap-4">
          <KleioWordmarkLink
            href="/demo/"
            imageClassName="h-8 w-auto"
            imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
          />
          <nav className="flex items-center gap-2 text-xs font-medium text-[#6F6882]">
            <button type="button" onClick={returnToKleio} className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              {locale === "es" ? "Volver a KLEIO" : "Return to KLEIO"}
            </button>
            <button
              type="button"
              onClick={() => openRealAccount("artist")}
              className="rounded-full bg-[#5B4B8A] px-3 py-1.5 font-semibold text-white transition-opacity hover:opacity-90 max-sm:hidden"
            >
              {locale === "es" ? "Crear cuenta" : "Create account"}
            </button>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1040px] px-5 py-12 max-sm:py-9">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
              {locale === "es" ? "Demo guiado" : "Guided demo"}
            </p>
            <DemoEnvironmentBadge />
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] text-[#292631] max-md:text-3xl">
            {locale === "es" ? "Explora KLEIO desde una ruta clara" : "Explore KLEIO through one clear path"}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6F6882] max-sm:text-sm">
            {locale === "es"
              ? "Descubre cómo KLEIO ayuda a artistas a preparar postulaciones y a instituciones a organizar convocatorias, revisión y decisiones en un solo espacio."
              : "See how KLEIO helps artists prepare stronger applications and helps institutions organize calls, review, and decisions in one workspace."}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-5 max-md:grid-cols-1">
          {artistStart && (
            <AudiencePathCard
              scenario={artistStart}
              locale={locale}
              eyebrow={locale === "es" ? "Experiencia del artista" : "Artist experience"}
              title={locale === "es" ? "Empieza con el Pasaporte Creativo" : "Start with the Creative Passport"}
              description={
                locale === "es"
                  ? "Crea un perfil reutilizable, organiza materiales profesionales y entiende cómo KLEIO reduce el trabajo repetitivo de cada postulación."
                  : "Build a reusable profile, organize professional materials, and see how KLEIO reduces repetitive application work."
              }
              buttonLabel={locale === "es" ? "Entrar al demo de artista" : "Enter artist demo"}
              onStart={handleStartScenario}
            />
          )}
          {institutionStart && (
            <AudiencePathCard
              scenario={institutionStart}
              locale={locale}
              eyebrow={locale === "es" ? "Experiencia institucional" : "Institution experience"}
              title={locale === "es" ? "Empieza con una convocatoria" : "Start with an open call"}
              description={
                locale === "es"
                  ? "Organiza requisitos, fechas, materiales y estructura de revisión antes de que lleguen las postulaciones."
                  : "Organize requirements, deadlines, materials, and review structure before submissions arrive."
              }
              buttonLabel={locale === "es" ? "Entrar al demo institucional" : "Enter institution demo"}
              onStart={handleStartScenario}
            />
          )}
        </div>

        <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-[#7F7890]">
          {locale === "es"
            ? "Este demo utiliza datos sintéticos y muestra flujos previstos. No representa instituciones verificadas, artistas reales ni postulaciones en vivo."
            : "This demo uses synthetic data and shows intended workflows. It does not represent verified institutions, real artists, or live submissions."}
        </p>

        <div className="mt-10 space-y-3">
          <details className="group rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.05)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#292631] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/25">
              <span>
                {locale === "es" ? "Explorar más recorridos guiados" : "Explore more guided walkthroughs"}
                <span className="mt-1 block text-xs font-normal text-[#7F7890]">
                  {locale === "es" ? "Rutas opcionales para profundizar después de la introducción." : "Optional paths for a deeper look after the introduction."}
                </span>
              </span>
              <span className="text-lg font-normal text-[#5B4B8A] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="grid gap-3 border-t border-[#EEEAF8] p-4 md:grid-cols-2">
              {additionalScenarios.map((scenario) => (
                <CompactScenarioButton key={scenario.id} scenario={scenario} locale={locale} onStart={handleStartScenario} />
              ))}
            </div>
          </details>

          <details className="group rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.05)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#292631] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/25">
              <span>
                {locale === "es" ? "Abrir una pantalla demo específica" : "Open a specific demo workspace"}
                <span className="mt-1 block text-xs font-normal text-[#7F7890]">
                  {locale === "es" ? "Acceso directo para revisiones técnicas o demostraciones en vivo." : "Direct access for technical review or a live presentation."}
                </span>
              </span>
              <span className="text-lg font-normal text-[#5B4B8A] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="grid gap-5 border-t border-[#EEEAF8] p-5 md:grid-cols-2">
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">
                  {locale === "es" ? "Espacio del artista" : "Artist workspace"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {artistWorkspaceLinks.map(([label, route]) => (
                    <button
                      key={route}
                      type="button"
                      onClick={() => openDemoWorkspace("artist", route)}
                      className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-white"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">
                  {locale === "es" ? "Espacio institucional" : "Institution workspace"}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {institutionWorkspaceLinks.map(([label, route]) => (
                    <button
                      key={route}
                      type="button"
                      onClick={() => openDemoWorkspace("institution", route)}
                      className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-3 py-2 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-white"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </details>

          <details className="group rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_12px_34px_rgba(82,64,130,0.05)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-[#292631] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/25">
              <span>
                {locale === "es" ? "Acerca de este demo" : "About this demo"}
                <span className="mt-1 block text-xs font-normal text-[#7F7890]">
                  {locale === "es" ? "Datos, credenciales de muestra y documentación de confianza." : "Synthetic-data notes, sample credentials, and trust documentation."}
                </span>
              </span>
              <span className="text-lg font-normal text-[#5B4B8A] transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-[#EEEAF8] p-5 text-sm text-[#6F6882]">
              <p className="max-w-3xl leading-6">
                {locale === "es"
                  ? "Los botones principales no requieren credenciales. Las cuentas de muestra se mantienen únicamente para enlaces de vista previa anteriores y nunca autentican contra Supabase."
                  : "The primary demo buttons do not require credentials. Sample accounts remain only for older preview links and never authenticate against Supabase."}
              </p>
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-3">
                {["artist@kleio.demo", "institution@kleio.demo", "reviewer@kleio.demo"].map((email) => (
                  <div key={email} className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF]/65 px-3 py-2">
                    <span className="block font-semibold text-[#292631]">{email}</span>
                    <span className="mt-1 block">Password: kleio2026</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {[
                  ["Data note", "/demo/trust/"],
                  ["Reports", "/demo/reports-export-archive/"],
                  ["Roles", "/demo/roles/"],
                  ["Pilot readiness", "/demo/pilot-readiness/"],
                ].map(([label, href]) => (
                  <Link key={href} href={href} className="rounded-full border border-[#D8D0F2] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]">
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </details>
        </div>

        <section className="mt-10 flex flex-col items-start justify-between gap-4 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">
              {locale === "es" ? "Listo para usar KLEIO" : "Ready to use KLEIO"}
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">
              {locale === "es" ? "Crea una cuenta real separada del demo" : "Create a real account, separate from the demo"}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => openRealAccount("artist")} className="rounded-full bg-[#5B4B8A] px-4 py-2 text-xs font-semibold text-white">
              {locale === "es" ? "Cuenta de artista" : "Artist account"}
            </button>
            <button type="button" onClick={() => openRealAccount("institution")} className="rounded-full border border-[#D8D0F2] px-4 py-2 text-xs font-semibold text-[#5B4B8A]">
              {locale === "es" ? "Cuenta institucional" : "Institution account"}
            </button>
          </div>
        </section>
      </section>

      <KleioDemoGuide variant="workspace" />
    </main>
  )
}
