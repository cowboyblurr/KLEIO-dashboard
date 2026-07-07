import type { Metadata } from "next"
import { ReportsExportArchivePage } from "@/components/kleio/reports-export-archive-page"

export const metadata: Metadata = {
  title: "KLEIO — Reports, Export & Archive",
  description: "Preview how KLEIO preserves review-cycle reports, exports, and archived decision history.",
}

export default function Page() {
  return <ReportsExportArchivePage />
}
