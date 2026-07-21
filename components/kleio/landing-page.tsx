"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2, ChevronRight, UserRound } from "lucide-react"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { assetPath } from "@/lib/asset-path"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

const wordmarkStyle = { filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" } as const

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

  const footerLinks = [
    { label: es ? "Acerca de" : "About", href: "/about/" },
    { label: es ? "Manifiesto" : "Manifesto", href: "/manifesto/" },
    { label: es ? "Notas de campo" : "Field Notes", href: "/journal/" },
  ] as const

  return (
    <main className="flex min-h-dvh w-full flex-col overflow-x-hidden bg-[radial-gradient(circle_at_50%_28%,#FBF9FF_0%,#FFFFFF_55%)] text-[#292631]">
      <header className="relative z-20 border-b border-[#F0ECF8] bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-24 w-full max-w-[1120px] items-center justify-between px-6 max-sm:h-20 max-sm:px-5">
          <KleioWordmarkLink href="/" imageClassName="h-10 w-auto max-sm:h-8" imageStyle={wordmarkStyle} priority />
          <KleioLocaleToggle />
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center px-6 py-12 max-sm:px-5 max-sm:py-9">
        <div className="mx-auto max-w-[800px] text-center">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
            {es ? "Para artistas e instituciones" : "For artists and institutions"}
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.25rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-[#292631]">
            {es ? "Postulaciones de artistas y revisión institucional, reunidas." : "Artist applications and institutional review, brought together."}
          </h1>
          <p className="mx-auto mt-5 max-w-[720px] text-[clamp(0.94rem,1.5vw,1.08rem)] leading-7 text-[#6F6882]">
            {es
              ? "Los artistas pueden mantener su obra una sola vez y reutilizarla en distintas oportunidades. Las instituciones pueden gestionar postulaciones, comités, evaluaciones y decisiones sin formularios, archivos y correos dispersos."
              : "Artists can maintain their work once and reuse it across opportunities. Institutions can manage submissions, committees, evaluations, and decisions without fragmented forms, files, and email."}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center" aria-hidden>
          <video
            className="kleio-transparent-center-video h-auto max-h-[190px] w-[clamp(320px,34vw,470px)] object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={assetPath("/landing/kleio-transparent-center-video.mp4")} type="video/mp4" />
          </video>
        </div>

        <div className="mx-auto mt-6 grid w-full max-w-[960px] grid-cols-2 items-start gap-5 max-md:max-w-[560px] max-md:grid-cols-1">
          <LandingLoginCard />

          <section className="rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF]/65 p-6 shadow-[0_24px_64px_rgba(82,64,130,0.09)] max-sm:p-5" aria-labelledby="create-account-title">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.17em] text-[#A997E8]">
              {es ? "Crear una cuenta" : "Create an account"}
            </p>
            <h2 id="create-account-title" className="mt-2 font-serif text-2xl font-semibold tracking-[-0.025em] text-[#292631]">
              {es ? "Elige cómo usarás KLEIO" : "Choose how you’ll use KLEIO"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">
              {es ? "Comienza con el tipo de cuenta que corresponde a tu función." : "Start with the account type that matches your role."}
            </p>

            <div className="mt-5 grid gap-3">
              <button type="button" onClick={() => openRealSignup("artist")} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#D8D0F2] bg-white p-4 text-left transition-colors hover:border-[#A997E8] hover:bg-[#FCFBFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><UserRound className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 font-serif text-base font-semibold text-[#292631]">
                    {es ? "Crear cuenta de artista" : "Create Artist Account"}
                    <ChevronRight className="size-4 shrink-0 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#7F7890]">
                    {es ? "Crea un Pasaporte Creativo reutilizable para tu obra y tus postulaciones." : "Build a reusable Creative Passport for your work and applications."}
                  </span>
                </span>
              </button>

              <button type="button" onClick={() => openRealSignup("institution")} className="group flex min-h-[104px] items-center gap-4 rounded-2xl border border-[#D8D0F2] bg-white p-4 text-left transition-colors hover:border-[#A997E8] hover:bg-[#FCFBFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#F7F4FF] text-[#5B4B8A]"><Building2 className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 font-serif text-base font-semibold text-[#292631]">
                    {es ? "Crear cuenta institucional" : "Create Institution Account"}
                    <ChevronRight className="size-4 shrink-0 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[#7F7890]">
                    {es ? "Organiza convocatorias, postulaciones, comités, evaluaciones y decisiones." : "Organize open calls, submissions, committees, evaluations, and decisions."}
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </section>

      <footer className="border-t border-[#F0ECF8] bg-white/85 px-5 py-5">
        <div className="mx-auto flex w-full max-w-[1120px] flex-wrap items-center justify-between gap-3 text-[0.68rem] text-[#8A829B] max-sm:justify-center">
          <p>© 2026 KLEIO ARTHOUSE</p>
          <nav aria-label={es ? "Enlaces esenciales" : "Essential links"} className="flex items-center gap-5">
            {footerLinks.map(({ label, href }) => <Link key={href} href={href} className="font-medium transition-colors hover:text-[#5B4B8A]">{label}</Link>)}
          </nav>
        </div>
      </footer>
    </main>
  )
}
