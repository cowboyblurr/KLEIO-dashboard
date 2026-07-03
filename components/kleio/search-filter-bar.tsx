"use client"

import { Search } from "lucide-react"
import { inkColor, mutedColor, lavenderSoftLine } from "@/lib/workspace-styles"

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
          {filterChips.map((chip) => (
            <button
              key={chip}
              type="button"
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[#F7F4FF]"
              style={{ borderColor: lavenderSoftLine, color: inkColor }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
