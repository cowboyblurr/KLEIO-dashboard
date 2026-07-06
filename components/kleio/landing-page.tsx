"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { KleioLocaleToggle } from "@/components/kleio/kleio-locale-toggle"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { KleioAssistObjectVisual } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

// ─── tiny icon components ────────────────────────────────────────────────────

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

// ─── main page ───────────────────────────────────────────────────────────────

export function LandingPage() {
  const { t, locale } = useKleioLocale()
  const isSpanish = locale === "es"

  const navLinks = [
    { key: "nav.about", href: "/about/" },
    { key: "nav.manifesto", href: "/manifesto/" },
    { key: "nav.journal", href: "/journal/" },
  ] as const

  return (
    <main className="relative min-h-dvh w-full overflow-x-hidden bg-white text-[#292631]">
      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="relative z-30 h-[96px] w-full">
        <div className="relative mx-auto h-full w-full max-w-[1280px] px-8 max-md:px-5">
          <nav className="absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-8 max-md:left-5 max-md:gap-4">
            {navLinks.map(({ key, href }) => (
              <Link key={key} href={href} className="text-[0.78rem] font-medium tracking-wide hover:opacity-70" style={navLinkStyle}>
                {t(key)}
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
            <ExploreArthouseLink className="text-[0.78rem] font-medium tracking-wide hover:opacity-70 max-md:hidden" style={navLinkStyle}>
              {t("nav.exploreArthouse")}
            </ExploreArthouseLink>
            <KleioLocaleToggle />
          </nav>
        </div>
      </header>

      {/* ── viewport grid stage ─────────────────────────────────────────── */}
      <section
        className="landing-stage relative z-10 mx-auto grid w-full max-w-[1280px] px-8 pb-16 pt-2 max-md:px-5"
        style={{
          gridTemplateRows: "auto auto auto auto",
          rowGap: "clamp(12px, 2vh, 20px)",
        }}
      >
        {/* Row 1 — hero */}
        <div className="flex h-full flex-col items-center justify-start text-center">
          <h1
            className="font-serif tracking-tight"
            style={{ color: inkColor, fontSize: "clamp(1.45rem, 1.95vw, 2.05rem)", lineHeight: 0.98 }}
          >
            {t("landing.hero.line1")}
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>{t("landing.hero.line2Italic")}</em>
          </h1>

          <p
            className="mx-auto mt-2.5 max-w-[520px]"
            style={{
              color: mutedColor,
              fontSize: "clamp(0.5rem, 0.62vw, 0.6rem)",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              lineHeight: 1.42,
            }}
          >
            {t("landing.tagline.line1")}
            <br />
            {t("landing.tagline.line2")}
            <br />
            {t("landing.tagline.line3")}
          </p>
        </div>

        {/* Row 2 — video */}
        <div className="flex h-full items-center justify-center">
          <video
            className="kleio-transparent-center-video h-auto max-h-[170px] w-[clamp(300px,26vw,430px)] object-contain"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={assetPath("/landing/kleio-transparent-center-video.mp4")} type="video/mp4" />
          </video>
        </div>

        {/* Row 3 — login + join cards */}
        <div className="landing-card-grid mx-auto grid w-full max-w-[980px] grid-cols-[minmax(0,1fr)_26px_minmax(0,1fr)] items-start gap-4 max-md:grid-cols-1 max-md:gap-4">
          <LandingLoginCard />

          {/* "or" divider */}
          <div className="landing-or-divider flex items-center justify-center max-md:hidden">
            <div className="flex flex-col items-center justify-center">
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
              <span className="my-1.5 font-serif text-[0.8rem] italic" style={{ color: mutedColor }}>
                {t("nav.or")}
              </span>
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
            </div>
          </div>

          {/* Join card */}
          <div
            className="landing-choice-card flex flex-col rounded-[1.1rem] p-3.5"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${lavenderSoftLine}`,
              boxShadow: cardShadow,
            }}
          >
            <h2 className="font-serif text-[0.95rem] font-semibold" style={{ color: inkColor, letterSpacing: "-0.01em" }}>
              {t("landing.choosePath.title")}
            </h2>
            <p className="mt-0.5 text-[0.68rem]" style={{ color: mutedColor }}>
              {t("landing.choosePath.subtitle")}
            </p>

            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              <Link
                href="/signup/artist/"
                className="group flex h-[70px] flex-col justify-between rounded-[0.85rem] border p-2.5 transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]"
                style={{ borderColor: lavenderLine, backgroundColor: "#FFFFFF" }}
              >
                <span className="grid size-6 place-items-center rounded-md" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
                  <ArtistIcon />
                </span>
                <span>
                  <span className="block text-[0.62rem]" style={{ color: mutedColor }}>
                    {t("landing.choosePath.iAmArtist")}
                  </span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    {t("landing.choosePath.passport")}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" style={{ color: lavenderAccent }} />
                  </span>
                </span>
              </Link>

              <Link
                href="/signup/institution/"
                className="group flex h-[70px] flex-col justify-between rounded-[0.85rem] border p-2.5 transition-colors hover:border-[#A997E8] hover:bg-[#F7F4FF]"
                style={{ borderColor: lavenderLine, backgroundColor: "#FFFFFF" }}
              >
                <span className="grid size-6 place-items-center rounded-md" style={{ backgroundColor: lavenderMist, color: lavenderDeep }}>
                  <InstitutionIcon />
                </span>
                <span>
                  <span className="block text-[0.62rem]" style={{ color: mutedColor }}>
                    {t("landing.choosePath.iRepresentInstitution")}
                  </span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    {t("landing.choosePath.workspace")}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" style={{ color: lavenderAccent }} />
                  </span>
                </span>
              </Link>
            </div>

            <div className="landing-import-assist-strip mt-3">
              <KleioAssistObjectVisual size="sm" mode="preparing" className="shrink-0 scale-[0.72]" />
              <div className="min-w-0">
                <p className="landing-import-assist-title">KLEIO Import Assist</p>
                <p className="landing-import-assist-copy">{t("landing.importAssist.note")}</p>
              </div>
            </div>

            <div
              className="mt-3 rounded-[0.95rem] border p-3"
              style={{ borderColor: lavenderSoftLine, backgroundColor: lavenderMist }}
            >
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: lavenderAccent }}>
                {isSpanish ? "Demo guiado" : "Guided demo"}
              </p>
              <h3 className="mt-1 font-serif text-[0.92rem] font-semibold" style={{ color: inkColor }}>
                {isSpanish ? "Explora KLEIO por flujo" : "Explore KLEIO by workflow"}
              </h3>
              <p className="mt-1 text-[0.68rem] leading-relaxed" style={{ color: mutedColor }}>
                {isSpanish
                  ? "Elige un recorrido guiado para flujos de artista o institución."
                  : "Choose a guided walkthrough for artist or institution workflows."}
              </p>

              <div className="mt-2.5 grid grid-cols-1 gap-2">
                <Link
                  href="/demo/"
                  className="group inline-flex min-h-8 items-center justify-between rounded-xl bg-[#5B4B8A] px-3 py-2 text-[0.68rem] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  {isSpanish ? "Elegir recorrido" : "Choose a walkthrough"}
                  <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/demo/?scenario=artist-passport-setup"
                    className="group inline-flex min-h-8 items-center justify-between rounded-xl border bg-white px-3 py-2 text-[0.64rem] font-semibold transition-colors hover:bg-[#F7F4FF]"
                    style={{ borderColor: lavenderLine, color: lavenderDeep }}
                  >
                    {isSpanish ? "Pasaporte" : "Artist Passport"}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/demo/?scenario=create-open-call"
                    className="group inline-flex min-h-8 items-center justify-between rounded-xl border bg-white px-3 py-2 text-[0.64rem] font-semibold transition-colors hover:bg-[#F7F4FF]"
                    style={{ borderColor: lavenderLine, color: lavenderDeep }}
                  >
                    {isSpanish ? "Convocatoria" : "Open Call"}
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Row 4 — quote */}
        <div
          className="landing-quote flex flex-col items-center justify-center text-center font-serif text-[10px] italic leading-tight"
          style={{ color: mutedColor }}
        >
          &ldquo;{t("landing.quote.line1")}
          <br />
          {t("landing.quote.line2")}&rdquo;
          <div className="mx-auto mt-1 h-[2px] w-9 rounded-full" style={{ backgroundColor: lavenderAccent }} />
        </div>
      </section>

      {/* ── footer / copyright ──────────────────────────────────────────── */}
      <footer
        className="pointer-events-none relative z-30 px-5 pb-4 pt-2 text-center text-[8px] tracking-[0.15em]"
        style={{ color: "#B2A9C9" }}
      >
        © 2026 KLEIO ARTHOUSE
      </footer>

      <KleioDemoGuide variant="landing" />
    </main>
  )
}
