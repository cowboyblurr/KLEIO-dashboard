"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Building2, CheckCircle2, FileText, Mic2, Search, Sparkles, Upload, UsersRound } from "lucide-react"
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
const primary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#55457F] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(82,64,130,0.16)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25"
const secondary = "inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#CFC3ED] bg-white px-5 text-sm font-semibold text-[#55457F] transition-colors hover:bg-[#F8F5FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"

function OutcomeCard({ icon: Icon, title, description }: { icon: typeof Search; title: string; description: string }) {
  return (
    <article className="rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_16px_48px_rgba(82,64,130,0.05)]">
      <span className="grid size-10 place-items-center rounded-xl bg-[#F2EDFC] text-[#5B4B8A]"><Icon className="size-4" /></span>
      <h3 className="mt-4 font-serif text-xl font-semibold tracking-[-0.02em] text-[#292631]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#746E80]">{description}</p>
    </article>
  )
}

function PassportMethod({ icon: Icon, title, description }: { icon: typeof Sparkles; title: string; description: string }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-[#E7E1F7] bg-white p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#F2EDFC] text-[#5B4B8A]"><Icon className="size-4" /></span>
      <div><h3 className="font-serif text-lg font-semibold text-[#292631]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#746E80]">{description}</p></div>
    </div>
  )
}

export function LandingPage() {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const institutionRef = useRef<HTMLElement>(null)
  const institutionTrackedRef = useRef(false)

  useEffect(() => {
    void trackKleioProductEvent("landing_viewed", { surface: "landing", metadata: { viewport: window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop" } })
  }, [])

  useEffect(() => {
    const target = institutionRef.current
    if (!target) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting) || institutionTrackedRef.current) return
      institutionTrackedRef.current = true
      void trackKleioProductEvent("institution_section_viewed", { surface: "landing" })
      observer.disconnect()
    }, { threshold: 0.3 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  function openLiveRoute(path: string, eventName?: "creative_passport_selected" | "institution_signup_selected") {
    clearDemoSession()
    setKleioMode("live")
    persistDemoGuideState({ isOpen: false, isMinimized: true, dismissed: false, activeScenarioId: null, activeStepId: null, completedScenarioId: null })
    if (eventName) void trackKleioProductEvent(eventName, { surface: "landing", metadata: { role: eventName === "institution_signup_selected" ? "institution" : "artist" } })
    router.push(path)
  }

  const copy = es ? {
    heroTitle: "Descubre oportunidades para tu práctica.",
    heroItalic: "Construye un Pasaporte Creativo reutilizable.",
    heroBody: "Explora primero. Crea una cuenta cuando quieras que KLEIO guarde, personalice, organice o prepare una oportunidad contigo.",
    explore: "Explorar oportunidades",
    passport: "Crear tu Pasaporte Creativo",
    signIn: "¿Ya tienes una cuenta? Inicia sesión",
    workflowTitle: "De la oportunidad a una solicitud más preparada",
    workflowBody: "KLEIO mantiene los datos públicos abiertos y reserva el registro para las funciones que dependen de tu información y tus decisiones.",
    flexibleTitle: "Un Pasaporte, distintas formas de construirlo",
    flexibleBody: "Elige cómo quieres trabajar. Cada método actualiza la misma fuente de información, y nada se aplica o publica sin tu decisión.",
    institutionTitle: "Creado para las organizaciones detrás de las oportunidades",
    institutionBody: "Publica convocatorias, recibe solicitudes estructuradas, coordina revisores, administra listas cortas y conserva el historial de decisiones en un solo espacio.",
    institutionCta: "Crear un espacio institucional",
    institutionTools: "Explorar herramientas institucionales",
    finalTitle: "Empieza con una oportunidad real, no con otro formulario.",
    finalBody: "Busca lo que encaja. Añade tu Pasaporte solo cuando KLEIO pueda ayudarte a comprobar, guardar, reutilizar o preparar algo concreto.",
  } : {
    heroTitle: "Discover opportunities for your practice.",
    heroItalic: "Build one reusable Creative Passport.",
    heroBody: "Explore first. Create an account when you want KLEIO to save, personalize, organize, or prepare an opportunity with you.",
    explore: "Explore opportunities",
    passport: "Create your Creative Passport",
    signIn: "Already have an account? Sign in",
    workflowTitle: "From discovery to a better-prepared application",
    workflowBody: "KLEIO keeps public facts open and reserves signup for the functions that depend on your information and decisions.",
    flexibleTitle: "One Passport, several ways to build it",
    flexibleBody: "Choose how you want to work. Every method updates the same source of information, and nothing is applied or published without your decision.",
    institutionTitle: "Built for the organizations behind the opportunities",
    institutionBody: "Publish open calls, receive structured artist submissions, coordinate reviewers, manage shortlists, and preserve decision history in one workspace.",
    institutionCta: "Create an institution workspace",
    institutionTools: "Explore institution tools",
    finalTitle: "Begin with a real opportunity, not another form.",
    finalBody: "Find what fits. Add your Passport only when KLEIO can help you check, save, reuse, or prepare something specific.",
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#FAFAFA] text-[#292631]">
      <header className="sticky top-0 z-40 border-b border-[#ECE7F3] bg-[#FAFAFA]/95 backdrop-blur">
        <div className="mx-auto flex min-h-[76px] max-w-[1280px] items-center justify-between gap-5 px-5 sm:px-8">
          <KleioWordmarkLink href="/" imageClassName="h-9 w-auto" imageStyle={wordmarkStyle} priority />
          <nav className="hidden items-center gap-7 text-xs font-semibold text-[#6F6882] md:flex" aria-label={es ? "Navegación principal" : "Primary navigation"}>
            <Link href="/opportunities/" onClick={() => void trackKleioProductEvent("explore_opportunities_selected", { surface: "landing_navigation" })} className="hover:text-[#292631]">{es ? "Oportunidades" : "Opportunities"}</Link>
            <Link href="/about/" className="hover:text-[#292631]">{es ? "Acerca de" : "About"}</Link>
            <Link href="/demo/" className="hover:text-[#292631]">{es ? "Demo guiado" : "Guided demo"}</Link>
          </nav>
          <div className="flex items-center gap-3"><KleioLocaleToggle /><a href="#login" onClick={() => void trackKleioProductEvent("login_selected", { surface: "landing_navigation" })} className="inline-flex min-h-10 items-center rounded-lg border border-[#D8D0F2] px-3 text-xs font-semibold text-[#5B4B8A]">{es ? "Iniciar sesión" : "Sign in"}</a></div>
        </div>
      </header>

      <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-24 sm:pt-24">
        <div aria-hidden="true" className="absolute left-1/2 top-12 size-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(225,215,246,0.72),rgba(250,250,250,0)_68%)]" />
        <div className="relative mx-auto max-w-[1060px] text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75639E]">KLEIO · {es ? "Oportunidades y Pasaporte Creativo" : "Opportunities and Creative Passport"}</p>
          <h1 className="mx-auto mt-5 max-w-[950px] font-serif text-[clamp(2.7rem,6.5vw,5.8rem)] leading-[0.98] tracking-[-0.055em] text-[#292631]">{copy.heroTitle}<br /><em className="font-normal text-[#5E4C88]">{copy.heroItalic}</em></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-[#746E80] sm:text-lg sm:leading-8">{copy.heroBody}</p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/opportunities/" className={primary} onClick={() => void trackKleioProductEvent("explore_opportunities_selected", { surface: "landing_hero" })}>{copy.explore}<ArrowRight className="size-4" /></Link>
            <button type="button" className={secondary} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.passport}</button>
          </div>
          <a href="#login" className="mt-5 inline-flex text-sm font-semibold text-[#6F6882] underline decoration-[#CFC3ED] underline-offset-4 hover:text-[#292631]" onClick={() => void trackKleioProductEvent("login_selected", { surface: "landing_hero" })}>{copy.signIn}</a>
        </div>
      </section>

      <PublicOpportunityCarousel />

      <section className="px-5 py-20 sm:px-8 sm:py-24" aria-labelledby="artist-workflow-title">
        <div className="mx-auto max-w-[1180px]">
          <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">{es ? "Flujo del artista" : "Artist workflow"}</p><h2 id="artist-workflow-title" className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">{copy.workflowTitle}</h2><p className="mt-4 text-base leading-7 text-[#746E80]">{copy.workflowBody}</p></div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <OutcomeCard icon={Search} title={es ? "Descubrir" : "Discover"} description={es ? "Explora oportunidades actuales y sus datos públicos antes de registrarte." : "Explore current opportunities and their public facts before creating an account."} />
            <OutcomeCard icon={CheckCircle2} title={es ? "Comprender" : "Understand"} description={es ? "Revisa elegibilidad, fechas, financiación, tarifas y requisitos confirmados." : "Review eligibility, dates, funding, fees, and confirmed requirements."} />
            <OutcomeCard icon={Sparkles} title={es ? "Personalizar" : "Personalize"} description={es ? "Añade solo la información necesaria para comprobar tu encaje y preparación." : "Add only the information needed to check your fit and readiness."} />
            <OutcomeCard icon={FileText} title={es ? "Reutilizar" : "Reuse"} description={es ? "Mantén biografía, declaración, CV y respuestas en un Pasaporte controlado por ti." : "Keep biography, statement, CV, and answers in one artist-controlled Passport."} />
            <OutcomeCard icon={Upload} title={es ? "Preparar" : "Prepare"} description={es ? "Relaciona materiales existentes con requisitos reales y revisa cada propuesta." : "Match existing materials to real requirements and review every proposal."} />
            <OutcomeCard icon={CheckCircle2} title={es ? "Dar seguimiento" : "Track"} description={es ? "Guarda oportunidades, borradores y estados sin perder el contexto original." : "Save opportunities, drafts, and statuses without losing the original context."} />
          </div>
        </div>
      </section>

      <section className="border-y border-[#E9E3F3] bg-[#F7F4FB] px-5 py-20 sm:px-8 sm:py-24" aria-labelledby="passport-methods-title">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">Creative Passport</p><h2 id="passport-methods-title" className="mt-3 font-serif text-4xl tracking-[-0.04em] sm:text-5xl">{copy.flexibleTitle}</h2><p className="mt-4 text-base leading-7 text-[#746E80]">{copy.flexibleBody}</p><button type="button" className={`${primary} mt-7`} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.passport}<ArrowRight className="size-4" /></button></div>
          <div className="grid gap-4 sm:grid-cols-2"><PassportMethod icon={Sparkles} title={es ? "Configuración guiada" : "Guided setup"} description={es ? "Preguntas breves, opciones claras y pasos que puedes omitir." : "Short prompts, clear options, and steps you can skip."} /><PassportMethod icon={FileText} title={es ? "Formulario completo" : "Full form"} description={es ? "Entrada directa para artistas que prefieren ver todo a la vez." : "Direct entry for artists who prefer to see everything at once."} /><PassportMethod icon={Upload} title={es ? "Importar materiales" : "Import materials"} description={es ? "Extrae propuestas de texto y PDF; aprueba cada campo antes de guardarlo." : "Extract proposals from text and PDFs; approve each field before saving it."} /><PassportMethod icon={Mic2} title={es ? "Entrada por voz" : "Voice input"} description={es ? "Dicta respuestas narrativas cuando el navegador lo permita y edita la transcripción." : "Dictate narrative answers where supported and edit the transcript before saving."} /></div>
        </div>
      </section>

      <section ref={institutionRef} className="px-5 py-20 sm:px-8 sm:py-24" aria-labelledby="institution-title">
        <div className="relative mx-auto max-w-[1180px] overflow-hidden rounded-[2rem] border border-[#DCD3ED] bg-[#302942] px-6 py-10 text-white shadow-[0_30px_90px_rgba(39,29,64,0.18)] sm:px-10 sm:py-14 lg:px-14">
          <div aria-hidden="true" className="absolute -right-24 -top-28 size-96 rounded-full bg-[#75639E]/35 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D9D0F2]">{es ? "Para instituciones" : "For institutions"}</p><h2 id="institution-title" className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-[-0.04em] sm:text-5xl">{copy.institutionTitle}</h2><p className="mt-5 max-w-2xl text-base leading-7 text-[#DED9E7]">{copy.institutionBody}</p><div className="mt-8 flex flex-col gap-3 sm:flex-row"><button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#302942]" onClick={() => openLiveRoute("/signup/institution/", "institution_signup_selected")}>{copy.institutionCta}<ArrowRight className="size-4" /></button><Link href="/demo/" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/25 px-5 text-sm font-semibold text-white hover:bg-white/10">{copy.institutionTools}</Link></div></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"><div className="flex gap-3 rounded-xl border border-white/12 bg-white/7 p-4"><Building2 className="mt-0.5 size-5 shrink-0 text-[#D9D0F2]" /><p className="text-sm leading-6 text-[#F0EDF5]">{es ? "Publica y administra convocatorias con información estructurada." : "Publish and manage open calls with structured information."}</p></div><div className="flex gap-3 rounded-xl border border-white/12 bg-white/7 p-4"><UsersRound className="mt-0.5 size-5 shrink-0 text-[#D9D0F2]" /><p className="text-sm leading-6 text-[#F0EDF5]">{es ? "Asigna revisores, controla el progreso y compara candidatos." : "Assign reviewers, track progress, and compare applicants."}</p></div><div className="flex gap-3 rounded-xl border border-white/12 bg-white/7 p-4"><FileText className="mt-0.5 size-5 shrink-0 text-[#D9D0F2]" /><p className="text-sm leading-6 text-[#F0EDF5]">{es ? "Conserva listas cortas, decisiones e informes en un historial común." : "Preserve shortlists, decisions, and reports in one shared history."}</p></div></div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E9E3F3] bg-white px-5 py-20 text-center sm:px-8 sm:py-24">
        <div className="mx-auto max-w-3xl"><h2 className="font-serif text-4xl tracking-[-0.04em] sm:text-5xl">{copy.finalTitle}</h2><p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#746E80]">{copy.finalBody}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/opportunities/" className={primary} onClick={() => void trackKleioProductEvent("explore_opportunities_selected", { surface: "landing_final" })}>{copy.explore}<ArrowRight className="size-4" /></Link><button type="button" className={secondary} onClick={() => openLiveRoute("/signup/artist/", "creative_passport_selected")}>{copy.passport}</button></div><button type="button" onClick={() => openLiveRoute("/signup/institution/", "institution_signup_selected")} className="mt-5 text-sm font-semibold text-[#6F6882] underline decoration-[#CFC3ED] underline-offset-4">{copy.institutionCta}</button></div>
      </section>

      <section id="login" className="scroll-mt-24 px-5 py-16 sm:px-8" aria-labelledby="login-title">
        <div className="mx-auto max-w-[680px]"><div className="mb-6 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">{es ? "Usuarios existentes" : "Existing users"}</p><h2 id="login-title" className="mt-2 font-serif text-3xl tracking-[-0.03em]">{es ? "Inicia sesión en tu espacio" : "Sign in to your workspace"}</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">{es ? "Un solo inicio de sesión dirige a artistas, instituciones y colaboradores según su rol guardado." : "One role-neutral login routes artists, institutions, and collaborators according to their stored role."}</p></div><LandingLoginCard /></div>
      </section>

      <footer className="border-t border-[#E9E3F3] px-5 py-8 text-center text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-[#AAA0C1]">© 2026 KLEIO ARTHOUSE</footer>
    </main>
  )
}
