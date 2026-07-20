import { Suspense } from "react"
import { AuthGate } from "@/components/kleio/auth-gate"
import { AcceptInvitation } from "@/components/kleio/auth/accept-invitation"

export default function Page() {
  return <AuthGate><Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading invitation…</div>}><AcceptInvitation /></Suspense></AuthGate>
}
