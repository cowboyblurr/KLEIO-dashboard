import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ClipboardList } from "lucide-react"
import { DashboardShell } from "@/components/kleio/dashboard-shell"
import { getProgramStats } from "@/lib/kleio-analytics"
import { programs } from "@/lib/kleio-data"

const inkColor = "#292631"
const mutedColor = "#7F7890"
const lavenderSoftLine = "#E7E1F7"
const cardShadow = "0 18px 48px rgba(82, 64, 130, 0.08)"

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`))
}

export function generateStaticParams() {
  return programs.map((program) => ({ programId: program.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ programId: string }>
}): Promise<Metadata> {
  const { programId } = await params
  const program = programs.find((entry) => entry.id === programId)

  if (!program) return { title: "Program | KLEIO" }

  return {
    title: `${program.title} | KLEIO Program`,
    description: `Program detail for ${program.title}. Synthetic demo open call configuration and review context.`,
  }
}

export default async function Page({ params }: { params: Promise<{ programId: string }> }) {
  const { programId } = await params
  const program = programs.find((entry) => entry.id === programId)

  if (!program) notFound()

  const stats = getProgramStats(program.id)

  return (
    <DashboardShell>
      <main className="h-full overflow-auto px-6 py-6">
        <div className="mx-auto min-w-[760px] max-w-[1120px] space-y-5">
          <Link href="/programs/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] transition-opacity hover:opacity-75">
            <ArrowLeft className="size-3.5" /> Back to programs
          </Link>

          <section className="rounded-[1.6rem] border bg-white p-6" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Program workspace · {program.category}</p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl font-semibold tracking-tight" style={{ color: inkColor }}>{program.title}</h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed" style={{ color: mutedColor }}>{program.description}</p>
              </div>
              <span className="rounded-full border border-[#D8D0F2] bg-[#F7F4FF] px-3 py-1 text-xs font-semibold text-[#5B4B8A]">{program.status}</span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/review-queue/" className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><ClipboardList className="size-4" /> View applicants</Link>
              <Link href="/review-room/" className="inline-flex h-10 items-center rounded-xl border px-4 text-sm font-semibold transition-colors hover:bg-[#F7F4FF]" style={{ borderColor: lavenderSoftLine, color: "#5B4B8A" }}>Open review room</Link>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Metric label="Deadline" value={formatDate(program.deadline)} />
            <Metric label="Review period" value={`${formatDate(program.reviewStart)} – ${formatDate(program.decisionDate)}`} />
            <Metric label="Submissions" value={stats.submissionCount} />
            <Metric label="Needs attention" value={stats.needsAttentionCount} />
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Required materials</p>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                {program.requiredMaterials.map((material) => <div key={material} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}>{material}</div>)}
              </div>
            </div>

            <aside className="space-y-5">
              <section className="rounded-2xl border bg-white p-5" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Rubric</p>
                <div className="mt-3 space-y-2">
                  {program.rubric.map((item) => <div key={item} className="rounded-xl border px-3 py-2 text-sm" style={{ borderColor: lavenderSoftLine, color: inkColor }}>{item}</div>)}
                </div>
              </section>

              <section className="rounded-2xl border bg-[#FDFBFF] p-4" style={{ borderColor: lavenderSoftLine }}>
                <p className="text-xs leading-relaxed" style={{ color: mutedColor }}>Synthetic demo program. This route gives program names a stable destination from submissions, dashboards, and open-call cards.</p>
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
    <section className="rounded-2xl border bg-white p-4" style={{ borderColor: lavenderSoftLine, boxShadow: cardShadow }}>
      <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: mutedColor }}>{label}</p>
      <p className="mt-2 text-sm font-semibold" style={{ color: inkColor }}>{value}</p>
    </section>
  )
}
