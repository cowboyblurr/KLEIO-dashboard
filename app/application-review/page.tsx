import type { Metadata } from "next"
import { Suspense } from "react"
import { RecipientApplicationReview } from "@/components/kleio/recipient-application-review"

export const metadata: Metadata = {
  title: "KLEIO — Review artist application",
  description: "Review an artist-approved application package, confirm receipt, and continue the submission-specific conversation.",
  robots: { index: false, follow: false, nocache: true },
}

function ReviewFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#F8F7FB] px-4 py-12 text-[#292631]">
      <div role="status" className="w-full max-w-xl rounded-3xl border border-[#E7E1F7] bg-white p-8 text-center shadow-[0_24px_70px_rgba(65,53,102,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7F6EB4]">Secure KLEIO application</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.03em]">Preparing the artist-approved review page…</h1>
      </div>
    </main>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<ReviewFallback />}>
      <RecipientApplicationReview />
    </Suspense>
  )
}
