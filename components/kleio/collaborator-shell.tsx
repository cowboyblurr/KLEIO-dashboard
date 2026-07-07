"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { CollaboratorSidebar } from "@/components/kleio/collaborator-sidebar"
import { KleioDemoGuide } from "@/components/kleio/kleio-demo-guide"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { DemoPresentationStyles } from "@/components/kleio/demo-presentation-styles"

export function CollaboratorShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate requiredRole="collaborator">
      <DemoPresentationStyles />
      <div className="relative flex h-screen overflow-hidden bg-background text-foreground">
        <CollaboratorSidebar />
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
        <DemoEnvironmentBadge compact className="pointer-events-none absolute right-5 top-5 z-30 hidden 2xl:inline-flex" />
      </div>
      <KleioDemoGuide variant="workspace" />
    </AuthGate>
  )
}
