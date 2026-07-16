import { getSupabaseConfig, supabaseRest } from "@/lib/kleio-supabase"
import type { ApplicationRecord, PortfolioWorkRecord } from "@/lib/kleio-live-data"

const PREVIEW_KEY = "kleio-connected-preview-v1"

type PreviewState = {
  portfolioWorks?: PortfolioWorkRecord[]
}

function previewWorks() {
  if (typeof window === "undefined") return []
  const raw = window.localStorage.getItem(PREVIEW_KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as PreviewState).portfolioWorks ?? []
  } catch {
    return []
  }
}

export async function listSelectedApplicationWorks(application: ApplicationRecord) {
  if (!application.selected_work_ids.length) return []

  if (!getSupabaseConfig().configured) {
    const selected = new Set(application.selected_work_ids)
    return previewWorks().filter((work) => selected.has(work.id)).sort((a, b) => application.selected_work_ids.indexOf(a.id) - application.selected_work_ids.indexOf(b.id))
  }

  const filter = application.selected_work_ids.map(encodeURIComponent).join(",")
  const rows = await supabaseRest<PortfolioWorkRecord[]>(`portfolio_works?select=*&id=in.(${filter})`, { method: "GET" })
  return rows.sort((a, b) => application.selected_work_ids.indexOf(a.id) - application.selected_work_ids.indexOf(b.id))
}
