"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

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
const inkColor = "#292631"
const mutedColor = "#7F7890"
const cardBg = "#FFFFFF"
const lavenderLine = "#D8D0F2"
const lavenderSoftLine = "#E7E1F7"
const lavenderMist = "#F7F4FF"
const lavenderAccent = "#A997E8"
const lavenderDeep = "#5B4B8A"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

export function LandingPage() {
  const { t, locale } = useKleioLocale()
  const isSpanish = locale === "es"

  const navLinks = [
    { label: t("nav.about"), href: "/about/" },
    { label: t("nav.manifesto"), href: "/manifesto/" },
    { label: isSpanish ? "Notas de campo" : "Field Notes", href: "/journal/" },
  ] as const

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-white text-[#292631]">
      <header className="relative z-30 h-[96px] w-full">
        <div className="relative mx-auto h-full w-full max-w-[1280px] px-8 max-md:px-5">
          <nav className="absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-8 max-md:left-5 max-md:gap-4">
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
              imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
              priority
            />
          </div>

          <nav className="absolute right-8 top-1/2 flex -translate-y-1/2 items-center gap-7 max-md:right-5 max-md:gap-4">
            <Link href="/demo/" className="text-[0.78rem] font-medium tracking-wide hover:opacity-70 max-md:hidden" style={navLinkStyle}>
              {isSpanish ? "Demo guiado" : "Guided Demo"}
            </Link>
            <KleioLocaleToggle />
          </nav>
        </div>
      </header>

      <section
        className="landing-stage relative z-10 mx-auto grid w-full max-w-[1280px] px-8 pb-16 pt-2 max-md:px-5"
        style={{ gridTemplateRows: "auto auto auto auto", rowGap: "clamp(12px, 2vh, 20px)" }}
      >
        <div className="flex h-full flex-col items-center justify-start text-center">
          <h1 className="font-serif tracking-tight" style={{ color: inkColor, fontSize: "clamp(1.45rem, 1.95vw, 2.05rem)", lineHeight: 0.98 }}>
            {t("landing.hero.line1")}
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>{t("landing.hero.line2Italic")}</em>
          </h1>

          <p
            className="mx-auto mt-2.5 max-w-[520px]"
            style={{ color: mutedColor, fontSize: "clamp(0.5rem, 0.62vw, 0.6rem)", letterSpacing: "0.20em", textTransform: "uppercase", lineHeight: 1.42 }}
          >
            {t("landing.tagline.line1")}
            <br />
            {t("landing.tagline.line2")}
            <br />
            {t("landing.tagline.line3")}
          </p>
        </div>

        <div className="flex h-full items-center justify-center">
          <video className="kleio-transparent-center-video h-auto max-h-[170px] w-[clamp(300px,26vw,430px)] object-contain" autoPlay muted loop playsInline preload="metadata" aria-hidden>
            <source src={assetPath("/landing/kleio-transparent-center-video.mp4")} type="video/mp4" />
          </video>
        </div>

        <div className="landing-card-grid mx-auto grid w-full max-w-[980px] grid-cols-[minmax(0,1fr)_26px_minmax(0,1fr)] items-start gap-4 max-md:grid-cols-1 max-md:gap-4">
          <LandingLoginCard />

          <div className="landing-or-divider flex items-center justify-center max-md:hidden">
            <div className="flex flex-col items-center justify-center">
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
              <span className="my-1.5 font-serif text-[0.8rem] italic" style={{ color: mutedColor }}>{t("nav.or")}</span>
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
            </div>
          </div>

          <div className="landing-choice-card flex flex-col rounded-[1.1rem] p-3.5" style={{ backgroundColor: cardBg, border: `1px solid ${lavenderSoftLine}`, boxShadow: cardShadow }}>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: lavenderAccent }}>
              {isSpanish ? "Rutas de configuración" : "Setup paths"}
            </p>
            <h2 className="mt-1 font-serif text-[0.98rem] font-semibold" style={{ color: inkColor, letterSpacing: "-0.01em" }}>
              {t("landing.choosePath.title")}
            </h2>
            <p className="mt-0.5 text-[0.68rem] leading-relaxed" style={{ color: mutedColor }}>
              {isSpanish
                ? "Usa estas rutas si quieres ver cómo empieza el perfil de artista o el espacio institucional. Para una primera vista, usa el demo guiado."
                : "Use these paths when you want to see how artist or institution setup begins. For a first viewing, use the guided demo."}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <Link href="/signup/artist/" className="group flex h-[72px] flex-col justify-between rounded-[0.85rem] border p-2.5 transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]" style={{ borderColor: lavenderLine, backgroundColor: "#FFFFFF" }}>
                <span className="grid size-6 place-items-center rounded-md" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}><ArtistIcon /></span>
                <span>
                  <span className="block text-[0.62rem]" style={{ color: mutedColor }}>{t("landing.choosePath.iAmArtist")}</span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    {t("landing.choosePath.passport")}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" style={{ color: lavenderAccent }} />
                  </span>
                </span>
              </Link>

              <Link href="/signup/institution/" className="group flex h-[72px] flex-col justify-between rounded-[0.85rem] border p-2.5 transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]" style={{ borderColor: lavenderLine, backgroundColor: "#FFFFFF" }}>
                <span className="grid size-6 place-items-center rounded-md" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}><InstitutionIcon /></span>
                <span>
                  <span className="block text-[0.62rem]" style={{ color: mutedColor }}>{t("landing.choosePath.iRepresentInstitution")}</span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    {t("landing.choosePath.workspace")}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" style={{ color: lavenderAccent }} />
                  </span>
                </span>
              </Link>
            </div>

            <div className="landing-import-assist-strip mt-3 border-t border-[#E7E1F7] pt-3">
              <KleioAssistObjectVisual size="sm" mode="preparing" className="shrink-0 scale-[0.72]" />
              <div className="min-w-0">
                <p className="landing-import-assist-title">KLEIO Import Assist</p>
                <p className="landing-import-assist-copy">
                  {isSpanish
                    ? "Import Assist prepara borradores desde materiales existentes. La persona revisa cada detalle antes de usarlo."
                    : "Import Assist prepares draft fields from existing materials. The user reviews every detail before use."}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-quote flex flex-col items-center justify-center text-center font-serif text-[10px] italic leading-tight" style={{ color: mutedColor }}>
          &ldquo;{t("landing.quote.line1")}
          <br />
          {t("landing.quote.line2")}&rdquo;
          <div className="mx-auto mt-1 h-[2px] w-9 rounded-full" style={{ backgroundColor: lavenderAccent }} />
        </div>
      </section>

      <footer className="pointer-events-none relative z-30 px-5 pb-4 pt-2 text-center text-[8px] tracking-[0.15em]" style={{ color: "#B2A9C9" }}>
        © 2026 KLEIO ARTHOUSE
      </footer>

      <KleioDemoGuide variant="landing" />
    </main>
  )
}
