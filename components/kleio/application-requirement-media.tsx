"use client"

import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AlertTriangle, CheckCircle2, FileCheck2, FileText, Loader2, ShieldCheck } from "lucide-react"
import { ApplicationRequirementFilePicker } from "@/components/kleio/application-requirement-file-picker"
import {
  normalizeRequirementFileTypes,
  requirementFileTypeLabel,
  SUPPORTED_REQUIREMENT_MIME_TYPES,
} from "@/lib/kleio-requirement-file-types"
import {
  attachMediaToRequirement,
  loadOpportunityRequirements,
  loadRequirementAttachments,
  requestMediaExtraction,
  type RequirementAttachment,
  type RequirementRecord,
} from "@/lib/kleio-upload-to-passport"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-4 sm:p-5 shadow-[0_14px_42px_rgba(82,64,130,0.045)]"
const EXPLICIT_FILE_INPUTS = ["document", "documents", "file", "upload", "mixed", "url_or_document"]
const EXPLICIT_WRITTEN_INPUTS = ["textarea", "long_text", "written_response", "essay", "text", "short_text"]

function fileCapable(requirement: RequirementRecord) {
  if (EXPLICIT_WRITTEN_INPUTS.includes(requirement.input_type)) return false
  if (EXPLICIT_FILE_INPUTS.includes(requirement.input_type)) return true
  if (requirement.accepted_file_types.length > 0) return true
  return requirement.category === "supporting_document"
}

function requirementLimit(requirement: RequirementRecord) {
  return Math.max(1, requirement.maximum_item_count ?? requirement.minimum_item_count ?? 1)
}

function readableBytes(value: number | null) {
  if (!value) return "size not stated"
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB max`
  return `${Math.round(value / 1024 / 1024)} MB max`
}

function statusCopy(attachment: RequirementAttachment | undefined) {
  if (!attachment) return { label: "Missing", detail: "Add private material for this requirement.", tone: "border-red-200 bg-red-50 text-red-800", icon: AlertTriangle, ready: false }
  if (attachment.validation_status === "satisfied") return { label: "Ready", detail: "Validated and confirmed for this application.", tone: "border-emerald-200 bg-emerald-50 text-emerald-800", icon: CheckCircle2, ready: true }
  if (attachment.validation_status === "likely_satisfied") return { label: "Confirm", detail: "Available checks pass; final source confirmation remains.", tone: "border-blue-200 bg-blue-50 text-blue-800", icon: FileCheck2, ready: false }
  if (attachment.validation_status === "invalid") return { label: "Fix needed", detail: "At least one published file rule failed.", tone: "border-red-200 bg-red-50 text-red-800", icon: AlertTriangle, ready: false }
  return { label: "Review", detail: "Confirm this private material for the exact requirement.", tone: "border-amber-200 bg-amber-50 text-amber-800", icon: AlertTriangle, ready: false }
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

  const fileRequirements = useMemo(() => requirements.filter(fileCapable), [requirements])
  const byRequirement = useMemo(() => {
    const map = new Map<string, RequirementAttachment[]>()
    for (const attachment of attachments) {
      const current = map.get(attachment.requirement_id) ?? []
      current.push(attachment)
      map.set(attachment.requirement_id, current)
    }
    return map
  }, [attachments])

  const requirementRows = useMemo(() => fileRequirements.map((requirement) => {
    const requirementAttachments = byRequirement.get(requirement.id) ?? []
    const current = requirementAttachments.find((attachment) => attachment.included_in_package) ?? requirementAttachments[0]
    return { requirement, current, presentation: statusCopy(current) }
  }), [byRequirement, fileRequirements])

  const includedCount = requirementRows.filter((row) => row.current?.included_in_package).length
  const requiredMissingCount = requirementRows.filter((row) => row.requirement.required && !row.current?.included_in_package).length
  const reviewCount = requirementRows.filter((row) => row.current?.included_in_package && !row.presentation.ready).length

  if (!opportunityId) return null
  if (loading && !requirements.length) return <section className={`${surface} flex items-center gap-2 text-sm text-[#746E80]`}><Loader2 className="size-4 animate-spin" />Checking requirement material…</section>
  if (!fileRequirements.length && !error) return null

  return (
    <section className={surface} id="application-requirement-files" aria-labelledby="application-requirement-media-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#75639E]">Requirement material</p>
          <h2 id="application-requirement-media-title" className="mt-1 font-serif text-xl font-semibold tracking-[-0.02em] text-[#292631]">Attach files once, to the exact requirement</h2>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-[#746E80]">Written responses stay in the composer; source-declared file or media inputs live here; portfolio works stay in the visual selector. KLEIO accepts the source-specified format when supported and does not pretend every uploaded file is a PDF or CV.</p>
          <p className="mt-1 max-w-3xl text-[0.7rem] font-medium leading-5 text-[#665A85]">Required files must be included before KLEIO will preserve a final submission version.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{includedCount} included</span>
          {requiredMissingCount > 0 && <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-800">{requiredMissingCount} required missing</span>}
          {reviewCount > 0 && <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{reviewCount} need source review</span>}
        </div>
      </div>

      {(error || message) && <div role={error ? "alert" : "status"} className={`mt-3 rounded-xl border px-3 py-2.5 text-sm ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}

      <div className="mt-4 divide-y divide-[#EEEAF6] rounded-xl border border-[#E7E1F7] bg-[#FCFBFE]">
        {requirementRows.map(({ requirement, current, presentation }) => {
          const StatusIcon = presentation.icon
          const sourceMimeTypes = normalizeRequirementFileTypes(requirement.accepted_file_types)
          const pickerMimeTypes = sourceMimeTypes.length ? sourceMimeTypes : SUPPORTED_REQUIREMENT_MIME_TYPES
          const count = requirementLimit(requirement)
          const typeSummary = requirementFileTypeLabel(requirement.accepted_file_types)
          const normalizedRequirement = sourceMimeTypes.length ? { ...requirement, accepted_file_types: sourceMimeTypes } : requirement
          return (
            <article id={`file-requirement-${requirement.id}`} key={requirement.id} className="p-3 sm:p-4">
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileText className="size-4 shrink-0 text-[#75639E]" aria-hidden="true" />
                    <h3 className="min-w-0 truncate text-sm font-semibold text-[#292631]">{requirement.label}</h3>
                    <span className="rounded-full border border-[#E2DCF1] bg-white px-2 py-0.5 text-[0.66rem] font-semibold text-[#746E80]">{requirement.required ? "Required" : "Optional"}</span>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.66rem] font-semibold ${presentation.tone}`}><StatusIcon className="size-3" />{presentation.label}</span>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-[#746E80]">{current?.source ? <><strong className="font-semibold text-[#5B5465]">{current.source.original_filename || current.source.label}</strong> · v{current.source.document_version}</> : presentation.detail}</p>
                  <p className="mt-1 text-[0.68rem] text-[#8A8296]">{typeSummary} · {count === 1 ? "1 item" : `up to ${count} items`} · {readableBytes(requirement.maximum_file_size_bytes)}</p>
                  {!sourceMimeTypes.length && <p className="mt-1 text-[0.68rem] leading-5 text-amber-800">The source does not specify a file format. KLEIO will let you choose a supported private file or media item, but the official source remains authoritative.</p>}
                </div>

                <div className="md:justify-self-end">
                  <ApplicationRequirementFilePicker
                    label={current ? "Replace" : "Add file"}
                    requirementLabel={requirement.label}
                    description={requirement.description || "Choose private material for this exact opportunity requirement. Nothing is submitted until your final external or KLEIO submission action."}
                    allowedMimeTypes={pickerMimeTypes}
                    sourceAcceptedTypes={requirement.accepted_file_types}
                    maximumFileSizeBytes={requirement.maximum_file_size_bytes ?? 50 * 1024 * 1024}
                    maximumSelectionCount={count}
                    allowMultiple={count > 1}
                    onConfirm={async (items) => {
                      setError("")
                      setMessage("")
                      try {
                        for (const item of items) {
                          await attachMediaToRequirement({ item, requirement: normalizedRequirement, artistConfirmed: true })
                          if (item.mimeType === "application/pdf" && item.sourceId) await requestMediaExtraction(item, "application_requirement_file")
                        }
                        setMessage(`${requirement.label} updated. You can continue the application without leaving this page.`)
                        await refresh()
                      } catch (reason) {
                        setError(reason instanceof Error ? reason.message : "KLEIO could not attach this material to the requirement.")
                        throw reason
                      }
                    }}
                  />
                </div>
              </div>

              {current?.validation_results?.length ? <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-[#5B4B8A]">Validation details</summary><ul className="mt-2 space-y-1.5 pl-1">{current.validation_results.map((check, index) => <li key={`${check.rule}-${index}`} className="flex items-start gap-2 text-xs leading-5 text-[#746E80]">{check.passed === true ? <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-700" /> : <AlertTriangle className={`mt-0.5 size-3.5 shrink-0 ${check.passed === false ? "text-red-700" : "text-amber-700"}`} />}<span><strong className="font-semibold text-[#625C70]">{check.rule.replaceAll("_", " ")}:</strong> {check.explanation}</span></li>)}</ul></details> : null}
            </article>
          )
        })}
      </div>

      <p className="mt-3 text-[0.68rem] leading-5 text-[#8A8296]"><ShieldCheck className="mr-1 inline size-3.5" />The official opportunity source remains the final authority for external submissions.</p>
    </section>
  )
}
