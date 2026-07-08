"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { Sidebar } from "@/components/kleio/sidebar"
import { TopBar } from "@/components/kleio/top-bar"
import { DemoPresentationStyles } from "@/components/kleio/demo-presentation-styles"
import { GuideWalkthroughCollapser } from "@/components/kleio/guide-walkthrough-collapser"
import { DemoClickFeedbackLayer } from "@/components/kleio/demo-click-feedback-layer"
import { DemoGuideHighlightLayer } from "@/components/kleio/demo-guide-highlight-layer"
import { DemoTrustLink } from "@/components/kleio/demo-trust-link"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isDemo } = useKleioMode()

  return (
    <AuthGate requiredRole="institution">
      <DemoPresentationStyles />
      {isDemo && <GuideWalkthroughCollapser />}
      {isDemo && <DemoClickFeedbackLayer />}
      {isDemo && <DemoGuideHighlightLayer />}
      {isDemo && <DemoTrustLink className="fixed bottom-4 left-4 z-40 max-lg:hidden" />}
      <div className="flex h-screen overflow-x-auto overflow-y-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-[920px] flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">{children}</div>
        </div>
      </div>
      {isDemo && <KleioDemoGuide variant="workspace" />}
    </AuthGate>
  )
}
