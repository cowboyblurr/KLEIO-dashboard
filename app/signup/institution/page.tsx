import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { InstitutionOnboarding } from "@/components/kleio/signup/institution-onboarding"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return <LiveModeView live={<LiveSignup role="institution" />} preview={<InstitutionOnboarding />} />
}
