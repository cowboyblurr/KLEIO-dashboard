import type { Metadata } from "next"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { ApplicantRecordsPreview } from "@/components/kleio/applicant-records-preview"
import { LiveInstitutionArtists } from "@/components/kleio/live-institution-artists"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export const metadata: Metadata = {
  title: "KLEIO — Applicant Records",
  description: "Institution-specific application snapshots and artist review history.",
}

export default function Page() {
  return (
    <DashboardShell>
      <LiveModeView live={<LiveInstitutionArtists />} preview={<ApplicantRecordsPreview />} />
    </DashboardShell>
  )
}
