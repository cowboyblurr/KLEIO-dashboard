import Link from "next/link"
import { ArrowLeft, ShieldCheck } from "lucide-react"
import { DemoEnvironmentBadge } from "@/components/kleio/demo-environment-badge"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"

const demoTruths = [
  {
    title: "Clickable prototype",
    body: "This build demonstrates KLEIO’s intended artist and institution workflows. It is not a production account system.",
  },
  {
    title: "Synthetic data",
    body: "Artists, institutions, programs, reviewer activity, messages, reports, and metrics are fictional demo records.",
  },
  {
    title: "Simulated access",
    body: "Demo login and role switching are local prototype behavior. They should not be described as production authentication.",
  },
  {
    title: "No live submissions",
    body: "No real artist applications, institutional calls, integrations, payments, or external messages are created by this demo.",
  },
]

const permissionPreview = [
  {
    title: "Artist control",
    body: "Artists should review, edit, approve, and authorize materials before anything is used in an application or shared with an institution.",
  },
  {
    title: "Institution workspace",
    body: "Institution users should manage programs, submissions, reviewer assignments, shortlist decisions, reports, and preserved review history.",
  },
  {
    title: "Reviewer seats",
    body: "Invited reviewers should see only assigned work, relevant guidelines, deadlines, notes, and rubric context—not unnecessary administrative controls.",
  },
  {
    title: "Decision history",
    body: "KLEIO should preserve review actions and status changes so decisions can be traced without rebuilding the process from scattered files.",
  },
]

export default function DemoTrustPage() {
  return (
    <main className="min-h-dvh bg-white text-[#292631]">
      <header className="border-b border-[#E7E1F7] bg-white/90 px-5 py-4 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4">
          <KleioWordmarkLink href="/" imageClassName="h-8 w-auto" imageStyle={{ filter: "brightness(0) saturate(100%) invert(16%) sepia(5%) saturate(800%) hue-rotate(220deg)" }} />
          <nav className="flex items-center gap-2 text-xs font-medium text-[#6F6882]">
            <Link href="/demo/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">Demo paths</Link>
            <Link href="/" className="rounded-full px-3 py-1.5 transition-colors hover:bg-[#F7F4FF]">Home</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto w-full max-w-[1120px] px-5 py-10">
        <Link href="/demo/" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-[#5B4B8A] transition-opacity hover:opacity-75">
          <ArrowLeft className="size-3.5" /> Back to guided demo
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Demo trust layer</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] text-[#292631] max-md:text-3xl">
              What is real in this KLEIO demo?
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
              This page separates the current prototype from intended product behavior so artists, institutions, reviewers, funders, and advisors can evaluate the demo clearly.
            </p>
          </div>
          <DemoEnvironmentBadge />
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF] p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[#5B4B8A] shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em] text-[#292631]">Prototype boundary</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
                KLEIO should be presented today as a clickable prototype with synthetic demo data. Do not claim live integrations, production authentication, verified institutions, real users, or secure production deployment unless those systems are separately built and verified.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 max-md:grid-cols-1">
          {demoTruths.map((item) => (
            <article key={item.title} className="rounded-[1.25rem] border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
              <p className="text-[0.64rem] font-bold uppercase tracking-[0.16em] text-[#A997E8]">Current demo</p>
              <h3 className="mt-1 font-serif text-lg font-semibold text-[#292631]">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{item.body}</p>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Security and permissions preview</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em] text-[#292631]">Intended access model</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
            This is a product-direction preview, not a production security audit. It explains how KLEIO should separate artist control, institutional operations, reviewer seats, and decision history in a future live environment.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-4 max-md:grid-cols-1">
            {permissionPreview.map((item) => (
              <article key={item.title} className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4">
                <h3 className="font-serif text-base font-semibold text-[#292631]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#292631] p-5 text-white shadow-[0_18px_48px_rgba(82,64,130,0.12)]">
          <h2 className="font-serif text-2xl font-semibold tracking-[-0.02em]">Safe language for outreach</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            Use: clickable demo flow, prototype onboarding, simulated demo login, synthetic data, intended reviewer workflow, intended access model. Avoid: secure login, real account system, production authentication, live integrations, verified institution profiles, or real user activity unless separately confirmed.
          </p>
          <Link href="/demo/" className="mt-5 inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-[#292631] transition-opacity hover:opacity-90">
            Return to demo paths
          </Link>
        </section>
      </section>
    </main>
  )
}
