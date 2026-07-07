import Link from "next/link"
import { ArrowLeft, Archive, CheckCircle2, Download, FileText } from "lucide-react"
import { analytics, getReviewerProgress, getShortlistGroups } from "@/lib/kleio-analytics"
import { activityLog, programs } from "@/lib/kleio-data"

const activeProgram = programs[0]
const reviewerProgress = getReviewerProgress()
const shortlistGroups = getShortlistGroups()
const completedReviews = reviewerProgress.reduce((sum, reviewer) => sum + reviewer.completed, 0)
const assignedReviews = reviewerProgress.reduce((sum, reviewer) => sum + reviewer.assigned, 0)
const selectedCount = shortlistGroups.find((group) => group.id === "accepted")?.submissions.length ?? 0
const shortlistedCount = shortlistGroups.find((group) => group.id === "shortlisted")?.submissions.length ?? 0

const exportItems = [
  "program summary",
  "submission status breakdown",
  "reviewer completion report",
  "shortlist and final decision history",
  "missing-material resolution record",
  "activity log archive",
]

export function ReportsExportArchivePage() {
  return (
    <main className="min-h-dvh bg-white px-5 py-10 text-[#292631]">
      <section className="mx-auto w-full max-w-[1120px]">
        <Link href="/demo/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#5B4B8A] hover:opacity-75">
          <ArrowLeft className="size-3.5" /> Back to demo
        </Link>

        <div className="mt-6 max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Reports / Export / Archive</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] max-md:text-3xl">
            Preserve the review cycle after decisions are made.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6F6882]">
            KLEIO should help institutions move from live review to export-ready reports and archived decision history. This preview shows how a program cycle can close without losing reviewer progress, shortlist context, missing-material notes, and activity history.
          </p>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF] p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Cycle report</p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-[#292631]">{activeProgram?.title ?? "Program Review Cycle"}</h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
                Final report preview generated from structured program, submission, review, message, and activity records.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="inline-flex h-10 items-center rounded-full bg-[#5B4B8A] px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90" type="button">
                <Download className="mr-2 size-3.5" /> Export report
              </button>
              <button className="inline-flex h-10 items-center rounded-full border border-[#D8D0F2] bg-white px-4 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F7F4FF]" type="button">
                <Archive className="mr-2 size-3.5" /> Archive cycle
              </button>
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Applications</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{analytics.totalApplications}</p>
            <p className="mt-1 text-xs text-[#6F6882]">source-backed submissions</p>
          </article>
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Reviews</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{completedReviews}/{assignedReviews}</p>
            <p className="mt-1 text-xs text-[#6F6882]">completed reviewer actions</p>
          </article>
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Shortlist</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{shortlistedCount}</p>
            <p className="mt-1 text-xs text-[#6F6882]">active shortlisted records</p>
          </article>
          <article className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Selected</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{selectedCount}</p>
            <p className="mt-1 text-xs text-[#6F6882]">final decision records</p>
          </article>
        </div>

        <div className="mt-6 grid grid-cols-[1.1fr_0.9fr] gap-4 max-lg:grid-cols-1">
          <section className="rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_16px_44px_rgba(82,64,130,0.07)]">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-[#F7F4FF] text-[#5B4B8A]"><FileText className="size-5" /></span>
              <div>
                <h2 className="font-serif text-xl font-semibold">Export package</h2>
                <p className="text-sm text-[#6F6882]">What an institution should be able to preserve or export after a cycle closes.</p>
              </div>
            </div>
            <ul className="mt-5 grid gap-3 text-sm text-[#6F6882] sm:grid-cols-2">
              {exportItems.map((item) => (
                <li key={item} className="flex gap-2 rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-[#5B4B8A]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_16px_44px_rgba(82,64,130,0.07)]">
            <h2 className="font-serif text-xl font-semibold">Recent decision history</h2>
            <p className="mt-1 text-sm text-[#6F6882]">A cycle archive should keep the actions that explain how the program moved forward.</p>
            <ul className="mt-5 space-y-3">
              {activityLog.slice(0, 5).map((entry) => (
                <li key={entry.id} className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-sm">
                  <p className="font-medium text-[#292631]">{entry.action}</p>
                  <p className="mt-0.5 text-xs text-[#6F6882]">{entry.actor} · {entry.date} · {entry.target}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-6 rounded-[1.5rem] border border-[#E7E1F7] bg-[#292631] p-5 text-white">
          <h2 className="font-serif text-2xl font-semibold">Why this matters for institutions</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/75">
            A pilot is stronger when the institution can see not only the review interface, but also what remains after decisions: reports, exports, archived submissions, reviewer completion, and decision history.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/reports/" className="inline-flex h-10 items-center rounded-full bg-white px-4 text-xs font-semibold text-[#292631] transition-opacity hover:opacity-90">
              Open reports workspace
            </Link>
            <Link href="/demo/pilot-readiness/" className="inline-flex h-10 items-center rounded-full border border-white/20 px-4 text-xs font-semibold text-white transition-colors hover:bg-white/10">
              View pilot readiness
            </Link>
          </div>
        </section>
      </section>
    </main>
  )
}
