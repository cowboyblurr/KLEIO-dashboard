import type { Metadata } from "next"
import { JournalPageView } from "@/components/kleio/public-pages/journal-page-view"

// Metadata remains English in this static demo. Visible page copy is bilingual through KLEIO i18n.
export const metadata: Metadata = {
  title: "KLEIO Journal",
  description:
    "Field notes on artist applications, institutional review, cultural records, and the development of KLEIO.",
}

export default function Page() {
  return <JournalPageView />
}
