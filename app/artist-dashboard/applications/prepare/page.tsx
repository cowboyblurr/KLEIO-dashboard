import type { Metadata } from "next"
import { Suspense } from "react"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ApplicationPreparationWorkspace } from "@/components/kleio/application-preparation-workspace"

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
      <Suspense fallback={<PreparationFallback />}>
        <ApplicationPreparationWorkspace />
      </Suspense>
    </ArtistShell>
  )
}
