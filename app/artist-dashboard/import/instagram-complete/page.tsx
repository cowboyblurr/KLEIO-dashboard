"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Check, Loader2, X } from "lucide-react"

type CompletionState = {
  result: string
  username: string
  success: boolean
}

type OAuthMessage = {
  type: "kleio-instagram-oauth"
  success: boolean
  username: string
  message: string
}

const importPath = "/artist-dashboard/import/"

function completionCopy(state: CompletionState | null) {
  if (!state) {
    return {
      title: "Finishing Instagram connection",
      body: "KLEIO is returning your authorization result to the Import Studio.",
    }
  }
  if (state.success) {
    return {
      title: "Instagram connected",
      body: "Your Instagram gallery is opening in the original KLEIO window.",
    }
  }
  if (state.result === "instagram_oauth_cancelled") {
    return {
      title: "Authorization cancelled",
      body: "Nothing was connected. Return to the original KLEIO window to try again.",
    }
  }
  return {
    title: "Connection needs attention",
    body: "Return to the original KLEIO window and start a fresh Instagram connection.",
  }
}

export default function InstagramCompletePage() {
  const [completion, setCompletion] = useState<CompletionState | null>(null)
  const [canCloseManually, setCanCloseManually] = useState(false)
  const copy = useMemo(() => completionCopy(completion), [completion])

  useEffect(() => {
    const url = new URL(window.location.href)
    const result = url.searchParams.get("instagram_result") || "instagram_oauth_failed"
    const username = url.searchParams.get("instagram_username") || ""
    const success = result === "instagram_oauth_success"
    const state = { result, username, success }
    const payload: OAuthMessage = {
      type: "kleio-instagram-oauth",
      success,
      username,
      message: result,
    }

    setCompletion(state)

    url.searchParams.delete("instagram")
    url.searchParams.delete("instagram_result")
    url.searchParams.delete("instagram_username")
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)

    if (window.opener && !window.opener.closed) {
      window.opener.postMessage(payload, window.location.origin)
      window.setTimeout(() => window.close(), 120)
      window.setTimeout(() => setCanCloseManually(true), 800)
      return
    }

    setCanCloseManually(true)
  }, [])

  return (
    <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] px-5 py-10 text-[#292631]">
      <section className="w-full max-w-md rounded-[28px] border border-[#E2DCF1] bg-white p-7 text-center shadow-[0_24px_80px_rgba(82,64,130,0.12)]" aria-labelledby="instagram-complete-title" aria-live="polite">
        <span className={`mx-auto grid size-12 place-items-center rounded-full ${completion?.success ? "bg-emerald-50 text-emerald-700" : completion ? "bg-amber-50 text-amber-700" : "bg-[#F1EDF8] text-[#5B4B8A]"}`}>
          {!completion ? <Loader2 className="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : completion.success ? <Check className="size-5" aria-hidden="true" /> : <AlertTriangle className="size-5" aria-hidden="true" />}
        </span>
        <h1 id="instagram-complete-title" className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em]">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#746E80]">{copy.body}</p>

        {canCloseManually ? (
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={() => window.close()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
              <X className="size-4" aria-hidden="true" />
              Close window
            </button>
            <a href={importPath} className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F7F4FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20">
              Return to Import Studio
            </a>
          </div>
        ) : (
          <p className="mt-5 text-xs font-semibold text-[#75639E]">Returning to KLEIO…</p>
        )}
      </section>
    </main>
  )
}
