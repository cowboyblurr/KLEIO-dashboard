import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Product Usage Privacy | KLEIO",
  description: "How KLEIO uses limited first-party product analytics.",
}

export default function ProductAnalyticsPrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#FCFBFE] px-4 py-8 text-[#292631] sm:px-6">
      <article className="mx-auto max-w-3xl rounded-[30px] border border-[#E2DCF1] bg-white p-6 shadow-[0_24px_76px_rgba(82,64,130,0.07)] sm:p-9">
        <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><ArrowLeft className="size-4" />Back to KLEIO</Link>
        <p className="mt-8 text-[0.68rem] font-semibold uppercase tracking-[0.17em] text-[#75639E]">Product usage privacy</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.05em]">How KLEIO uses product-usage information</h1>
        <p className="mt-4 text-base leading-8 text-[#625C70]">KLEIO collects a limited amount of first-party product-usage information so the team can understand whether essential workflows work, where artists encounter friction, and which parts of the platform deserve improvement.</p>

        <section className="mt-8 rounded-[22px] border border-[#DCD4EF] bg-[#F9F7FD] p-5" aria-labelledby="analytics-purpose">
          <h2 id="analytics-purpose" className="flex items-center gap-2 font-serif text-2xl font-semibold"><ShieldCheck className="size-5 text-[#6A5896]" />What KLEIO may measure</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#625C70]">
            <li>• Whether a signup, onboarding step, upload, import, save or recovery workflow succeeds or fails.</li>
            <li>• Which product area was used, the broad device class, a normalized referral category, and a stable non-sensitive error code.</li>
            <li>• Aggregate milestones such as onboarding completion, first saved value and artist activation.</li>
            <li>• Whether an activated artist returns, calculated from timestamps rather than artificial reminder events.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-[22px] border border-[#E7E1F7] p-5" aria-labelledby="analytics-never">
          <h2 id="analytics-never" className="flex items-center gap-2 font-serif text-2xl font-semibold"><EyeOff className="size-5 text-[#6A5896]" />What KLEIO does not record as analytics content</h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#625C70]">
            <li>• Artwork titles, captions, images, uploaded filenames or file contents.</li>
            <li>• Artist statements, biographies, CV contents, application answers, grant proposals or private professional materials.</li>
            <li>• Names, email addresses, phone numbers, physical addresses, private URLs or authentication credentials.</li>
            <li>• Keystrokes, session replay, heatmaps, advertising retargeting, or third-party behavioral profiles.</li>
          </ul>
        </section>

        <section className="mt-6 rounded-[22px] border border-[#E7E1F7] p-5" aria-labelledby="analytics-protection">
          <h2 id="analytics-protection" className="flex items-center gap-2 font-serif text-2xl font-semibold"><LockKeyhole className="size-5 text-[#6A5896]" />Protection and purpose</h2>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-[#625C70]">
            <p>KLEIO does not sell artist behavioral data and does not use advertising pixels or marketing-retargeting analytics.</p>
            <p>Artists and institutions cannot browse KLEIO’s complete product-event history. Administrator reporting is limited to aggregate counts, rates and privacy-safe categories.</p>
            <p>Product analytics should support a concrete decision—such as repairing a failed upload or simplifying an onboarding step—not create a surveillance record or vanity score.</p>
          </div>
        </section>

        <p className="mt-8 border-t border-[#E7E1F7] pt-5 text-xs leading-6 text-[#81788E]">This disclosure describes KLEIO’s current product-analytics approach. KLEIO should update this explanation before introducing any materially different measurement practice.</p>
      </article>
    </main>
  )
}
