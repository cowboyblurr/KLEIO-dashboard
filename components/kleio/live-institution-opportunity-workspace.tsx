"use client"

/* eslint-disable @next/next/no-img-element -- institution opportunity media uses controlled public listing assets */

import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Loader2, Save, Trash2, X } from "lucide-react"
import { LiveInstitutionCallsWithImages } from "@/components/kleio/live-institution-calls-with-images"
import { loadInstitutionOpenCalls, type OpenCallRecord } from "@/lib/kleio-live-data"
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import { getOpportunityImagePublicUrl, removeOpportunityImage } from "@/lib/kleio-opportunity-images"
import { uploadSubmissionCover } from "@/lib/kleio-opportunity-media"

type CallWithCover = OpenCallRecord & {
  submission_cover_path?: string
  submission_cover_alt_text?: string
  submission_cover_position_x?: number
  submission_cover_position_y?: number
}

const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:opacity-50"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 text-sm font-semibold text-white disabled:opacity-50"

export function LiveInstitutionOpportunityWorkspace() {
  const [open, setOpen] = useState(false)
  const [calls, setCalls] = useState<CallWithCover[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [altText, setAltText] = useState("")
  const [positionX, setPositionX] = useState(50)
  const [positionY, setPositionY] = useState(50)
  const [removeCover, setRemoveCover] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const selected = calls.find((call) => call.id === selectedId) || null
  const localUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file])
  useEffect(() => () => { if (localUrl) URL.revokeObjectURL(localUrl) }, [localUrl])

  async function refresh() {
    const rows = await loadInstitutionOpenCalls() as CallWithCover[]
    setCalls(rows)
    const nextId = selectedId && rows.some((row) => row.id === selectedId) ? selectedId : rows[0]?.id || ""
    setSelectedId(nextId)
    const next = rows.find((row) => row.id === nextId)
    if (next) applyCall(next)
  }

  function applyCall(call: CallWithCover) {
    setAltText(call.submission_cover_alt_text || "")
    setPositionX(call.submission_cover_position_x ?? 50)
    setPositionY(call.submission_cover_position_y ?? 50)
    setFile(null)
    setRemoveCover(false)
  }

  useEffect(() => { if (open) void refresh().catch((reason: Error) => setError(reason.message)) }, [open])

  async function save() {
    if (!selected) return
    if ((file || (!removeCover && selected.submission_cover_path)) && !altText.trim()) {
      setError("Add concise alt text describing the submission cover before saving.")
      return
    }
    setBusy(true); setError(""); setMessage("")
    let uploadedPath = ""
    const previousPath = selected.submission_cover_path || ""
    try {
      if (file) uploadedPath = await uploadSubmissionCover(file, selected.id)
      const nextPath = removeCover ? "" : uploadedPath || previousPath
      const supabase = getSupabaseBrowserClient()
      const { error: updateError } = await supabase.from("open_calls").update({
        submission_cover_path: nextPath,
        submission_cover_alt_text: nextPath ? altText.trim() : "",
        submission_cover_position_x: positionX,
        submission_cover_position_y: positionY,
        updated_at: new Date().toISOString(),
      }).eq("id", selected.id)
      if (updateError) throw updateError
      if (previousPath && previousPath !== nextPath) await removeOpportunityImage(previousPath).catch(() => undefined)
      setMessage(nextPath ? "Submission cover saved separately from the opportunity image." : "Submission cover removed. The application experience will use the standard KLEIO fallback.")
      await refresh()
    } catch (reason) {
      if (uploadedPath) await removeOpportunityImage(uploadedPath).catch(() => undefined)
      setError(reason instanceof Error ? reason.message : "Unable to save the submission cover.")
    } finally { setBusy(false) }
  }

  const currentUrl = localUrl || (!removeCover && selected?.submission_cover_path ? getOpportunityImagePublicUrl(selected.submission_cover_path) : "")

  return <div className="relative h-full"><LiveInstitutionCallsWithImages /><button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 inline-flex h-11 items-center gap-2 rounded-full border border-[#D8D0F2] bg-white px-5 text-sm font-semibold text-[#5B4B8A] shadow-[0_18px_50px_rgba(82,64,130,0.18)]"><ImagePlus className="size-4" />Submission covers</button>{open && <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#201B2B]/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Submission cover manager"><div className="mx-auto mt-6 max-w-4xl rounded-3xl border border-[#E7E1F7] bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6A5896]">Institution opportunity media</p><h2 className="mt-2 font-serif text-3xl tracking-[-0.04em]">Submission cover</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#7F7890]">This image introduces the application experience and remains separate from the opportunity card image. JPG, PNG, or WebP only, up to 10 MB.</p></div><button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-full border border-[#E7E1F7]" aria-label="Close"><X className="size-4" /></button></div>{calls.length === 0 ? <p className="mt-6 rounded-2xl bg-[#F7F4FF] p-5 text-sm text-[#7F7890]">Create an opportunity draft before adding a submission cover.</p> : <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"><div><label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Opportunity</span><select value={selectedId} onChange={(event) => { const call = calls.find((row) => row.id === event.target.value); setSelectedId(event.target.value); if (call) applyCall(call) }} className="h-11 rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm">{calls.map((call) => <option key={call.id} value={call.id}>{call.title} · {call.status}</option>)}</select></label><label className="mt-4 flex min-h-28 cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-[#CFC5ED] bg-[#FBF9FF] px-4 text-sm font-semibold text-[#5B4B8A]"><ImagePlus className="size-5" /><span>{file ? file.name : selected?.submission_cover_path ? "Replace submission cover" : "Choose submission cover"}</span><input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] || null); setRemoveCover(false) }} /></label><label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Alt text</span><input value={altText} onChange={(event) => setAltText(event.target.value)} placeholder="Describe the image for applicants using assistive technology" className="h-11 rounded-xl border border-[#E7E1F7] px-3 text-sm font-normal text-[#292631]" /></label><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-1 text-xs font-semibold text-[#746E80]"><span>Horizontal focal point</span><input type="range" min="0" max="100" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label><label className="grid gap-1 text-xs font-semibold text-[#746E80]"><span>Vertical focal point</span><input type="range" min="0" max="100" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label></div>{(currentUrl || selected?.submission_cover_path) && <button type="button" className={`${secondary} mt-4`} onClick={() => { setFile(null); setRemoveCover(true); setAltText("") }}><Trash2 className="size-4" />Remove cover</button>}{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}{message && <p role="status" className="mt-4 text-sm text-emerald-700">{message}</p>}<button type="button" onClick={() => void save()} disabled={busy || !selectedId} className={`${primary} mt-5`}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save submission cover</button></div><div className="overflow-hidden rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF]"><div className="relative aspect-[4/5] overflow-hidden">{currentUrl ? <img src={currentUrl} alt={altText || "Submission cover preview"} className="size-full object-cover" style={{ objectPosition: `${positionX}% ${positionY}%` }} /> : <div className="grid size-full place-items-center text-center text-[#7F7890]"><div><ImagePlus className="mx-auto size-7" /><p className="mt-2 text-sm">Application cover preview</p></div></div>}</div><div className="border-t border-[#E7E1F7] bg-white p-4"><p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#6A5896]">Applicant view</p><p className="mt-1 font-serif text-xl">{selected?.title || "Opportunity"}</p><p className="mt-2 text-xs text-[#7F7890]">Cover imagery does not change eligibility, requirements, or submission status.</p></div></div></div>}</div></div>}</div>
}
