import type { Metadata } from "next"
import { LiveModeView } from "@/components/kleio/live-mode-view"
import { IntentAwareLiveSignup } from "@/components/kleio/signup/intent-aware-live-signup"
import { GuidedSignup } from "@/components/kleio/signup/guided-signup"
import { AccountRoleSignupBoundary } from "@/components/kleio/signup/account-role-signup-boundary"

export const metadata: Metadata = {
  title: "KLEIO — Artist signup",
  description: "Create an artist account and begin a reusable Creative Passport with structured disciplines, mediums, and materials.",
}

export default function Page() {
  return (
    <LiveModeView
      live={<AccountRoleSignupBoundary role="artist"><IntentAwareLiveSignup role="artist" /></AccountRoleSignupBoundary>}
      preview={<GuidedSignup role="artist" />}
    />
  )
}
