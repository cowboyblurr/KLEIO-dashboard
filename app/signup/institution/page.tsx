import { InstitutionSignupEntry } from "@/components/kleio/signup/institution-signup-entry"
import { GuidedSignup } from "@/components/kleio/signup/guided-signup"
import { AccountRoleSignupBoundary } from "@/components/kleio/signup/account-role-signup-boundary"
import { LiveModeView } from "@/components/kleio/live-mode-view"

export default function Page() {
  return (
    <LiveModeView
      live={<AccountRoleSignupBoundary role="institution"><InstitutionSignupEntry /></AccountRoleSignupBoundary>}
      preview={<GuidedSignup role="institution" />}
    />
  )
}
