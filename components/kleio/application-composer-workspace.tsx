"use client"

/* eslint-disable @next/next/no-img-element -- artist portfolio images use short-lived signed URLs */

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  History,
  Loader2,
  Mail,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  getOrCreateApplicationDraft,
  saveApplicationDraft,
  type ApplicationRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  buildEmailPreview,
  deriveSubmissionMethod,
  markPackageArtistReportedSubmitted,
  saveApplicationPackage,
  type ApplicationPackageRecord,
  type ApplicationPackageState,
  type EmailPreview,
} from "@/lib/kleio-application-preparation"
import {
  assessOpportunityMaterialReadiness,
  loadOpportunityDirectoryWithSources,
  safeOpportunityUrl,
  type OpportunityDirectoryDataWithSources,
} from "@/lib/kleio-opportunity-presentation"
import type { OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"
import {
  answersFromPackage,
  autosaveComposerWrittenContent,
  buildApplicationPreflight,
  composerQuestions,
  finalizeApplicationSubmissionVersion,
  recordArtistApplicationTimelineEvent,
  requirementAnswerKey,
  writtenContentWithAnswers,
  type ApplicationPreflight,
  type ComposerAnswerMap,
  type ComposerRequirement,
} from "@/lib/kleio-application-composer"
import { requestApplicationAnswer, type ApplicationAnswerAssistResult } from "@/lib/kleio-application-answer-assist"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.055)]"
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407C] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-45"
const secondary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#F8F6FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-45"
const subtle = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#665A85] transition hover:bg-[#F5F1FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:opacity-45"
const textarea = "w-full resize-y rounded-xl border border-[#DED7EF] bg-white px-3 py-3 text-sm leading-6 text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"
const input = "h-11 w-full rounded-xl border border-[#DED7EF] bg-white px-3 text-sm text-[#292631] outline-none transition focus:border-[#A997E8] focus:ring-4 focus:ring-[#A997E8]/12"

const approvalLabels = {
  destination: "I confirmed the submission destination against the opportunity source.",
  materials: "I reviewed the exact answers, works, and documents included in this application.",
  accuracy: "I confirm the application does not invent credentials, history, motives, dates, or project facts.",
  submit: "I approve this exact version for the delivery action shown below.",
} as const

type ApprovalKey = keyof typeof approvalLabels

type FinalizedVersion = { id: string; versionNumber: number; finalizedAt: string }

type DraftChoiceState = Record<string, ApplicationAnswerAssistResult | undefined>
type DraftBusyState = Record<string, boolean>
type AnswerHistory = Record<string, string[]>

function formatDate(value: string | null | undefined) {
  if (!value) return "Not stated by source"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not stated by source"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function displayLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function wordCount(value: string) {
  const clean = value.trim()
  return clean ? clean.split(/\s+/).length : 0
}

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "KLEIO-Application"
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function downloadTextFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function emailAsEml(preview: EmailPreview) {
  return [
    `To: ${preview.to}`,
    `Subject: ${preview.subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    preview.body,
    "",
    preview.attachments.length ? `Attachment checklist:\n${preview.attachments.map((item) => `- ${item}`).join("\n")}` : "",
    "",
    "Prepared by KLEIO for artist review. Files are not embedded in this email preview.",
  ].filter(Boolean).join("\r\n")
}

function buildDossierHtml(input: {
  item: OpportunityDirectoryItem
  artistName: string
  answers: ComposerAnswerMap
  questions: ComposerRequirement[]
  selectedWorks: PortfolioWorkRecord[]
  emailPreview: EmailPreview
  versionNumber: number
}) {
  const { item, artistName, answers, questions, selectedWorks, emailPreview, versionNumber } = input
  const answerMarkup = questions.map((question) => {
    const answer = answers[requirementAnswerKey(question)]?.text?.trim() || "No response supplied."
    return `<section><h3>${escapeHtml(question.label || question.source_text || "Application question")}</h3><p>${escapeHtml(answer).replaceAll("\n", "<br>")}</p></section>`
  }).join("\n")
  const worksMarkup = selectedWorks.map((work, index) => `<li><strong>${index + 1}. ${escapeHtml(work.title)}</strong>${work.year ? ` · ${escapeHtml(work.year)}` : ""}${work.medium ? ` · ${escapeHtml(work.medium)}` : ""}${work.dimensions ? ` · ${escapeHtml(work.dimensions)}` : ""}${work.description ? `<br><span>${escapeHtml(work.description)}</span>` : ""}</li>`).join("\n")
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(item.title)} — ${escapeHtml(artistName)}</title><style>
body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;margin:0;background:#f8f7fb;color:#292631;line-height:1.6}main{max-width:820px;margin:0 auto;padding:56px 28px 80px}.card{background:#fff;border:1px solid #e7e1f7;border-radius:22px;padding:28px;margin:18px 0;box-shadow:0 18px 48px rgba(82,64,130,.055)}.eyebrow{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#7f6eb4;font-weight:700}h1{font-family:Georgia,serif;font-size:38px;line-height:1.08;margin:8px 0 10px}h2{font-family:Georgia,serif;font-size:24px;margin:0 0 14px}h3{font-size:15px;margin:18px 0 6px}p{margin:0 0 12px}ol{padding-left:22px}li{margin:0 0 14px}.meta{color:#746e80;font-size:13px}.notice{font-size:12px;color:#746e80;border-top:1px solid #eee9f7;padding-top:18px;margin-top:26px}@media print{body{background:#fff}.card{box-shadow:none;break-inside:avoid}main{padding:0}}</style></head><body><main>
<div class="eyebrow">KLEIO application dossier · preserved version ${versionNumber}</div><h1>${escapeHtml(artistName)}</h1><p>${escapeHtml(item.title)} · ${escapeHtml(item.provider_name)}</p><p class="meta">Deadline: ${escapeHtml(formatDate(item.deadline_at))}</p>
<div class="card"><h2>Application responses</h2>${answerMarkup || "<p>No source-structured written questions were included.</p>"}</div>
<div class="card"><h2>Selected works</h2><ol>${worksMarkup || "<li>No portfolio works selected.</li>"}</ol></div>
<div class="card"><h2>Email preparation</h2><p><strong>To:</strong> ${escapeHtml(emailPreview.to || "Not applicable")}</p><p><strong>Subject:</strong> ${escapeHtml(emailPreview.subject)}</p><p>${escapeHtml(emailPreview.body).replaceAll("\n", "<br>")}</p></div>
<p class="notice">Prepared from the artist-approved KLEIO application version. This dossier is a portable application record; it is not proof that an institution received or reviewed the submission.</p>
</main></body></html>`
}

function PackageReadiness({ score, preflight }: { score: number | null; preflight: ApplicationPreflight }) {
  return (
    <section className={`${surface} grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8874C1]">Creative Passport → application</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold tracking-[-0.02em] text-[#292631]">Most of the work should already be behind you.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">KLEIO has matched the opportunity against what is already approved in your Creative Passport. Finish only the information this application uniquely needs.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full bg-[#F3EFFB] px-3 py-1.5 text-[#665A85]">{preflight.completedQuestionCount}/{preflight.totalQuestionCount} application responses complete</span>
          <span className="rounded-full bg-[#F3EFFB] px-3 py-1.5 text-[#665A85]">{preflight.selectedWorkCount} work{preflight.selectedWorkCount === 1 ? "" : "s"} selected</span>
          <span className={`rounded-full px-3 py-1.5 ${preflight.blockingCount ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-800"}`}>{preflight.blockingCount ? `${preflight.blockingCount} item${preflight.blockingCount === 1 ? "" : "s"} need attention` : "No blocking issues"}</span>
        </div>
      </div>
      <div className="rounded-2xl border border-[#E4DDF3] bg-[#FAF8FD] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source readiness</p>
        <p className="mt-1 font-serif text-4xl font-semibold text-[#4E426F]">{score === null ? "—" : `${score}%`}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">A readiness signal, not a quality score. Artist review remains required.</p>
      </div>
    </section>
  )
}

export function ApplicationComposerWorkspace() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity")?.trim() ?? ""
  const [directory, setDirectory] = useState<OpportunityDirectoryDataWithSources | null>(null)
  const [packageRecord, setPackageRecord] = useState<ApplicationPackageRecord | null>(null)
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const [answers, setAnswers] = useState<ComposerAnswerMap>({})
  const [emailIntroduction, setEmailIntroduction] = useState("")
  const [approvals, setApprovals] = useState<Record<ApprovalKey, boolean>>({ destination: false, materials: false, accuracy: false, submit: false })
  const [draftChoices, setDraftChoices] = useState<DraftChoiceState>({})
  const [draftBusy, setDraftBusy] = useState<DraftBusyState>({})
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory>({})
  const [latestVersion, setLatestVersion] = useState<FinalizedVersion | null>(null)
  const [finalizedFingerprint, setFinalizedFingerprint] = useState("")
  const [providerConfirmation, setProviderConfirmation] = useState("")
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(opportunityId ? "" : "Choose an opportunity before preparing an application.")
  const [message, setMessage] = useState("")
  const [autosaveStatus, setAutosaveStatus] = useState("")
  const hydratedRef = useRef(false)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!opportunityId) return
    let active = true
    setLoading(true)
    setError("")
    hydratedRef.current = false

    void Promise.all([
      loadOpportunityDirectoryWithSources({ limit: 100 }),
      import("@/lib/kleio-application-preparation").then(({ loadApplicationPackage }) => loadApplicationPackage(opportunityId)),
    ]).then(async ([loadedDirectory, stored]) => {
      const item = loadedDirectory.items.find((candidate) => candidate.id === opportunityId)
      if (!item) throw new Error("This opportunity is unavailable or no longer part of the approved directory.")
      const nativeApplication = item.internal_call ? await getOrCreateApplicationDraft(item.internal_call) : null
      if (!active) return

      setDirectory(loadedDirectory)
      setPackageRecord(stored)
      setApplication(nativeApplication)
      const savedWorkIds = Array.isArray(stored?.portfolio_snapshot)
        ? stored.portfolio_snapshot.flatMap((work) => work && typeof work === "object" && "id" in work ? [String((work as { id: unknown }).id)] : [])
        : []
      const nativeWorkIds = nativeApplication?.application_works?.map((work) => work.portfolio_work_id) ?? []
      const workRequirement = (item.requirements as ComposerRequirement[]).find((requirement) => ["portfolio", "work_samples", "artwork_images"].includes(requirement.material_key))
      const preferredMaximum = workRequirement?.maximum_item_count ?? 5
      setSelectedWorkIds(nativeWorkIds.length
        ? nativeWorkIds
        : savedWorkIds.length
          ? savedWorkIds
          : loadedDirectory.portfolioWorks.filter((work) => work.image_path).slice(0, preferredMaximum).map((work) => work.id))

      const storedAnswers = answersFromPackage(stored)
      const projectProposal = String(stored?.written_content?.project_proposal ?? nativeApplication?.application_answers?.find((answer) => answer.question_key === "project_proposal")?.answer_text ?? "")
      const projectQuestion = composerQuestions(item).find((requirement) => requirement.material_key === "project_proposal")
      if (projectQuestion && projectProposal && !storedAnswers[requirementAnswerKey(projectQuestion)]) {
        storedAnswers[requirementAnswerKey(projectQuestion)] = { text: projectProposal }
      }
      setAnswers(storedAnswers)
      setEmailIntroduction(String(stored?.written_content?.email_introduction ?? ""))
      const savedApprovals = stored?.approval_confirmations ?? {}
      setApprovals({
        destination: Boolean(savedApprovals.destination),
        materials: Boolean(savedApprovals.materials),
        accuracy: Boolean(savedApprovals.accuracy),
        submit: Boolean(savedApprovals.submit),
      })
      setProviderConfirmation(stored?.provider_confirmation ?? "")
      hydratedRef.current = true
    }).catch((reason: Error) => {
      if (active) setError(reason.message)
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [opportunityId])

  const item = directory?.items.find((candidate) => candidate.id === opportunityId) ?? null
  const questions = useMemo(() => item ? composerQuestions(item) : [], [item])
  const selectedWorks = useMemo(() => (directory?.portfolioWorks ?? []).filter((work) => selectedWorkIds.includes(work.id)), [directory, selectedWorkIds])
  const readiness = item ? assessOpportunityMaterialReadiness(item, directory?.passport ?? null, selectedWorks) : null
  const method = item ? deriveSubmissionMethod(item) : "unknown"
  const projectQuestion = questions.find((requirement) => requirement.material_key === "project_proposal")
  const projectProposal = projectQuestion ? answers[requirementAnswerKey(projectQuestion)]?.text ?? "" : ""
  const emailPreview = item ? buildEmailPreview(item, directory?.passport ?? null, selectedWorks, { project_proposal: projectProposal, email_introduction: emailIntroduction }) : null
  const approvalsComplete = Object.values(approvals).every(Boolean)
  const structuralApprovals = { destination: true, materials: true, accuracy: true, submit: true }
  const structuralPreflight = item && readiness && emailPreview ? buildApplicationPreflight({ item, readiness, selectedWorks, answers, approvals: structuralApprovals, method, destination: method === "email" ? emailPreview.to : item.application_url || item.canonical_url || "" }) : null
  const preflight = item && readiness && emailPreview ? buildApplicationPreflight({ item, readiness, selectedWorks, answers, approvals, method, destination: method === "email" ? emailPreview.to : item.application_url || item.canonical_url || "" }) : null

  const packageState: ApplicationPackageState = (() => {
    if (!item || !structuralPreflight) return "draft"
    if (item.deadline_at && new Date(item.deadline_at).getTime() < Date.now()) return "deadline_passed"
    if (structuralPreflight.blockingCount > 0) return "missing_information"
    if (!approvalsComplete) return "artist_review_required"
    if (method === "email") return "email_preview_ready"
    if (["external_portal", "download_package", "unknown"].includes(method)) return "external_submission_required"
    return "ready_for_submission"
  })()

  const currentFingerprint = useMemo(() => JSON.stringify({
    answers,
    selectedWorkIds,
    emailIntroduction,
    approvals,
    packageState,
  }), [answers, selectedWorkIds, emailIntroduction, approvals, packageState])
  const finalizedIsCurrent = Boolean(latestVersion && finalizedFingerprint === currentFingerprint)

  function fullWrittenContent() {
    const existing = packageRecord?.written_content && typeof packageRecord.written_content === "object" ? packageRecord.written_content : {}
    return writtenContentWithAnswers({
      ...existing,
      project_proposal: projectProposal,
      email_introduction: emailIntroduction,
    }, answers)
  }

  async function persistPackage() {
    if (!item || !directory || !readiness || !emailPreview) throw new Error("The application package is not ready to save.")
    const packageResult = await saveApplicationPackage({
      item,
      application,
      state: packageState,
      readiness,
      passport: directory.passport,
      selectedWorks,
      writtenContent: { project_proposal: projectProposal, email_introduction: emailIntroduction },
      emailPreview,
      approvals,
      items: readiness.requirements.map((requirement, index) => ({
        requirement_id: requirement.id.startsWith("fallback-") ? null : requirement.id,
        item_type: requirement.key,
        label: requirement.label,
        status: requirement.status,
        source_kind: ["portfolio", "work_samples"].includes(requirement.key) ? "creative_passport_portfolio" : "creative_passport",
        source_reference: requirement.sourceUrl,
        content_data: {
          explanation: requirement.explanation,
          current_count: requirement.currentCount,
          minimum_count: requirement.minimumCount,
          maximum_count: requirement.maximumCount,
        },
        content_text: questions.find((question) => question.id === requirement.id) ? answers[requirement.id]?.text ?? "" : "",
        ai_assisted: Boolean(answers[requirement.id]?.aiAssisted),
        artist_approved: approvals.materials,
        sort_order: index,
      })),
    })
    if (application) await saveApplicationDraft(application.id, projectProposal, selectedWorkIds)
    const written = fullWrittenContent()
    const savedAt = await autosaveComposerWrittenContent(packageResult.id, written)
    const normalized = { ...packageResult, written_content: written, last_autosaved_at: savedAt } as ApplicationPackageRecord
    setPackageRecord(normalized)
    return normalized
  }

  useEffect(() => {
    if (!hydratedRef.current || !packageRecord || loading || busy) return
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    setAutosaveStatus("Saving changes…")
    autosaveTimerRef.current = setTimeout(() => {
      void autosaveComposerWrittenContent(packageRecord.id, fullWrittenContent())
        .then((savedAt) => {
          setAutosaveStatus(`Saved ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(savedAt))}`)
        })
        .catch(() => setAutosaveStatus("Autosave paused — use Save application"))
    }, 900)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
    // fullWrittenContent is intentionally derived from the state fingerprint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFingerprint, packageRecord?.id, loading, busy])

  async function saveNow() {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await persistPackage()
      setAutosaveStatus("Saved")
      setMessage("Application saved. You can close KLEIO and return without losing these edits.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not save this application.")
    } finally {
      setBusy(false)
    }
  }

  function updateAnswer(question: ComposerRequirement, text: string, metadata: Partial<ComposerAnswerMap[string]> = {}) {
    const key = requirementAnswerKey(question)
    setAnswers((current) => ({
      ...current,
      [key]: {
        ...current[key],
        ...metadata,
        text,
        reviewed: true,
        updatedAt: new Date().toISOString(),
      },
    }))
  }

  async function generateAnswer(question: ComposerRequirement) {
    const key = requirementAnswerKey(question)
    setDraftBusy((current) => ({ ...current, [key]: true }))
    setError("")
    try {
      const result = await requestApplicationAnswer({
        opportunityId,
        requirementId: question.id.startsWith("fallback-") ? undefined : question.id,
        question: question.source_text || question.label,
        maximumWords: question.maximum_word_count,
      })
      setDraftChoices((current) => ({ ...current, [key]: result }))
      if (packageRecord) {
        await recordArtistApplicationTimelineEvent({
          packageId: packageRecord.id,
          eventType: "draft_generated",
          summary: `KLEIO prepared reviewable draft options for “${question.label}”.`,
          metadata: { requirement_id: question.id, ai_draft_id: result.draft.id },
        }).catch(() => undefined)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO Assist could not prepare this answer.")
    } finally {
      setDraftBusy((current) => ({ ...current, [key]: false }))
    }
  }

  function useDraftOption(question: ComposerRequirement, result: ApplicationAnswerAssistResult, index: number) {
    const key = requirementAnswerKey(question)
    const option = result.options.options?.[index]
    if (!option) return
    const previous = answers[key]?.text ?? ""
    if (previous.trim()) setAnswerHistory((current) => ({ ...current, [key]: [...(current[key] ?? []), previous].slice(-5) }))
    updateAnswer(question, option.text, { aiAssisted: true, aiDraftId: result.draft.id })
    setDraftChoices((current) => ({ ...current, [key]: undefined }))
  }

  function restorePrevious(question: ComposerRequirement) {
    const key = requirementAnswerKey(question)
    const history = answerHistory[key] ?? []
    const previous = history.at(-1)
    if (previous === undefined) return
    setAnswerHistory((current) => ({ ...current, [key]: history.slice(0, -1) }))
    updateAnswer(question, previous)
  }

  async function finalizeVersion() {
    if (!preflight) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const saved = await persistPackage()
      const refreshedPreflight = item && readiness && emailPreview ? buildApplicationPreflight({ item, readiness, selectedWorks, answers, approvals, method, destination: method === "email" ? emailPreview.to : item.application_url || item.canonical_url || "" }) : preflight
      if (!refreshedPreflight.ready) throw new Error("Resolve every blocking preflight item before finalizing this application.")
      const version = await finalizeApplicationSubmissionVersion(saved.id, refreshedPreflight)
      setLatestVersion(version)
      setFinalizedFingerprint(currentFingerprint)
      setMessage(`Version ${version.versionNumber} is preserved. Future Creative Passport edits will not change this application.`)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not finalize this application version.")
    } finally {
      setBusy(false)
    }
  }

  async function openEmailClient() {
    if (!item || !emailPreview || !packageRecord || !latestVersion || !finalizedIsCurrent) return
    const params = new URLSearchParams({ subject: emailPreview.subject, body: emailPreview.body })
    const href = `mailto:${encodeURIComponent(emailPreview.to)}?${params.toString()}`
    await recordArtistApplicationTimelineEvent({
      packageId: packageRecord.id,
      submissionVersionId: latestVersion.id,
      eventType: "email_client_opened",
      summary: "KLEIO opened the artist’s email client with prepared application copy. This is not proof the email was sent.",
      metadata: { recipient: emailPreview.to },
    }).catch(() => undefined)
    window.location.href = href
  }

  async function downloadDossier() {
    if (!item || !directory || !emailPreview || !latestVersion || !packageRecord || !finalizedIsCurrent) return
    const artistName = directory.passport?.professional_name || "Artist"
    const html = buildDossierHtml({ item, artistName, answers, questions, selectedWorks, emailPreview, versionNumber: latestVersion.versionNumber })
    downloadTextFile(`${safeFilename(artistName)}_${safeFilename(item.title)}_KLEIO-v${latestVersion.versionNumber}.html`, html, "text/html;charset=utf-8")
    await recordArtistApplicationTimelineEvent({
      packageId: packageRecord.id,
      submissionVersionId: latestVersion.id,
      eventType: "package_downloaded",
      summary: "Artist downloaded the preserved application dossier.",
      metadata: { format: "html", version_number: latestVersion.versionNumber },
    }).catch(() => undefined)
  }

  async function downloadEmailDraft() {
    if (!item || !emailPreview || !latestVersion || !packageRecord || !finalizedIsCurrent) return
    downloadTextFile(`${safeFilename(item.title)}_Email-Draft_v${latestVersion.versionNumber}.eml`, emailAsEml(emailPreview), "message/rfc822")
    await recordArtistApplicationTimelineEvent({
      packageId: packageRecord.id,
      submissionVersionId: latestVersion.id,
      eventType: "package_downloaded",
      summary: "Artist downloaded the prepared email draft. No email was sent by KLEIO.",
      metadata: { format: "eml", version_number: latestVersion.versionNumber },
    }).catch(() => undefined)
  }

  async function markSent() {
    if (!packageRecord || !latestVersion || !finalizedIsCurrent) return
    setBusy(true)
    setError("")
    try {
      const updated = await markPackageArtistReportedSubmitted(packageRecord.id, providerConfirmation)
      setPackageRecord(updated)
      await recordArtistApplicationTimelineEvent({
        packageId: packageRecord.id,
        submissionVersionId: latestVersion.id,
        eventType: "artist_marked_sent",
        summary: "Artist marked this application as sent. KLEIO has not independently confirmed institutional receipt.",
        metadata: { provider_confirmation: providerConfirmation.trim() },
      })
      setMessage("Marked as sent by you. KLEIO is not claiming the institution received it unless separate evidence arrives.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not update the submission status.")
    } finally {
      setBusy(false)
    }
  }

  function jumpTo(anchor: string) {
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  if (loading) {
    return <main className="px-0 py-2"><div className={`${surface} flex items-center gap-2 text-sm text-muted-foreground`} role="status"><Loader2 className="size-4 animate-spin" />Preparing the application composer…</div></main>
  }

  if (error && !item) {
    return <main className="space-y-4 px-0 py-2"><Link className={secondary} href="/artist-dashboard/opportunities/"><ArrowLeft className="size-4" />Back to opportunities</Link><div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div></main>
  }

  if (!item || !directory || !readiness || !emailPreview || !preflight) return null
  const officialUrl = safeOpportunityUrl(item.canonical_url)
  const destinationUrl = safeOpportunityUrl(item.application_url || item.canonical_url)
  const artistName = directory.passport?.professional_name || "Artist"

  return (
    <main className="space-y-5 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className={secondary} href="/artist-dashboard/opportunities/"><ArrowLeft className="size-4" />Back to opportunities</Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground" aria-live="polite">{autosaveStatus || (packageRecord ? "Saved application" : "Not saved yet")}</span>
          {officialUrl && <a className={secondary} href={officialUrl} target="_blank" rel="noreferrer">Verify source<ExternalLink className="size-4" /></a>}
        </div>
      </div>

      <WorkspacePageHeader eyebrow="Artist application" title={item.title} description={`${item.provider_name} · KLEIO uses your approved Creative Passport material, then asks only for what this opportunity uniquely requires.`} />
      <PackageReadiness score={readiness.score} preflight={preflight} />

      <section className={surface} id="requirements-overview">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">What KLEIO already knows</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">A compact source check before you write anything new.</p></div></div>
          <span className="rounded-full bg-[#F4F1FA] px-3 py-1 text-xs font-semibold text-[#665A85]">{readiness.readyCount}/{readiness.requiredCount} source requirements ready</span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {readiness.requirements.map((requirement) => (
            <div id={`requirement-${requirement.id}`} key={requirement.id} className="flex items-start gap-2 rounded-xl border border-[#ECE7F5] px-3 py-3">
              {requirement.status === "complete" || requirement.status === "optional" ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-700" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />}
              <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-[#292631]">{requirement.label}</p><span className="text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground">{requirement.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs leading-5 text-muted-foreground">{requirement.explanation}</p>{requirement.sourceText && <details className="mt-1"><summary className="cursor-pointer text-xs font-semibold text-[#665A85]">Source wording</summary><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{requirement.sourceText}</p></details>}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={surface} id="application-questions">
        <div className="flex items-start gap-3"><FileText className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">Application questions</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Drafts are suggestions. KLEIO will not invent personal intent, budgets, dates, collaborators, or achievements to make an answer sound complete.</p></div></div>
        <div className="mt-5 space-y-5">
          {questions.length ? questions.map((question, index) => {
            const key = requirementAnswerKey(question)
            const value = answers[key]?.text ?? ""
            const count = wordCount(value)
            const result = draftChoices[key]
            const over = Boolean(question.maximum_word_count && count > question.maximum_word_count)
            const under = Boolean(question.minimum_word_count && count < question.minimum_word_count && value.trim())
            return (
              <article key={key} id={`question-${question.id}`} className="scroll-mt-24 border-t border-[#EEEAF6] pt-5 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8874C1]">Question {index + 1}{question.required ? " · Required" : " · Optional"}</p><h3 className="mt-1 text-base font-semibold leading-6 text-[#292631]">{question.source_text || question.label}</h3>{question.source_text && question.label && question.source_text !== question.label && <p className="mt-1 text-xs text-muted-foreground">{question.label}</p>}</div>
                  <button type="button" className={subtle} disabled={draftBusy[key]} onClick={() => void generateAnswer(question)}>{draftBusy[key] ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5" />}{value.trim() ? "Draft another option" : "Prepare draft"}</button>
                </div>
                <textarea className={`${textarea} mt-3 min-h-36 ${over || under ? "border-amber-300" : ""}`} value={value} onChange={(event) => updateAnswer(question, event.target.value, { aiAssisted: answers[key]?.aiAssisted })} placeholder="Write in your own words, or ask KLEIO to prepare a source-grounded starting point." aria-describedby={`question-${question.id}-count`} />
                <div id={`question-${question.id}-count`} className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={over || under ? "font-semibold text-amber-800" : "text-muted-foreground"}>{count} words{question.maximum_word_count ? ` · ${question.maximum_word_count} max` : ""}{question.minimum_word_count ? ` · ${question.minimum_word_count} min` : ""}</span>
                  <div className="flex items-center gap-1">{answers[key]?.aiAssisted && <span className="rounded-full bg-[#F3EFFB] px-2 py-1 font-semibold text-[#665A85]">Suggested draft · edited by you</span>}{(answerHistory[key]?.length ?? 0) > 0 && <button type="button" className={subtle} onClick={() => restorePrevious(question)}><History className="size-3.5" />Restore previous</button>}</div>
                </div>

                {result && <div className="mt-3 rounded-2xl border border-[#DED7EF] bg-[#FAF8FD] p-4">
                  <div className="flex items-start gap-2"><Sparkles className="mt-0.5 size-4 text-[#7F6EB4]" /><div><p className="text-sm font-semibold text-[#292631]">Suggested drafts — choose only if useful</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{result.label}</p></div></div>
                  {result.options.missing_context?.length ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs font-semibold text-amber-900">KLEIO still needs your input</p><ul className="mt-1 list-disc space-y-1 pl-4 text-xs leading-5 text-amber-900">{result.options.missing_context.map((missing) => <li key={missing}>{missing}</li>)}</ul></div> : null}
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {(result.options.options ?? []).slice(0, 2).map((option, optionIndex) => <div key={`${key}-${optionIndex}`} className="rounded-xl border border-[#E7E1F7] bg-white p-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#8874C1]">{option.label || `Option ${optionIndex + 1}`}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#403A4A]">{option.text}</p><div className="mt-3 flex items-center justify-between gap-2"><details><summary className="cursor-pointer text-xs font-semibold text-[#665A85]">Why this draft?</summary><p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">Built from {option.evidence_refs.length} artist-confirmed evidence reference{option.evidence_refs.length === 1 ? "" : "s"} and this exact opportunity question.</p></details><button type="button" className={secondary} onClick={() => useDraftOption(question, result, optionIndex)}><Check className="size-4" />Use this draft</button></div></div>)}
                  </div>
                </div>}
              </article>
            )
          }) : <div className="rounded-xl border border-[#E7E1F7] bg-[#FAF8FD] p-4 text-sm leading-6 text-muted-foreground">KLEIO did not find source-structured written questions for this opportunity. Review the official source before finalizing; unknown requirements are not silently invented.</div>}
        </div>
      </section>

      <section className={surface} id="portfolio-selection">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><PackageCheck className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">Portfolio selection</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Choose the exact works that belong in this application. Originals remain untouched.</p></div></div><span className="rounded-full bg-[#F4F1FA] px-3 py-1 text-xs font-semibold text-[#665A85]">{selectedWorks.length} selected{preflight.requiredWorkCount ? ` · ${preflight.requiredWorkCount} minimum` : ""}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {directory.portfolioWorks.length ? directory.portfolioWorks.map((work) => {
            const selected = selectedWorkIds.includes(work.id)
            return <button key={work.id} type="button" aria-pressed={selected} onClick={() => setSelectedWorkIds((current) => selected ? current.filter((id) => id !== work.id) : [...current, work.id])} className={`overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 ${selected ? "border-[#9C8BCF] bg-[#F8F5FF] shadow-[0_12px_28px_rgba(82,64,130,0.08)]" : "border-[#E7E1F7] bg-white hover:border-[#CFC4EA]"}`}>
              <div className="aspect-[4/3] bg-[#F4F1F8]">{work.image_url ? <img src={work.image_url} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs font-semibold text-muted-foreground">Image missing</div>}</div>
              <div className="p-3"><div className="flex items-start justify-between gap-2"><div><p className="text-sm font-semibold text-[#292631]">{work.title || "Untitled work"}</p><p className="mt-0.5 text-xs text-muted-foreground">{[work.year, work.medium].filter(Boolean).join(" · ") || "Metadata incomplete"}</p></div><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selected ? "border-[#6F5DA7] bg-[#6F5DA7] text-white" : "border-[#D7D0E5] text-transparent"}`}><Check className="size-3" /></span></div>{work.dimensions && <p className="mt-2 text-xs text-muted-foreground">{work.dimensions}</p>}</div>
            </button>
          }) : <p className="text-sm text-muted-foreground">No portfolio works are available in the Creative Passport.</p>}
        </div>
      </section>

      {method === "email" && <section className={surface} id="submission-email"><div className="flex items-start gap-3"><Mail className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">Email introduction</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">This is the short message around the application—not the application answer itself.</p></div></div><textarea className={`${textarea} mt-4 min-h-28`} value={emailIntroduction} onChange={(event) => setEmailIntroduction(event.target.value)} placeholder={`A concise introduction for ${item.provider_name}.`} /></section>}

      <section className={surface} id="preflight">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3">{preflight.ready ? <CheckCircle2 className="mt-0.5 size-5 text-emerald-700" /> : <AlertTriangle className="mt-0.5 size-5 text-amber-700" />}<div><h2 className="text-base font-semibold text-[#292631]">Preflight</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">KLEIO checks the application before any delivery action becomes available.</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${preflight.ready ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{preflight.ready ? "Ready to finalize" : `${preflight.blockingCount} blocking issue${preflight.blockingCount === 1 ? "" : "s"}`}</span></div>
        {preflight.issues.length ? <div className="mt-4 divide-y divide-[#EEEAF6] rounded-xl border border-[#E7E1F7]">{preflight.issues.map((issue) => <button type="button" key={issue.id} onClick={() => jumpTo(issue.anchor)} className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left hover:bg-[#FAF8FD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#A997E8]/20"><div><p className="text-sm font-semibold text-[#292631]">{issue.label}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">{issue.detail}</p></div><span className={`shrink-0 rounded-full px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide ${issue.severity === "blocking" ? "bg-amber-50 text-amber-800" : "bg-[#F3EFFB] text-[#665A85]"}`}>{issue.severity}</span></button>)}</div> : <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">All known requirements are complete. Final artist approval is the remaining trust gate.</div>}
      </section>

      <section className={surface} id="submission-review">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">Exactly what will leave KLEIO</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Nothing here is hidden. Review the destination, copy, works, and tracking behavior before approval.</p></div></div>
        <dl className="mt-4 grid gap-4 text-sm md:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission method</dt><dd className="mt-1 font-semibold text-[#292631]">{displayLabel(method)}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Destination</dt><dd className="mt-1 break-all font-semibold text-[#292631]">{method === "email" ? emailPreview.to || "Recipient not verified" : destinationUrl || "Destination requires confirmation"}</dd></div><div className="md:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email subject</dt><dd className="mt-1 text-[#292631]">{emailPreview.subject}</dd></div><div className="md:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email body</dt><dd className="mt-2 whitespace-pre-wrap rounded-xl bg-[#FAF8FD] p-3 leading-6 text-[#403A4A]">{emailPreview.body}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Works</dt><dd className="mt-1 text-[#292631]">{selectedWorks.length ? selectedWorks.map((work) => work.title).join(", ") : "None selected"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tracking truth</dt><dd className="mt-1 leading-6 text-[#403A4A]">KLEIO may record that it opened your email client, that a hosted application page was accessed, or that you marked an application sent. It does not call those events proof that the institution read or received the application.</dd></div></dl>
      </section>

      <section className={surface} id="final-review">
        <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">Final artist review</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Finalizing creates an immutable version. Editing afterward is allowed, but it creates a new version rather than rewriting history.</p></div></div>
        <div className="mt-4 grid gap-2">{(Object.keys(approvalLabels) as ApprovalKey[]).map((key) => <label key={key} className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] px-3 py-3 text-sm leading-6"><input className="mt-1 size-4 accent-[#6F5DA7]" type="checkbox" checked={approvals[key]} onChange={(event) => setApprovals((current) => ({ ...current, [key]: event.target.checked }))} /><span>{approvalLabels[key]}</span></label>)}</div>
      </section>

      {latestVersion && !finalizedIsCurrent && <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">You changed the application after preserving Version {latestVersion.versionNumber}. Finalize again before delivery so the sent package matches the historical record.</div>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-800">{error}</div>}
      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900">{message}</div>}

      <section className={`${surface} space-y-4`}>
        <div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={busy} onClick={() => void saveNow()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}Save application</button><button type="button" className={primary} disabled={busy || !preflight.ready} onClick={() => void finalizeVersion()}>{busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{latestVersion && finalizedIsCurrent ? `Preserve as Version ${latestVersion.versionNumber + 1}` : "Finalize & preserve version"}</button></div>
        {latestVersion && finalizedIsCurrent && <div className="rounded-2xl border border-[#DED7EF] bg-[#FAF8FD] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8874C1]">Preserved submission version</p><h3 className="mt-1 text-base font-semibold text-[#292631]">KLA · Version {latestVersion.versionNumber}</h3><p className="mt-1 text-xs text-muted-foreground">Finalized {formatDate(latestVersion.finalizedAt)}</p></div><CheckCircle2 className="size-5 text-emerald-700" /></div><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => void downloadDossier()}><Download className="size-4" />Download application dossier</button>{method === "email" && <><button type="button" className={secondary} onClick={() => void downloadEmailDraft()}><Download className="size-4" />Download email draft</button><button type="button" className={primary} disabled={!emailPreview.to} onClick={() => void openEmailClient()}><Mail className="size-4" />Open email client</button></>}{["external_portal", "download_package", "unknown"].includes(method) && destinationUrl && <a className={primary} href={destinationUrl} target="_blank" rel="noreferrer">Open official destination<ExternalLink className="size-4" /></a>}</div></div>}
      </section>

      {latestVersion && finalizedIsCurrent && ["email", "external_portal", "download_package", "unknown"].includes(method) && <section className={surface}><div className="flex items-start gap-3"><History className="mt-0.5 size-5 text-[#6F5DA7]" /><div><h2 className="text-base font-semibold text-[#292631]">After you submit outside KLEIO</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">If KLEIO cannot independently confirm the send, keep the evidence label truthful.</p></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row"><input className={input} value={providerConfirmation} onChange={(event) => setProviderConfirmation(event.target.value)} placeholder="Optional receipt or confirmation number" /><button type="button" className={secondary} disabled={busy} onClick={() => void markSent()}><Check className="size-4" />I sent this application</button></div><p className="mt-2 text-xs leading-5 text-muted-foreground">This records “Artist marked as sent.” It does not claim “Institution received your application.”</p></section>}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-muted-foreground"><span>{artistName} · {item.provider_name}</span><span>Deadline {formatDate(item.deadline_at)}</span></div>
    </main>
  )
}