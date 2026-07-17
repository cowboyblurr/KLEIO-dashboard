import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/kleio/auth/password-recovery-forms"
import { SignupShell } from "@/components/kleio/signup/signup-shell"

export const metadata: Metadata = {
  title: "Recover your KLEIO account",
  description: "Request a secure password reset link for a KLEIO artist or institution account.",
}

export default function Page() {
  return (
    <SignupShell title="Recover your account" subtitle="Request a secure link to create a new password for your artist or institution workspace.">
      <div className="mx-auto max-w-lg">
        <ForgotPasswordForm />
      </div>
    </SignupShell>
  )
}
