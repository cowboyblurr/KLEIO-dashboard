"use client"

import { useId, useMemo, useState } from "react"
import { Check, Plus, Search, X } from "lucide-react"
import {
  ARTIST_DISCIPLINE_OPTIONS,
  canonicalDisciplineValue,
  disciplineLabel,
  normalizeArtistTerms,
} from "@/lib/kleio-artist-taxonomy"

const field = "rounded-xl border border-[#E7E1F7] bg-white p-2 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10"
const input = "h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground outline-none"

export function DisciplineMultiSelect({
  values,
  onChange,
  locale = "en",
  label = "Disciplines",
  helper,
}: {
  values: string[]
  onChange: (values: string[]) => void
  locale?: "en" | "es"
  label?: string
  helper?: string
}) {
  const id = useId()
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

  function add(value: string) {
    const nextValue = value.startsWith("custom:") ? value.slice(7) : canonicalDisciplineValue(value)
    onChange(normalizeArtistTerms([...selected, nextValue], "discipline"))
    setQuery("")
    setOpen(false)
    setActiveIndex(0)
  }

  function remove(value: string) {
    onChange(selected.filter((entry) => entry !== value))
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</legend>
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
            id={id}
            role="combobox"
            aria-expanded={open}
            aria-controls={`${id}-listbox`}
            aria-activedescendant={open && choices[activeIndex] ? `${id}-option-${activeIndex}` : undefined}
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
              if (event.key === "Escape") setOpen(false)
              if (event.key === "Backspace" && !query && selected.length) remove(selected[selected.length - 1])
            }}
          />
        </div>
        {open && choices.length > 0 && (
          <div id={`${id}-listbox`} role="listbox" className="mt-1 max-h-52 overflow-auto rounded-lg border border-[#E7E1F7] bg-white py-1 shadow-lg">
            {choices.map((option, index) => {
              const custom = option.value.startsWith("custom:")
              return (
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
                  <span>{custom ? option.label : locale === "es" ? option.labelEs : option.label}</span>
                  {custom ? <Plus className="size-4 text-primary" aria-hidden /> : <Check className="size-4 text-transparent" aria-hidden />}
                </button>
              )
            })}
          </div>
        )}
      </div>
      {helper && <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">{helper}</p>}
    </fieldset>
  )
}

export function TagEntryField({
  values,
  onChange,
  label,
  placeholder,
  helper,
}: {
  values: string[]
  onChange: (values: string[]) => void
  label: string
  placeholder?: string
  helper?: string
}) {
  const [draft, setDraft] = useState("")
  const selected = normalizeArtistTerms(values)

  function commit() {
    if (!draft.trim()) return
    onChange(normalizeArtistTerms([...selected, draft]))
    setDraft("")
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-semibold text-muted-foreground">{label}</legend>
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
            className={input}
            value={draft}
            placeholder={placeholder || "Type a value and press Enter"}
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
      {helper && <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">{helper}</p>}
    </fieldset>
  )
}
