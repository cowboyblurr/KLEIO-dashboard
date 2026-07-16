import type { Metadata } from "next"
import { ProductionInfoPageView } from "@/components/kleio/public-pages/production-info-page-view"

export const metadata: Metadata = {
  title: "Preview Terms — KLEIO Arthouse",
  description: "Plain-language terms for evaluating the current KLEIO product preview.",
}

export default function Page() {
  return <ProductionInfoPageView variant="terms" />
}
