"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, FileCheck2, FileText, Loader2, ShieldCheck } from "lucide-react"
import { QuickMediaImport } from "@/components/kleio/media-import/quick-media-import"
import {
  attachMediaToRequirement,
  loadOpportunityRequirements,
  loadRequirementAttachments,
  requestMediaExtraction,
  type RequirementAttachment,
  type RequirementRecord,
} from "@/lib/kleio-upload-to-passport"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_14px_42px_rgba(82,64,130,0.05)]"
const DEFAULT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"]

function acceptedMimeTypes(values: string[]) {
  const aliases: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    "application/pdf": "application/pdf",
    "image/jpeg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
  }
  const normalized = values.map((value) => aliases[value.toLowerCase().replace(/^\./, "")]).filter(Boolean)
  return Array.from(new Set(normalized.length ? normalized : DEFAULT_MIME_TYPES))
}

function fileCapable(requirement: RequirementRecord) {
  return requirement.accepted_file_types.length > 0
    || ["document", "documents", "file", "upload", "mixed", "url_or_document"].includes(requirement.input_type)
    || ["supporting_document", "biography", "project_proposal", "budget", "portfolio"].includes(requirement.category)
}

function requirementLimit(requirement: RequirementRecord) {
  return Math.max(1, requirement.maximum_item_count ?? requirement.minimum_item_count ?? 1)
}

function readableBytes(value: number | null) {
  if (!value) return "No published file-size limit"
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB maximum`
  return `${Math.round(value / 1024 / 1024)} MB maximum`
}

function statusCopy(attachment: RequirementAttachment | undefined) {
  if (!attachment) return { label: "Missing", detail: "No private source is attached to this requirement.", tone: "border-red-200 bg-red-50 text-red-800", icon: AlertTriangle }
  if (attachment.validation_status === "satisfied") return { label: "Requirement satisfied", detail: "The source passed the available deterministic checks and you confirmed its inclusion.", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2 }
  if (attachment.validation_status === "likely_satisfied") return { label: "Likely satisfied", detail: "Available checks pass, but the published or external requirement still needs confirmation.", tone: "border-blue-200 bg-blue-50 text-blue-800", icon: FileCheck2 }
  if (attachment.validation_status === "invalid") return { label: "Does not satisfy current checks", detail: "At least one published file rule failed.", tone: "border-red-200 bg-red-50 text-red-800", icon: AlertTriangle }
  return { label: "Artist review required", detail: "The source remains private until you confirm its use for this exact requirement.", tone: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle }
}

export function ApplicationRequirementMedia() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [requirements, setRequirements] = useState<RequirementRecord[]>([])
  const [attachments, setAttachments] = useState<RequirementAttachment[]>([])
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const refresh = useCallback(async () => {
    if (!opportunityId) return
    setLoading(true)
    setError("")
    try {
      const [nextRequirements, nextAttachments] = await Promise.all([
        loadOpportunityRequirements(opportunityId),
        loadRequirementAttachments(opportunityId),
      ])
      setRequirements(nextRequirements)
      setAttachments(nextAttachments)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not load application requirements.")
    } finally {
      setLoading(false)
    }
  }, [opportunityId])

  useEffect(() => { void refresh() }, [refresh])

  const documentRequirements = useMemo(() => requirements.filter(fileCapable), [requirements])
  const byRequirement = useMemo(() => {
    const map = new Map<string, RequirementAttachment[]>()
    for (const attachment of attachments) {
      const current = map.get(attachment.requirement_id) ?? []
      current.push(attachment)
      map.set(attachment.requirement_id, current)
    }
    return map
  }, [attachments])

  if (!opportunityId) return null
  if (loading && !requirements.length) return <section className={`${surface} flex items-center justify-center text-sm text-[#746E80]`}><Loader2 className="mr-2 size-4 animate-spin" />Loading requirement-specific materials…</section>
  if (!documentRequirements.length && !error) return null

  return (
    <section className={surface} aria-labelledby="application-requirement-media-title">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl"><p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[#75639E]">Exact requirement attachments</p><h2 id="application-requirement-media-title" className="mt-1 font-serif text-2xl font-semibold tracking-[-0.03em]">Attach the right source to the right requirement</h2><p className="mt-2 text-sm leading-6 text-[#746E80]">A file does not count merely because it was uploaded. KLEIO links it to one named requirement, validates the published rules it can verify, preserves the selected version, and waits for your confirmation before package inclusion.</p></div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D8D0F2] bg-[#F8F5FF] px-3 py-1.5 text-xs font-semibold text-[#5B4B8A]"><ShieldCheck className="size-3.5" />Private application workspace</span>
      </div>

      {(error || message) && <div role={error ? "alert" : "status"} className={`mt-4 rounded-xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {documentRequirements.map((requirement) => {
          const requirementAttachments = byRequirement.get(requirement.id) ?? []
          const current = requirementAttachments.find((attachment) => attachment.included_in_package) ?? requirementAttachments[0]
          const presentation = statusCopy(current)
          const StatusIcon = presentation.icon
          const mimeTypes = acceptedMimeTypes(requirement.accepted_file_types)
          const count = requirementLimit(requirement)
          return (
            <article key={requirement.id} className="rounded-2xl border border-[#E7E1F7] bg-[#FCFBFE] p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">{requirement.required ? "Required material" : "Optional material"}</p><h3 className="mt-1 font-serif text-xl font-semibold text-[#292631]">{requirement.label}</h3></div><FileText className="mt-1 size-5 shrink-0 text-[#75639E]" /></div>
              {requirement.description && <p className="mt-2 text-xs leading-5 text-[#746E80]">{requirement.description}</p>}
              <div className="mt-3 flex flex-wrap gap-2 text-[0.68rem] font-semibold text-[#746E80]"><span className="rounded-full border border-[#E2DCF1] bg-white px-2.5 py-1">{mimeTypes.map((type) => type.split("/").at(-1)?.toUpperCase()).join(", ")}</span><span className="rounded-full border border-[#E2DCF1] bg-white px-2.5 py-1">{count === 1 ? "One file" : `Up to ${count} files`}</span><span className="rounded-full border border-[#E2DCF1] bg-white px-2.5 py-1">{readableBytes(requirement.maximum_file_size_bytes)}</span></div>

              <div className={`mt-4 rounded-xl border p-3 ${presentation.tone}`}><p className="flex items-center gap-2 text-sm font-semibold"><StatusIcon className="size-4" />{presentation.label}</p><p className="mt-1 text-xs leading-5">{presentation.detail}</p>{current?.source && <p className="mt-2 truncate text-xs font-semibold">{current.source.original_filename || current.source.label} · Version {current.source.document_version}</p>}</div>

              {current?.validation_results?.length ? <details className="mt-3 rounded-xl border border-[#E7E1F7] bg-white px-3 py-2"><summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">View validation checks</summary><ul className="mt-2 space-y-2">{current.validation_results.map((check, index) => <li key={`${check.rule}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-[#746E80]">{check.passed === true ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" /> : check.passed === false ? <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-red-700" /> : <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-700" />}<span><strong className="font-semibold text-[#625C70]">{check.rule.replaceAll("_", " ")}:</strong> {check.explanation}</span></li>)}</ul></details> : null}

              <div className="mt-4">
                <QuickMediaImport
                  context="opportunity_requirement"
                  label={current ? "Replace or add source" : `Add ${requirement.label}`}
                  config={{
                    title: requirement.label,
                    description: requirement.description || "Choose a private source for this exact opportunity requirement.",
                    completionAction: "Validate and include",
                    allowedMimeTypes: mimeTypes,
                    maxFileSizeBytes: requirement.maximum_file_size_bytes ?? 20 * 1024 * 1024,
                    maxSelectionCount: count,
                    allowMultiple: count > 1,
                    destinationType: "opportunity_requirement",
                    destinationId: requirement.id,
                  }}
                  onConfirm={async ({ items }) => {
                    setError("")
                    setMessage("")
                    try {
                      for (const item of items) {
                        await attachMediaToRequirement({ item, requirement, artistConfirmed: true })
                        if (item.mediaKind === "document" && item.sourceId) await requestMediaExtraction(item, "application_requirement_file")
                      }
                      setMessage(`${items.length} private source${items.length === 1 ? "" : "s"} validated and associated with ${requirement.label}.`)
                      await refresh()
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : "KLEIO could not attach this source to the requirement.")
                      throw reason
                    }
                  }}
                />
              </div>
            </article>
          )
        })}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#8A8296]"><ShieldCheck className="mr-1.5 inline size-3.5" />For external opportunities, these checks are validated against the instructions currently stored in KLEIO. The external portal remains the final authority.</p>
    </section>
  )
}
