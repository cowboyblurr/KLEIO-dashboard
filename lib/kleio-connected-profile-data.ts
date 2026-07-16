import { getDemoSession } from "@/lib/kleio-demo-auth"
import { getSupabaseConfig, supabaseRest } from "@/lib/kleio-supabase"

const PREVIEW_KEY = "kleio-connected-preview-v1"

type PreviewState = {
  portfolioWorks?: Array<{ id: string; artist_user_id: string }>
  [key: string]: unknown
}

export async function deleteConnectedPortfolioWork(workId: string) {
  const session = getDemoSession()
  if (!session || session.role !== "artist") throw new Error("An artist session is required.")
  const userId = session.userId ?? "preview-artist"

  if (!getSupabaseConfig().configured) {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(PREVIEW_KEY)
    if (!raw) return
    const state = JSON.parse(raw) as PreviewState
    state.portfolioWorks = (state.portfolioWorks ?? []).filter((work) => !(work.id === workId && work.artist_user_id === userId))
    window.localStorage.setItem(PREVIEW_KEY, JSON.stringify(state))
    return
  }

  await supabaseRest(`portfolio_works?id=eq.${encodeURIComponent(workId)}&artist_user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  })
}
