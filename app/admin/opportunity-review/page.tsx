import type { Metadata } from "next"
import { AdminOpportunityReviewQueue } from "@/components/kleio/admin-opportunity-review-queue"

export const metadata: Metadata = {
  title: "Opportunity Review | KLEIO Admin",
  description: "Private KLEIO opportunity verification, artist-report, and publication workflow.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function KleioAdminOpportunityReviewPage() {
  return <AdminOpportunityReviewQueue />
}
