import type { Metadata } from "next"
import { ManifestoPageView } from "@/components/kleio/public-pages/manifesto-page-view"

// Metadata remains English in this static demo. Visible page copy is bilingual through KLEIO i18n.
export const metadata: Metadata = {
  title: "KLEIO Manifesto",
  description: "The principles behind KLEIO: artist control, institutional clarity, and cultural memory.",
}

export default function Page() {
  return <ManifestoPageView />
}
