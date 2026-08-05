"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Check, FilePenLine, Loader2, ShieldCheck, Sparkles, X } from "lucide-react"
import {
  loadDocumentDraftCapabilities,
  loadDocumentDrafts,
  rejectDocumentDraft,
  requestDocumentDraft,
  saveDocumentDraftReview,
  type DocumentAssistDraft,
  type DocumentDraftKind,
} from "@/lib/kleio-document-drafting"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const panel = "rounded-[24px] border border-[#E2DCF1] bg-white p-5 shadow-[0_18px_52px_rgba(82,64,130,0.06)] sm:p-6"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/25 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:border-[#B9A9DE] hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const textarea = "min-h-44 w-full rounded-xl border border-[#DED7EF] bg-white px-3 py-3 text-sm leading-7 text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const KINDS: Array<{ value: DocumentDraftKind; label: string; note: string }> = [
  { value: "short_bio", label: "Short biography", note: "Approximately 50–75 words" },
  { value: "standard_bio", label: "Standard biography", note: "Approximately 120–160 words" },
  { value: "extended_bio", label: "Extended biography", note: "Approximately 220–300 words" },
  { value: "practice_description", label: "Practice description", note: "Concise third-person practice language" },
  { value: "first_person_practice", label: "First-person practice introduction", note: "Artist-facing first-person language" },
]

function kindLabel(value: unknown) {
  return KINDS.find((item) => item.value === value)?.label ?? "KLEIO Assist draft"
}

export function DocumentDraftStudio() {
  const [kind, setKind] = useState<DocumentDraftKind>("short_bio")
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [drafts, setDrafts] = useState<DocumentAssistDraft[]>([])
  const [selectedDraft, setSelectedDraft] = useState<DocumentAssistDraft | null>(null)
  const [selectedOption, setSelectedOption] = useState(0)
  const [text, setText] = useState("")
  const [working, setWorking] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    try {
      const [capabilities, nextDrafts] = await Promise.all([
        loadDocumentDraftCapabilities(),
        loadDocumentDrafts(),
      ])
      setConfigured(capabilities.configured)
      setDrafts(nextDrafts)
    } catch (reason) {
      setConfigured(false)
      setError(reason instanceof Error ? reason.message : "KLEIO Assist drafting is unavailable.")
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const currentOptions = useMemo(() => selectedDraft?.generated_output.options ?? [], [selectedDraft])

  function chooseDraft(draft: DocumentAssistDraft, optionIndex = 0) {
    const option = draft.generated_output.options?.[optionIndex]
    setSelectedDraft(draft)
    setSelectedOption(optionIndex)
    setText(draft.artist_edited_text || option?.text || "")
    setError("")
    setMessage("")
  }

  async function generate() {
    setWorking("generate")
    setError("")
    setMessage("")
    try {
      void trackKleioProductEvent("biography_draft_requested", {
        surface: "document_draft_studio",
        metadata: { mode: kind, provider: "configured_server_provider" },
      })
      const result = await requestDocumentDraft(kind)
      const draft = result.draft
      setDrafts((current) => [draft, ...current.filter((item) => item.id !== draft.id)])
      chooseDraft(draft, 0)
      setMessage("Prepared by KLEIO Assist for review. The draft is private and uses only confirmed Passport records.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO Assist could not prepare this draft.")
    } finally {
      setWorking("")
    }
  }

  async function save(approve: boolean) {
    if (!selectedDraft || !text.trim()) return
    setWorking("save")
    setError("")
    setMessage("")
    try {
      const original = currentOptions[selectedOption]?.text || ""
      await saveDocumentDraftReview({ draft: selectedDraft, text, optionIndex: selectedOption, approve })
      setMessage(approve ? "The reviewed text was saved privately to your Creative Passport." : "Your edited private draft was saved for later review.")
      if (approve) {
        void trackKleioProductEvent("biography_draft_saved", {
          surface: "document_draft_studio",
          metadata: {
            mode: String(selectedDraft.request_context.requested_kind || "document_draft"),
            edited: text.trim() !== original.trim(),
            status: "approved_private",
          },
        })
      }
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save this reviewed draft.")
    } finally {
      setWorking("")
    }
  }

  async function reject() {
    if (!selectedDraft) return
    setWorking("reject")
    setError("")
    setMessage("")
    try {
      await rejectDocumentDraft(selectedDraft.id)
      setSelectedDraft(null)
      setText("")
      setMessage("The private draft was rejected and not added to the Creative Passport.")
      await refresh()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not reject this draft.")
    } finally {
      setWorking("")
    }
  }

  return (
    <section className={panel} aria-labelledby="document-drafting-title">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.15em] text-[#75639E]">Confirmed facts only</p>
          <h2 id="document-drafting-title" className="mt-1 font-serif text-2xl font-semibold text-[#292631]">Biography and practice drafting</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#746E80]">KLEIO Assist can prepare writing only after you confirm source-backed Passport records. Approved correlations may shape language, but they never become facts automatically.</p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-[#625C70]"><span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-[#75639E]" />Private until approved</span><span className="inline-flex items-center gap-2"><Sparkles className="size-4 text-[#75639E]" />No prestige or intent invented</span></div>
        </div>

        <div className="space-y-3 rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
          <label className="grid gap-1.5 text-xs font-semibold text-[#625C70]">
            <span>Draft format</span>
            <select className="min-h-11 rounded-xl border border-[#DED7EF] bg-white px-3 text-sm outline-none focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12" value={kind} onChange={(event) => setKind(event.target.value as DocumentDraftKind)} disabled={Boolean(working)}>
              {KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <p className="text-xs leading-5 text-[#81788E]">{KINDS.find((item) => item.value === kind)?.note}</p>
          <button type="button" className={`${primary} w-full`} disabled={configured !== true || Boolean(working)} onClick={() => void generate()}>{working === "generate" ? <Loader2 className="size-4 animate-spin" /> : <FilePenLine className="size-4" />}Prepare two private options</button>
          {configured === false && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Drafting is configured only when the approved server-side provider credentials are available. Document upload and deterministic extraction remain usable without it.</p>}
        </div>
      </div>

      {(error || message) && <div role={error ? "alert" : "status"} aria-live="polite" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

      {drafts.length > 0 && <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <nav className="space-y-2" aria-label="Private KLEIO Assist drafts">
          {drafts.map((draft) => <button key={draft.id} type="button" className={`w-full rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${selectedDraft?.id === draft.id ? "border-[#A997E8] bg-[#F7F4FF]" : "border-[#E7E1F7] bg-white hover:bg-[#FBFAFE]"}`} onClick={() => chooseDraft(draft)}><span className="block text-sm font-semibold text-[#292631]">{kindLabel(draft.request_context.requested_kind)}</span><span className="mt-1 block text-xs text-[#746E80]">{draft.status.replaceAll("_", " ")} · {new Date(draft.created_at).toLocaleDateString()}</span></button>)}
        </nav>

        {selectedDraft && <article className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4 sm:p-5">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">Prepared by KLEIO Assist for review</p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{kindLabel(selectedDraft.request_context.requested_kind)}</h3>
          {currentOptions.length > 1 && <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Draft options">{currentOptions.map((option, index) => <button key={index} type="button" role="tab" aria-selected={selectedOption === index} className={selectedOption === index ? primary : secondary} onClick={() => { setSelectedOption(index); setText(option.text) }}>{option.label}</button>)}</div>}
          <label className="mt-4 grid gap-1.5 text-xs font-semibold text-[#625C70]"><span>Edit before saving</span><textarea className={textarea} value={text} onChange={(event) => setText(event.target.value)} /></label>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-xs leading-5 text-[#81788E]">{text.trim() ? text.trim().split(/\s+/).length : 0} words · source references retained privately in the draft record</p><div className="flex flex-wrap gap-2"><button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 disabled:opacity-50" disabled={Boolean(working)} onClick={() => void reject()}><X className="size-4" />Reject</button><button type="button" className={secondary} disabled={Boolean(working) || !text.trim()} onClick={() => void save(false)}>Save private edit</button><button type="button" className={primary} disabled={Boolean(working) || !text.trim()} onClick={() => void save(true)}>{working === "save" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve and save to Passport</button></div></div>
        </article>}
      </div>}
    </section>
  )
}
