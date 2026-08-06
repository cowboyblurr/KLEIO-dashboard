import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationPreparationWorkspace } from "@/components/kleio/application-preparation-workspace"
import { ApplicationArtistIdentityBar } from "@/components/kleio/application-artist-identity-bar"
import { ApplicationSubmissionCover } from "@/components/kleio/application-submission-cover"
import { ApplicationMediaImportBar } from "@/components/kleio/application-media-import-bar"
import { ApplicationRequirementMedia } from "@/components/kleio/application-requirement-media"
import { ApplicationRecipientLoopPanel } from "@/components/kleio/application-recipient-loop-panel"
import { ArtistRecipientConversation } from "@/components/kleio/artist-recipient-conversation"
import { PracticeSubmissionResetControl } from "@/components/kleio/practice-submission-reset-control"

export const metadata: Metadata = {
  title: "KLEIO — Prepare application",
  description: "Review source requirements, assemble reusable artist media, approve an artist-controlled application package, and prepare a truthful recipient handoff.",
}

function PreparationFallback() {
  return <div role="status" className="rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground">Preparing the application workspace…</div>
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col bg-[#FCFBFE]">
        <ApplicationArtistIdentityBar />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1120px] space-y-5 px-4 py-5 sm:px-6">
            <Suspense fallback={<PreparationFallback />}>
              <div className="[&>main]:!h-auto [&>main]:!overflow-visible [&>main]:!px-0 [&>main]:!py-0 [&>main>div]:!max-w-none">
                <ApplicationPreparationWorkspace />
              </div>
            </Suspense>

            <Suspense fallback={null}>
              <ApplicationRequirementMedia />
            </Suspense>
            <Suspense fallback={null}>
              <ApplicationMediaImportBar />
            </Suspense>
            <Suspense fallback={null}>
              <ApplicationSubmissionCover />
            </Suspense>
            <Suspense fallback={null}>
              <ArtistRecipientConversation />
            </Suspense>
            <Suspense fallback={null}>
              <div className="[&>button]:!static [&>button]:!z-auto [&>button]:!min-h-11 [&>button]:!w-full [&>button]:!justify-center [&>button]:!rounded-2xl [&>button]:!shadow-[0_12px_34px_rgba(51,42,77,0.16)]">
                <ApplicationRecipientLoopPanel />
              </div>
            </Suspense>
            <Suspense fallback={null}>
              <PracticeSubmissionResetControl />
            </Suspense>
          </div>
        </div>
      </div>
    </ArtistShell>
  )
}
