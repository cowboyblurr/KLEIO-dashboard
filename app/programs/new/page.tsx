import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ProgramsNewPageView } from "@/components/kleio/programs-new-page-view"
import { InstitutionCleoStatusBar } from "@/components/kleio/institution-cleo-status-bar"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveInstitutionCallsWithImages } from "@/components/kleio/live-institution-calls-with-images"

export default function Page() {
  return (
    <DashboardShell>
      <div className="flex h-full min-h-0 flex-col bg-white">
        <div className="shrink-0 px-4 pt-4 sm:px-6">
          <InstitutionCleoStatusBar />
        </div>
        <div className="min-h-0 flex-1">
          <LiveModeView live={<LiveInstitutionCallsWithImages />} preview={<ProgramsNewPageView />} />
        </div>
      </div>
    </DashboardShell>
  )
}
