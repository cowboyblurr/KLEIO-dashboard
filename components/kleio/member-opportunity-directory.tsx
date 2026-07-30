"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Loader2, LockKeyhole, RotateCcw, Search, ShieldCheck } from "lucide-react"
import { KleioWordmarkLink } from "@/components/kleio/kleio-wordmark-link"
import { PublicOpportunityDirectory } from "@/components/kleio/public-opportunity-directory"
import { getDashboardForRole } from "@/lib/kleio-demo-auth"
import { storeKleioReturnIntent, type KleioOpportunityIntentAction, type KleioOpportunityIntentSource } from "@/lib/kleio-return-intent"
import { loadKleioAccount, type KleioAccount } from "@/lib/kleio-supabase"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#55457F] px-5 text-sm font-semibold text-white"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A]"

type AccessState = "checking" | "member" | "guest" | "error"

function parseAction(value: string | null): KleioOpportunityIntentAction {
  return value === "check_fit" || value === "save" || value === "prepare" || value === "complete_passport" ? value : "view_details"
}

function parseSource(value: string | null): KleioOpportunityIntentSource {
  return value === "landing_carousel" || value === "public_detail" || value === "shared_link" ? value : "public_directory"
}

export function MemberOpportunityDirectory() {
  const searchParams = useSearchParams()
  const [state, setState] = useState<AccessState>("checking")
  const [account, setAccount] = useState<KleioAccount | null>(null)
  const [error, setError] = useState("")

  const requestedOpportunityId = searchParams.get("opportunity")
  const selectedOpportunityId = requestedOpportunityId && UUID_PATTERN.test(requestedOpportunityId) ? requestedOpportunityId : null
  const requestedAction = parseAction(searchParams.get("resume"))
  const requestedSource = parseSource(searchParams.get("source"))

  const selectedReturnRoute = useMemo(() => {
    if (!selectedOpportunityId) return null
    const params = new URLSearchParams({
      opportunity: selectedOpportunityId,
      resume: requestedAction,
      source: requestedSource,
    })
    return `/opportunities/?${params.toString()}`
  }, [requestedAction, requestedSource, selectedOpportunityId])

  const checkAccess = useCallback(async () => {
    setState("checking")
    setError("")
    try {
      const nextAccount = await loadKleioAccount()
      setAccount(nextAccount)
      setState(nextAccount ? "member" : "guest")
    } catch (reason) {
      setAccount(null)
      setError(reason instanceof Error ? reason.message : "KLEIO could not confirm your account.")
      setState("error")
    }
  }, [])

  useEffect(() => {
    void checkAccess()
  }, [checkAccess])

  function preserveSelection() {
    if (!selectedOpportunityId) return
    storeKleioReturnIntent({
      opportunityId: selectedOpportunityId,
      action: requestedAction,
      source: requestedSource,
      searchContext: "member_directory_gate",
    })
  }

  if (state === "checking") {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#FAFAFA] px-5 text-[#292631]">
        <div role="status" className="rounded-2xl border border-[#E7E1F7] bg-white px-8 py-10 text-center shadow-[0_18px_48px_rgba(82,64,130,0.06)]">
          <Loader2 className="mx-auto size-5 animate-spin text-[#75639E]" />
          <p className="mt-4 text-sm text-[#746E80]">Confirming member access to the opportunity directory…</p>
        </div>
      </main>
    )
  }

  if (state === "error") {
    return (
      <main className="grid min-h-dvh place-items-center bg-[#FAFAFA] px-5 text-[#292631]">
        <div role="alert" className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-[0_18px_48px_rgba(82,64,130,0.06)]">
          <p className="font-serif text-2xl font-semibold">Member access could not be confirmed.</p>
          <p className="mt-3 text-sm leading-6 text-[#746E80]">{error || "The directory remains closed until KLEIO can confirm an authenticated account."}</p>
          <button type="button" onClick={() => void checkAccess()} className={`${secondary} mt-6`}><RotateCcw className="size-4" />Try again</button>
        </div>
      </main>
    )
  }

  if (state === "guest" || !account) {
    const signupUrl = selectedReturnRoute ? `/signup/artist/?returnTo=${encodeURIComponent(selectedReturnRoute)}` : "/signup/artist/"
    return (
      <main className="min-h-dvh bg-[#FAFAFA] text-[#292631]">
        <header className="border-b border-[#E7E1F7] bg-white/95">
          <div className="mx-auto flex min-h-16 max-w-[1180px] items-center justify-between gap-4 px-5 sm:px-8">
            <KleioWordmarkLink href="/" />
            <Link href="/" className="text-sm font-semibold text-[#6F6882] hover:text-[#292631]">Back to KLEIO</Link>
          </div>
        </header>
        <section className="mx-auto grid max-w-[1080px] gap-8 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#75639E]">Member opportunity directory</p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl leading-tight tracking-[-0.045em] sm:text-6xl">The full directory begins after sign-up.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#746E80]">Public visitors can preview selected opportunities on the landing page. A confirmed KLEIO account unlocks complete browsing, detailed eligibility and requirements, source access, saving, fit checks, and application preparation.</p>
            {selectedOpportunityId && <p className="mt-5 rounded-xl border border-[#D9D0F2] bg-[#F8F5FF] px-4 py-3 text-sm leading-6 text-[#5B4B8A]">Your selected opportunity will be preserved and reopened after account creation or sign-in.</p>}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={signupUrl} onClick={preserveSelection} className={primary}>Create free artist account<ArrowRight className="size-4" /></Link>
              <Link href="/#login" onClick={preserveSelection} className={secondary}>Already a member? Sign in</Link>
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#DDD5ED] bg-white p-7 shadow-[0_26px_70px_rgba(70,52,112,0.09)] sm:p-9">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#F0EAFB] text-[#5B4B8A]"><LockKeyhole className="size-5" /></span>
            <h2 className="mt-5 font-serif text-2xl font-semibold">What membership unlocks</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[#655F70]">
              <li className="flex gap-3"><Search className="mt-1 size-4 shrink-0 text-[#75639E]" />Search and filter the complete sourced directory.</li>
              <li className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-[#75639E]" />Review structured eligibility, requirements, verification, and source limitations.</li>
              <li className="flex gap-3"><ArrowRight className="mt-1 size-4 shrink-0 text-[#75639E]" />Save, assess fit, and prepare materials through your Creative Passport.</li>
            </ul>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#FAFAFA] text-[#292631]">
      <header className="sticky top-0 z-40 border-b border-[#E7E1F7] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-4"><KleioWordmarkLink href="/" /><span className="hidden rounded-full bg-[#F2EDFC] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#5B4B8A] sm:inline-flex">Member directory</span></div>
          <Link href={getDashboardForRole(account.profile.role)} className={secondary}>Return to workspace</Link>
        </div>
      </header>
      <section className="mx-auto max-w-[1180px] px-4 pb-1 pt-8 sm:px-6 sm:pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7F6EB4]">Full member access</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Browse sourced opportunities with complete KLEIO context.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#746E80]">Search the directory, open structured details, and continue into saving, fit assessment, or application preparation from your member workspace.</p>
      </section>
      <div className="[&>main>header]:hidden [&>main>div>section:first-child]:hidden [&>main]:min-h-0">
        <PublicOpportunityDirectory />
      </div>
    </main>
  )
}
