import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, FileText, MessageCircle } from "lucide-react"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { StatusPill, PriorityPill } from "@/components/kleio/pills"
import { allSubmissions } from "@/lib/kleio-data"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

export function generateStaticParams() {
  return allSubmissions.map((submission) => ({ submissionId: submission.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ submissionId: string }>
}): Promise<Metadata> {
  const { submissionId } = await params
  const submission = allSubmissions.find((entry) => entry.id === submissionId)

  if (!submission) return { title: "Submission | KLEIO" }

  return {
    title: `${submission.artist} Submission | KLEIO`,
    description: `Review record for ${submission.artist}'s ${submission.projectTitle}. Synthetic demo submission detail.`,
  }
}

export default async function Page({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params
  const submission = allSubmissions.find((entry) => entry.id === submissionId)

  if (!submission) notFound()

  const missingMaterials = submission.missingMaterials ?? []

  return (
    <DashboardShell>
      <main className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto min-w-[760px] max-w-[1120px] space-y-5">
          <Link href="/submissions/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] transition-opacity hover:opacity-75">
            <ArrowLeft className="size-3.5" /> Back to submissions
          </Link>

          <section className="rounded-[1.6rem] border bg-white p-6" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Submission detail · {submission.programCycle}</p>
                <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight" style={{ color: inkColor }}>{submission.projectTitle}</h1>
                <p className="mt-2 text-sm" style={{ color: mutedColor }}>
                  <Link href={`/artists/${submission.artistId}/`} className="font-medium transition-colors hover:text-[#5B4B8A]" style={{ color: inkColor }}>{submission.artist}</Link>
                  <span> · </span>
                  <Link href={`/programs/${submission.programId}/`} className="transition-colors hover:text-[#5B4B8A]">{submission.program}</Link>
                </p>
              </div>
              <div className="flex flex-wrap gap-2"><StatusPill status={submission.status} /><PriorityPill priority={submission.priority} /></div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Metric label="Completeness" value={`${submission.completeness}%`} />
              <Metric label="Reviewer" value={submission.reviewer} />
              <Metric label="Submitted" value={submission.submitted} />
              <Metric label="Stage" value={submission.decisionStage ?? "Review"} />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Artist statement</p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{submission.statement}</p>
              </section>

              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Internal note</p>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: mutedColor }}>{submission.internalNote.body}</p>
                <p className="mt-3 text-xs" style={{ color: mutedColor }}>{submission.internalNote.author} · {submission.internalNote.date}</p>
              </section>

              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Activity</p>
                <div className="mt-3 space-y-3">
                  {submission.activity.map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: lavenderSoftLine }}>
                      <MessageCircle className="mt-0.5 size-4 shrink-0 text-[#5B4B8A]" />
                      <div>
                        <p className="text-sm" style={{ color: inkColor }}>{item.actor} {item.action}</p>
                        <p className="text-xs" style={{ color: mutedColor }}>{item.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Materials</p>
                <div className="mt-3 space-y-2 text-sm" style={{ color: mutedColor }}>
                  <MaterialRow label="Creative Passport" value="Available" />
                  <MaterialRow label="Portfolio" value={submission.completeness >= 90 ? "Ready" : "Needs review"} />
                  {missingMaterials.length ? missingMaterials.map((item) => <MaterialRow key={item} label={item} value="Missing" />) : <MaterialRow label="Missing materials" value="None" />}
                </div>
              </section>

              <section className="rounded-2xl border bg-[#FDFBFF] p-4" style={{ borderColor: lavenderSoftLine }}>
                <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>Synthetic demo submission. Use this page as the stable destination for submission rows, review links, and application IDs.</p>
              </section>
            </aside>
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border bg-[#FDFBFF] p-3" style={{ borderColor: lavenderSoftLine }}>
      <p className="text-xs font-medium" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-1 text-sm font-semibold" style={{ color: inkColor }}>{value}</p>
    </div>
  )
}

function MaterialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border px-3 py-2" style={{ borderColor: lavenderSoftLine }}>
      <span className="flex items-center gap-2"><FileText className="size-3.5 text-[#7F7890]" /> {label}</span>
      <span className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.62rem] font-semibold text-[#5B4B8A]">{value}</span>
    </div>
  )
}
