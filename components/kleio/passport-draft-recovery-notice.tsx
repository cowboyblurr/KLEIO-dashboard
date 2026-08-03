"use client"

import { X } from "lucide-react"
import type { KleioDraftEnvelope } from "@/lib/kleio-passport-drafts"

export function PassportDraftRecoveryNotice({
  recovery,
  onRestore,
  onDismiss,
  locale = "en",
  className = "",
}: {
  recovery: KleioDraftEnvelope<Record<string, unknown>>
  onRestore: () => void
  onDismiss: () => void
  locale?: string
  className?: string
}) {
  const es = locale === "es"
  const updatedAt = new Intl.DateTimeFormat(es ? "es-ES" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(recovery.clientUpdatedAt))

  return (
    <div className={`flex justify-end ${className}`}>
      <section
        className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-[#E7E1F7] bg-[#FCFBFE] px-2.5 py-1.5"
        role="status"
        aria-live="polite"
      >
        <p className="text-xs leading-5 text-[#837B8E]">
          <span className="font-medium text-[#5E556B]">{es ? "Borrador sin guardar" : "Unsaved draft"}</span>
          <span aria-hidden="true"> · </span>
          <span>{updatedAt}</span>
        </p>
        <button
          type="button"
          className="rounded-md px-2 py-1 text-xs font-semibold text-[#5B4B8A] transition-colors hover:bg-[#F1EDFA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/40"
          onClick={onRestore}
        >
          {es ? "Restaurar" : "Restore"}
        </button>
        <button
          type="button"
          className="grid size-7 place-items-center rounded-md text-[#8A8296] transition-colors hover:bg-[#F1EDFA] hover:text-[#5B4B8A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A997E8]/40"
          onClick={onDismiss}
          aria-label={es ? "Descartar este aviso de borrador" : "Dismiss this draft notice"}
          title={es ? "No volver a mostrar este borrador" : "Do not show this draft again"}
        >
          <X className="size-3.5" aria-hidden="true" />
        </button>
      </section>
    </div>
  )
}
