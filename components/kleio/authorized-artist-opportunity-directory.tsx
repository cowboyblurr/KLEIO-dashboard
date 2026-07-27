"use client"

import { useEffect, useRef } from "react"
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
      <div className="min-h-0 flex-1">
        <LiveGlobalArtistOpportunitiesWithImages />
      </div>
    </div>
  )
}
