"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import { assetPath } from "@/lib/asset-path"

// ─── tiny icon components ────────────────────────────────────────────────────

function ArtistIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="9" r="4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 24c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function InstitutionIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M4 24h20M14 4l10 6H4L14 4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="7" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="12.5" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      <rect x="18" y="10" width="3" height="10" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────

export function LandingPage() {
  const [loginFocused, setLoginFocused] = useState(false)

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{ backgroundColor: "#f7f4ef" }}
    >
      {/* ── subtle background tone ──────────────────────────────────────── */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
      >
        {/* large ghost circle – architectural background shape */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[45%] rounded-full"
          style={{
            width: "min(1100px, 120vw)",
            height: "min(1100px, 120vw)",
            background: "radial-gradient(ellipse at center, oklch(0.93 0.04 290 / 0.18) 0%, transparent 65%)",
          }}
        />
        {/* ivory grain overlay – very subtle */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='512' height='512' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
            backgroundSize: "256px 256px",
          }}
        />
      </div>

      {/* ── header ──────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto grid max-w-[1280px] grid-cols-3 items-center px-8 pt-7 pb-0">
        {/* left nav */}
        <nav className="flex items-center gap-7">
          {["About", "Manifesto", "Journal"].map((label) => (
            <a
              key={label}
              href="#"
              className="text-[0.78rem] font-medium tracking-wide transition-colors"
              style={{ color: "#7a7368", letterSpacing: "0.04em" }}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* center wordmark */}
        <div className="flex justify-center">
          <Link href="/" aria-label="KLEIO home">
            <Image
              src={assetPath("/kleio-wordmark.png")}
              alt="KLEIO"
              width={1024}
              height={189}
              priority
              className="h-8 w-auto"
              style={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }}
            />
          </Link>
        </div>

        {/* right nav */}
        <nav className="flex items-center justify-end gap-6">
          <Link
            href="/"
            className="text-[0.78rem] font-medium tracking-wide transition-colors hover:opacity-70"
            style={{ color: "#7a7368", letterSpacing: "0.04em" }}
          >
            Explore Arthouse
          </Link>
          <button
            type="button"
            className="flex items-center gap-1 text-[0.78rem] font-medium tracking-wide"
            style={{ color: "#7a7368", letterSpacing: "0.04em" }}
          >
            EN <ChevronDown className="size-3" />
          </button>
        </nav>
      </header>

      {/* ── thin rule under header ─────────────────────────────────────── */}
      <div className="relative z-10 mx-auto max-w-[1280px] px-8 mt-5">
        <div className="h-px w-full" style={{ backgroundColor: "oklch(0.88 0.01 290)" }} />
      </div>

      {/* ── hero text ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mt-10 px-8 text-center">
        <h1
          className="font-serif leading-[1.12] tracking-tight"
          style={{ color: "#1e1b17", fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
        >
          Where artistic vision
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 400 }}>meets institutional memory.</em>
        </h1>

        <p
          className="mx-auto mt-5 max-w-sm leading-relaxed"
          style={{
            color: "#7a7368",
            fontSize: "0.68rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            lineHeight: 1.9,
          }}
        >
          KLEIO Arthouse is an intelligent ecosystem
          <br />
          for artists and institutions to archive, exhibit,
          <br />
          and advance cultural legacies—together.
        </p>
      </div>

      {/* ── central artwork ─────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto mt-6 max-w-[1100px] px-8">
        <div
          className="relative mx-auto overflow-hidden"
          style={{
            borderRadius: "4px",
            height: "clamp(260px, 34vw, 460px)",
          }}
        >
          {/* foyer image as art layer */}
          <Image
            src={assetPath("/landing/kleio-arthouse-foyer.png")}
            alt="KLEIO Arthouse — translucent archival panels in a gallery space"
            fill
            sizes="1100px"
            priority
            className="object-cover object-center"
            style={{ opacity: 0.92 }}
          />
          {/* warm ivory gradient fade — top */}
          <div
            className="absolute inset-x-0 top-0 h-24"
            style={{ background: "linear-gradient(to bottom, #f7f4ef 0%, transparent 100%)" }}
          />
          {/* warm ivory gradient fade — bottom  */}
          <div
            className="absolute inset-x-0 bottom-0 h-32"
            style={{ background: "linear-gradient(to top, #f7f4ef 0%, transparent 100%)" }}
          />
        </div>
      </div>

      {/* ── cards row ───────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto -mt-6 max-w-[900px] px-6 pb-12">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-0">

          {/* ── Login card ──────────────────────────────────────────────── */}
          <div
            className="w-full flex-1 rounded-sm p-7 shadow-xl sm:rounded-r-none"
            style={{
              backgroundColor: "rgba(255, 253, 250, 0.97)",
              border: "1px solid oklch(0.90 0.01 290)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h2
              className="font-serif text-xl font-semibold"
              style={{ color: "#1e1b17", letterSpacing: "-0.01em" }}
            >
              Welcome back
            </h2>
            <p className="mt-1 text-xs" style={{ color: "#9a9186" }}>
              Log in to your account
            </p>

            <div className="mt-5 space-y-3">
              <input
                type="email"
                placeholder="Email address"
                className="h-10 w-full rounded-sm border bg-transparent px-3 text-sm outline-none transition-colors"
                style={{
                  borderColor: "oklch(0.88 0.01 290)",
                  color: "#1e1b17",
                  fontSize: "0.84rem",
                }}
                onFocus={() => setLoginFocused(true)}
                onBlur={() => setLoginFocused(false)}
              />
              <input
                type="password"
                placeholder="Password"
                className="h-10 w-full rounded-sm border bg-transparent px-3 text-sm outline-none transition-colors"
                style={{
                  borderColor: "oklch(0.88 0.01 290)",
                  color: "#1e1b17",
                  fontSize: "0.84rem",
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between">
              <a href="#" className="text-[0.72rem]" style={{ color: "#9a9186" }}>
                Forgot password?
              </a>
            </div>

            <Link
              href="/"
              className="mt-5 flex h-10 items-center justify-center gap-1.5 rounded-sm text-sm font-medium transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "oklch(0.93 0.04 290)",
                color: "oklch(0.38 0.12 287)",
                fontSize: "0.84rem",
                letterSpacing: "0.02em",
              }}
            >
              Login
              <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* ── divider "or" ─────────────────────────────────────────────── */}
          <div
            className="hidden items-center justify-center sm:flex"
            style={{ width: "3rem", flexShrink: 0 }}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-px" style={{ backgroundColor: "oklch(0.88 0.01 290)" }} />
              <span
                className="font-serif text-xs italic"
                style={{ color: "#b0a898", letterSpacing: "0.04em" }}
              >
                or
              </span>
              <div className="h-10 w-px" style={{ backgroundColor: "oklch(0.88 0.01 290)" }} />
            </div>
          </div>
          <p
            className="flex items-center justify-center gap-3 text-xs sm:hidden"
            style={{ color: "#b0a898" }}
          >
            <span className="h-px flex-1" style={{ backgroundColor: "oklch(0.88 0.01 290)" }} />
            or
            <span className="h-px flex-1" style={{ backgroundColor: "oklch(0.88 0.01 290)" }} />
          </p>

          {/* ── Join card ───────────────────────────────────────────────── */}
          <div
            className="w-full flex-1 rounded-sm p-7 shadow-xl sm:rounded-l-none"
            style={{
              backgroundColor: "rgba(255, 253, 250, 0.97)",
              border: "1px solid oklch(0.90 0.01 290)",
              backdropFilter: "blur(12px)",
            }}
          >
            <h2
              className="font-serif text-xl font-semibold"
              style={{ color: "#1e1b17", letterSpacing: "-0.01em" }}
            >
              Join KLEIO Arthouse
            </h2>
            <p className="mt-1 text-xs" style={{ color: "#9a9186" }}>
              Create your account
            </p>

            <div className="mt-5 space-y-3">
              <Link
                href="/signup/artist/"
                className="group flex items-center gap-4 rounded-sm border px-4 py-3.5 transition-all hover:border-[oklch(0.72_0.1_287)] hover:bg-[oklch(0.97_0.02_290)]"
                style={{ borderColor: "oklch(0.88 0.01 290)" }}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-sm"
                  style={{ backgroundColor: "oklch(0.94_0.03_290)", color: "oklch(0.45_0.14_287)" }}
                >
                  <ArtistIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-sm font-medium"
                    style={{ color: "#1e1b17", fontSize: "0.84rem" }}
                  >
                    I am an
                  </span>
                  <span
                    className="block font-serif text-base font-semibold"
                    style={{ color: "#1e1b17" }}
                  >
                    Artist
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: "#9a9186" }}
                />
              </Link>

              <Link
                href="/signup/institution/"
                className="group flex items-center gap-4 rounded-sm border px-4 py-3.5 transition-all hover:border-[oklch(0.72_0.1_287)] hover:bg-[oklch(0.97_0.02_290)]"
                style={{ borderColor: "oklch(0.88 0.01 290)" }}
              >
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-sm"
                  style={{ backgroundColor: "oklch(0.94_0.03_290)", color: "oklch(0.45_0.14_287)" }}
                >
                  <InstitutionIcon />
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className="block text-sm font-medium"
                    style={{ color: "#1e1b17", fontSize: "0.84rem" }}
                  >
                    I represent an
                  </span>
                  <span
                    className="block font-serif text-base font-semibold"
                    style={{ color: "#1e1b17" }}
                  >
                    Institution
                  </span>
                </span>
                <ChevronRight
                  className="size-4 shrink-0 transition-transform group-hover:translate-x-0.5"
                  style={{ color: "#9a9186" }}
                />
              </Link>
            </div>
          </div>
        </div>

        {/* ── quote ──────────────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p
            className="font-serif italic leading-relaxed"
            style={{ color: "#9a9186", fontSize: "0.82rem", letterSpacing: "0.01em" }}
          >
            &ldquo;To archive is not to forget.
            <br />
            It is to shape what will be remembered.&rdquo;
          </p>
          {/* lavender accent mark */}
          <div
            className="h-0.5 w-8 rounded-full"
            style={{ backgroundColor: "oklch(0.75 0.10 290)" }}
          />
        </div>
      </div>

      {/* ── footer ──────────────────────────────────────────────────────── */}
      <div
        className="relative z-10 border-t px-8 py-4 text-left"
        style={{
          borderColor: "oklch(0.90 0.01 290)",
          backgroundColor: "rgba(247, 244, 239, 0.6)",
        }}
      >
        <p
          className="text-[0.68rem] tracking-widest"
          style={{ color: "#b0a898", letterSpacing: "0.12em" }}
        >
          © 2026 KLEIO ARTHOUSE
        </p>
      </div>
    </div>
  )
}
