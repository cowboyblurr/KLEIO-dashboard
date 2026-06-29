import type { ReactNode } from "react"
import { Sidebar } from "@/components/kleio/sidebar"
import { TopBar } from "@/components/kleio/top-bar"

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen overflow-x-hidden bg-background text-foreground lg:h-screen lg:overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}
