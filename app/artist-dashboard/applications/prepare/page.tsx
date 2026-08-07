import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationComposerWorkspace } from "@/components/kleio/application-composer-workspace"
import { ApplicationArtistIdentityBar } from "@/components/kleio/application-artist-identity-bar"
import { ApplicationSubmissionCover } from "@/components/kleio/application-submission-cover"
import { ApplicationMediaImportBar } from "@/components/kleio/application-media-import-bar"
import { ApplicationRequirementMedia } from "@/components/kleio/application-requirement-media"
import { ApplicationRecipientLoopPanel } from "@/components/kleio/application-recipient-loop-panel"
import { ApplicationTimelinePanel } from "@/components/kleio/application-timeline-panel"
import { ArtistRecipientConversation } from "@/components/kleio/artist-recipient-conversation"
import { PracticeSubmissionResetControl } from "@/components/kleio/practice-submission-reset-control"

export const metadata: Metadata = {
  title: "KLEIO — Prepare application",
  description: "Turn approved Creative Passport material into an opportunity-specific, editable, preflight-checked and historically preserved application.",
}

function PreparationFallback() {
  return <main className="px-0 py-2"><div className="rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground">Preparing the application composer…</div></main>
}

export default function Page() {
  return (
    <ArtistShell>
      <div className="flex h-full min-h-0 flex-col">
        <ApplicationArtistIdentityBar />
        <Suspense fallback={null}>
          <ApplicationSubmissionCover />
        </Suspense>
        <Suspense fallback={null}>
          <ApplicationMediaImportBar />
        </Suspense>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1120px] space-y-5 px-4 py-5 sm:px-6">
            <Suspense fallback={null}>
              <PracticeSubmissionResetControl />
            </Suspense>
            <Suspense fallback={null}>
              <ApplicationRequirementMedia />
            </Suspense>
            <Suspense fallback={<PreparationFallback />}>
              <ApplicationComposerWorkspace />
            </Suspense>
            <Suspense fallback={null}>
              <ApplicationTimelinePanel />
            </Suspense>
            <Suspense fallback={null}>
              <ArtistRecipientConversation />
            </Suspense>
          </div>
        </div>
        <Suspense fallback={null}>
          <ApplicationRecipientLoopPanel />
        </Suspense>
      </div>
    </ArtistShell>
  )
}