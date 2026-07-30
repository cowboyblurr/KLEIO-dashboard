import type { Metadata } from "next"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { IntentAwareLiveSignup } from "@/components/kleio/signup/intent-aware-live-signup"
import { GuidedSignup } from "@/components/kleio/signup/guided-signup"

export const metadata: Metadata = {
  title: "KLEIO — Artist signup",
  description: "Create an artist account and begin a reusable Creative Passport with structured disciplines, mediums, and materials.",
}

export default function Page() {
  return (
    <LiveModeView
      live={<IntentAwareLiveSignup role="artist" />}
      preview={<GuidedSignup role="artist" />}
    />
  )
}
