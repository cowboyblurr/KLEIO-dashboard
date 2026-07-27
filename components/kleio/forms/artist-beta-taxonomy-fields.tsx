"use client"

import { useId, useMemo, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import {
  canonicalTaxonomyValue,
  normalizeArtistTerms,
  taxonomyLabel,
  type ArtistTaxonomyOption,
} from "@/lib/kleio-artist-taxonomy"

const field = "rounded-xl border border-border bg-background p-2 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
const input = "h-9 min-w-0 flex-1 border-0 bg-transparent px-2 text-sm text-foreground outline-none"

function matches(option: ArtistTaxonomyOption, query: string) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [option.value, option.label, option.labelEs, ...(option.aliases ?? [])]
    .some((value) => value.toLowerCase().includes(needle))
}

export function PrimaryTaxonomySelect({
  label,
  value,
  onChange,
  options,
  locale = "en",
  required = false,
  placeholder,
  helper,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: ArtistTaxonomyOption[]
  locale?: "en" | "es"
  required?: boolean
  placeholder: string
  helper?: string
}) {
  const id = useId()
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground" htmlFor={id}>
      <span>{label}{required ? " *" : ""}</span>
      <select
        id={id}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {locale === "es" ? option.labelEs : option.label}
          </option>
        ))}
      </select>
      {helper && <span className="text-[0.68rem] leading-relaxed text-muted-foreground">{helper}</span>}
    </label>
  )
}

export function TaxonomyMultiSelect({
  label,
  values,
  onChange,
  options,
  locale = "en",
  placeholder,
  helper,
  allowCustom = true,
  kind = "free",
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  options: ArtistTaxonomyOption[]
  locale?: "en" | "es"
  placeholder: string
  helper?: string
  allowCustom?: boolean
  kind?: "discipline" | "medium" | "free"
}) {
  const id = useId()
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const selected = normalizeArtistTerms(values, kind)

  const filtered = useMemo(
    () => options.filter((option) => !selected.includes(option.value) && matches(option, query)).slice(0, 12),
    [options, query, selected],
  )
  const exactKnown = options.some((option) =>
    [option.value, option.label, option.labelEs, ...(option.aliases ?? [])]
      .some((candidate) => candidate.toLowerCase() === query.trim().toLowerCase()),
  )
  const canAddCustom = allowCustom && Boolean(query.trim()) && !exactKnown
    && !selected.some((entry) => entry.toLowerCase() === query.trim().toLowerCase())
  const choices = [
    ...filtered,
    ...(canAddCustom ? [{ value: `custom:${query.trim()}`, label: query.trim(), labelEs: query.trim() }] : []),
  ]

  function add(rawValue: string) {
    const value = rawValue.startsWith("custom:")
      ? rawValue.slice(7)
      : canonicalTaxonomyValue(rawValue, options)
    onChange(normalizeArtistTerms([...selected, value], kind))
    setQuery("")
    setOpen(false)
    setActiveIndex(0)
  }

  return (
    <fieldset>
      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</legend>
      <div className={field}>
        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selected.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onChange(selected.filter((entry) => entry !== value))}
                className="inline-flex items-center gap-1 rounded-full bg-[#F7F4FF] px-2.5 py-1 text-xs font-medium text-[#5B4B8A]"
                aria-label={`${locale === "es" ? "Eliminar" : "Remove"} ${taxonomyLabel(value, options, locale)}`}
              >
                {taxonomyLabel(value, options, locale)}
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
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setActiveIndex(0)
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault()
                setOpen(true)
                setActiveIndex((index) => Math.min(index + 1, Math.max(choices.length - 1, 0)))
              }
              if (event.key === "ArrowUp") {
                event.preventDefault()
                setActiveIndex((index) => Math.max(index - 1, 0))
              }
              if (event.key === "Enter" && open && choices[activeIndex]) {
                event.preventDefault()
                add(choices[activeIndex].value)
              }
              if (event.key === "Escape") setOpen(false)
              if (event.key === "Backspace" && !query && selected.length) {
                onChange(selected.slice(0, -1))
              }
            }}
          />
          {query.trim() && (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choices[activeIndex] && add(choices[activeIndex].value)}
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border text-primary"
              aria-label={`Add ${label.toLowerCase()}`}
            >
              <Plus className="size-4" />
            </button>
          )}
        </div>
        {open && choices.length > 0 && (
          <div id={`${id}-listbox`} role="listbox" className="mt-1 max-h-56 overflow-auto rounded-lg border border-border bg-background py-1 shadow-lg">
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
      {helper && <p className="mt-1 text-[0.68rem] leading-relaxed text-muted-foreground">{helper}</p>}
    </fieldset>
  )
}
