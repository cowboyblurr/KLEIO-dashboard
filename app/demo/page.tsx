import { Suspense } from "react"
import type { Metadata } from "next"
import { ScenarioPlaylistPage } from "@/components/kleio/scenario-playlist-page"
import { DemoTrustLink } from "@/components/kleio/demo-trust-link"
import { DemoProofLinks } from "@/components/kleio/demo-proof-links"

export const metadata: Metadata = {
  title: "KLEIO — Guided Demo",
  description:
    "Choose guided KLEIO walkthroughs for artist and institution workflows using synthetic demo data.",
}

export default function Page() {
  return (
    <>
      <DemoTrustLink className="fixed bottom-4 left-4 z-50 max-sm:hidden" />
      <DemoProofLinks />
      <Suspense
        fallback={
          <main className="min-h-dvh bg-white px-5 py-10 text-[#292631]">
            Loading guided demo…
          </main>
        }
      >
        <ScenarioPlaylistPage />
      </Suspense>
    </>
  )
}
