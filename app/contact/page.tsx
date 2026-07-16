import type { Metadata } from "next"
import { ProductionInfoPageView } from "@/components/kleio/public-pages/production-info-page-view"

export const metadata: Metadata = {
  title: "Contact — KLEIO Arthouse",
  description: "Choose the artist or institution pathway for evaluating KLEIO and discussing a controlled pilot.",
}

export default function Page() {
  return <ProductionInfoPageView variant="contact" />
}
