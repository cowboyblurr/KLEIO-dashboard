import Link from "next/link"
import { ArrowLeft, CheckCircle2, ClipboardCheck } from "lucide-react"

const sections = [
  {
    title: "Pilot scope",
    body: "Start with one controlled program, one institution workspace, a small reviewer group, and synthetic or approved sample submissions before any live public call.",
    items: ["one program", "defined committee", "review rubric", "clear decision timeline", "export/report expectation"],
  },
  {
    title: "Implementation path",
    body: "KLEIO should move from source-backed demo records into database-backed records, then add production authentication and role policies before real applications are accepted.",
    items: ["database schema", "auth plan", "role policies", "seed migration", "file storage", "activity log"],
  },
  {
    title: "Institution readiness",
    body: "Institutions need clarity on who manages the call, who reviews, what materials are required, and how decisions are preserved after the cycle closes.",
    items: ["program owner", "reviewers", "required materials", "deadline schedule", "shortlist/reporting needs"],
  },
  {
    title: "Artist protection",
    body: "Artists should control their materials, approve what is shared, and understand which application data is visible to the institution.",
    items: ["artist approval", "material authorization", "submission status", "messages", "no hidden internal notes"],
  },
]

export function PilotReadinessPage() {
  return (
    <main className="min-h-dvh bg-white px-5 py-10 text-[#292631]">
      <section className="mx-auto w-full max-w-[1120px]">
        <Link href="/demo/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B4B8A] hover:opacity-75">
          <ArrowLeft className="size-3.5" /> Back to demo
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Pilot readiness preview</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] max-md:text-3xl">
            KLEIO should enter pilots as a controlled review environment.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F6882]">
            This page frames the next credible implementation step for institutions, universities, foundations, and public-sector arts teams: a contained pilot with clear scope, role boundaries, source-backed records, and preserved review history.
          </p>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[#5B4B8A] shadow-sm">
              <ClipboardCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Recommended first pilot</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
                One institution, one program, three to seven reviewers, one review rubric, one shortlist/reporting cycle. This keeps validation focused on the core institutional problem: replacing scattered email, PDFs, and spreadsheets with structured review.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-4 max-lg:grid-cols-1">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_16px_44px_rgba(82,64,130,0.07)]">
              <h2 className="font-serif text-xl font-semibold text-[#292631]">{section.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#6F6882]">{section.body}</p>
              <ul className="mt-4 grid gap-2 text-sm text-[#6F6882]">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#5B4B8A]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#292631] p-5 text-white">
          <h2 className="font-serif text-2xl font-semibold">What this does not claim yet</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            This does not claim production authentication, live institutional users, live submissions, or live source integrations. It defines the controlled bridge from real computed demo to credible institutional pilot.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/demo/roles/" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-[#292631] transition-opacity hover:opacity-90">
              View roles preview
            </Link>
            <Link href="/demo/infrastructure/" className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
              View infrastructure audit
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
