"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, X } from "lucide-react"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

const ARTIST_ACTIONS: Record<string, { title: string; description: string; href: string }> = {
  build_passport: {
    title: "Continue your Creative Passport",
    description: "Add the materials that make future applications easier to prepare.",
    href: "/artist-dashboard/passport/",
  },
  find_opportunities: {
    title: "Review matched opportunities",
    description: "Start with programs aligned to your practice and location preferences.",
    href: "/artist-dashboard/opportunities/",
  },
  prepare_application: {
    title: "Prepare an application",
    description: "Compare an opportunity’s requirements with the materials already in your passport.",
    href: "/artist-dashboard/opportunities/",
  },
  organize_portfolio: {
    title: "Organize your portfolio",
    description: "Add works and descriptions without publishing anything automatically.",
    href: "/artist-dashboard/portfolio/",
  },
  track_applications: {
    title: "Open application tracking",
    description: "Keep deadlines, drafts, and submission status in one place.",
    href: "/artist-dashboard/applications/",
  },
  explore: {
    title: "Explore your workspace",
    description: "Review the Creative Passport, opportunities, and application tools at your own pace.",
    href: "/artist-dashboard/",
  },
}

const INSTITUTION_ACTIONS: Record<string, { title: string; description: string; href: string }> = {
  create_open_call: {
    title: "Create your open call",
    description: "Begin with program details, eligibility, required materials, and review dates.",
    href: "/programs/new/",
  },
  invite_team: {
    title: "Prepare your review team",
    description: "Define roles and reviewer access before invitations are enabled.",
    href: "/committee/",
  },
  configure_rubric: {
    title: "Configure a review rubric",
    description: "Set clear evaluation criteria before submissions reach the committee.",
    href: "/settings/",
  },
  organize_submissions: {
    title: "Open the submissions workspace",
    description: "See how applications, assignments, and reviewer progress stay organized.",
    href: "/submissions/",
  },
  sample_workflow: {
    title: "Explore a sample review workflow",
    description: "Use synthetic submissions to understand the committee experience.",
    href: "/submissions/",
  },
  review_platform: {
    title: "Review the institution workspace",
    description: "Explore open calls, submissions, review progress, and reports before setup.",
    href: "/dashboard/",
  },
}

type PreferenceRecord = Record<string, unknown>

type DemoSetup = {
  primaryGoal?: string
  disciplines?: string[]
  opportunityTypes?: string[]
  institutionName?: string
  organizationSize?: string
  currentWorkflow?: string
}

function stringValue(record: PreferenceRecord, key: string) {
  return typeof record[key] === "string" ? record[key] : ""
}

function stringArray(record: PreferenceRecord, key: string) {
  const value = record[key]
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

export function OnboardingPersonalizationPanel({ role }: { role: "artist" | "institution" }) {
  const { isDemo, isResolved } = useKleioMode()
  const [preferences, setPreferences] = useState<PreferenceRecord | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const dismissKey = `kleio:onboarding-recommendations:dismissed:${role}:v1`

  useEffect(() => {
    if (typeof window === "undefined") return
    setDismissed(window.localStorage.getItem(dismissKey) === "true")
  }, [dismissKey])

  useEffect(() => {
    if (!isResolved || dismissed) return
    let active = true

    async function loadPreferences() {
      if (isDemo) {
        const demoKey = `kleio:demo:onboarding:${role}:v1`
        const raw = window.localStorage.getItem(demoKey)
        if (!raw) return
        try {
          const demo = JSON.parse(raw) as DemoSetup
          if (!active) return
          setPreferences({
            primary_goal: demo.primaryGoal ?? "",
            disciplines: demo.disciplines ?? [],
            opportunity_types: demo.opportunityTypes ?? [],
            institution_name: demo.institutionName ?? "",
            organization_size: demo.organizationSize ?? "",
            current_workflow: demo.currentWorkflow ?? "",
          })
        } catch {
          window.localStorage.removeItem(demoKey)
        }
        return
      }

      const account = await loadKleioAccount()
      if (!active || !account || account.profile.role !== role) return
      const supabase = getSupabaseBrowserClient()
      const table = role === "artist" ? "artist_profiles" : "institutions"
      const ownerColumn = role === "artist" ? "user_id" : "owner_user_id"
      const { data, error } = await supabase
        .from(table)
        .select("onboarding_preferences")
        .eq(ownerColumn, account.user.id)
        .maybeSingle()
      if (error) throw error
      if (!active) return
      const stored = data?.onboarding_preferences
      setPreferences(stored && typeof stored === "object" ? (stored as PreferenceRecord) : null)
    }

    void loadPreferences().catch(() => {
      if (active) setPreferences(null)
    })
    return () => {
      active = false
    }
  }, [dismissed, isDemo, isResolved, role])

  const recommendation = useMemo(() => {
    if (!preferences) return null
    const goal = stringValue(preferences, "primary_goal")
    return role === "artist" ? ARTIST_ACTIONS[goal] : INSTITUTION_ACTIONS[goal]
  }, [preferences, role])

  if (dismissed || !recommendation) return null

  const context = role === "artist"
    ? [
        ...stringArray(preferences ?? {}, "disciplines").slice(0, 2),
        ...stringArray(preferences ?? {}, "opportunity_types").slice(0, 1),
      ]
    : [stringValue(preferences ?? {}, "organization_size"), stringValue(preferences ?? {}, "current_workflow")].filter(Boolean)

  function dismiss() {
    setDismissed(true)
    if (typeof window !== "undefined") window.localStorage.setItem(dismissKey, "true")
  }

  return (
    <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.045] p-5 shadow-[0_18px_50px_-42px_oklch(0.42_0.16_287)]" aria-labelledby={`${role}-onboarding-recommendation`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">Prepared from your setup</p>
            <h2 id={`${role}-onboarding-recommendation`} className="mt-1 font-serif text-xl font-semibold text-foreground">
              {recommendation.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">{recommendation.description}</p>
            {context.length ? <p className="mt-2 text-xs text-muted-foreground">Based on: {context.join(" · ").replaceAll("_", " ")}</p> : null}
            <Link href={recommendation.href} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
              Continue setup
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" aria-label="Dismiss setup recommendation">
          <X className="size-4" />
        </button>
      </div>
    </section>
  )
}
