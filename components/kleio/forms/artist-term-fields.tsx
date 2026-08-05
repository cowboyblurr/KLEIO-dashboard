"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import {
  ARTIST_DISCIPLINE_OPTIONS,
  canonicalDisciplineValue,
  disciplineLabel,
  normalizeArtistTerms,
} from "@/lib/kleio-artist-taxonomy"

const field = "rounded-lg border border-[#E7E1F7] bg-white p-2 focus-within:border-[#A997E8] focus-within:ring-2 focus-within:ring-[#A997E8]/15"
const input = "h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground outline-none"

export function DisciplineMultiSelect({
  values,
  onChange,
  locale = "en",
}: {
  values: string[]
  onChange: (values: string[]) => void
  locale?: "en" | "es"
}) {
  const id = useId()
  const rootRef = useRef<HTMLFieldSetElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = normalizeArtistTerms(values, "discipline")
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return ARTIST_DISCIPLINE_OPTIONS.filter((option) => {
      if (selected.includes(option.value)) return false
      return !needle || `${option.label} ${option.labelEs}`.toLowerCase().includes(needle)
    }).slice(0, 10)
  }, [query, selected])
  const exactKnown = ARTIST_DISCIPLINE_OPTIONS.some((option) => [option.value, option.label.toLowerCase(), option.labelEs.toLowerCase()].includes(query.trim().toLowerCase()))
  const canAddCustom = Boolean(query.trim()) && !exactKnown && !selected.some((value) => value.toLowerCase() === query.trim().toLowerCase())
  const choices = [...filtered, ...(canAddCustom ? [{ value: `custom:${query.trim()}`, label: query.trim(), labelEs: query.trim() }] : [])]

  useEffect(() => {
    if (!open) return
    function dismissOutside(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return
      setOpen(false)
      setActiveIndex(0)
    }
    document.addEventListener("pointerdown", dismissOutside)
    return () => document.removeEventListener("pointerdown", dismissOutside)
  }, [open])

  function add(value: string) {
    const nextValue = value.startsWith("custom:") ? value.slice(7) : canonicalDisciplineValue(value)
    onChange(normalizeArtistTerms([...selected, nextValue], "discipline"))
    setQuery("")
    setOpen(false)
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  function remove(value: string) {
    onChange(selected.filter((entry) => entry !== value))
  }

  function close() {
    setOpen(false)
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  return (
    <fieldset ref={rootRef}>
      <legend className="mb-1.5 text-xs font-semibold text-[#746E80]">{locale === "es" ? "Disciplinas creativas" : "Creative disciplines"}</legend>
      <p id={`${id}-help`} className="mb-2 text-[0.68rem] leading-relaxed text-muted-foreground">
        {locale === "es" ? "Elige los campos creativos amplios que describen tu práctica, como pintura, fotografía, cine o performance." : "Choose the broad creative fields that describe your practice, such as painting, photography, film, or performance."}
      </p>
      <div className={field}>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selected.map((value) => (
              <button key={value} type="button" onClick={() => remove(value)} className="inline-flex items-center gap-1 rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-medium text-[#5B4B8A]" aria-label={`${locale === "es" ? "Eliminar" : "Remove"} ${disciplineLabel(value, locale)}`}>
                {disciplineLabel(value, locale)}
                <X className="size-3" aria-hidden />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <Search className="ml-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
          <input
            ref={inputRef}
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={open && choices[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
            aria-describedby={`${id}-help`}
            autoComplete="off"
            className={input}
            value={query}
            placeholder={locale === "es" ? "Buscar fotografía, pintura…" : "Search photography, painting…"}
            onFocus={() => setOpen(true)}
            onChange={(event) => { setQuery(event.target.value); setOpen(true); setActiveIndex(0) }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(choices.length - 1, 0))) }
              if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)) }
              if (event.key === "Enter" && open && choices[activeIndex]) { event.preventDefault(); add(choices[activeIndex].value) }
              if (event.key === "Escape") { event.preventDefault(); close() }
              if (event.key === "Backspace" && !query && selected.length) remove(selected[selected.length - 1])
            }}
          />
          {open && <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={close} className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#E7E1F7] text-[#5B4B8A]" aria-label={locale === "es" ? "Cerrar opciones de disciplinas" : "Close discipline options"}><X className="size-4" /></button>}
        </div>
        {open && choices.length > 0 && (
          <div id={`${id}-listbox`} role="listbox" className="mt-1 max-h-52 overflow-auto rounded-lg border border-[#E7E1F7] bg-white py-1 shadow-lg">
            {choices.map((option, index) => (
              <button
                id={`${id}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                key={option.value}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => add(option.value)}
                className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm ${index === activeIndex ? "bg-[#F7F4FF]" : "hover:bg-[#FDFBFF]"}`}
              >
                <span>{option.value.startsWith("custom:") ? option.label : locale === "es" ? option.labelEs : option.label}</span>
                {option.value.startsWith("custom:") && <Plus className="size-4 text-primary" aria-hidden />}
              </button>
            ))}
          </div>
        )}
      </div>
    </fieldset>
  )
}

export function TagEntryField({
  values,
  onChange,
  label,
  placeholder,
  description,
}: {
  values: string[]
  onChange: (values: string[]) => void
  label: string
  placeholder: string
  description?: string
}) {
  const id = useId()
  const [draft, setDraft] = useState("")
  const selected = normalizeArtistTerms(values)

  function commit() {
    if (!draft.trim()) return
    onChange(normalizeArtistTerms([...selected, draft]))
    setDraft("")
  }

  const resolvedDescription = description || (label.toLowerCase().includes("medium")
    ? "Describe what you work with or how you create the work—for example oil on canvas, analog photography, field recording, or digital collage."
    : "Add values one at a time; capitalization and spacing duplicates are merged safely.")

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-[#746E80]">{label}</legend>
      <p id={`${id}-help`} className="mb-2 text-[0.68rem] leading-relaxed text-muted-foreground">{resolvedDescription}</p>
      <div className={field}>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selected.map((value) => (
              <button key={value} type="button" onClick={() => onChange(selected.filter((entry) => entry !== value))} className="inline-flex items-center gap-1 rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-medium text-[#5B4B8A]" aria-label={`Remove ${value}`}>
                {value}<X className="size-3" aria-hidden />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1">
          <input
            id={id}
            aria-describedby={`${id}-help`}
            className={input}
            value={draft}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") { event.preventDefault(); commit() }
              if (event.key === "Backspace" && !draft && selected.length) onChange(selected.slice(0, -1))
            }}
          />
          <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={commit} className="grid size-8 shrink-0 place-items-center rounded-lg border border-[#E7E1F7] text-[#5B4B8A]" aria-label={`Add ${label.toLowerCase()}`}><Plus className="size-4" /></button>
        </div>
      </div>
    </fieldset>
  )
}
