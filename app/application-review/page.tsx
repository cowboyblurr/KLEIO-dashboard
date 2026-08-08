import type { Metadata } from "next"
import { Suspense } from "react"
import { RecipientApplicationReview } from "@/components/kleio/recipient-application-review"

export const metadata: Metadata = {
  title: "KLEIO — Secure Submission Review",
  description: "Review an artist-approved submission in a secure, application-specific KLEIO review room.",
  robots: { index: false, follow: false, nocache: true },
}

function ReviewFallback() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#F8F5EF] px-4 py-12 text-[#2D2931]">
      <div role="status" className="w-full max-w-xl border-y border-[#DFD9D1] bg-[#FFFDFC] px-6 py-10 text-center sm:px-10">
        <p className="text-[0.69rem] font-semibold uppercase tracking-[0.18em] text-[#77658D]">Secure KLEIO submission</p>
        <h1 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.03em]">Preparing the artist-approved review room…</h1>
        <p className="mt-3 text-sm leading-6 text-[#766F7A]">Artwork, responses, and approved supporting materials are being organized for review.</p>
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
