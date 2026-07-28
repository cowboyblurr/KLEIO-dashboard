"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { ProductionArtistOpportunityDirectory } from "@/components/kleio/production-artist-opportunity-directory"

const FILTER_STORAGE_KEY = "kleio_opportunity_filters_v1"

export function AuthorizedArtistOpportunityDirectory() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filtersHost, setFiltersHost] = useState<HTMLElement | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FILTER_STORAGE_KEY)
      if (stored) {
        const filters = JSON.parse(stored) as Record<string, unknown>
        window.localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify({
          ...filters,
          careerStage: "all",
          funding: "all",
        }))
      }
    } catch {
      window.localStorage.removeItem(FILTER_STORAGE_KEY)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    if (!ready) return

    const findFilterHost = () => {
      const host = rootRef.current?.querySelector<HTMLElement>('section[aria-label="Opportunity filters"]') ?? null
      if (host) {
        setFiltersHost(host)
        return true
      }
      return false
    }

    if (findFilterHost()) return

    const observer = new MutationObserver(() => {
      if (findFilterHost()) observer.disconnect()
    })
    if (rootRef.current) observer.observe(rootRef.current, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [ready])

  useEffect(() => {
    if (!filtersHost) return
    filtersHost.dataset.refinementsOpen = String(filtersOpen)
  }, [filtersHost, filtersOpen])

  return (
    <div ref={rootRef} className="kleio-opportunity-directory">
      {ready && <ProductionArtistOpportunityDirectory />}

      {filtersHost && createPortal(
        <button
          type="button"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]"
          onClick={() => setFiltersOpen((current) => !current)}
          aria-expanded={filtersOpen}
        >
          <SlidersHorizontal className="size-4" />
          {filtersOpen ? "Hide filters" : "Refine search"}
          <ChevronDown className={`size-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
        </button>,
        filtersHost,
      )}

      <style jsx global>{`
        .kleio-opportunity-directory section[aria-label="Opportunity filters"] > div:nth-of-type(2),
        .kleio-opportunity-directory section[aria-label="Opportunity filters"] > div:nth-of-type(3) {
          display: none;
        }

        .kleio-opportunity-directory section[aria-label="Opportunity filters"][data-refinements-open="true"] > div:nth-of-type(2) {
          display: grid;
        }

        .kleio-opportunity-directory section[aria-label="Opportunity filters"][data-refinements-open="true"] > div:nth-of-type(3) {
          display: flex;
        }

        .kleio-opportunity-directory section[aria-label="Opportunity filters"] > div:nth-of-type(2) > label:nth-child(4),
        .kleio-opportunity-directory section[aria-label="Opportunity filters"] > div:nth-of-type(2) > label:nth-child(7) {
          display: none !important;
        }
      `}</style>
    </div>
  )
}
