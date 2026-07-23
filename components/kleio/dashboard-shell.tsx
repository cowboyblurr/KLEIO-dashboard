"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { AuthGate } from "@/components/kleio/auth-gate"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { Sidebar } from "@/components/kleio/sidebar"
import { TopBar } from "@/components/kleio/top-bar"
import { DemoPresentationStyles } from "@/components/kleio/demo-presentation-styles"
import { GuideWalkthroughCollapser } from "@/components/kleio/guide-walkthrough-collapser"
import { DemoClickFeedbackLayer } from "@/components/kleio/demo-click-feedback-layer"
import { DemoGuideHighlightLayer } from "@/components/kleio/demo-guide-highlight-layer"
import { DemoTrustLink } from "@/components/kleio/demo-trust-link"
import { InternalMessengerAccent } from "@/components/kleio/internal-messenger-accent"
import { LiveInstitutionUnavailable } from "@/components/kleio/live-institution-unavailable"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"

function liveRouteFallback(pathname: string) {
  if (pathname === "/activity-log" || pathname === "/activity-log/") {
    return <LiveInstitutionUnavailable title="Activity log" description="Review a clear history of important workspace activity, including updates to programs, submissions, reviewer assignments, and decisions." />
  }
  if (pathname === "/templates" || pathname === "/templates/" || pathname.startsWith("/templates/")) {
    return <LiveInstitutionUnavailable title="Templates" description="Create reusable starting points for open calls, application questions, review criteria, applicant messages, and recurring program workflows." />
  }
  return null
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const { isDemo, isLive } = useKleioMode()
  const pathname = usePathname()
  const fallback = isLive ? liveRouteFallback(pathname) : null

  return (
    <AuthGate requiredRole="institution">
      <DemoPresentationStyles />
      {isDemo && <GuideWalkthroughCollapser />}
      {isDemo && <DemoClickFeedbackLayer />}
      {isDemo && <DemoGuideHighlightLayer />}
      {isDemo && <DemoTrustLink className="fixed bottom-4 left-4 z-40 max-lg:hidden" />}
      <div className="kleio-workspace-density flex h-dvh min-w-0 overflow-hidden bg-background pt-14 text-foreground md:pt-0">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-hidden">{fallback ?? children}</div>
        </div>
        <InternalMessengerAccent />
      </div>
      {isDemo && <KleioDemoGuide variant="workspace" />}
    </AuthGate>
  )
}
