import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationPreparationWorkspace } from "@/components/kleio/application-preparation-workspace"
import { ApplicationArtistIdentityBar } from "@/components/kleio/application-artist-identity-bar"
import { ApplicationSubmissionCover } from "@/components/kleio/application-submission-cover"
import { VerifiedApplicationPreparationGate } from "@/components/kleio/verified-application-preparation-gate"

export const metadata: Metadata = {
  title: "KLEIO — Prepare application",
  description: "Review source requirements, assemble Creative Passport materials, and approve an artist-controlled application package.",
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
            <VerifiedApplicationPreparationGate>
              <ApplicationPreparationWorkspace />
            </VerifiedApplicationPreparationGate>
          </Suspense>
        </div>
      </div>
    </ArtistShell>
  )
}
