"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, RotateCcw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { loadOpportunityDirectoryWithSources } from "@/lib/kleio-opportunity-presentation"

type ScopedOpportunity = { id: string; data_scope?: string; title: string }

export function PracticeSubmissionResetControl() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity")?.trim() ?? ""
  const [visible, setVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    if (!opportunityId) return
    let active = true
    loadOpportunityDirectoryWithSources({ limit: 100 })
      .then((directory) => {
        const opportunity = directory.items.find((item) => item.id === opportunityId) as ScopedOpportunity | undefined
        if (active) setVisible(opportunity?.data_scope === "synthetic_test")
      })
      .catch(() => { if (active) setVisible(false) })
    return () => { active = false }
  }, [opportunityId])

  async function reset() {
    setBusy(true)
    setError("")
    setStatus("")
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error: rpcError } = await supabase.rpc("reset_my_kleio_practice_submission")
      if (rpcError) throw rpcError
      const result = data as { reset?: boolean; deleted_packages?: number; preserved_artist_data?: boolean }
      setStatus(`Practice state reset. ${result.deleted_packages ?? 0} application package${result.deleted_packages === 1 ? " was" : "s were"} removed; your Passport, portfolio, media, and unrelated applications were preserved.`)
      window.dispatchEvent(new CustomEvent("kleio:practice-submission-reset"))
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reset the practice application.")
    } finally {
      setBusy(false)
    }
  }

  if (!visible) return null

  return (
    <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4" aria-labelledby="practice-reset-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-800">Internal test control</p><h2 id="practice-reset-title" className="mt-1 text-sm font-semibold text-amber-950">Reset only this synthetic practice application</h2><p className="mt-1 text-xs leading-5 text-amber-900">This removes the test package, secure links, recipient events, verification records, and test conversation. It does not delete artist source data.</p></div>
        <button type="button" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-400 bg-white px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50" disabled={busy} onClick={() => void reset()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCcw className="size-4" />}Reset practice state</button>
      </div>
      {status && <p role="status" aria-live="polite" className="mt-3 text-sm text-emerald-800">{status}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-800">{error}</p>}
    </section>
  )
}
