"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import { Check, Loader2, MapPin, Search } from "lucide-react"
import {
  searchRealWorldEntities,
  type KleioEntityKind,
  type KleioEntitySuggestion,
} from "@/lib/kleio-entity-search"
import { cn } from "@/lib/utils"

export function EntityAutocomplete({
  label,
  value,
  onChange,
  onSelect,
  kind,
  locale,
  placeholder,
  required,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: KleioEntitySuggestion | null) => void
  kind: KleioEntityKind
  locale: "en" | "es"
  placeholder?: string
  required?: boolean
}) {
  const inputId = useId()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [suggestions, setSuggestions] = useState<KleioEntitySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeIndex, setActiveIndex] = useState(-1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [])

  useEffect(() => {
    const query = value.trim()
    if (selectedId || query.length < 3) {
      setSuggestions([])
      setLoading(false)
      setError("")
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const next = await searchRealWorldEntities(query, kind, locale, controller.signal)
        setSuggestions(next)
        setOpen(true)
        setActiveIndex(next.length ? 0 : -1)
      } catch (searchError) {
        if (controller.signal.aborted) return
        setSuggestions([])
        setError(searchError instanceof Error ? searchError.message : "Search unavailable.")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 450)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [kind, locale, selectedId, value])

  function selectSuggestion(suggestion: KleioEntitySuggestion) {
    setSelectedId(suggestion.id)
    onSelect(suggestion)
    onChange(kind === "institution" ? suggestion.name : suggestion.label)
    setSuggestions([])
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleInput(nextValue: string) {
    setSelectedId(null)
    onSelect(null)
    onChange(nextValue)
    setOpen(true)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => Math.min(suggestions.length - 1, index + 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => Math.max(0, index - 1))
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (event.key === "Escape") {
      setOpen(false)
    }
  }

  const helper = locale === "es"
    ? "Escribe al menos 3 caracteres. Puedes elegir un resultado o conservar tu entrada manual."
    : "Type at least 3 characters. Choose a result or keep your manual entry."

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}{required ? " *" : ""}
      </label>
      <div className="relative">
        {kind === "location" ? <MapPin className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" /> : <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />}
        <input
          id={inputId}
          value={value}
          onChange={(event) => handleInput(event.target.value)}
          onFocus={() => suggestions.length && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
        />
        {loading && <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-primary" aria-label={locale === "es" ? "Buscando" : "Searching"} />}
        {!loading && selectedId && <Check className="absolute right-3 top-3 size-4 text-emerald-600" aria-label={locale === "es" ? "Resultado seleccionado" : "Result selected"} />}
      </div>
      <p className="mt-1 text-[0.65rem] leading-relaxed text-muted-foreground">{helper}</p>
      {error && <p className="mt-1 text-[0.65rem] text-amber-700">{locale === "es" ? "La búsqueda no está disponible; la entrada manual sigue funcionando." : "Search is unavailable; manual entry still works."}</p>}

      {open && suggestions.length > 0 && (
        <ul id={listboxId} role="listbox" className="absolute z-40 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl">
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} id={`${listboxId}-${index}`} role="option" aria-selected={activeIndex === index}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectSuggestion(suggestion)}
                className={cn("w-full rounded-xl px-3 py-2.5 text-left transition-colors", activeIndex === index ? "bg-primary/10" : "hover:bg-accent/50")}
              >
                <span className="block text-sm font-semibold text-foreground">{suggestion.name}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{suggestion.detail}</span>
              </button>
            </li>
          ))}
          <li className="px-3 pb-1 pt-2 text-[0.6rem] text-muted-foreground">
            {locale === "es" ? "Datos de ubicación © colaboradores de OpenStreetMap." : "Location data © OpenStreetMap contributors."}
          </li>
        </ul>
      )}
    </div>
  )
}
