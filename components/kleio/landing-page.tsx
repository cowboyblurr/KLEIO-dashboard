"use client"

import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { assetPath } from "@/lib/asset-path"
import { LandingLoginCard } from "@/components/kleio/landing-login-card"
import { ExploreArthouseLink } from "@/components/kleio/smart-home-link"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

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
  return (
    <main className="relative h-dvh min-h-[680px] w-full overflow-hidden bg-white text-[#292631]">
      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="absolute left-0 top-0 z-30 h-[96px] w-full">
        <div className="relative mx-auto h-full w-full max-w-[1280px] px-8 max-md:px-5">
          <nav className="absolute left-8 top-1/2 flex -translate-y-1/2 items-center gap-8 max-md:left-5 max-md:gap-4">
            {["About", "Manifesto", "Journal"].map((label) => (
              <a key={label} href="#" className="text-[0.78rem] font-medium tracking-wide hover:opacity-70" style={navLinkStyle}>
                {label}
              </a>
            ))}
          </nav>

          <div className="absolute left-1/2 top-[62px] -translate-x-1/2 -translate-y-1/2">
            <KleioWordmarkLink
              imageClassName="h-[clamp(2rem,2.75vw,3rem)] w-auto"
              imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
              priority
            />
          </div>

          <nav className="absolute right-8 top-1/2 flex -translate-y-1/2 items-center gap-7 max-md:right-5 max-md:gap-4">
            <ExploreArthouseLink className="text-[0.78rem] font-medium tracking-wide hover:opacity-70 max-md:hidden" style={navLinkStyle}>
              Explore Arthouse
            </ExploreArthouseLink>
            <button type="button" className="flex items-center gap-1 text-[0.78rem] font-medium tracking-wide" style={navLinkStyle}>
              EN <ChevronDown className="size-3" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── viewport grid stage ─────────────────────────────────────────── */}
      <section
        className="absolute inset-x-0 top-[104px] z-10 grid h-[558px] px-8 max-md:px-5"
        style={{
          gridTemplateRows: "112px 190px 220px 36px",
        }}
      >
        {/* Row 1 — hero */}
        <div className="flex h-full flex-col items-center justify-start text-center">
          <h1
            className="font-serif tracking-tight"
            style={{ color: inkColor, fontSize: "clamp(1.45rem, 1.95vw, 2.05rem)", lineHeight: 0.98 }}
          >
            Where artistic vision
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>meets institutional memory.</em>
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
            KLEIO Arthouse is an intelligent ecosystem
            <br />
            for artists and institutions to archive, exhibit,
            <br />
            and advance cultural legacies—together.
          </p>
        </div>

        {/* Row 2 — video */}
        <div className="flex h-full items-center justify-center">
          <video
            className="kleio-transparent-center-video h-auto max-h-[185px] w-[clamp(300px,26vw,430px)] object-contain"
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
        <div className="mx-auto grid h-full w-full max-w-[980px] grid-cols-[minmax(0,1fr)_26px_minmax(0,1fr)] items-stretch gap-4">
          <LandingLoginCard />

          {/* "or" divider */}
          <div className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center">
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
              <span className="my-1.5 font-serif text-[0.8rem] italic" style={{ color: mutedColor }}>
                or
              </span>
              <div className="h-6 w-px" style={{ backgroundColor: lavenderLine }} />
            </div>
          </div>

          {/* Join card */}
          <div
            className="flex h-full flex-col rounded-[1.1rem] p-3.5"
            style={{
              backgroundColor: cardBg,
              border: `1px solid ${lavenderSoftLine}`,
              boxShadow: cardShadow,
            }}
          >
            <h2 className="font-serif text-[0.95rem] font-semibold" style={{ color: inkColor, letterSpacing: "-0.01em" }}>
              Join KLEIO Arthouse
            </h2>
            <p className="mt-0.5 text-[0.68rem]" style={{ color: mutedColor }}>
              Create your account
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
                    I am an
                  </span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    Artist
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
                    I represent an
                  </span>
                  <span className="flex items-center justify-between font-serif text-[0.78rem] font-semibold" style={{ color: inkColor }}>
                    Institution
                    <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" style={{ color: lavenderAccent }} />
                  </span>
                </span>
              </Link>
            </div>
            <p className="mt-2 text-center text-[0.6rem] italic" style={{ color: mutedColor }}>
              Optional Import Assist available during setup.
            </p>
          </div>
        </div>

        {/* Row 4 — quote */}
        <div
          className="flex h-full flex-col items-center justify-center text-center font-serif text-[10px] italic leading-tight"
          style={{ color: mutedColor }}
        >
          &ldquo;To archive is not to forget.
          <br />
          It is to shape what will be remembered.&rdquo;
          <div className="mx-auto mt-1 h-[2px] w-9 rounded-full" style={{ backgroundColor: lavenderAccent }} />
        </div>
      </section>

      {/* ── footer / copyright ──────────────────────────────────────────── */}
      <footer
        className="pointer-events-none absolute bottom-2 left-5 z-30 text-[8px] tracking-[0.15em] max-md:left-1/2 max-md:-translate-x-1/2"
        style={{ color: "#B2A9C9" }}
      >
        © 2026 KLEIO ARTHOUSE
      </footer>
    </main>
  )
}
