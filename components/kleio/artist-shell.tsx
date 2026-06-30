"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { ArtistSidebar } from "@/components/kleio/artist-sidebar"

export function ArtistShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate requiredRole="artist">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <ArtistSidebar />
        <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </AuthGate>
  )
}
