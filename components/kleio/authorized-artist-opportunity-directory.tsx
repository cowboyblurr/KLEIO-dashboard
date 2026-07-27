"use client"

import { useEffect, useRef, useState } from "react"
import { SlidersHorizontal, X } from "lucide-react"
import { LiveGlobalArtistOpportunitiesWithImages } from "@/components/kleio/live-global-artist-opportunities-with-images"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { ARTIST_DISCIPLINE_OPTIONS, disciplineLabel } from "@/lib/kleio-artist-taxonomy"

function setReactInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

export function AuthorizedArtistOpportunityDirectory() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { locale } = useKleioLocale()
  const [discipline, setDiscipline] = useState("")

  useEffect(() => {
    const rootElement = rootRef.current
    if (!rootElement) return

    function enforceAuthorizedEntryPoints() {
      for (const button of rootElement.querySelectorAll("button")) {
        if (button.textContent?.trim() === "Message institution") {
          button.disabled = true
          button.hidden = true
          button.setAttribute("aria-hidden", "true")
          button.setAttribute("tabindex", "-1")
        }
      }
    }

    enforceAuthorizedEntryPoints()
    const observer = new MutationObserver(enforceAuthorizedEntryPoints)
    observer.observe(rootElement, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  function applyDiscipline(next: string) {
    setDiscipline(next)
    const input = rootRef.current?.querySelector<HTMLInputElement>('input[type="search"]')
    if (input) {
      setReactInputValue(input, next ? disciplineLabel(next, locale) : "")
      input.focus()
    }
  }

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      <div className="mx-auto w-full max-w-[1180px] shrink-0 px-4 pt-4 sm:px-6">
        <section className="flex flex-col gap-3 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 sm:flex-row sm:items-end sm:justify-between" aria-label="Discipline opportunity filter">
          <label className="grid min-w-0 flex-1 gap-1.5 text-xs font-semibold text-[#625C70]">
            <span className="flex items-center gap-2"><SlidersHorizontal className="size-3.5 text-[#6A5896]" />Discipline filter</span>
            <select
              value={discipline}
              onChange={(event) => applyDiscipline(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#D8D0F2] bg-white px-3 text-sm text-[#292631] outline-none focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
            >
              <option value="">All disciplines</option>
              {ARTIST_DISCIPLINE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {locale === "es" ? option.labelEs : option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="max-w-xl text-xs leading-5 text-[#746E80]">
            <p>This filter writes a real discipline criterion into KLEIO’s sourced search. Results must contain that discipline or a recognized alias; the filter does not create cosmetic matches.</p>
            {discipline && (
              <button type="button" onClick={() => applyDiscipline("")} className="mt-1 inline-flex items-center gap-1 font-semibold text-[#5B4B8A] hover:underline">
                <X className="size-3" />Clear {disciplineLabel(discipline, locale)}
              </button>
            )}
          </div>
        </section>
      </div>
      <div className="min-h-0 flex-1">
        <LiveGlobalArtistOpportunitiesWithImages />
      </div>
    </div>
  )
}
