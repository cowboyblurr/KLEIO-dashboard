"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import { ProductionArtistOpportunityDirectory } from "@/components/kleio/production-artist-opportunity-directory"

const STORAGE_KEY = "kleio_opportunity_filters_v1"

const defaultFilters = {
  query: "",
  type: "all",
  source: "all",
  format: "all",
  discipline: "all",
  geography: "",
  deadlineWindow: "all",
  noFeeOnly: false,
  requirementsOnly: false,
}

type StoredOpportunityFilters = typeof defaultFilters

function restoreFilters(value: unknown): StoredOpportunityFilters {
  if (!value || typeof value !== "object") return defaultFilters
  const stored = value as Record<string, unknown>

  return {
    query: typeof stored.query === "string" ? stored.query : "",
    type: typeof stored.type === "string" ? stored.type : "all",
    source: typeof stored.source === "string" ? stored.source : "all",
    format: typeof stored.format === "string" ? stored.format : "all",
    discipline: typeof stored.discipline === "string" ? stored.discipline : "all",
    geography: typeof stored.geography === "string" ? stored.geography : "",
    deadlineWindow: typeof stored.deadlineWindow === "string" ? stored.deadlineWindow : "all",
    noFeeOnly: stored.noFeeOnly === true,
    requirementsOnly: stored.requirementsOnly === true,
  }
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function deadlineLabel(value: string) {
  if (value === "30") return "Next 30 days"
  if (value === "60") return "Next 60 days"
  if (value === "90") return "Next 90 days"
  if (value === "180") return "Next 6 months"
  return cleanLabel(value)
}

function activeFilterLabels(filters: StoredOpportunityFilters) {
  const labels: string[] = []
  const query = filters.query.trim()
  const geography = filters.geography.trim()

  if (query) labels.push(`Search: “${query}”`)
  if (filters.discipline !== "all") labels.push(`Discipline: ${filters.discipline}`)
  if (filters.type !== "all") labels.push(`Type: ${cleanLabel(filters.type)}`)
  if (filters.format !== "all") labels.push(`Participation: ${cleanLabel(filters.format)}`)
  if (geography) labels.push(`Eligible in: ${geography}`)
  if (filters.deadlineWindow !== "all") labels.push(`Deadline: ${deadlineLabel(filters.deadlineWindow)}`)
  if (filters.source !== "all") labels.push(`Source: ${cleanLabel(filters.source)}`)
  if (filters.noFeeOnly) labels.push("No application fee")
  if (filters.requirementsOnly) labels.push("Structured requirements")

  return labels
}

export function OpportunityFilterVisibilityGuard() {
  const lastStoredValue = useRef("")
  const [filters, setFilters] = useState<StoredOpportunityFilters>(defaultFilters)
  const [hydrated, setHydrated] = useState(false)
  const activeFilters = useMemo(() => activeFilterLabels(filters), [filters])

  useEffect(() => {
    function syncFilters() {
      try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY) ?? ""
        if (storedValue === lastStoredValue.current) return

        lastStoredValue.current = storedValue
        setFilters(storedValue ? restoreFilters(JSON.parse(storedValue)) : defaultFilters)
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
        lastStoredValue.current = ""
        setFilters(defaultFilters)
      } finally {
        setHydrated(true)
      }
    }

    syncFilters()
    const intervalId = window.setInterval(syncFilters, 500)
    window.addEventListener("focus", syncFilters)
    window.addEventListener("storage", syncFilters)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", syncFilters)
      window.removeEventListener("storage", syncFilters)
    }
  }, [])

  function clearAllFilters() {
    const serializedDefaults = JSON.stringify(defaultFilters)
    window.localStorage.setItem(STORAGE_KEY, serializedDefaults)
    lastStoredValue.current = serializedDefaults
    setFilters(defaultFilters)
    window.location.reload()
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FCFBFE]">
      {hydrated && activeFilters.length > 0 && (
        <section className="shrink-0 border-b border-[#E7E1F7] bg-white px-4 py-3 sm:px-6" aria-label="Active opportunity filters">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[#5B4B8A]">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#F7F4FF]">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[#292631]">Filtered opportunity view</p>
                <p className="text-xs text-[#625C70]">These filters are reducing the directory results.</p>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap gap-2" aria-live="polite">
              {activeFilters.map((label) => (
                <span key={label} className="max-w-full truncate rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]" title={label}>
                  {label}
                </span>
              ))}
            </div>

            <button type="button" onClick={clearAllFilters} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-3 text-sm font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8] focus-visible:ring-offset-2">
              <RotateCcw className="size-4" aria-hidden="true" />
              Clear all
            </button>
          </div>
        </section>
      )}

      <div className="min-h-0 flex-1">
        <ProductionArtistOpportunityDirectory />
      </div>
    </div>
  )
}
