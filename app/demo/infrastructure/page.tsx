import type { Metadata } from "next"
import { InfrastructureAuditPage } from "@/components/kleio/infrastructure-audit-page"

export const metadata: Metadata = {
  title: "KLEIO — Infrastructure Audit",
  description: "Trace KLEIO demo metrics back to structured seed records and the intended live infrastructure path.",
}

export default function Page() {
  return <InfrastructureAuditPage />
}
