import Link from "next/link"
import { CheckCircle2, Database, ShieldCheck } from "lucide-react"
import { getKleioInfrastructureAudit } from "@/lib/kleio-analytics-audit"

export function InfrastructureAuditPage() {
  const audit = getKleioInfrastructureAudit()

  return (
    <main className="min-h-dvh bg-white px-5 py-10 text-[#292631]">
      <section className="mx-auto w-full max-w-[1120px]">
        <Link href="/demo/" className="text-xs font-semibold text-[#5B4B8A] hover:opacity-75">
          ← Back to demo
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[#A997E8]">Real infrastructure audit</p>
            <h1 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.035em] max-md:text-3xl">
              KLEIO metrics are computed from source records.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#6F6882]">
              This page separates real computed logic from synthetic seed data. Names and records are fictional for now, but the calculation layer is traceable and ready to migrate behind a database source adapter.
            </p>
          </div>
          <div className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-4 text-sm text-[#5B4B8A]">
            <div className="flex items-center gap-2 font-semibold">
              <Database className="size-4" /> Source: {audit.source.sourceLabel}
            </div>
            <p className="mt-1 text-xs text-[#6F6882]">Boundary: {audit.summary.sourceBoundary}</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 max-md:grid-cols-1">
          <div className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Traceable metrics</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{audit.summary.traceableMetricRate}</p>
            <p className="mt-1 text-xs text-[#6F6882]">{audit.summary.traceableMetricCount} of {audit.summary.metricCount} audited metrics</p>
          </div>
          <div className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Submissions</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{audit.source.counts.submissions}</p>
            <p className="mt-1 text-xs text-[#6F6882]">Seed records feeding dashboard analytics</p>
          </div>
          <div className="rounded-2xl border border-[#E7E1F7] bg-white p-4 shadow-[0_12px_34px_rgba(82,64,130,0.06)]">
            <p className="text-xs font-semibold text-[#A997E8]">Reviews</p>
            <p className="mt-1 font-serif text-3xl font-semibold">{audit.source.counts.reviews}</p>
            <p className="mt-1 text-xs text-[#6F6882]">Review records feeding reviewer progress</p>
          </div>
        </div>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#F7F4FF] p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white text-[#5B4B8A] shadow-sm">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-serif text-2xl font-semibold">Current truth</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#6F6882]">
                The demo is not production-ready because database persistence, production authentication, role-based access control, source ingestion, and file storage are not live yet. But audited metrics are computed from source records rather than hand-entered display values.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.08)]">
          <h2 className="font-serif text-2xl font-semibold">Metric trace table</h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-[#E7E1F7]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7F4FF] text-xs uppercase tracking-[0.12em] text-[#7F7890]">
                <tr>
                  <th className="px-4 py-3">Metric</th>
                  <th className="px-4 py-3">Value</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E1F7]">
                {audit.metrics.map((metric) => (
                  <tr key={metric.metric}>
                    <td className="px-4 py-3 font-medium text-[#292631]">{metric.metric}</td>
                    <td className="px-4 py-3 text-[#5B4B8A]">{metric.value}</td>
                    <td className="px-4 py-3 text-[#6F6882]">{metric.sourceCollections.join(", ")}</td>
                    <td className="px-4 py-3 text-[#6F6882]">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="size-3.5 text-[#5B4B8A]" /> {metric.calculation}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-[1.5rem] border border-[#E7E1F7] bg-[#292631] p-5 text-white">
          <h2 className="font-serif text-2xl font-semibold">Next required infrastructure</h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75 max-md:grid-cols-1">
            {audit.summary.nextRequired.map((item) => (
              <li key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  )
}
