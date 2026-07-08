"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { CollaboratorSidebar } from "@/components/kleio/collaborator-sidebar"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoPresentationStyles } from "@/components/kleio/demo-presentation-styles"
import { GuideWalkthroughCollapser } from "@/components/kleio/guide-walkthrough-collapser"
import { DemoClickFeedbackLayer } from "@/components/kleio/demo-click-feedback-layer"
import { DemoGuideHighlightLayer } from "@/components/kleio/demo-guide-highlight-layer"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function CollaboratorShell({ children }: { children: ReactNode }) {
  const { isDemo } = useKleioMode()

  return (
    <AuthGate requiredRole="collaborator">
      <DemoPresentationStyles />
      {isDemo && <GuideWalkthroughCollapser />}
      {isDemo && <DemoClickFeedbackLayer />}
      {isDemo && <DemoGuideHighlightLayer />}
      <div className="relative flex h-screen overflow-x-auto overflow-y-hidden bg-background text-foreground">
        <CollaboratorSidebar />
        <div className="min-w-[860px] flex-1 overflow-x-auto overflow-y-hidden">{children}</div>
        <DemoEnvironmentBadge compact className="pointer-events-none absolute right-5 top-5 z-30 hidden 2xl:inline-flex" />
      </div>
      {isDemo && <KleioDemoGuide variant="workspace" />}
    </AuthGate>
  )
}
