"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { assetPath } from "@/lib/asset-path"

// ─── tiny icon components ────────────────────────────────────────────────────

function ArtistIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function InstitutionIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M4 24h20M14 4l10 6H4L14 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="7" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12.5" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="18" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

const navLinkStyle = { color: "#7a7368", letterSpacing: "0.04em" } as const
const inkColor = "#1e1b17"
const mutedColor = "#9a9186"
const borderCol = "oklch(0.88 0.01 290)"

// ─── main page ───────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f8f5ef]">
      {/* ── fixed-ratio artboard stage (matches reference 1672×941) ──────── */}
      <section className="absolute left-1/2 top-0 aspect-[1672/941] h-screen max-h-screen -translate-x-1/2 overflow-hidden">
        {/* background fills the stage exactly — no crop, no zoom */}
        <Image
          src={assetPath("/landing/kleio-glass-gallery-bg.png")}
          alt=""
          fill
          priority
          sizes="100vw"
          aria-hidden
          className="absolute inset-0 h-full w-full object-fill"
        />
        <div className="absolute inset-0 bg-white/10" aria-hidden />

        {/* ── top navigation ──────────────────────────────────────────── */}
        <nav className="absolute left-[12%] top-[4.4%] flex items-center gap-7">
          {["About", "Manifesto", "Journal"].map((label) => (
            <a key={label} href="#" className="text-[0.78rem] font-medium tracking-wide hover:opacity-70" style={navLinkStyle}>
              {label}
            </a>
          ))}
        </nav>

        <div className="absolute left-1/2 top-[2.4%] -translate-x-1/2">
          <Link href="/" aria-label="KLEIO home">
            <Image
              src={assetPath("/kleio-wordmark.png")}
              alt="KLEIO"
              width={1024}
              height={189}
              priority
              className="h-[clamp(2rem,3vw,3.25rem)] w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
            />
          </Link>
        </div>

        <nav className="absolute right-[12%] top-[4.4%] flex items-center gap-6">
          <Link href="/" className="text-[0.78rem] font-medium tracking-wide hover:opacity-70" style={navLinkStyle}>
            Explore Arthouse
          </Link>
          <button type="button" className="flex items-center gap-1 text-[0.78rem] font-medium tracking-wide" style={navLinkStyle}>
            EN <ChevronDown className="size-3" />
          </button>
        </nav>

        {/* ── hero headline ───────────────────────────────────────────── */}
        <div className="absolute left-1/2 top-[11.8%] w-[660px] max-w-[90%] -translate-x-1/2 text-center">
          <h1 className="font-serif leading-[1.15] tracking-tight" style={{ color: inkColor, fontSize: "clamp(1.6rem, 2.2vw, 2.25rem)" }}>
            Where artistic vision
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>meets institutional memory.</em>
          </h1>
        </div>

        {/* ── subtitle ────────────────────────────────────────────────── */}
        <div className="absolute left-1/2 top-[22.5%] w-[480px] max-w-[88%] -translate-x-1/2 text-center">
          <p
            style={{
              color: "#7a7368",
              fontSize: "0.66rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              lineHeight: 1.8,
            }}
          >
            KLEIO Arthouse is an intelligent ecosystem
            <br />
            for artists and institutions to archive, exhibit,
            <br />
            and advance cultural legacies—together.
          </p>
        </div>

        {/* ── login + join cards row (lower center, over plinth) ───────── */}
        <div className="absolute left-1/2 top-[70.3%] grid w-[900px] max-w-[94%] -translate-x-1/2 -translate-y-1/2 grid-cols-[1fr_40px_1fr] items-center gap-0 max-lg:grid-cols-1 max-lg:gap-4">
          {/* Login card */}
          <div
            className="rounded-md p-7 shadow-xl"
            style={{ backgroundColor: "rgba(255, 253, 250, 0.97)", border: `1px solid ${borderCol}`, backdropFilter: "blur(12px)" }}
          >
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor, letterSpacing: "-0.01em" }}>
              Welcome back
            </h2>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>
              Log in to your account
            </p>

            <div className="mt-4 space-y-2.5">
              <input
                type="email"
                placeholder="Email address"
                className="h-9 w-full rounded-sm border bg-transparent px-3 outline-none"
                style={{ borderColor: borderCol, color: inkColor, fontSize: "0.82rem" }}
              />
              <input
                type="password"
                placeholder="Password"
                className="h-9 w-full rounded-sm border bg-transparent px-3 outline-none"
                style={{ borderColor: borderCol, color: inkColor, fontSize: "0.82rem" }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <a href="#" className="text-[0.72rem]" style={{ color: mutedColor }}>
                Forgot password?
              </a>
              <Link
                href="/"
                className="flex h-9 items-center justify-center gap-1.5 rounded-sm px-5 font-medium transition-opacity hover:opacity-90"
                style={{ backgroundColor: "oklch(0.93 0.04 290)", color: "oklch(0.38 0.12 287)", fontSize: "0.82rem", letterSpacing: "0.02em" }}
              >
                Login
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* "or" divider */}
          <div className="flex items-center justify-center max-lg:hidden">
            <div className="flex flex-col items-center gap-2">
              <div className="h-9 w-px" style={{ backgroundColor: borderCol }} />
              <span className="font-serif text-xs italic" style={{ color: "#b0a898", letterSpacing: "0.04em" }}>
                or
              </span>
              <div className="h-9 w-px" style={{ backgroundColor: borderCol }} />
            </div>
          </div>

          {/* Join card */}
          <div
            className="rounded-md p-7 shadow-xl"
            style={{ backgroundColor: "rgba(255, 253, 250, 0.97)", border: `1px solid ${borderCol}`, backdropFilter: "blur(12px)" }}
          >
            <h2 className="font-serif text-lg font-semibold" style={{ color: inkColor, letterSpacing: "-0.01em" }}>
              Join KLEIO Arthouse
            </h2>
            <p className="mt-1 text-xs" style={{ color: mutedColor }}>
              Create your account
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href="/signup/artist/"
                className="group flex flex-col gap-2 rounded-sm border px-3 py-3 transition-all hover:border-[oklch(0.72_0.1_287)] hover:bg-[oklch(0.97_0.02_290)]"
                style={{ borderColor: borderCol }}
              >
                <span className="grid size-8 place-items-center rounded-sm" style={{ backgroundColor: "oklch(0.94_0.03_290)", color: "oklch(0.45_0.14_287)" }}>
                  <ArtistIcon />
                </span>
                <span>
                  <span className="block text-[0.7rem]" style={{ color: mutedColor }}>
                    I am an
                  </span>
                  <span className="flex items-center justify-between font-serif text-sm font-semibold" style={{ color: inkColor }}>
                    Artist
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: mutedColor }} />
                  </span>
                </span>
              </Link>

              <Link
                href="/signup/institution/"
                className="group flex flex-col gap-2 rounded-sm border px-3 py-3 transition-all hover:border-[oklch(0.72_0.1_287)] hover:bg-[oklch(0.97_0.02_290)]"
                style={{ borderColor: borderCol }}
              >
                <span className="grid size-8 place-items-center rounded-sm" style={{ backgroundColor: "oklch(0.94_0.03_290)", color: "oklch(0.45_0.14_287)" }}>
                  <InstitutionIcon />
                </span>
                <span>
                  <span className="block text-[0.7rem]" style={{ color: mutedColor }}>
                    I represent an
                  </span>
                  <span className="flex items-center justify-between font-serif text-sm font-semibold" style={{ color: inkColor }}>
                    Institution
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" style={{ color: mutedColor }} />
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── quote ───────────────────────────────────────────────────── */}
        <div className="absolute left-1/2 top-[91.8%] w-[360px] max-w-[90%] -translate-x-1/2 text-center">
          <p className="font-serif italic leading-relaxed" style={{ color: mutedColor, fontSize: "0.8rem", letterSpacing: "0.01em" }}>
            &ldquo;To archive is not to forget.
            <br />
            It is to shape what will be remembered.&rdquo;
          </p>
          <div className="mx-auto mt-2 h-0.5 w-8 rounded-full" style={{ backgroundColor: "oklch(0.75 0.10 290)" }} />
        </div>

        {/* ── footer / copyright ──────────────────────────────────────── */}
        <div className="absolute bottom-[3.5%] left-[6%]">
          <p className="text-[0.68rem] tracking-widest" style={{ color: "#b0a898", letterSpacing: "0.12em" }}>
            © 2026 KLEIO ARTHOUSE
          </p>
        </div>
      </section>
    </main>
  )
}
