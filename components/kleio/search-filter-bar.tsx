"use client"

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
  value,
  onChange,
  filterChips,
}: {
  placeholder: string
  value?: string
  onChange?: (value: string) => void
  filterChips?: string[]
}) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: mutedColor }} />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={!onChange}
          className="h-10 w-full rounded-xl border bg-white pl-9 pr-3 text-sm outline-none transition-colors focus:border-[#D8D0F2] focus:ring-2 focus:ring-[#F1ECFB]"
          style={{ borderColor: lavenderSoftLine, color: inkColor }}
        />
      </div>
      {filterChips && filterChips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {filterChips.map((chip) => {
            const chipValue = valueForChip(chip)
            const active = Boolean(value && chipValue && value.toLowerCase() === chipValue.toLowerCase()) || (!value && chipValue === "")
            return (
              <button
                key={chip}
                type="button"
                onClick={() => onChange?.(chipValue)}
                disabled={!onChange}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-default ${active ? "bg-[#F7F4FF]" : "hover:bg-[#F7F4FF]"}`}
                style={{ borderColor: active ? "#D8D0F2" : lavenderSoftLine, color: active ? "#5B4B8A" : inkColor }}
              >
                {chip}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
