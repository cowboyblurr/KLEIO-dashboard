"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Loader2 } from "lucide-react"
import { acceptInstitutionInvitation } from "@/lib/kleio-live-data"

export function AcceptInvitation() {
  const params = useSearchParams()
  const token = params.get("token") || ""
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [accepted, setAccepted] = useState(false)

  async function accept() {
    if (!token) return
    setLoading(true); setError("")
    try { await acceptInstitutionInvitation(token); setAccepted(true) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to accept this invitation.") }
    finally { setLoading(false) }
  }

  return <main className="grid min-h-screen place-items-center bg-[oklch(0.985_0.005_287)] px-5"><section className="w-full max-w-lg rounded-2xl border border-[#E7E1F7] bg-white p-7 shadow-sm">{accepted ? <><CheckCircle2 className="size-8 text-emerald-600" /><h1 className="mt-4 font-serif text-2xl font-semibold">Invitation accepted</h1><p className="mt-2 text-sm text-muted-foreground">Your institution membership is active and ready to use.</p><Link href="/collaborator-dashboard/" className="mt-5 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">Open reviewer workspace</Link></> : <><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#A997E8]">Institution invitation</p><h1 className="mt-2 font-serif text-2xl font-semibold">Join the institution workspace</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Sign in with the email address that received this link, then accept the invitation.</p>{!token && <p role="alert" className="mt-4 text-sm text-red-700">This invitation link is incomplete. Ask the institution to send a new one.</p>}{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<button className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50" disabled={!token || loading} onClick={() => void accept()}>{loading && <Loader2 className="size-4 animate-spin" />}Accept invitation</button></>}</section></main>
}
