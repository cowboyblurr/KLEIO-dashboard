"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { RotateCcw, SlidersHorizontal } from "lucide-react"
import { ProductionArtistOpportunityDirectory } from "@/components/kleio/production-artist-opportunity-directory"

const STORAGE_KEY = "kleio_opportunity_filters_v1"
const FILTER_VISIBILITY_MIGRATION_KEY = "kleio_opportunity_filter_visibility_v1"
const TRANSIENT_PRESET_KEY = "kleio_opportunity_filter_preset"

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

function isFundingPreset(filters: StoredOpportunityFilters) {
  return filters.query.trim().toLowerCase() === "funding"
    && filters.type === "all"
    && filters.source === "all"
    && filters.format === "all"
    && filters.discipline === "all"
    && filters.geography.trim() === ""
    && filters.deadlineWindow === "all"
    && !filters.noFeeOnly
    && !filters.requirementsOnly
}

export function OpportunityFilterVisibilityGuard() {
  const lastStoredValue = useRef("")
  const syncTimeout = useRef<number | null>(null)
  const syncFiltersRef = useRef<() => void>(() => undefined)
  const [filters, setFilters] = useState<StoredOpportunityFilters>(defaultFilters)
  const [hydrated, setHydrated] = useState(false)
  const activeFilters = useMemo(() => activeFilterLabels(filters), [filters])

  useEffect(() => {
    function syncFilters() {
      try {
        const storedValue = window.localStorage.getItem(STORAGE_KEY) ?? ""
        const restored = storedValue ? restoreFilters(JSON.parse(storedValue)) : defaultFilters
        const isFundingView = new URLSearchParams(window.location.search).get("view") === "funding"
        const transientPreset = window.sessionStorage.getItem(TRANSIENT_PRESET_KEY)

        if (transientPreset === "funding") {
          if (!isFundingView && isFundingPreset(restored)) {
            const serializedDefaults = JSON.stringify(defaultFilters)
            window.sessionStorage.removeItem(TRANSIENT_PRESET_KEY)
            window.localStorage.setItem(STORAGE_KEY, serializedDefaults)
            lastStoredValue.current = serializedDefaults
            setFilters(defaultFilters)
            setHydrated(true)
            window.location.reload()
            return
          }

          if (isFundingView && !isFundingPreset(restored)) {
            window.sessionStorage.removeItem(TRANSIENT_PRESET_KEY)
          }
        }

        const migrationComplete = window.localStorage.getItem(FILTER_VISIBILITY_MIGRATION_KEY) === "complete"
        if (!migrationComplete && !isFundingView) {
          window.localStorage.setItem(FILTER_VISIBILITY_MIGRATION_KEY, "complete")
          if (activeFilterLabels(restored).length > 0) {
            const serializedDefaults = JSON.stringify(defaultFilters)
            window.localStorage.setItem(STORAGE_KEY, serializedDefaults)
            lastStoredValue.current = serializedDefaults
            setFilters(defaultFilters)
            setHydrated(true)
            window.location.reload()
            return
          }
        }

        if (storedValue === lastStoredValue.current) return
        lastStoredValue.current = storedValue
        setFilters(restored)
      } catch {
        window.localStorage.removeItem(STORAGE_KEY)
        lastStoredValue.current = ""
        setFilters(defaultFilters)
      } finally {
        setHydrated(true)
      }
    }

    syncFiltersRef.current = syncFilters
    syncFilters()
    window.addEventListener("focus", syncFilters)
    window.addEventListener("storage", syncFilters)

    return () => {
      if (syncTimeout.current !== null) window.clearTimeout(syncTimeout.current)
      window.removeEventListener("focus", syncFilters)
      window.removeEventListener("storage", syncFilters)
    }
  }, [])

  function scheduleFilterSync() {
    if (syncTimeout.current !== null) window.clearTimeout(syncTimeout.current)
    syncTimeout.current = window.setTimeout(() => syncFiltersRef.current(), 75)
  }

  function clearAllFilters() {
    const serializedDefaults = JSON.stringify(defaultFilters)
    window.sessionStorage.removeItem(TRANSIENT_PRESET_KEY)
    window.localStorage.setItem(FILTER_VISIBILITY_MIGRATION_KEY, "complete")
    window.localStorage.setItem(STORAGE_KEY, serializedDefaults)
    lastStoredValue.current = serializedDefaults
    setFilters(defaultFilters)
    window.location.reload()
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#FCFBFE]" onInputCapture={scheduleFilterSync} onChangeCapture={scheduleFilterSync} onClickCapture={scheduleFilterSync}>
      {hydrated && activeFilters.length > 0 && (
        <section className="shrink-0 border-b border-[#E7E1F7] bg-white px-4 py-2 sm:px-6" aria-label="Active opportunity filters">
          <div className="mx-auto flex max-w-[1180px] items-center gap-2.5">
            <SlidersHorizontal className="size-4 shrink-0 text-[#5B4B8A]" aria-hidden="true" />
            <p className="shrink-0 text-xs font-semibold text-[#292631]">{activeFilters.length} active filter{activeFilters.length === 1 ? "" : "s"}</p>
            <div className="hidden min-w-0 flex-1 gap-1.5 overflow-x-auto sm:flex" aria-live="polite">
              {activeFilters.map((label) => (
                <span key={label} className="max-w-56 shrink-0 truncate rounded-full bg-[#F7F4FF] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5B4B8A]" title={label}>{label}</span>
              ))}
            </div>
            <button type="button" onClick={clearAllFilters} className="ml-auto inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8] focus-visible:ring-offset-2">
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Clear
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
