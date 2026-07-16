import type { Metadata } from "next"
import { ProductionInfoPageView } from "@/components/kleio/public-pages/production-info-page-view"

export const metadata: Metadata = {
  title: "Privacy — KLEIO Arthouse",
  description: "How the current KLEIO product preview handles synthetic data, browser state, and user control.",
}

export default function Page() {
  return <ProductionInfoPageView variant="privacy" />
}
