"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, UserRound } from "lucide-react"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

export function LandingPage() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"

  function openRealSignup(role: "artist" | "institution") {
    clearDemoSession()
    setKleioMode("live")
    persistDemoGuideState({
      isOpen: false,
      isMinimized: true,
      dismissed: false,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
    router.push(`/signup/${role}/`)
  }

  function openGuidedTour() {
    setKleioMode("demo")
    persistDemoGuideState({
      isOpen: false,
      isMinimized: true,
      dismissed: false,
      activeScenarioId: null,
      activeStepId: null,
      completedScenarioId: null,
    })
    router.push("/demo/")
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[oklch(0.985_0.005_287)] text-[#292631]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(169,151,232,0.17),transparent_68%)]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1120px] items-center justify-between px-5 py-5 sm:px-8">
        <KleioWordmarkLink href="/" imageClassName="h-8 w-auto" imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }} priority />
        <KleioLocaleToggle />
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-[1040px] gap-10 px-5 pb-12 pt-8 sm:px-8 lg:grid-cols-[1fr_0.82fr] lg:items-center lg:gap-16 lg:pt-16">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
            {es ? "El espacio compartido para el trabajo artístico" : "The shared workspace for artistic work"}
          </p>
          <h1 className="mt-4 max-w-2xl font-serif text-[clamp(2.5rem,5.5vw,4.6rem)] font-semibold leading-[0.96] tracking-[-0.045em] text-[#292631]">
            {es ? "Una historia artística. Un proceso de revisión claro." : "One artistic record. One clear review process."}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#6F6882]">
            {es
              ? "KLEIO ofrece a artistas un Pasaporte Creativo reutilizable y a instituciones un espacio estructurado para convocatorias, revisión y decisiones."
              : "KLEIO gives artists a reusable Creative Passport and institutions a structured workspace for calls, review, and decisions."}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => openRealSignup("artist")} className="group flex min-h-14 items-center justify-between rounded-2xl border border-[#D8D0F2] bg-white px-4 text-left shadow-[0_14px_38px_rgba(82,64,130,0.07)] transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
              <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><UserRound className="size-4" /></span><span className="text-sm font-semibold">{es ? "Crear cuenta de artista" : "Create Artist Account"}</span></span>
              <ArrowRight className="size-4 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
            </button>
            <button type="button" onClick={() => openRealSignup("institution")} className="group flex min-h-14 items-center justify-between rounded-2xl border border-[#D8D0F2] bg-white px-4 text-left shadow-[0_14px_38px_rgba(82,64,130,0.07)] transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
              <span className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><Building2 className="size-4" /></span><span className="text-sm font-semibold">{es ? "Crear cuenta institucional" : "Create Institution Account"}</span></span>
              <ArrowRight className="size-4 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <button type="button" onClick={openGuidedTour} className="mt-5 inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-[#5B4B8A] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
            {es ? "Hacer el recorrido guiado" : "Take the Guided Tour"}<ArrowRight className="size-3.5" />
          </button>
        </div>

        <LandingLoginCard />
      </section>

      <footer className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-3 border-t border-[#E7E1F7] px-5 py-5 text-xs text-[#7F7890] sm:flex-row sm:px-8">
        <p>© 2026 KLEIO ARTHOUSE</p>
        <nav aria-label={es ? "Enlaces esenciales" : "Essential links"} className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/about/" className="hover:text-[#292631]">{es ? "Acerca de" : "About"}</Link>
          <Link href="/manifesto/" className="hover:text-[#292631]">{es ? "Manifiesto" : "Manifesto"}</Link>
          <Link href="/journal/" className="hover:text-[#292631]">{es ? "Notas de campo" : "Field Notes"}</Link>
        </nav>
      </footer>
    </main>
  )
}
