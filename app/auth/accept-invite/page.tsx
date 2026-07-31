import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { AuthGate } from "@/components/kleio/auth-gate"

export default function Page() {
  return (
    <AuthGate>
      <main className="grid min-h-screen place-items-center bg-[oklch(0.985_0.005_287)] px-5">
        <section className="w-full max-w-lg rounded-3xl border border-[#D9D0F2] bg-white p-8 shadow-[0_22px_60px_rgba(70,52,112,0.08)]" role="status">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><ShieldAlert className="size-5" /></span>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#75639E]">Institution access</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">Team invitation acceptance is paused for the initial beta.</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">KLEIO will not activate a membership until invitation acceptance, workspace selection, account roles, and membership revocation have been validated together. No membership change was made from this link.</p>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground">Return to KLEIO</Link>
        </section>
      </main>
    </AuthGate>
  )
}
