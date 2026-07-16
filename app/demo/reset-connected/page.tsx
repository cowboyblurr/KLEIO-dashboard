import type { Metadata } from "next"
import { ConnectedDemoResetView } from "@/components/kleio/connected-demo-reset-view"

export const metadata: Metadata = {
  title: "KLEIO — Reset Connected Demo",
  description: "Restore the browser-local KLEIO preview dataset without deleting Supabase records.",
}

export default function Page() {
  return <ConnectedDemoResetView />
}
