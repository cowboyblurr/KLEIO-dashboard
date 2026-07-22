import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveOpportunitySubmission } from "@/components/kleio/live-opportunity-submission"

export const metadata: Metadata = {
  title: "KLEIO — Submit an Opportunity",
  description: "Submit an external artist opportunity for KLEIO moderation and source review.",
}

function PreviewNotice() {
  return <main className="h-full overflow-y-auto px-6 py-8"><div className="mx-auto max-w-3xl rounded-2xl border border-[#E7E1F7] bg-white p-6"><h1 className="font-serif text-2xl font-semibold">Submit an opportunity</h1><p className="mt-2 text-sm text-muted-foreground">Provider submissions are available only in an authenticated institution workspace. Guided-demo records remain synthetic and are not submitted for publication.</p></div></main>
}

export default function Page() {
  return <DashboardShell><LiveModeView live={<LiveOpportunitySubmission />} preview={<PreviewNotice />} /></DashboardShell>
}
