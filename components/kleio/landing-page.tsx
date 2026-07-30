"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, CheckCircle2, FileText, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { PublicOpportunityCarousel } from "@/components/kleio/public-opportunity-carousel"
import { persistDemoGuideState } from "@/components/kleio/use-demo-guide"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession } from "@/lib/kleio-demo-auth"
import { setKleioMode } from "@/lib/kleio-mode"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const wordmarkStyle = { filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" } as const
const heroVideoUrl = "https://github.com/cowboyblurr/KLEIO-ASSETS/raw/refs/heads/main/Transparent%20webpagebackground.mp4"
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#55457F] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(82,64,130,0.16)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
const secondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#CFC3ED] bg-white px-5 text-sm font-semibold text-[#55457F] transition-colors hover:bg-[#F8F5FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function PathPoint({ icon: Icon, children }: { icon: typeof Search; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-sm leading-6 text-[#655F70]">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-[#F2EDFC] text-[#5B4B8A]"><Icon className="size-3.5" /></span>
      <span>{children}</span>
    </li>
  )
}

export function LandingPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const { locale } = useKleioLocale()
  const es = locale === "es"

  useEffect(() => {
    void trackKleioProductEvent("landing_viewed", {
      surface: "landing",
      metadata: { viewport: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop" },
    })
  }, [])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const syncPlayback = () => {
      const video = videoRef.current
      if (!video) return
      if (media.matches) video.pause()
      else void video.play().catch(() => undefined)
    }
    syncPlayback()
    media.addEventListener("change", syncPlayback)
    return () => media.removeEventListener("change", syncPlayback)
  }, [])

  function openLiveRoute(path: string, eventName?: "creative_passport_selected" | "institution_signup_selected") {
    clearDemoSession()
    setKleioMode("live")
    persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: false, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
    if (eventName) {
      void trackKleioProductEvent(eventName, {
        surface: "landing",
        metadata: { role: eventName === "institution_signup_selected" ? "institution" : "artist" },
      })
    }
    router.push(path)
  }

  const copy = es ? {
    eyebrow: "Infraestructura para artistas e instituciones",
    title: "Menos administración. Más claridad para crear, solicitar y decidir.",
    body: "KLEIO conecta un Pasaporte Creativo reutilizable con oportunidades verificadas y flujos institucionales de revisión estructurada.",
    preview: "Ver oportunidades",
    artistCta: "Crear cuenta de artista",
    institutionCta: "Crear espacio institucional",
    signIn: "Iniciar sesión",
    visualLabel: "Una infraestructura compartida",
    visualTitle: "El trabajo creativo y la revisión institucional, en un mismo sistema.",
    artistTitle: "Para artistas",
    artistBody: "Mantén tus materiales organizados y reutilizables sin entregar el control de tu práctica.",
    institutionTitle: "Para instituciones",
    institutionBody: "Reemplaza cadenas de correo, PDFs y hojas dispersas con un proceso de revisión claro.",
    truth: "KLEIO prepara y organiza. Nada se envía, publica o decide automáticamente.",
    finalTitle: "Entra por el camino que corresponde a tu trabajo.",
  } : {
    eyebrow: "Infrastructure for artists and institutions",
    title: "Less administration. More clarity to create, apply, and decide.",
    body: "KLEIO connects one reusable Creative Passport with sourced opportunities and structured institutional review workflows.",
    preview: "Preview opportunities",
    artistCta: "Create artist account",
    institutionCta: "Create institution workspace",
    signIn: "Sign in",
    visualLabel: "One shared infrastructure",
    visualTitle: "Creative work and institutional review, held in one coherent system.",
    artistTitle: "For artists",
    artistBody: "Keep your materials organized and reusable without giving up control of your practice.",
    institutionTitle: "For institutions",
    institutionBody: "Replace scattered email, PDFs, and spreadsheets with a clear review process.",
    truth: "KLEIO prepares and organizes. Nothing is submitted, published, or decided automatically.",
    finalTitle: "Enter through the path that matches your work.",
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-white text-[#292631]">
      <header className="sticky top-0 z-50 border-b border-[#EEEAF4] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[72px] max-w-[1280px] items-center justify-between gap-4 px-5 sm:px-8">
          <KleioWordmarkLink href="/" imageClassName="h-9 w-auto" imageStyle={wordmarkStyle} priority />
          <nav className="hidden items-center gap-7 text-xs font-semibold text-[#6F6882] md:flex" aria-label={es ? "Navegación principal" : "Primary navigation"}>
            <a href="#opportunity-preview" className="hover:text-[#292631]">{es ? "Oportunidades" : "Opportunities"}</a>
            <a href="#artists" className="hover:text-[#292631]">{es ? "Artistas" : "Artists"}</a>
            <a href="#institutions" className="hover:text-[#292631]">{es ? "Instituciones" : "Institutions"}</a>
            <Link href="/about/" className="hover:text-[#292631]">{es ? "Acerca de" : "About"}</Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <KleioLocaleToggle />
            <a href="#login" onClick={() => void trackKleioProductEvent("login_selected", { surface: "landing_navigation" })} className="inline-flex min-h-10 items-center rounded-lg border border-[#D8D0F2] px-3 text-xs font-semibold text-[#5B4B8A]">{copy.signIn}</a>
            <button type="button" onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")} className="hidden min-h-10 items-center rounded-lg bg-[#55457F] px-4 text-xs font-semibold text-white sm:inline-flex">{es ? "Crear cuenta" : "Create account"}</button>
          </div>
        </div>
      </header>

      <section className="relative bg-white px-5 pb-12 pt-14 sm:px-8 sm:pb-16 sm:pt-20">
        <div aria-hidden="true" className="absolute left-[12%] top-12 size-[420px] rounded-full bg-[radial-gradient(circle,rgba(229,221,247,0.55),rgba(255,255,255,0)_70%)]" />
        <div className="relative mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75639E]">KLEIO · {copy.eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-serif text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.98] tracking-[-0.055em] text-[#292631]">{copy.title}</h1>
            <p className="mt-7 max-w-2xl text-base leading-7 text-[#746E80] sm:text-lg sm:leading-8">{copy.body}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href="#opportunity-preview" className={primary} onClick={() => void trackKleioProductEvent("explore_opportunities_selected", { surface: "landing_hero" })}>{copy.preview}<ArrowRight className="size-4" /></a>
              <button type="button" className={secondary} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.artistCta}</button>
              <button type="button" className="inline-flex min-h-12 items-center justify-center px-3 text-sm font-semibold text-[#6F6882] underline decoration-[#CFC3ED] underline-offset-4" onClick={() => openLiveRoute("/signup/institution/", "institution_signup_selected")}>{copy.institutionCta}</button>
            </div>
            <div className="mt-7 flex max-w-2xl items-start gap-3 border-t border-[#EEEAF4] pt-5 text-sm leading-6 text-[#6F6882]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#75639E]" />
              <p>{copy.truth}</p>
            </div>
          </div>

          <div className="relative">
            <div aria-hidden="true" className="absolute -inset-6 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(225,215,246,0.42),transparent_66%)]" />
            <div className="relative">
              <p className="mb-3 text-center text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#8A7AA7]">{es ? "Acceso para miembros" : "Member access"}</p>
              <LandingLoginCard />
            </div>
          </div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-white px-0 pb-10 sm:pb-16" aria-labelledby="landing-visual-title">
        <div className="mx-auto max-w-[1180px] px-5 text-center sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">{copy.visualLabel}</p>
          <h2 id="landing-visual-title" className="mx-auto mt-3 max-w-3xl font-serif text-3xl tracking-[-0.04em] sm:text-4xl">{copy.visualTitle}</h2>
        </div>
        <div className="relative mx-auto mt-4 max-w-[1440px] overflow-hidden bg-white">
          <video ref={videoRef} autoPlay loop muted playsInline preload="metadata" aria-hidden="true" className="block max-h-[620px] w-full bg-white object-contain [mask-image:linear-gradient(to_bottom,transparent_0%,black_9%,black_91%,transparent_100%)] motion-reduce:hidden">
            <source src={heroVideoUrl} type="video/mp4" />
          </video>
          <div className="mx-auto hidden min-h-64 max-w-[980px] place-items-center bg-[radial-gradient(circle,rgba(229,221,247,0.46),rgba(255,255,255,0)_70%)] px-6 text-center motion-reduce:grid">
            <p className="max-w-xl font-serif text-2xl text-[#554D61]">{es ? "Una vista tranquila de KLEIO conecta el Pasaporte Creativo, las oportunidades y la revisión institucional." : "A calm view of KLEIO connecting the Creative Passport, opportunities, and institutional review."}</p>
          </div>
        </div>
      </section>

      <PublicOpportunityCarousel />

      <section className="bg-white px-5 py-20 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-[1180px] gap-5 lg:grid-cols-2">
          <article id="artists" className="scroll-mt-24 rounded-[2rem] border border-[#E7E1F7] bg-[#FCFBFE] p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">Creative Passport</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em]">{copy.artistTitle}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#746E80]">{copy.artistBody}</p>
            <ul className="mt-7 space-y-4">
              <PathPoint icon={FileText}>{es ? "Reutiliza biografía, declaración, CV, portafolio y documentos aprobados." : "Reuse your biography, statement, CV, portfolio, and approved documents."}</PathPoint>
              <PathPoint icon={Search}>{es ? "Descubre oportunidades y revisa tu preparación con información de origen." : "Discover opportunities and review readiness against sourced information."}</PathPoint>
              <PathPoint icon={Sparkles}>{es ? "Recibe ayuda para preparar borradores; tú revisas cada decisión." : "Receive preparation help while retaining review over every decision."}</PathPoint>
            </ul>
            <button type="button" className={`${primary} mt-8`} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.artistCta}<ArrowRight className="size-4" /></button>
          </article>

          <article id="institutions" className="scroll-mt-24 rounded-[2rem] bg-[#302942] p-7 text-white shadow-[0_26px_70px_rgba(39,29,64,0.16)] sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#D9D0F2]">Institution workspace</p>
            <h2 className="mt-3 font-serif text-4xl tracking-[-0.04em]">{copy.institutionTitle}</h2>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#DED9E7]">{copy.institutionBody}</p>
            <ul className="mt-7 space-y-4">
              <PathPoint icon={Building2}>{es ? "Crea convocatorias y recibe solicitudes estructuradas." : "Create open calls and receive structured submissions."}</PathPoint>
              <PathPoint icon={UsersRound}>{es ? "Asigna revisores, controla el progreso y administra listas cortas." : "Assign reviewers, track progress, and manage shortlists."}</PathPoint>
              <PathPoint icon={CheckCircle2}>{es ? "Conserva decisiones, informes e historial del programa." : "Preserve decisions, reports, and program history."}</PathPoint>
            </ul>
            <button type="button" className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#302942]" onClick={() => openLiveRoute("/signup/institution/", "institution_signup_selected")}>{copy.institutionCta}<ArrowRight className="size-4" /></button>
          </article>
        </div>
      </section>

      <section className="border-y border-[#EEEAF4] bg-[#FAF8FD] px-5 py-16 text-center sm:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">{copy.finalTitle}</h2>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" className={primary} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.artistCta}</button>
            <button type="button" className={secondary} onClick={() => openLiveRoute("/signup/institution/", "institution_signup_selected")}>{copy.institutionCta}</button>
          </div>
          <a href="#login" className="mt-5 inline-flex text-sm font-semibold text-[#6F6882] underline decoration-[#CFC3ED] underline-offset-4">{es ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</a>
        </div>
      </section>

      <footer className="border-t border-[#EEEAF4] bg-white px-5 py-8 text-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#AAA0C1]">© 2026 KLEIO ARTHOUSE</footer>
    </main>
  )
}
