import { LiveSignup } from "@/components/kleio/signup/live-signup"
import { ArtistOnboarding } from "@/components/kleio/signup/artist-onboarding"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return <LiveModeView live={<LiveSignup role="artist" />} preview={<ArtistOnboarding />} />
}
