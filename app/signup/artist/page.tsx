import type { Metadata } from "next"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { GuidedSignup } from "@/components/kleio/signup/guided-signup"

export const metadata: Metadata = {
  title: "KLEIO — Artist signup",
  description: "Create an artist account and begin a reusable Creative Passport with structured disciplines, mediums, and materials.",
}

export default function Page() {
  return (
    <LiveModeView
      live={<LiveSignup role="artist" />}
      preview={<GuidedSignup role="artist" />}
    />
  )
}
