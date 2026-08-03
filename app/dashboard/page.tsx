import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { InstitutionDashboardOverview } from "@/components/kleio/institution-dashboard-overview"
import { OnboardingPersonalizationPanel } from "@/components/kleio/onboarding-personalization-panel"

/** Institution dashboard overview — private workspace, not the public homepage. */
export const metadata: Metadata = {
  title: "KLEIO — Institution Workspace",
  description:
    "Manage submissions, reviewer progress, missing materials, shortlists, and reports from one organized workspace.",
}

export default function Page() {
  return (
    <DashboardShell>
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <OnboardingPersonalizationPanel role="institution" />
        </div>
        <div className="min-h-0 flex-1">
          <InstitutionDashboardOverview />
        </div>
      </div>
    </DashboardShell>
  )
}
