"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { CircleHelp, Loader2, ShieldX, TriangleAlert } from "lucide-react"
import {
  evaluateMyOpportunities,
  type PersistedOpportunityEvaluation,
} from "@/lib/kleio-persisted-opportunity-evaluations"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A]"

function PreparationGateShell({ children }: { children: React.ReactNode }) {
  return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto max-w-[760px]">{children}</div></main>
}

export function VerifiedApplicationPreparationGate({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [evaluation, setEvaluation] = useState<PersistedOpportunityEvaluation | null>(null)
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState(opportunityId ? "" : "Choose an opportunity before preparing an application.")

  useEffect(() => {
    let active = true
    if (!opportunityId) return () => { active = false }

    async function loadEvaluation() {
      try {
        const evaluations = await evaluateMyOpportunities([opportunityId])
        if (!active) return
        const result = evaluations[opportunityId] ?? null
        setEvaluation(result)
        if (!result) setError("KLEIO could not produce a persisted eligibility evaluation for this opportunity.")
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not verify eligibility for this opportunity.")
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadEvaluation()
    return () => { active = false }
  }, [opportunityId])

  if (loading) {
    return <PreparationGateShell><section className={`${surface} flex items-center gap-2 text-sm text-muted-foreground`} role="status"><Loader2 className="size-4 animate-spin" />Verifying eligibility before opening application preparation…</section></PreparationGateShell>
  }

  if (error || !evaluation) {
    return (
      <PreparationGateShell>
        <section role="alert" className={`${surface} border-amber-200 bg-amber-50 text-amber-900`}>
          <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-5" />Verified eligibility is unavailable</p>
          <p className="mt-2 text-sm leading-relaxed">KLEIO will not open application preparation using a browser-only estimate. Review the official source or return to the opportunity directory and try again.</p>
          {error && <p className="mt-2 text-xs leading-relaxed opacity-80">{error}</p>}
          <Link className={`${secondary} mt-4`} href="/artist-dashboard/opportunities/">Return to opportunities</Link>
        </section>
      </PreparationGateShell>
    )
  }

  if (evaluation.eligibility_status === "not_eligible" || evaluation.deadline_status === "expired") {
    const failedRules = (evaluation.rule_results ?? []).filter((rule) => rule.status === "failed")
    return (
      <PreparationGateShell>
        <section className={`${surface} border-red-200 bg-red-50 text-red-900`}>
          <p className="flex items-center gap-2 font-semibold"><ShieldX className="size-5" />Application preparation is unavailable</p>
          <p className="mt-2 text-sm leading-relaxed">A verified mandatory requirement fails, or the official deadline has passed. Creative similarity cannot override hard eligibility.</p>
          {!!failedRules.length && <ul className="mt-3 space-y-2 text-sm">{failedRules.map((rule, index) => <li key={rule.rule_id || `${rule.rule_type}-${index}`} className="rounded-xl border border-red-200 bg-white/70 p-3">{rule.source_text || rule.reason || rule.rule_type?.replaceAll("_", " ") || "Mandatory requirement failed"}</li>)}</ul>}
          <div className="mt-4 flex flex-wrap gap-2"><Link className={secondary} href="/artist-dashboard/opportunities/">Return to opportunities</Link>{evaluation.explanation.source?.official_url && <a className={secondary} href={evaluation.explanation.source.official_url} target="_blank" rel="noreferrer">Review official source</a>}</div>
        </section>
      </PreparationGateShell>
    )
  }

  if (["missing_information", "eligibility_unclear"].includes(evaluation.eligibility_status)) {
    return (
      <PreparationGateShell>
        <section className={`${surface} border-amber-200 bg-amber-50 text-amber-900`}>
          <p className="flex items-center gap-2 font-semibold"><CircleHelp className="size-5" />Eligibility cannot yet be confirmed</p>
          <p className="mt-2 text-sm leading-relaxed">Complete the missing Creative Passport information or review the unclear official requirement before preparing a package.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link className={primary} href="/artist-dashboard/passport/">Complete Creative Passport</Link><Link className={secondary} href="/artist-dashboard/opportunities/">Return to opportunities</Link></div>
        </section>
      </PreparationGateShell>
    )
  }

  if (evaluation.readiness.work_provenance_confirmation_required) {
    return (
      <PreparationGateShell>
        <section className={`${surface} border-amber-200 bg-amber-50 text-amber-900`}>
          <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-5" />Confirm artwork creation provenance</p>
          <p className="mt-2 text-sm leading-relaxed">This opportunity prohibits or restricts AI-generated artwork. KLEIO needs an artist-controlled provenance confirmation for at least one compatible portfolio work before opening package preparation.</p>
          <p className="mt-2 text-xs leading-relaxed">Artwork policy: {evaluation.explanation.artwork_policy?.artwork_ai_policy?.replaceAll("_", " ") || "restricted"}. Application-assistance policy: {evaluation.explanation.artwork_policy?.application_assistance_policy?.replaceAll("_", " ") || "not stated"}.</p>
          <div className="mt-4 flex flex-wrap gap-2"><Link className={primary} href="/artist-dashboard/portfolio/">Review portfolio works</Link><Link className={secondary} href="/artist-dashboard/opportunities/">Return to opportunities</Link></div>
        </section>
      </PreparationGateShell>
    )
  }

  return <>{children}</>
}
