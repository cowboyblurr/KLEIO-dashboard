import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationPreparationOrchestrator } from "@/components/kleio/application-preparation-orchestrator"
import { ApplicationArtistIdentityBar } from "@/components/kleio/application-artist-identity-bar"
import { ApplicationSubmissionCover } from "@/components/kleio/application-submission-cover"

export const metadata: Metadata = {
  title: "KLEIO — Prepare application",
  description: "Review public-source evidence, compare requirements with the Creative Passport, and approve an artist-controlled application package.",
}

function PreparationFallback() {
  return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto max-w-[1120px] rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground">Preparing the application workspace…</div></main>
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col">
        <ApplicationArtistIdentityBar />
        <Suspense fallback={null}>
          <ApplicationSubmissionCover />
        </Suspense>
        <div className="min-h-0 flex-1">
          <Suspense fallback={<PreparationFallback />}>
            <ApplicationPreparationOrchestrator />
          </Suspense>
        </div>
      </div>
    </ArtistShell>
  )
}
