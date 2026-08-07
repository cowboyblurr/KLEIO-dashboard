import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationMediaImportBar } from "@/components/kleio/application-media-import-bar"
import { ApplicationRequirementMedia } from "@/components/kleio/application-requirement-media"
import { ApplicationComposerWorkspace } from "@/components/kleio/application-composer-workspace"
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
      <div className="h-full min-h-0 overflow-y-auto bg-[#FCFBFE]">
        <div className="mx-auto max-w-[1120px] space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <Suspense fallback={null}>
            <PracticeSubmissionResetControl />
          </Suspense>

          <Suspense fallback={null}>
            <ApplicationMediaImportBar />
          </Suspense>

          <Suspense fallback={null}>
            <ApplicationRequirementMedia />
          </Suspense>

          <Suspense fallback={<PreparationFallback />}>
            <ApplicationComposerWorkspace />
          </Suspense>

          <section className="rounded-2xl border border-[#E7E1F7] bg-white p-4 sm:p-5 [&>button]:!static [&>button]:!min-h-10 [&>button]:!shadow-none">
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8874C1]">After final review</p>
              <h2 className="mt-1 text-base font-semibold text-[#292631]">Recipient access and replies</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Use this only when you want to create or revoke KLEIO recipient access, inspect recipient activity, or continue the application conversation. It no longer floats over the preparation workspace.</p>
            </div>
            <Suspense fallback={null}>
              <ApplicationRecipientLoopPanel />
            </Suspense>
          </section>

          <Suspense fallback={null}>
            <ApplicationTimelinePanel />
          </Suspense>

          <Suspense fallback={null}>
            <ArtistRecipientConversation />
          </Suspense>
        </div>
      </div>
    </ArtistShell>
  )
}
