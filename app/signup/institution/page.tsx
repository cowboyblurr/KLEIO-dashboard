import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { GuidedSignup } from "@/components/kleio/signup/guided-signup"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return <LiveModeView live={<LiveSignup role="institution" />} preview={<GuidedSignup role="institution" />} />
}
