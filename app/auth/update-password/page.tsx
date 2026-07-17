import type { Metadata } from "next"
import { UpdatePasswordForm } from "@/components/kleio/auth/password-recovery-forms"
import { SignupShell } from "@/components/kleio/signup/signup-shell"

export const metadata: Metadata = {
  title: "Create a new KLEIO password",
  description: "Securely update the password for a KLEIO artist or institution account.",
}

export default function Page() {
  return (
    <SignupShell title="Create a new password" subtitle="This page accepts only a valid, unexpired recovery session from Supabase.">
      <div className="mx-auto max-w-lg">
        <UpdatePasswordForm />
      </div>
    </SignupShell>
  )
}
