import { AuthCallbackClient } from "@/components/kleio/auth/auth-callback-client"
import { GoogleRoleBootstrapGate } from "@/components/kleio/auth/google-role-bootstrap-gate"

export default function AuthCallbackPage() {
  return <GoogleRoleBootstrapGate><AuthCallbackClient /></GoogleRoleBootstrapGate>
}
