import type { Metadata } from "next"
import { ArtistShell } from "@/components/kleio/artist-shell"
import { ArtistDashboardView } from "@/components/kleio/artist-dashboard-view"
import { ArtistIntentRedirector } from "@/components/kleio/artist-intent-redirector"
import { OnboardingPersonalizationPanel } from "@/components/kleio/onboarding-personalization-panel"

/** Artist dashboard overview — private workspace, not the public homepage. */
export const metadata: Metadata = {
  title: "KLEIO — Artist Workspace",
  description:
    "Manage your Creative Passport, application materials, opportunities, and submission progress from one place.",
}

export default function Page() {
  return (
    <ArtistShell>
      <ArtistIntentRedirector />
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <OnboardingPersonalizationPanel role="artist" />
        </div>
        <div className="min-h-0 flex-1">
          <ArtistDashboardView />
        </div>
      </div>
    </ArtistShell>
  )
}
