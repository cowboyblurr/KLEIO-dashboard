"use client"

import { useEffect, useRef, useState } from "react"
import { ExternalLink, MoreHorizontal, Trash2, Unlink, X } from "lucide-react"
import type { ArtistMediaLibraryItem, MediaImportContext } from "@/lib/kleio-universal-media"
import {
  createMediaOpenUrl,
  deleteMediaFromKleio,
  detachMediaFromContext,
  loadMediaDeletionAssessment,
  type MediaDeletionAssessment,
} from "@/lib/kleio-media-control"

type Props = {
  item: ArtistMediaLibraryItem
  currentContext?: MediaImportContext
  onChanged?: () => void | Promise<void>
}

const menuItem = "flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#4F485A] transition hover:bg-[#F6F3FA] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-50"

const copy = {
  en: {
    more: "More actions", preview: "Preview / open", remove: "Remove from this section", delete: "Delete from KLEIO", title: "Delete from KLEIO?",
    plain: "The private source and its saved analysis will be removed from your active KLEIO library.",
    referenced: "This source is still used in editable material. KLEIO can remove those references first, then delete the private source.",
    blocked: "This source cannot be deleted safely yet because doing so could break material that must remain intact.",
    finalized: "A finalized application version references this source. KLEIO will preserve that historical record and will not delete the active source from here.",
    cancel: "Cancel", close: "Close", deleteNow: "Delete from KLEIO", detachDelete: "Remove references and delete",
    detachSuccess: "Removed from this section. The original remains in your private Media Library.",
    deleteSuccess: "The private media source and saved analysis were deleted from KLEIO.",
  },
  es: {
    more: "Más acciones", preview: "Vista previa / abrir", remove: "Quitar de esta sección", delete: "Eliminar de KLEIO", title: "¿Eliminar de KLEIO?",
    plain: "La fuente privada y su análisis guardado se eliminarán de tu biblioteca activa de KLEIO.",
    referenced: "Esta fuente todavía se usa en material editable. KLEIO puede quitar primero esas referencias y luego eliminar la fuente privada.",
    blocked: "Esta fuente todavía no se puede eliminar de forma segura porque podría romper material que debe mantenerse intacto.",
    finalized: "Una versión finalizada de una solicitud hace referencia a esta fuente. KLEIO preservará ese registro histórico y no eliminará la fuente activa desde aquí.",
    cancel: "Cancelar", close: "Cerrar", deleteNow: "Eliminar de KLEIO", detachDelete: "Quitar referencias y eliminar",
    detachSuccess: "Se quitó de esta sección. El original permanece en tu Biblioteca de medios privada.",
    deleteSuccess: "La fuente privada y su análisis guardado se eliminaron de KLEIO.",
  },
} as const

function referenceSummary(assessment: MediaDeletionAssessment | null) {
  if (!assessment) return []
  return [...assessment.finalizedReferences, ...assessment.blockingReferences, ...assessment.editableReferences].slice(0, 6)
}

export function MediaManagementMenu({ item, currentContext, onChanged }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [assessment, setAssessment] = useState<MediaDeletionAssessment | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [language, setLanguage] = useState<"en" | "es">("en")

  useEffect(() => { setLanguage(document.documentElement.lang.toLowerCase().startsWith("es") ? "es" : "en") }, [])
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false) }
    window.addEventListener("pointerdown", onPointer)
    window.addEventListener("keydown", onKey)
    return () => { window.removeEventListener("pointerdown", onPointer); window.removeEventListener("keydown", onKey) }
  }, [open])

  const t = copy[language]
  const references = referenceSummary(assessment)
  const blocked = Boolean(assessment?.blockingReferences.length || assessment?.finalizedReferences.length)
  const hasEditable = Boolean(assessment?.editableReferences.length)

  async function preview() {
    if (busy) return
    const popup = window.open("about:blank", "_blank")
    if (popup) popup.opener = null
    setBusy(true); setError("")
    try {
      const url = await createMediaOpenUrl(item)
      if (!popup) throw new Error("Your browser blocked the private media preview window.")
      popup.location.replace(url)
      setOpen(false)
    } catch (reason) {
      popup?.close()
      setError(reason instanceof Error ? reason.message : "KLEIO could not open this private media source.")
    } finally { setBusy(false) }
  }

  async function detach() {
    if (!currentContext || busy) return
    setBusy(true); setError(""); setMessage("")
    try { await detachMediaFromContext(item, currentContext); setMessage(t.detachSuccess); setOpen(false); await onChanged?.() }
    catch (reason) { setError(reason instanceof Error ? reason.message : "KLEIO could not remove this media from the current section.") }
    finally { setBusy(false) }
  }

  async function prepareDelete() {
    setBusy(true); setError(""); setMessage("")
    try { setAssessment(await loadMediaDeletionAssessment(item)); setConfirmOpen(true); setOpen(false) }
    catch (reason) { setError(reason instanceof Error ? reason.message : "KLEIO could not check where this media is being used.") }
    finally { setBusy(false) }
  }

  async function remove() {
    if (busy || blocked) return
    setBusy(true); setError(""); setMessage("")
    try {
      const result = await deleteMediaFromKleio(item, { removeEditableReferences: hasEditable })
      if (result.status !== "deleted") { setAssessment(result.assessment); return }
      setConfirmOpen(false); setMessage(t.deleteSuccess); await onChanged?.()
    } catch (reason) { setError(reason instanceof Error ? reason.message : "KLEIO could not safely delete this media.") }
    finally { setBusy(false) }
  }

  return <>
    <div ref={rootRef} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label={`${t.more}: ${item.title}`} onClick={() => setOpen((value) => !value)} className="grid size-9 place-items-center rounded-lg text-[#746E80] transition hover:bg-[#F6F3FA] hover:text-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20"><MoreHorizontal className="size-4" /></button>
      {open && <div role="menu" className="absolute right-0 top-10 z-40 w-56 rounded-xl border border-[#E1DAF0] bg-white p-1.5 shadow-[0_18px_48px_rgba(54,42,82,0.16)]">
        <button type="button" role="menuitem" className={menuItem} onClick={() => void preview()} disabled={busy}><ExternalLink className="size-4" />{t.preview}</button>
        {currentContext && <button type="button" role="menuitem" className={menuItem} onClick={() => void detach()} disabled={busy}><Unlink className="size-4" />{t.remove}</button>}
        <button type="button" role="menuitem" className={`${menuItem} text-red-700 hover:bg-red-50`} onClick={() => void prepareDelete()} disabled={busy}><Trash2 className="size-4" />{t.delete}</button>
      </div>}
    </div>

    {(error || message) && <div className={`fixed bottom-4 left-1/2 z-[150] w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border px-4 py-3 text-sm shadow-lg ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role={error ? "alert" : "status"} aria-live="polite">{error || message}</div>}

    {confirmOpen && <div className="fixed inset-0 z-[145] grid place-items-center bg-[#21192D]/30 px-4 py-6" role="presentation">
      <button type="button" className="absolute inset-0" aria-label={t.cancel} onClick={() => !busy && setConfirmOpen(false)} />
      <section role="dialog" aria-modal="true" aria-labelledby={`delete-media-${item.id}`} className="relative z-10 w-full max-w-md rounded-[22px] border border-[#DED7EF] bg-white p-5 text-[#292631] shadow-[0_28px_80px_rgba(39,29,58,0.24)]">
        <div className="flex items-start justify-between gap-3"><div><p className="text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-red-700">{t.delete}</p><h2 id={`delete-media-${item.id}`} className="mt-1 font-serif text-2xl font-semibold">{t.title}</h2></div><button type="button" onClick={() => setConfirmOpen(false)} disabled={busy} className="grid size-9 place-items-center rounded-lg border border-[#E7E1F7]" aria-label={t.close}><X className="size-4" /></button></div>
        <p className="mt-3 text-sm leading-6 text-[#625C70]">{assessment?.finalizedReferences.length ? t.finalized : blocked ? t.blocked : hasEditable ? t.referenced : t.plain}</p>
        {references.length > 0 && <ul className="mt-4 space-y-2 rounded-xl border border-[#E7E1F7] bg-[#FAF8FD] p-3 text-xs leading-5 text-[#5D5668]">{references.map((reference) => <li key={reference.key} className="flex items-start gap-2"><span className="mt-1 size-1.5 shrink-0 rounded-full bg-[#8C78BF]" /><span>{reference.label}</span></li>)}</ul>}
        <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" className="min-h-10 rounded-xl border border-[#D8D0F2] px-4 text-sm font-semibold text-[#5B4B8A]" onClick={() => setConfirmOpen(false)} disabled={busy}>{blocked ? t.close : t.cancel}</button>{!blocked && <button type="button" className="min-h-10 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-50" onClick={() => void remove()} disabled={busy}>{busy ? "…" : hasEditable ? t.detachDelete : t.deleteNow}</button>}</div>
      </section>
    </div>}
  </>
}
