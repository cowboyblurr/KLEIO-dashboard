"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, ChevronRight } from "lucide-react"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { useDemoGuide } from "@/components/kleio/use-demo-guide"
import {
  demoGuideFilters,
  demoGuideScenarios,
  getFirstStepForScenario,
  isDemoGuideScenarioId,
  type DemoGuideFilter,
  type DemoGuideScenario,
  type DemoGuideScenarioId,
} from "@/lib/kleio-demo-guide"

function ScenarioCard({
  scenario,
  onStart,
}: {
  scenario: DemoGuideScenario
  onStart: (scenarioId: DemoGuideScenarioId) => void
}) {
  return (
    <article className="flex h-full flex-col rounded-[1.35rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#A997E8]">
            {scenario.roleLabel}
          </p>
          <h2 className="mt-1 font-serif text-lg font-semibold tracking-[-0.02em] text-[#292631]">
            {scenario.title}
          </h2>
        </div>
        <span className="shrink-0 rounded-full border border-[#E7E1F7] bg-[#F7F4FF] px-2.5 py-1 text-[0.62rem] font-semibold text-[#5B4B8A]">
          {scenario.timeEstimate}
        </span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{scenario.outcome}</p>

      <div className="mt-4 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]/70 p-3">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
          Walkthrough path
        </p>
        <ul className="mt-2 space-y-1.5">
          {scenario.previewSteps.map((step) => (
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
        Start here
        <ArrowRight className="size-3.5" />
      </button>
    </article>
  )
}

function ScenarioGroup({
  title,
  description,
  scenarios,
  onStart,
}: {
  title: string
  description: string
  scenarios: DemoGuideScenario[]
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
          <ScenarioCard key={scenario.id} scenario={scenario} onStart={onStart} />
        ))}
      </div>
    </section>
  )
}

export function ScenarioPlaylistPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
              Home
            </Link>
            <Link href="/signup/artist/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              Artist start
            </Link>
            <Link href="/signup/institution/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">
              Institution start
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-10">
        <div className="max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
            Guided demo playlist
          </p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292631] max-md:text-3xl">
            Choose one KLEIO walkthrough
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
            Start with one of four core paths. Each walkthrough opens the correct first page for
            that task and keeps the guide available as you move through the demo.
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
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-5">
          {artistScenarios.length > 0 && (
            <ScenarioGroup
              title="For artists"
              description="Start with the artist profile, then move into grant and open-call discovery."
              scenarios={artistScenarios}
              onStart={handleStartScenario}
            />
          )}

          {institutionScenarios.length > 0 && (
            <ScenarioGroup
              title="For institutions"
              description="Start with workspace setup, then move into open-call creation and review decisions."
              scenarios={institutionScenarios}
              onStart={handleStartScenario}
            />
          )}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <div className="grid gap-4 md:grid-cols-[1.25fr_1fr_1fr]">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#A997E8]">
                Best first demo paths
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#292631]">
                Use these when showing KLEIO quickly.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">
                These two paths communicate the platform fastest: artists create a reusable
                Passport, and institutions prepare a structured open call.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleStartScenario("artist-passport-setup")}
              className="group rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-left transition-colors hover:bg-[#F7F4FF]/70"
            >
              <p className="text-xs font-semibold text-[#5B4B8A]">Artist</p>
              <p className="mt-1 font-serif text-base font-semibold text-[#292631]">
                Create Artist Passport
              </p>
              <p className="mt-2 flex items-center text-xs font-semibold text-[#A997E8]">
                Start on signup
                <ChevronRight className="ml-1 size-3 transition-transform group-hover:translate-x-0.5" />
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleStartScenario("create-open-call")}
              className="group rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-left transition-colors hover:bg-[#F7F4FF]/70"
            >
              <p className="text-xs font-semibold text-[#5B4B8A]">Institution</p>
              <p className="mt-1 font-serif text-base font-semibold text-[#292631]">
                Prepare Open Call
              </p>
              <p className="mt-2 flex items-center text-xs font-semibold text-[#A997E8]">
                Start on signup
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
