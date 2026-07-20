"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { ArtistSidebar } from "@/components/kleio/artist-sidebar"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoPresentationStyles } from "@/components/kleio/demo-presentation-styles"
import { GuideWalkthroughCollapser } from "@/components/kleio/guide-walkthrough-collapser"
import { DemoClickFeedbackLayer } from "@/components/kleio/demo-click-feedback-layer"
import { DemoGuideHighlightLayer } from "@/components/kleio/demo-guide-highlight-layer"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function ArtistShell({ children }: { children: ReactNode }) {
  const { isDemo } = useKleioMode()

  return (
    <AuthGate requiredRole="artist">
      <DemoPresentationStyles />
      {isDemo && <GuideWalkthroughCollapser />}
      {isDemo && <DemoClickFeedbackLayer />}
      {isDemo && <DemoGuideHighlightLayer />}
      <div className="relative flex h-dvh min-w-0 overflow-hidden bg-background pt-14 text-foreground md:pt-0">
        <ArtistSidebar />
        <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-hidden">{children}</div>
        <DemoEnvironmentBadge compact className="pointer-events-none absolute right-5 top-5 z-30 hidden 2xl:inline-flex" />
      </div>
      {isDemo && <KleioDemoGuide variant="workspace" />}
    </AuthGate>
  )
}
