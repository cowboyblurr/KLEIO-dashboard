"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Building2, Check, Loader2, MapPin, Search } from "lucide-react"
import { normalizeManualEntity, retrieveEntity, searchEntities, type NormalizedEntityValue, type SearchPurpose } from "@/lib/kleio-entity-search"

function context(value: NormalizedEntityValue) {
  return value.formattedAddress || [value.city, value.stateOrRegion, value.country].filter(Boolean).join(", ")
}

export function EntityAutocomplete({ label, purpose, value, onChange, locale = "en", required, countryCode, helper, placeholder }: { label: string; purpose: SearchPurpose; value: NormalizedEntityValue | null; onChange: (value: NormalizedEntityValue | null) => void; locale?: "en" | "es"; required?: boolean; countryCode?: string; helper?: string; placeholder?: string }) {
  const id = useId()
  const listId = `${id}-listbox`
  const statusId = `${id}-status`
  const [query, setQuery] = useState(value?.displayName ?? "")
  const [results, setResults] = useState<NormalizedEntityValue[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [providerUnavailable, setProviderUnavailable] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const controllerRef = useRef<AbortController | null>(null)

  useEffect(() => { if (value) setQuery(value.displayName) }, [value?.displayName])

  useEffect(() => {
    const clean = query.trim()
    if (value && clean === value.displayName) return
    controllerRef.current?.abort()
    if (clean.length < 2) { setResults([]); setLoading(false); setOpen(false); return }
    const controller = new AbortController()
    controllerRef.current = controller
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setProviderUnavailable(false)
      try {
        const next = await searchEntities({ query: clean, purpose, countryCode, signal: controller.signal })
        setResults(next)
        setOpen(true)
        setActiveIndex(next.length ? 0 : -1)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) { setProviderUnavailable(true); setResults([]); setOpen(true) }
      } finally { if (!controller.signal.aborted) setLoading(false) }
    }, 320)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [query, purpose, countryCode, value])

  async function select(result: NormalizedEntityValue) {
    setLoading(true)
    const controller = new AbortController()
    try {
      const detailed = await retrieveEntity(result, controller.signal)
      onChange(detailed)
      setQuery(detailed.displayName)
    } finally { setLoading(false); setOpen(false); setResults([]); setActiveIndex(-1) }
  }

  function manual() {
    const result = normalizeManualEntity(query, purpose)
    onChange(result)
    setQuery(result.displayName)
    setOpen(false)
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((current) => Math.min(results.length - 1, current + 1)) }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((current) => Math.max(0, current - 1)) }
    if (event.key === "Enter" && open && activeIndex >= 0 && results[activeIndex]) { event.preventDefault(); void select(results[activeIndex]) }
    if (event.key === "Escape") { setOpen(false); setActiveIndex(-1) }
  }

  const sourceLabel = value?.sourceMode === "kleio_existing" ? (locale === "es" ? "Existe en KLEIO" : "Existing on KLEIO") : value?.sourceMode === "external_provider" ? (locale === "es" ? "Resultado público" : "Public provider result") : value ? (locale === "es" ? "Entrada manual" : "Manual entry") : ""

  return <div className="relative"><label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}{required ? " *" : ""}</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={listId} aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined} aria-describedby={statusId} required={required} value={query} onFocus={() => query.trim().length >= 2 && setOpen(true)} onChange={(event) => { setQuery(event.target.value); onChange(null) }} onKeyDown={keyDown} placeholder={placeholder ?? (locale === "es" ? "Escribe al menos dos caracteres" : "Type at least two characters")} autoComplete="off" className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10" />{loading && <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-primary" aria-hidden />}</div><p id={statusId} className="mt-1 text-[0.65rem] text-muted-foreground" aria-live="polite">{loading ? (locale === "es" ? "Buscando…" : "Searching…") : value ? `${sourceLabel}${context(value) && context(value) !== value.displayName ? ` · ${context(value)}` : ""}` : helper ?? (locale === "es" ? "Selecciona un resultado o usa entrada manual." : "Select a result or use manual entry.")}</p>{open && <div id={listId} role="listbox" className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-xl border border-border bg-card p-1 shadow-xl">{results.map((result, index) => <button id={`${id}-option-${index}`} role="option" aria-selected={index === activeIndex} type="button" key={`${result.sourceMode}-${result.existingKleioInstitutionId ?? result.providerPlaceId ?? index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => void select(result)} className={`flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left ${index === activeIndex ? "bg-[#F7F4FF]" : "hover:bg-accent/50"}`}>{purpose === "institution" ? <Building2 className="mt-0.5 size-4 shrink-0 text-primary" /> : <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />}<span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-foreground">{result.displayName}</span><span className="mt-0.5 block text-xs text-muted-foreground">{context(result) || result.entityType}</span>{result.sourceMode === "kleio_existing" && <span className="mt-1 inline-flex rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.6rem] font-semibold text-[#5B4B8A]">{locale === "es" ? "Ya existe en KLEIO — la membresía requiere verificación" : "Existing on KLEIO — membership still requires verification"}</span>}</span>{index === activeIndex && <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />}</button>)}{!loading && results.length === 0 && <p className="px-3 py-3 text-sm text-muted-foreground">{providerUnavailable ? (locale === "es" ? "El proveedor no está disponible. Puedes continuar manualmente." : "The provider is unavailable. You can continue manually.") : (locale === "es" ? "No se encontraron coincidencias." : "No matches found.")}</p>}{query.trim() && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={manual} className="mt-1 w-full rounded-lg border-t border-border px-3 py-2.5 text-left text-sm font-semibold text-primary hover:bg-[#F7F4FF]">{locale === "es" ? `¿No encuentras el resultado? Ingresar “${query.trim()}” manualmente` : `Can’t find it? Enter “${query.trim()}” manually`}</button>}</div>}</div>
}
