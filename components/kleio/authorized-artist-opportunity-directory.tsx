"use client"

import { useEffect, useRef } from "react"
import { ShieldCheck } from "lucide-react"
import { LiveGlobalArtistOpportunitiesWithImages } from "@/components/kleio/live-global-artist-opportunities-with-images"

export function AuthorizedArtistOpportunityDirectory() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    function enforceAuthorizedEntryPoints() {
      for (const button of root.querySelectorAll("button")) {
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
    observer.observe(root, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className="h-full">
      <div className="mx-auto max-w-[1180px] px-4 pt-4 sm:px-6">
        <div className="flex items-start gap-2 rounded-xl border border-[#E7E1F7] bg-[#FDFBFF] px-4 py-3 text-xs leading-5 text-[#625C70]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#6A5896]" />
          <p><strong className="text-[#292631]">Messaging boundary:</strong> artists may reply after an institution invitation or continue a conversation connected to a submitted application. Opportunity listings do not open unsolicited institution conversations.</p>
        </div>
      </div>
      <div className="h-[calc(100%-5rem)]">
        <LiveGlobalArtistOpportunitiesWithImages />
      </div>
    </div>
  )
}
