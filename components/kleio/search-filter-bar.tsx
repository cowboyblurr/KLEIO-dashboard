"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import { inkColor, mutedColor, lavenderSoftLine } from "@/lib/workspace-styles"

function valueForChip(chip: string) {
  const normalized = chip.toLowerCase()
  if (normalized.startsWith("all")) return ""
  if (normalized.includes("high fit")) return "fit"
  if (normalized.includes("due soon")) return "due"
  if (normalized.includes("material")) return "material"
  if (normalized.includes("review")) return "review"
  return chip.replace(/^all\s+/i, "")
}

export function SearchFilterBar({
  placeholder,
  value = "",
  onChange,
  filterChips,
  suggestions = [],
}: {
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  filterChips?: string[]
  suggestions?: string[]
}) {
  const [open, setOpen] = useState(false)
  const visibleSuggestions = useMemo(() => {
    const q = value.trim().toLowerCase()
    return suggestions
      .filter((suggestion) => !q || suggestion.toLowerCase().includes(q))
      .slice(0, 6)
  }, [suggestions, value])

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: mutedColor }} />
        <input
          type="search"
          value={value}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            onChange?.(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false)
            if (event.key === "Enter" && visibleSuggestions[0] && onChange) {
              event.preventDefault()
              onChange(visibleSuggestions[0])
              setOpen(false)
            }
          }}
          placeholder={placeholder}
          readOnly={!onChange}
          className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#D8D0F2] focus:ring-2 focus:ring-[#F1ECFB]"
          style={{ borderColor: lavenderSoftLine, color: inkColor }}
        />
        {open && onChange && visibleSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-2xl border border-[#E7E1F7] bg-white shadow-[0_16px_40px_rgba(82,64,130,0.12)]">
            <p className="border-b border-[#E7E1F7] px-3 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Suggested searches</p>
            <div className="p-1.5">
              {visibleSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(suggestion); setOpen(false) }} className="block w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-[#292631] transition-colors hover:bg-[#F7F4FF]">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {filterChips && filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => {
            const chipValue = valueForChip(chip)
            const active = Boolean(value && chipValue && value.toLowerCase() === chipValue.toLowerCase()) || (!value && chipValue === "")
            return (
              <button key={chip} type="button" onClick={() => onChange?.(chipValue)} disabled={!onChange} className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default ${active ? "bg-[#F7F4FF]" : "hover:bg-[#F7F4FF]"}`} style={{ borderColor: active ? "#D8D0F2" : lavenderSoftLine, color: active ? "#5B4B8A" : inkColor }}>
                {chip}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
