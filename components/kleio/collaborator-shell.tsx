"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { CollaboratorSidebar } from "@/components/kleio/collaborator-sidebar"

export function CollaboratorShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate requiredRole="collaborator">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <CollaboratorSidebar />
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </AuthGate>
  )
}
