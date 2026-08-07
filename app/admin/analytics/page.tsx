import type { Metadata } from "next"
import { AdminProductAnalyticsDashboard } from "@/components/kleio/admin-product-analytics-dashboard"

export const metadata: Metadata = {
  title: "Product Analytics | KLEIO Admin",
  description: "Private, aggregate KLEIO product analytics.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
}

export default function KleioAdminAnalyticsPage() {
  return <AdminProductAnalyticsDashboard />
}
