import type { Metadata } from "next"
import { Suspense } from "react"
import { PublicOpportunityDirectory } from "@/components/kleio/public-opportunity-directory"

export const metadata: Metadata = {
  title: "KLEIO — Artist opportunities",
  description: "Browse sourced grants, residencies, open calls, awards, and other artist opportunities before creating an account.",
}

function PublicOpportunityDirectoryFallback() {
  return (
    <main className="min-h-dvh bg-[#FAFAFA] px-4 py-16 text-[#292631] sm:px-6">
      <div className="mx-auto max-w-[1180px] rounded-2xl border border-[#E7E1F7] bg-white p-8 shadow-[0_18px_48px_rgba(82,64,130,0.06)]" role="status">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7F6EB4]">Public opportunity discovery</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em]">Preparing the sourced opportunity directory…</h1>
        <p className="mt-3 text-sm leading-6 text-[#746E80]">KLEIO is loading current public records and preserving any selected opportunity context.</p>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<PublicOpportunityDirectoryFallback />}>
      <PublicOpportunityDirectory />
    </Suspense>
  )
}
