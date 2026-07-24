"use client"

import { useEffect, useRef } from "react"
import { Globe2, Languages, ShieldCheck } from "lucide-react"
import { LiveGlobalArtistOpportunitiesWithImages } from "@/components/kleio/live-global-artist-opportunities-with-images"

export function AuthorizedArtistOpportunityDirectory() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const rootElement = rootRef.current!
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

  return (
    <div ref={rootRef} className="flex h-full min-h-0 flex-col">
      <div className="mx-auto w-full max-w-[1180px] shrink-0 space-y-3 px-4 pt-4 sm:px-6">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl border border-[#D8D0F2] bg-[#FDFBFF] px-4 py-3 text-xs leading-5 text-[#625C70]">
            <Globe2 className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
            <p><strong className="text-[#292631]">Worldwide discovery:</strong> KLEIO searches verified opportunities across regions and languages. Worldwide discovery does not mean every artist is eligible; citizenship, residence, partnership, and regional rules are checked against the Creative Passport.</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-[#D8D0F2] bg-[#FDFBFF] px-4 py-3 text-xs leading-5 text-[#625C70]">
            <Languages className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
            <p><strong className="text-[#292631]">Translation protocol:</strong> original titles, deadlines, currencies, requirements, and official sources remain authoritative. Contracts, rights clauses, tax forms, and binding declarations require human review when a translation is not verified.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-xs leading-5 text-[#625C70]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
          <p><strong className="text-[#292631]">Messaging boundary:</strong> artists may reply after an institution invitation or continue a conversation connected to a submitted application. Opportunity listings do not open unsolicited institution conversations.</p>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <LiveGlobalArtistOpportunitiesWithImages />
      </div>
    </div>
  )
}
