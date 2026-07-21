"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight } from "lucide-react"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { assetPath } from "@/lib/asset-path"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"

function ArtistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function InstitutionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M4 24h20M14 4l10 6H4L14 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="7" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12.5" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="18" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

const navLinkStyle = { color: "#6F6882", letterSpacing: "0.04em" } as const
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

  const navLinks = [
    { label: es ? "Acerca de" : "About", href: "/about/" },
    { label: es ? "Manifiesto" : "Manifesto", href: "/manifesto/" },
    { label: es ? "Notas de campo" : "Field Notes", href: "/journal/" },
  ] as const

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-white text-[#292631]">
      <header className="relative z-30 h-[96px] w-full">
        <div className="relative mx-auto h-full w-full max-w-[1280px] px-8 max-md:px-5">
          <nav className="absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-8 max-md:left-5 max-md:hidden" aria-label={es ? "Navegación principal" : "Primary navigation"}>
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="text-[0.78rem] font-medium tracking-wide hover:opacity-70" style={navLinkStyle}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="absolute left-1/2 top-[62px] -translate-x-1/2 -translate-y-1/2">
            <KleioWordmarkLink
              href="/"
              imageClassName="h-[clamp(2rem,2.75vw,3rem)] w-auto"
              imageStyle={wordmarkStyle}
              priority
            />
          </div>

          <div className="absolute right-8 top-1/2 -translate-y-1/2 max-md:right-5">
            <KleioLocaleToggle />
          </div>
        </div>
      </header>

      <section
        className="landing-stage relative z-10 mx-auto grid w-full max-w-[1280px] px-8 pb-16 pt-2 max-md:px-5"
        style={{ gridTemplateRows: "auto auto auto auto", rowGap: "clamp(12px, 2vh, 20px)" }}
      >
        <div className="flex h-full flex-col items-center justify-start text-center">
          <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">
            {es ? "Para artistas e instituciones" : "For artists and institutions"}
          </p>
          <h1
            className="mt-2 max-w-[760px] font-serif font-semibold tracking-[-0.035em]"
            style={{ color: "#292631", fontSize: "clamp(1.8rem, 2.65vw, 2.8rem)", lineHeight: 1.02 }}
          >
            {es ? "Postulaciones de artistas y revisión institucional, reunidas." : "Artist applications and institutional review, brought together."}
          </h1>
        </div>

        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-center gap-2 rounded-full border border-[#E7E1F7] bg-white/85 px-4 py-2 text-center shadow-[0_12px_34px_rgba(82,64,130,0.06)] backdrop-blur-sm">
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">
            {es ? "Qué es" : "What it is"}
          </span>
          <span className="text-[0.72rem] leading-relaxed text-[#6F6882]">
            {es
              ? "Los artistas mantienen su obra una sola vez y la reutilizan en distintas oportunidades. Las instituciones gestionan postulaciones, comités, evaluaciones y decisiones en un flujo estructurado."
              : "Artists maintain their work once and reuse it across opportunities. Institutions manage submissions, committees, evaluations, and decisions in one structured workflow."}
          </span>
        </div>

        <div className="flex h-full items-center justify-center" aria-hidden>
          <video
            className="kleio-transparent-center-video h-auto max-h-[170px] w-[clamp(300px,26vw,430px)] object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          >
            <source src={assetPath("/landing/kleio-transparent-center-video.mp4")} type="video/mp4" />
          </video>
        </div>

        <div className="landing-card-grid mx-auto grid w-full max-w-[1040px] grid-cols-[minmax(320px,0.88fr)_24px_minmax(320px,0.78fr)] items-start gap-4 max-lg:max-w-[560px] max-lg:grid-cols-1 max-lg:gap-4">
          <LandingLoginCard />

          <div className="landing-or-divider flex items-center justify-center max-lg:hidden" aria-hidden>
            <div className="flex flex-col items-center justify-center">
              <div className="h-6 w-px bg-[#D8D0F2]" />
              <span className="my-1.5 font-serif text-[0.8rem] italic text-[#7F7890]">{es ? "o" : "or"}</span>
              <div className="h-6 w-px bg-[#D8D0F2]" />
            </div>
          </div>

          <section className="landing-choice-card flex flex-col rounded-[1.1rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_18px_48px_rgba(82,64,130,0.08)]" aria-labelledby="create-account-title">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[#A997E8]">
              {es ? "Crear una cuenta" : "Create an account"}
            </p>
            <h2 id="create-account-title" className="mt-1 font-serif text-[1.05rem] font-semibold tracking-[-0.01em] text-[#292631]">
              {es ? "Elige cómo usarás KLEIO" : "Choose how you’ll use KLEIO"}
            </h2>
            <p className="mt-1 text-[0.7rem] leading-relaxed text-[#7F7890]">
              {es ? "Comienza con el tipo de cuenta que corresponde a tu función." : "Start with the account type that matches your role."}
            </p>

            <div className="mt-4 grid gap-3">
              <button
                type="button"
                onClick={() => openRealSignup("artist")}
                className="group flex min-h-[88px] items-center gap-3 rounded-[0.9rem] border border-[#D8D0F2] bg-white p-3 text-left transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F7F4FF] text-[#5B4B8A]">
                  <ArtistIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 font-serif text-[0.86rem] font-semibold text-[#292631]">
                    {es ? "Crear cuenta de artista" : "Create Artist Account"}
                    <ChevronRight className="size-3.5 shrink-0 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-[0.66rem] leading-relaxed text-[#7F7890]">
                    {es ? "Crea un Pasaporte Creativo reutilizable para tu obra y tus postulaciones." : "Build a reusable Creative Passport for your work and applications."}
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => openRealSignup("institution")}
                className="group flex min-h-[88px] items-center gap-3 rounded-[0.9rem] border border-[#D8D0F2] bg-white p-3 text-left transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#F7F4FF] text-[#5B4B8A]">
                  <InstitutionIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3 font-serif text-[0.86rem] font-semibold text-[#292631]">
                    {es ? "Crear cuenta institucional" : "Create Institution Account"}
                    <ChevronRight className="size-3.5 shrink-0 text-[#A997E8] transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-1 block text-[0.66rem] leading-relaxed text-[#7F7890]">
                    {es ? "Organiza convocatorias, postulaciones, comités, evaluaciones y decisiones." : "Organize open calls, submissions, committees, evaluations, and decisions."}
                  </span>
                </span>
              </button>
            </div>
          </section>
        </div>
      </section>

      <footer className="relative z-30 px-5 pb-4 pt-2 text-center text-[8px] tracking-[0.15em] text-[#B2A9C9]">
        © 2026 KLEIO ARTHOUSE
      </footer>
    </main>
  )
}
