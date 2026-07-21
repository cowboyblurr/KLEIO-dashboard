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
  const { t, locale } = useKleioLocale()
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
    { label: t("nav.about"), href: "/about/" },
    { label: t("nav.manifesto"), href: "/manifesto/" },
    { label: es ? "Notas de campo" : "Journal", href: "/journal/" },
  ] as const

  return (
    <main
      className="relative min-h-dvh w-full overflow-x-hidden text-[#292631]"
      style={{
        background:
          "radial-gradient(ellipse at 50% 67%, rgba(149,130,194,0.105) 0%, rgba(188,173,222,0.052) 31%, rgba(255,255,255,0) 62%), #FFFFFF",
      }}
    >
      <header className="relative z-30 h-[96px] w-full">
        <div className="relative mx-auto h-full w-full max-w-[1280px] px-8 max-md:px-5">
          <nav
            className="absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-8 max-md:left-5 max-md:hidden"
            aria-label={es ? "Navegación principal" : "Primary navigation"}
          >
            {navLinks.map(({ label, href }) => (
              <Link key={href} href={href} className="text-[0.78rem] font-medium tracking-wide transition-opacity hover:opacity-70" style={navLinkStyle}>
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
        style={{ gridTemplateRows: "auto auto auto auto auto", rowGap: "clamp(12px, 2vh, 20px)" }}
      >
        <div className="flex h-full flex-col items-center justify-start text-center">
          <h1
            className="font-serif tracking-tight"
            style={{ color: "#292631", fontSize: "clamp(1.45rem, 1.95vw, 2.05rem)", lineHeight: 0.98 }}
          >
            {t("landing.hero.line1")}
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>{t("landing.hero.line2Italic")}</em>
          </h1>
          <p
            className="mx-auto mt-2.5 max-w-[520px]"
            style={{ color: "#7F7890", fontSize: "clamp(0.5rem, 0.62vw, 0.6rem)", letterSpacing: "0.20em", textTransform: "uppercase", lineHeight: 1.42 }}
          >
            {t("landing.tagline.line1")}
            <br />
            {t("landing.tagline.line2")}
            <br />
            {t("landing.tagline.line3")}
          </p>
        </div>

        <div className="flex h-full items-center justify-center bg-white" aria-hidden>
          <video
            className="kleio-transparent-center-video h-auto max-h-[170px] w-[clamp(300px,26vw,430px)] object-contain"
            style={{ filter: "saturate(0.82) contrast(0.96) hue-rotate(3deg)" }}
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
              <span className="my-1.5 font-serif text-[0.8rem] italic text-[#7F7890]">{t("nav.or")}</span>
              <div className="h-6 w-px bg-[#D8D0F2]" />
            </div>
          </div>

          <section
            className="landing-choice-card flex flex-col rounded-[1.1rem] border border-[#E2DAF2] bg-[radial-gradient(circle_at_88%_0%,rgba(226,217,248,0.28),transparent_45%),linear-gradient(145deg,rgba(255,255,255,0.98)_0%,rgba(252,250,255,0.98)_60%,rgba(249,246,253,0.98)_100%)] p-4 shadow-[0_18px_48px_rgba(82,64,130,0.09)]"
            aria-labelledby="choose-path-title"
          >
            <h2 id="choose-path-title" className="font-serif text-[0.98rem] font-semibold tracking-[-0.01em] text-[#292631]">
              {t("landing.choosePath.title")}
            </h2>
            <p className="mt-1 text-[0.68rem] leading-relaxed text-[#7F7890]">{t("landing.choosePath.subtitle")}</p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => openRealSignup("artist")}
                className="group flex h-[82px] flex-col justify-between rounded-[0.85rem] border border-[#D8D0F2] bg-white/80 p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:-translate-y-px hover:border-[#A997E8] hover:bg-[#F8F5FF] hover:shadow-[0_8px_20px_rgba(82,64,130,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
              >
                <span className="grid size-6 place-items-center rounded-md bg-[#F2EDFC] text-[#5B4B8A]"><ArtistIcon /></span>
                <span>
                  <span className="block text-[0.62rem] text-[#7F7890]">{t("landing.choosePath.iAmArtist")}</span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold text-[#292631]">
                    {t("landing.choosePath.passport")}
                    <ChevronRight className="size-3 text-[#927DCE] transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => openRealSignup("institution")}
                className="group flex h-[82px] flex-col justify-between rounded-[0.85rem] border border-[#D8D0F2] bg-white/80 p-2.5 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-all hover:-translate-y-px hover:border-[#A997E8] hover:bg-[#F8F5FF] hover:shadow-[0_8px_20px_rgba(82,64,130,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
              >
                <span className="grid size-6 place-items-center rounded-md bg-[#F2EDFC] text-[#5B4B8A]"><InstitutionIcon /></span>
                <span>
                  <span className="block text-[0.62rem] text-[#7F7890]">{t("landing.choosePath.iRepresentInstitution")}</span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold text-[#292631]">
                    {t("landing.choosePath.workspace")}
                    <ChevronRight className="size-3 text-[#927DCE] transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            </div>

            <p className="mt-3 text-center font-serif text-[0.64rem] italic leading-relaxed text-[#837A94]">
              {t("landing.importAssist.note")}
            </p>
          </section>
        </div>

        <div className="flex items-center justify-center">
          <Link
            href="/demo/"
            className="group inline-flex items-center gap-1.5 rounded-full border border-[#DED5F1] bg-white/82 px-4 py-2 text-[0.68rem] font-semibold tracking-[0.02em] text-[#5B4B8A] shadow-[0_10px_28px_rgba(82,64,130,0.06)] transition-all hover:-translate-y-px hover:border-[#A997E8] hover:bg-[#F8F5FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"
          >
            {es ? "Recorrer el demo guiado" : "Take the Guided Tour"}
            <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>

        <div className="landing-quote flex flex-col items-center justify-center text-center font-serif text-[10px] italic leading-tight text-[#7F7890]">
          &ldquo;{t("landing.quote.line1")}
          <br />
          {t("landing.quote.line2")}&rdquo;
          <div className="mx-auto mt-1 h-[2px] w-9 rounded-full bg-[#927DCE]" />
        </div>
      </section>

      <footer className="pointer-events-none relative z-30 px-5 pb-4 pt-2 text-center text-[8px] tracking-[0.15em] text-[#AAA0C1]">
        © 2026 KLEIO ARTHOUSE
      </footer>
    </main>
  )
}
