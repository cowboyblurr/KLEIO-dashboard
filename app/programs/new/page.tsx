import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ProgramsNewPageView } from "@/components/kleio/programs-new-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionCallsWithImages } from "@/components/kleio/live-institution-calls-with-images"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionCallsWithImages />} preview={<ProgramsNewPageView />} />
    </DashboardShell>
  )
}
