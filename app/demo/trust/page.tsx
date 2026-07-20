import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

export default function DemoTrustPage() {
  return (
    <main className="min-h-dvh bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[960px] items-center justify-between gap-4">
          <KleioWordmarkLink href="/" imageClassName="h-8 w-auto" imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }} />
          <nav className="flex items-center gap-2 text-xs font-medium text-[#6F6882]">
            <Link href="/demo/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">Demo</Link>
            <Link href="/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">Home</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[960px] px-5 py-10">
        <Link href="/demo/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#5B4B8A] transition-opacity hover:opacity-75">
          <ArrowLeft className="size-3.5" /> Back to demo
        </Link>

        <section className="rounded-[1.75rem] border border-[#E7E1F7] bg-[#F7F4FF] p-6 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Demo data note</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292631] max-md:text-3xl">
            The names are fictional. The mechanics are real.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
            Preview and demo mode use clearly identified synthetic names, institutions, universities, applications, reviewers, and opportunities. Authenticated mode connects registration, onboarding, Creative Passports, portfolio assets, calls, saved opportunities, applications, status history, reviews, shortlists, messages, notifications, invitations, and report exports to Supabase.
          </p>
        </section>

        <div className="mt-6 grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Synthetic</p>
            <h2 className="mt-1 font-serif text-lg font-semibold text-[#292631]">Names and seed records</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">People, institutions, universities, applications, and opportunity examples are demo records.</p>
          </article>
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Real</p>
            <h2 className="mt-1 font-serif text-lg font-semibold text-[#292631]">Math and analytics</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">Counts, percentages, reviewer progress, missing materials, deadline urgency, and queue logic are computed from records.</p>
          </article>
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Real</p>
            <h2 className="mt-1 font-serif text-lg font-semibold text-[#292631]">Workflow model</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">Artist Passport, opportunity readiness, submission review, reviewer coordination, shortlist, reports, and activity history reflect the intended product flow.</p>
          </article>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#292631]">Current boundary</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
            Core artist and institution workflows persist in authenticated mode. Preview-only discovery analytics, matching scores, global search results, and some secondary dashboard metrics still use controlled synthetic records and should be presented as product scenarios rather than live usage analytics.
          </p>
          <Link href="/demo/infrastructure/" className="mt-4 inline-flex h-10 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90">
            View infrastructure audit
          </Link>
        </section>
      </section>
    </main>
  )
}
