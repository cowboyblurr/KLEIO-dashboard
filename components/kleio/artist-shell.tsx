import type { ReactNode } from "react"
import { ArtistSidebar } from "@/components/kleio/artist-sidebar"

export function ArtistShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <ArtistSidebar />
      <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
