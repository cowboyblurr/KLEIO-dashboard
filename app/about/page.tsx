import type { Metadata } from "next"
import { AboutPageView } from "@/components/kleio/public-pages/about-page-view"

// Metadata remains English in this static demo. Visible page copy is bilingual through KLEIO i18n.
export const metadata: Metadata = {
  title: "About KLEIO Arthouse",
  description:
    "KLEIO helps artists and institutions manage creative passports, submissions, reviews, and cultural records with clarity.",
}

export default function Page() {
  return <AboutPageView />
}
