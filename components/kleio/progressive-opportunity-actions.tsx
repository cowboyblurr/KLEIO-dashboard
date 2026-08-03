"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, FileText, Loader2, Save, UserPlus } from "lucide-react"
import { DisciplineMultiSelect } from "@/components/kleio/forms/artist-term-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { loadArtistPassport, saveArtistPassport, type ArtistPassportRecord } from "@/lib/kleio-live-data"
import { getSupabaseBrowserClient, loadKleioAccount, type KleioAccount } from "@/lib/kleio-supabase"
import { storeKleioReturnIntent, type KleioOpportunityIntentAction, type KleioOpportunityIntentSource } from "@/lib/kleio-return-intent"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"

type EvaluationRecord = {
  eligibility_status: string
  relevance_status: string
  readiness: Record<string, unknown>
  effort: Record<string, unknown>
  explanation: Record<string, unknown>
}

function cleanLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function ProgressiveOpportunityActions({
  opportunityId,
  opportunityTitle,
  source,
  searchContext,
  requestedAction,
}: {
  opportunityId: string
  opportunityTitle: string
  source: KleioOpportunityIntentSource
  searchContext?: string
  requestedAction?: KleioOpportunityIntentAction | null
}) {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const [account, setAccount] = useState<KleioAccount | null>(null)
  const [passport, setPassport] = useState<ArtistPassportRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<KleioOpportunityIntentAction | null>(requestedAction ?? null)
  const [location, setLocation] = useState("")
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [evaluation, setEvaluation] = useState<EvaluationRecord | null>(null)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void loadKleioAccount().then(async (nextAccount) => {
      if (!active) return
      setAccount(nextAccount)
      if (nextAccount?.profile.role === "artist") {
        const nextPassport = await loadArtistPassport()
        if (!active) return
        setPassport(nextPassport)
        setLocation(nextPassport?.location ?? "")
        setDisciplines(nextPassport?.disciplines ?? [])
      }
    }).catch(() => {
      if (active) {
        setError("Unable to check your KLEIO account.")
        void trackKleioProductEvent("user_visible_error", {
          surface: "public_opportunity",
          opportunityId,
          metadata: { step: "account_check", error_code: "opportunity_account_check_failed", retryable: true },
        })
      }
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [opportunityId])

  function requireArtist(action: KleioOpportunityIntentAction) {
    const eventName = action === "check_fit" ? "check_fit_selected" : action === "save" ? "save_selected" : "prepare_selected"
    void trackKleioProductEvent(eventName, { surface: "public_opportunity", opportunityId, metadata: { source } })
    if (!account) {
      storeKleioReturnIntent({ opportunityId, action, source, searchContext })
      void trackKleioProductEvent("signup_prompted", { surface: "public_opportunity", opportunityId, metadata: { action, intent_source: source } })
      router.push("/signup/artist/")
      return false
    }
    if (account.profile.role !== "artist") {
      setError("Personal fit, saving, and application preparation require an artist account. This institution or collaborator session has not been changed.")
      void trackKleioProductEvent("user_visible_error", {
        surface: "public_opportunity",
        opportunityId,
        metadata: { step: action, error_code: "artist_account_required", retryable: false },
      })
      return false
    }
    setActiveAction(action)
    setError("")
    setStatus("")
    return true
  }

  async function saveOpportunity() {
    if (!requireArtist("save") || !account) return
    setBusy(true)
    try {
      const supabase = getSupabaseBrowserClient()
      const { error: saveError } = await supabase.from("saved_opportunities").upsert(
        { artist_user_id: account.user.id, opportunity_id: opportunityId },
        { onConflict: "artist_user_id,opportunity_id", ignoreDuplicates: true },
      )
      if (saveError) throw saveError
      setSaved(true)
      setStatus("Saved to your opportunity shortlist.")
    } catch {
      setError("Unable to save this opportunity.")
      void trackKleioProductEvent("user_visible_error", {
        surface: "public_opportunity",
        opportunityId,
        metadata: { step: "save", error_code: "opportunity_save_failed", retryable: true },
      })
    } finally {
      setBusy(false)
    }
  }

  async function evaluateFit() {
    if (!account || account.profile.role !== "artist") return
    setBusy(true)
    setError("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: evaluationError } = await supabase.rpc("evaluate_my_opportunity", { target_opportunity_id: opportunityId })
      if (evaluationError) throw evaluationError
      const nextEvaluation = data as EvaluationRecord
      setEvaluation(nextEvaluation)
      setStatus("Your eligibility and readiness result has been recalculated from the current Passport and confirmed source rules.")
      void trackKleioProductEvent("readiness_viewed", {
        surface: "public_opportunity",
        opportunityId,
        metadata: {
          source,
          mode: "passport_evaluation",
          status: nextEvaluation.eligibility_status,
        },
      })
    } catch {
      setError("Unable to evaluate this opportunity.")
      void trackKleioProductEvent("user_visible_error", {
        surface: "public_opportunity",
        opportunityId,
        metadata: { step: "readiness", error_code: "opportunity_readiness_failed", retryable: true },
      })
    } finally {
      setBusy(false)
    }
  }

  async function saveRequiredPassportDetails() {
    if (!passport || !account || !location.trim() || disciplines.length === 0) return
    setBusy(true)
    setError("")
    try {
      const savedPassport = await saveArtistPassport({
        ...passport,
        location: location.trim(),
        disciplines,
        disciplines_text: disciplines.join(", "),
        mediums_text: passport.mediums.join(", "),
        languages_text: passport.languages.join(", "),
      })
      const supabase = getSupabaseBrowserClient()
      const { error: countryError } = await supabase.from("artist_profiles").update({
        country_of_residence: location.trim(),
        updated_at: new Date().toISOString(),
      }).eq("user_id", account.user.id)
      if (countryError) throw countryError
      setPassport(savedPassport)
      await evaluateFit()
    } catch {
      setError("Unable to save the required Passport details.")
      void trackKleioProductEvent("passport_save_failed", {
        surface: "public_opportunity",
        opportunityId,
        metadata: { section: "opportunity_foundation", reason: "passport_save_failed", error_code: "passport_save_failed" },
      })
      setBusy(false)
    }
  }

  function prepareApplication() {
    void trackKleioProductEvent("prepare_selected", {
      surface: "public_opportunity",
      opportunityId,
      metadata: { source, mode: "application_preparation" },
    })
    if (!requireArtist("prepare")) return
    if (!passport?.location || passport.disciplines.length === 0) return
    const params = new URLSearchParams({ opportunity: opportunityId, resume: "prepare" })
    router.push(`/artist-dashboard/opportunities/?${params.toString()}`)
  }

  const needsFoundation = account?.profile.role === "artist" && (!passport?.location.trim() || !passport.disciplines.length)
  const showPrompt = needsFoundation && (activeAction === "check_fit" || activeAction === "prepare" || requestedAction === "check_fit" || requestedAction === "prepare")
  const missingRequired = typeof evaluation?.readiness?.missing_required_count === "number" ? evaluation.readiness.missing_required_count : null

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={primary} disabled={loading || busy} onClick={() => { if (requireArtist("check_fit") && !needsFoundation) void evaluateFit() }}>{busy && activeAction === "check_fit" ? <Loader2 className="size-4 animate-spin" /> : account ? <CheckCircle2 className="size-4" /> : <UserPlus className="size-4" />}Check your fit</button>
        <button type="button" className={secondary} disabled={loading || busy || saved} onClick={() => void saveOpportunity()}>{busy && activeAction === "save" ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}{saved ? "Saved" : "Save opportunity"}</button>
        <button type="button" className={secondary} disabled={loading || busy} onClick={prepareApplication}><FileText className="size-4" />Prepare application</button>
      </div>

      {!account && !loading && <p className="mt-3 text-xs leading-5 text-[#746E80]">Create a free Passport only when you want KLEIO to save this opportunity, compare its rules with your information, or prepare the application.</p>}

      {showPrompt && (
        <section className="mt-4 rounded-xl border border-[#D9D0F2] bg-[#F8F5FF] p-4" aria-labelledby={`passport-prompt-${opportunityId}`}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#75639E]">Only what this result needs</p>
          <h3 id={`passport-prompt-${opportunityId}`} className="mt-1 font-serif text-xl font-semibold">Add two Passport details to check this opportunity</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Country or region of residence</span><input className={input} value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Country or region" /><span className="font-normal leading-5">Used to compare your residence with the organizer’s geographic eligibility. It does not publish your location.</span></label>
            <div><DisciplineMultiSelect values={disciplines} onChange={setDisciplines} locale={locale} /><p className="mt-1 text-xs leading-5 text-[#746E80]">Used to compare your practice with the disciplines stated by the source. You can select more than one.</p></div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#746E80]">Unrelated Passport sections remain optional.</p><button type="button" className={primary} disabled={busy || !location.trim() || disciplines.length === 0} onClick={() => void saveRequiredPassportDetails()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}Save and recalculate</button></div>
        </section>
      )}

      {evaluation && (
        <section className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4" aria-live="polite">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-emerald-800">Current KLEIO assessment</p>
          <div className="mt-2 flex flex-wrap gap-2"><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-900">Eligibility: {cleanLabel(evaluation.eligibility_status)}</span><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-900">Relevance: {cleanLabel(evaluation.relevance_status)}</span>{missingRequired !== null && <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-900">Missing required materials: {missingRequired}</span>}</div>
          <p className="mt-3 text-xs leading-5 text-emerald-900">This result is based on the current Passport and structured source evidence. Ambiguous or unstructured organizer rules remain clearly unresolved.</p>
        </section>
      )}

      {status && <p role="status" className="mt-3 text-sm font-medium text-emerald-700">{status}</p>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {requestedAction && requestedAction !== "view_details" && <p className="mt-3 text-xs text-[#746E80]">Restored action: {cleanLabel(requestedAction)} for “{opportunityTitle}”.</p>}
    </div>
  )
}
