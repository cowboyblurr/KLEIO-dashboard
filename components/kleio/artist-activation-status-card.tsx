"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ChevronRight, Circle, Loader2, TriangleAlert } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"

export type ArtistActivationStatus = {
  artist_user_id: string
  account_created: boolean
  onboarding_completed: boolean
  core_passport_completed: boolean
  identity_presentation_completed: boolean
  three_works_added: boolean
  reusable_material_added: boolean
  opportunity_action_completed: boolean
  activated: boolean
  completion_details: {
    work_count?: number
    reusable_material_count?: number
    opportunity_action_count?: number
    next_missing?: Record<string, string>
  }
  activated_at: string | null
  updated_at: string
}

type Milestone = {
  key: keyof Pick<
    ArtistActivationStatus,
    | "account_created"
    | "onboarding_completed"
    | "core_passport_completed"
    | "identity_presentation_completed"
    | "three_works_added"
    | "reusable_material_added"
    | "opportunity_action_completed"
  >
  label: string
  reason: string
  href: string
}

const milestones: Milestone[] = [
  { key: "account_created", label: "Account connected", reason: "Keeps your private workspace separate from every other artist.", href: "/artist-dashboard/" },
  { key: "onboarding_completed", label: "Onboarding completed", reason: "Gives KLEIO the basic context needed to open the correct artist workspace.", href: "/signup/artist/" },
  { key: "core_passport_completed", label: "Core Creative Passport", reason: "Provides approved identity, location, practice, biography, and statement information for reuse.", href: "/artist-dashboard/passport/" },
  { key: "identity_presentation_completed", label: "Professional identity", reason: "Ensures your workspace and application packages present the artist you intend.", href: "/artist-dashboard/profile/" },
  { key: "three_works_added", label: "Three portfolio works", reason: "Creates a minimum meaningful body of work for readiness checks and artist-controlled selection.", href: "/artist-dashboard/portfolio/" },
  { key: "reusable_material_added", label: "Reusable application material", reason: "Reduces repeated administrative work by storing a CV, proposal, reference, budget, timeline, or other private material.", href: "/artist-dashboard/passport/" },
  { key: "opportunity_action_completed", label: "One intentional opportunity action", reason: "Confirms that the Passport has supported a real decision: save, prepare, track, or dismiss after review.", href: "/artist-dashboard/opportunities/" },
]

function detailFor(status: ArtistActivationStatus, milestone: Milestone) {
  if (milestone.key === "three_works_added") return `${status.completion_details.work_count ?? 0} of 3 works connected.`
  if (milestone.key === "reusable_material_added") return `${status.completion_details.reusable_material_count ?? 0} reusable private material${status.completion_details.reusable_material_count === 1 ? "" : "s"} stored.`
  if (milestone.key === "opportunity_action_completed") return `${status.completion_details.opportunity_action_count ?? 0} intentional opportunity action${status.completion_details.opportunity_action_count === 1 ? "" : "s"} recorded.`
  return milestone.reason
}

export function ArtistActivationStatusCard() {
  const [status, setStatus] = useState<ArtistActivationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadActivationStatus() {
      try {
        const supabase = getSupabaseBrowserClient()
        const { data, error: loadError } = await supabase
          .from("artist_activation_status")
          .select("*")
          .maybeSingle()

        if (!active) return
        if (loadError) setError(loadError.message)
        else setStatus((data ?? null) as ArtistActivationStatus | null)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : "KLEIO could not load the activation record.")
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadActivationStatus()
    return () => { active = false }
  }, [])

  const completeCount = useMemo(() => status ? milestones.filter((milestone) => status[milestone.key]).length : 0, [status])
  const nextMilestone = useMemo(() => status ? milestones.find((milestone) => !status[milestone.key]) ?? null : null, [status])

  if (loading) {
    return <section className="mx-4 mt-4 flex items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-4 text-sm text-muted-foreground sm:mx-5"><Loader2 className="size-4 animate-spin" />Checking account readiness…</section>
  }

  if (error || !status) {
    return (
      <section role="status" className="mx-4 mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-5">
        <p className="flex items-center gap-2 font-semibold"><TriangleAlert className="size-4" />Activation status unavailable</p>
        <p className="mt-1 text-xs leading-relaxed">KLEIO could not confirm the durable milestone record. Your profile data has not been replaced with a local progress estimate.</p>
      </section>
    )
  }

  return (
    <section className="mx-4 mt-4 rounded-2xl border border-[#E7E1F7] bg-[linear-gradient(135deg,#FBF9FF_0%,#FFFFFF_70%)] p-4 shadow-[0_12px_34px_rgba(82,64,130,0.045)] sm:mx-5" aria-labelledby="artist-activation-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.14em] text-[#A997E8]">Useful account readiness</p>
          <h2 id="artist-activation-title" className="mt-1 font-serif text-lg font-semibold text-[#292631]">{status.activated ? "Your artist workspace is activated" : `${completeCount} of ${milestones.length} activation milestones are complete`}</h2>
          <p className="mt-1 text-[0.75rem] leading-relaxed text-[#7F7890]">Activation means the account contains enough approved material to support a real opportunity decision. It is not a ranking and does not affect how institutions judge your work.</p>
        </div>
        {nextMilestone && (
          <Link href={nextMilestone.href} className="inline-flex h-9 items-center gap-1 rounded-lg bg-primary px-3.5 text-xs font-semibold text-primary-foreground">
            Continue with {nextMilestone.label.toLowerCase()}<ChevronRight className="size-3" />
          </Link>
        )}
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {milestones.map((milestone) => {
          const complete = status[milestone.key]
          return (
            <Link key={milestone.key} href={milestone.href} className="rounded-xl border border-[#E7E1F7] bg-white p-3 transition-colors hover:bg-[#FDFBFF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10">
              <p className="flex items-center gap-2 text-[0.72rem] font-semibold text-[#292631]">{complete ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <Circle className="size-4 shrink-0 text-[#B6A8D8]" />}{milestone.label}</p>
              <p className="mt-1 text-[0.64rem] leading-relaxed text-[#7F7890]">{complete ? detailFor(status, milestone) : milestone.reason}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
