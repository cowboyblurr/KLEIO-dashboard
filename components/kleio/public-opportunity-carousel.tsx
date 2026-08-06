"use client"

/* eslint-disable @next/next/no-img-element -- opportunity previews come from verified source records */

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowLeft, ArrowRight, CalendarDays, ChevronDown, Loader2, LockKeyhole, MapPin, Pause, Play, RotateCcw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { storeKleioReturnIntent } from "@/lib/kleio-return-intent"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

export type PublicOpportunityCarouselItem = {
  id: string
  title: string
  provider_name: string
  opportunity_type: string
  summary: string
  deadline_at: string | null
  participation_format: string
  locations: string[]
  remote_allowed: boolean | null
  award_min: number | null
  award_max: number | null
  currency: string | null
  funding_display_text: string
  application_fee: number | null
  application_fee_currency: string | null
  disciplines: string[]
  verification_status: string
  last_verified_at: string | null
  created_at: string
  preview_image_url: string
  preview_image_path: string
  preview_image_alt_text: string
  source_name: string
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return "Confirm timing with the source"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Confirm timing with the source"
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed)
}

function fundingLabel(item: PublicOpportunityCarouselItem) {
  if (item.funding_display_text.trim()) return item.funding_display_text
  if (item.award_min === null && item.award_max === null) return "Funding not stated"
  const amount = item.award_max ?? item.award_min ?? 0
  return `${item.currency ?? ""} ${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount)}`.trim()
}

function feeLabel(item: PublicOpportunityCarouselItem) {
  if (item.application_fee === 0) return "No application fee"
  if (item.application_fee === null) return "Fee not stated"
  return `${item.application_fee_currency ?? item.currency ?? ""} ${item.application_fee}`.trim()
}

function returnRoute(itemId: string) {
  const params = new URLSearchParams({ opportunity: itemId, resume: "view_details", source: "landing_carousel" })
  return `/opportunities/?${params.toString()}`
}

function signupHref(itemId: string) {
  return `/signup/artist/?returnTo=${encodeURIComponent(returnRoute(itemId))}`
}

export function PublicOpportunityCarousel() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<PublicOpportunityCarouselItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [tabVisible, setTabVisible] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: requestError } = await supabase.rpc("get_public_opportunity_carousel", { limit_count: 6 })
      if (requestError) throw requestError
      const next = (data ?? []) as PublicOpportunityCarouselItem[]
      setItems(next)
      if (next.length) void trackKleioProductEvent("carousel_viewed", { surface: "landing", metadata: { result_count: next.length, mode: "limited_preview" } })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load recent opportunities.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const update = () => setTabVisible(document.visibilityState === "visible")
    document.addEventListener("visibilitychange", update)
    return () => document.removeEventListener("visibilitychange", update)
  }, [])

  const advance = useCallback((direction: 1 | -1, manual = false) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const card = viewport.querySelector<HTMLElement>("[data-opportunity-card]")
    const distance = (card?.offsetWidth ?? Math.max(viewport.clientWidth * 0.8, 280)) + 16
    const atEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 8
    const atStart = viewport.scrollLeft <= 8
    let left = direction * distance
    if (direction > 0 && atEnd) left = -viewport.scrollLeft
    if (direction < 0 && atStart) left = viewport.scrollWidth
    viewport.scrollBy({ left, behavior: reducedMotion ? "auto" : "smooth" })
    if (manual) void trackKleioProductEvent("carousel_manual_advanced", { surface: "landing", metadata: { action: direction > 0 ? "next" : "previous", reduced_motion: reducedMotion } })
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion || paused || interactionPaused || expandedId || !tabVisible || items.length < 2) return
    const timer = window.setInterval(() => advance(1), 9000)
    return () => window.clearInterval(timer)
  }, [advance, expandedId, interactionPaused, items.length, paused, reducedMotion, tabVisible])

  function preserveOpportunity(item: PublicOpportunityCarouselItem) {
    storeKleioReturnIntent({
      opportunityId: item.id,
      action: "view_details",
      source: "landing_carousel",
      searchContext: "landing_preview",
    })
  }

  function togglePreview(item: PublicOpportunityCarouselItem) {
    const opening = expandedId !== item.id
    setExpandedId(opening ? item.id : null)
    if (opening) {
      void trackKleioProductEvent("carousel_card_selected", {
        surface: "landing",
        opportunityId: item.id,
        metadata: { source: "landing_carousel", mode: "limited_preview" },
      })
    }
  }

  const firstItem = items[0]

  return (
    <section id="opportunity-preview" className="scroll-mt-24 border-y border-[#E9E3F3] bg-[#FCFBFE] py-14 sm:py-16" aria-labelledby="recent-opportunities-title">
      <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#75639E]">Limited public preview</p>
            <h2 id="recent-opportunities-title" className="mt-2 font-serif text-3xl tracking-[-0.035em] text-[#292631] sm:text-4xl">See what KLEIO is finding for artists.</h2>
            <p className="mt-3 text-sm leading-6 text-[#746E80]">Open a listing for a concise preview. Complete eligibility, application requirements, source links, saving, matching, and the full directory are available inside a free member account.</p>
          </div>
          <div className="flex items-center gap-2">
            {!reducedMotion && items.length > 1 && (
              <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-3 text-xs font-semibold text-[#5B4B8A]" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}{paused ? "Resume" : "Pause"}
              </button>
            )}
            <button type="button" onClick={() => advance(-1, true)} disabled={items.length < 2} className="grid size-10 place-items-center rounded-full border border-[#D8D0F2] bg-white text-[#5B4B8A] disabled:opacity-40" aria-label="Previous opportunities"><ArrowLeft className="size-4" /></button>
            <button type="button" onClick={() => advance(1, true)} disabled={items.length < 2} className="grid size-10 place-items-center rounded-full border border-[#D8D0F2] bg-white text-[#5B4B8A] disabled:opacity-40" aria-label="Next opportunities"><ArrowRight className="size-4" /></button>
          </div>
        </div>

        {loading && (
          <div className="mt-8 grid min-h-64 place-items-center rounded-3xl border border-[#E7E1F7] bg-white" role="status">
            <p className="flex items-center gap-2 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading sourced opportunity previews…</p>
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-3xl border border-[#E7E1F7] bg-white p-8" role="alert">
            <p className="font-serif text-xl text-[#292631]">Opportunity previews are temporarily unavailable.</p>
            <p className="mt-2 text-sm text-[#746E80]">No unverified fallback records are being shown.</p>
            <button type="button" onClick={() => void load()} className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8D0F2] px-4 text-sm font-semibold text-[#5B4B8A]"><RotateCcw className="size-4" />Retry</button>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="mt-8 rounded-3xl border border-[#E7E1F7] bg-white p-8">
            <p className="font-serif text-xl text-[#292631]">No verified previews are ready right now.</p>
            <p className="mt-2 text-sm text-[#746E80]">KLEIO only displays records that pass public visibility and source-quality rules.</p>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div
            ref={viewportRef}
            className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]"
            role="region"
            aria-roledescription="carousel"
            aria-label="Recently added artist opportunity previews"
            onMouseEnter={() => setInteractionPaused(true)}
            onMouseLeave={() => setInteractionPaused(false)}
            onFocusCapture={() => setInteractionPaused(true)}
            onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setInteractionPaused(false) }}
          >
            {items.map((item, index) => {
              const location = item.locations?.slice(0, 2).join(", ") || (item.remote_allowed ? "Online or remote" : cleanLabel(item.participation_format || "Location not stated"))
              const isExpanded = expandedId === item.id
              const previewId = `landing-opportunity-preview-${item.id}`
              return (
                <article key={item.id} data-opportunity-card className="relative min-w-[84vw] snap-start self-start overflow-hidden rounded-[1.4rem] border border-[#E4DDF1] bg-white shadow-[0_22px_60px_rgba(70,52,112,0.08)] sm:min-w-[390px] lg:min-w-[calc((100%-32px)/3)]" role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${items.length}: ${item.title}`}>
                  <div className="relative h-36 overflow-hidden bg-[radial-gradient(circle_at_15%_0%,#EAE2FA,transparent_52%),linear-gradient(145deg,#F7F3FF,#EEE8F8)]">
                    {item.preview_image_url ? <img src={item.preview_image_url} alt={item.preview_image_alt_text || ""} className="size-full object-cover" loading="lazy" /> : <div className="absolute inset-0 grid place-items-center"><span className="font-serif text-5xl italic text-[#8D79B4]/35">K</span></div>}
                    <span className="absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-2.5 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.12em] text-[#5B4B8A]">{cleanLabel(item.opportunity_type)}</span>
                  </div>
                  <div className="p-5">
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#81758C]">{item.provider_name}</p>
                    <h3 className="mt-2 line-clamp-2 min-h-[3.5rem] font-serif text-xl font-semibold leading-7 tracking-[-0.02em] text-[#292631]">{item.title}</h3>
                    <p className={`mt-3 text-sm leading-5 text-[#746E80] ${isExpanded ? "" : "line-clamp-2 min-h-10"}`}>{item.summary || "Review the sourced listing for details."}</p>
                    <dl className="mt-4 space-y-2 border-t border-[#EEE9F5] pt-4 text-xs text-[#625C70]">
                      <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#8F7AC8]" /><div><dt className="sr-only">Deadline</dt><dd>{formatDate(item.deadline_at)}</dd></div></div>
                      <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-3.5 shrink-0 text-[#8F7AC8]" /><div><dt className="sr-only">Location</dt><dd>{location}</dd></div></div>
                    </dl>
                    <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A] line-clamp-1">{fundingLabel(item)}</span><span className="rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A]">{feeLabel(item)}</span></div>

                    <button type="button" onClick={() => togglePreview(item)} aria-expanded={isExpanded} aria-controls={previewId} className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#CFC3ED] bg-white text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
                      {isExpanded ? "Close preview" : "View opportunity preview"}<ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div id={previewId} className="mt-5 border-t border-[#EEE9F5] pt-5">
                        <div className="space-y-3 text-xs leading-5 text-[#655F70]">
                          <p><strong className="text-[#292631]">Practice areas:</strong> {item.disciplines?.length ? item.disciplines.slice(0, 4).join(", ") : "Not stated in the public preview"}</p>
                          <p><strong className="text-[#292631]">Verification:</strong> {cleanLabel(item.verification_status || "source attributed")}</p>
                          <p><strong className="text-[#292631]">Preview boundary:</strong> Eligibility language, required materials, official source access, fit checks, and application preparation are intentionally reserved for members.</p>
                        </div>
                        <div className="mt-5 rounded-2xl border border-[#D9D0F2] bg-[linear-gradient(145deg,#F9F6FF,#FFFFFF)] p-4">
                          <div className="flex gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#ECE5FA] text-[#5B4B8A]"><LockKeyhole className="size-4" /></span>
                            <div>
                              <h4 className="font-serif text-lg font-semibold text-[#292631]">Continue inside KLEIO</h4>
                              <p className="mt-1 text-xs leading-5 text-[#746E80]">Create a free account to open the complete listing and browse the full member directory. Your selected opportunity will be restored after signup.</p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2 sm:grid-cols-2">
                            <Link href={signupHref(item.id)} onClick={() => preserveOpportunity(item)} className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#55457F] px-4 text-xs font-semibold text-white">Create free account</Link>
                            <a href="#login" onClick={() => preserveOpportunity(item)} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#CFC3ED] bg-white px-4 text-xs font-semibold text-[#5B4B8A]">Sign in</a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-[#DDD5ED] bg-white p-5 text-center shadow-[0_14px_38px_rgba(70,52,112,0.05)]">
          <LockKeyhole className="mx-auto size-5 text-[#75639E]" />
          <p className="mt-3 font-serif text-xl font-semibold text-[#292631]">The complete opportunity directory is a member experience.</p>
          <p className="mt-2 text-sm leading-6 text-[#746E80]">Sign up to search the full directory, open complete details, save opportunities, check fit, and prepare application materials.</p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={firstItem ? signupHref(firstItem.id) : "/signup/artist/"} onClick={() => { if (firstItem) preserveOpportunity(firstItem) }} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5B4B8A] px-5 text-sm font-semibold text-white">Create account to browse</Link>
            <a href="#login" onClick={() => { if (firstItem) preserveOpportunity(firstItem) }} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A]">Already a member? Sign in</a>
          </div>
        </div>
      </div>
    </section>
  )
}
