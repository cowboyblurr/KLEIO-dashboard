"use client"

import type { ReactNode } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { Sidebar } from "@/components/kleio/sidebar"
import { TopBar } from "@/components/kleio/top-bar"

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <AuthGate requiredRole="institution">
      <div className="flex h-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <TopBar />
          <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
        </div>
      </div>
    </AuthGate>
  )
}
