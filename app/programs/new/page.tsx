import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ProgramsNewPageView } from "@/components/kleio/programs-new-page-view"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionCalls } from "@/components/kleio/live-institution-workspace"

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionCalls />} preview={<ProgramsNewPageView />} />
    </DashboardShell>
  )
}
