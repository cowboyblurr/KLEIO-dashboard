"use client"

import { useEffect, useMemo, useState } from "react"

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

const callbackOrigin = "https://trekynurdgxgtaaqqtyq.supabase.co"
const importPath = "/artist-dashboard/import/"

function completionCopy(state: CompletionState | null) {
  if (!state) {
    return {
      title: "Finishing Instagram connection",
      body: "KLEIO is returning your authorization result to the original Import Studio.",
    }
  }
  if (state.success) {
    return {
      title: "Instagram connected",
      body: "Your media gallery is opening in the original KLEIO window.",
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
      try {
        // This route shares KLEIO's origin with the original window, so it can
        // deliver the exact callback event the existing Import Studio expects.
        const callbackEvent = new MessageEvent<OAuthMessage>("message", {
          data: payload,
          origin: callbackOrigin,
        })
        window.opener.dispatchEvent(callbackEvent)
        window.setTimeout(() => window.close(), 80)
        window.setTimeout(() => setCanCloseManually(true), 700)
        return
      } catch {
        // Fall through to the compact manual fallback.
      }
    }

    setCanCloseManually(true)
  }, [])

  return (
    <main className="grid min-h-dvh place-items-center bg-[#FCFBFE] px-5 py-10 text-[#292631]">
      <section className="w-full max-w-md rounded-[28px] border border-[#E2DCF1] bg-white p-7 text-center shadow-[0_24px_80px_rgba(82,64,130,0.12)]" aria-labelledby="instagram-complete-title" aria-live="polite">
        <span className={`mx-auto grid size-12 place-items-center rounded-full text-lg font-bold ${completion?.success ? "bg-emerald-50 text-emerald-700" : completion ? "bg-amber-50 text-amber-700" : "bg-[#F1EDF8] text-[#5B4B8A]"}`} aria-hidden="true">
          {!completion ? "…" : completion.success ? "✓" : "!"}
        </span>
        <h1 id="instagram-complete-title" className="mt-4 font-serif text-2xl font-semibold tracking-[-0.03em]">{copy.title}</h1>
        <p className="mt-3 text-sm leading-6 text-[#746E80]">{copy.body}</p>

        {canCloseManually ? (
          <div className="mt-6 grid gap-2">
            <button type="button" onClick={() => window.close()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25">
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
