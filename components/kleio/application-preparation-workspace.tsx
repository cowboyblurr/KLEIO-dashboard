"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  PackageCheck,
  ShieldCheck,
} from "lucide-react"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import {
  getOrCreateApplicationDraft,
  saveApplicationDraft,
  submitApplication,
  type ApplicationRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  buildEmailPreview,
  buildPackageManifest,
  deriveSubmissionMethod,
  loadApplicationPackage,
  markPackageArtistReportedSubmitted,
  packageStateFor,
  recordSubmissionAttempt,
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
import { getSupabaseBrowserClient } from "@/lib/kleio-supabase"
import type { OpportunityDirectoryItem } from "@/lib/kleio-opportunity-data"

const surface = "rounded-2xl border border-[#E7E1F7] bg-white p-5 shadow-[0_18px_48px_rgba(82,64,130,0.06)]"
const primary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D8D0F2] bg-white px-4 text-sm font-semibold text-[#5B4B8A] disabled:cursor-not-allowed disabled:opacity-50"
const input = "h-10 w-full rounded-xl border border-[#E7E1F7] bg-white px-3 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
const textarea = "w-full rounded-xl border border-[#E7E1F7] bg-white px-3 py-2 text-sm outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"

const approvalLabels = {
  destination: "I confirmed the recipient or destination against the source.",
  materials: "I reviewed the selected materials and application answers.",
  accuracy: "I confirm that the information is accurate and does not invent credentials or history.",
  submit: "I approve this package for the submission action shown below.",
} as const

type ApprovalKey = keyof typeof approvalLabels

type WrittenContent = {
  project_proposal: string
  email_introduction: string
}

function formatDate(value: string | null) {
  if (!value) return "Not stated by source"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Not stated by source"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

function displayLabel(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function safeFilename(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "KLEIO_Application"
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
    "Prepared by KLEIO for artist review. Files are not embedded in this preview.",
  ].filter(Boolean).join("\r\n")
}

function statusTone(status: string) {
  if (status === "complete" || status === "optional") return "border-emerald-200 bg-emerald-50 text-emerald-800"
  if (status === "missing" || status === "limit_error") return "border-red-200 bg-red-50 text-red-800"
  return "border-amber-200 bg-amber-50 text-amber-800"
}

function RequirementStatusIcon({ status }: { status: string }) {
  if (status === "complete" || status === "optional") return <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
  return <AlertTriangle className="mt-0.5 size-4 shrink-0" />
}

function PackageSummary({
  item,
  state,
  score,
  blockingCount,
}: {
  item: OpportunityDirectoryItem
  state: ApplicationPackageState
  score: number | null
  blockingCount: number
}) {
  return (
    <section className={`${surface} grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#A997E8]">{item.provider_name}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold text-[#292631]">{item.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {item.summary || "Review the official source before approving this application package."}
        </p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deadline</dt><dd className="mt-1 font-medium">{formatDate(item.deadline_at)}{item.deadline_timezone ? ` · ${item.deadline_timezone}` : ""}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission method</dt><dd className="mt-1 font-medium">{displayLabel(deriveSubmissionMethod(item))}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Source last checked</dt><dd className="mt-1 font-medium">{formatDate(item.last_verified_at)}</dd></div>
        </dl>
      </div>
      <div className="min-w-[190px] rounded-2xl border border-[#E7E1F7] bg-[#F9F7FD] p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application readiness</p>
        <p className="mt-2 font-serif text-3xl font-semibold text-[#4E426F]">{score === null ? "—" : `${score}%`}</p>
        <p className="mt-1 text-sm font-semibold text-[#292631]">{displayLabel(state)}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {blockingCount ? `${blockingCount} required item${blockingCount === 1 ? "" : "s"} currently block submission.` : "No confirmed requirement is currently blocking preparation."}
        </p>
      </div>
    </section>
  )
}

export function ApplicationPreparationWorkspace() {
  const searchParams = useSearchParams()
  const opportunityId = searchParams.get("opportunity") || ""
  const [directory, setDirectory] = useState<OpportunityDirectoryDataWithSources | null>(null)
  const [storedPackage, setStoredPackage] = useState<ApplicationPackageRecord | null>(null)
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [selectedWorkIds, setSelectedWorkIds] = useState<string[]>([])
  const [writtenContent, setWrittenContent] = useState<WrittenContent>({ project_proposal: "", email_introduction: "" })
  const [approvals, setApprovals] = useState<Record<ApprovalKey, boolean>>({ destination: false, materials: false, accuracy: false, submit: false })
  const [providerConfirmation, setProviderConfirmation] = useState("")
  const [loading, setLoading] = useState(Boolean(opportunityId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(opportunityId ? "" : "Choose an opportunity before preparing an application.")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!opportunityId) return
    let active = true

    void Promise.all([
      loadOpportunityDirectoryWithSources({ limit: 100 }),
      loadApplicationPackage(opportunityId),
    ]).then(async ([loadedDirectory, packageRecord]) => {
      const item = loadedDirectory.items.find((candidate) => candidate.id === opportunityId)
      if (!item) throw new Error("This opportunity is unavailable or no longer part of the approved directory.")
      const nativeApplication = item.internal_call ? await getOrCreateApplicationDraft(item.internal_call) : null
      if (!active) return

      setDirectory(loadedDirectory)
      setStoredPackage(packageRecord)
      setApplication(nativeApplication)

      const savedWorkIds = Array.isArray(packageRecord?.portfolio_snapshot)
        ? packageRecord.portfolio_snapshot.flatMap((work) => typeof work === "object" && work && "id" in work ? [String((work as { id: unknown }).id)] : [])
        : []
      const applicationWorkIds = nativeApplication?.application_works?.map((work) => work.portfolio_work_id) ?? []
      const workRequirement = item.requirements.find((requirement) => ["portfolio", "work_samples", "artwork_images"].includes(requirement.material_key)) as { maximum_item_count?: number | null } | undefined
      const maximumWorks = workRequirement?.maximum_item_count ?? 5
      setSelectedWorkIds(applicationWorkIds.length
        ? applicationWorkIds
        : savedWorkIds.length
          ? savedWorkIds
          : loadedDirectory.portfolioWorks.filter((work) => work.image_path).slice(0, maximumWorks).map((work) => work.id))

      setWrittenContent({
        project_proposal: nativeApplication?.application_answers?.find((answer) => answer.question_key === "project_proposal")?.answer_text
          || String(packageRecord?.written_content?.project_proposal ?? ""),
        email_introduction: String(packageRecord?.written_content?.email_introduction ?? ""),
      })
      const savedApprovals = packageRecord?.approval_confirmations ?? {}
      setApprovals({
        destination: Boolean(savedApprovals.destination),
        materials: Boolean(savedApprovals.materials),
        accuracy: Boolean(savedApprovals.accuracy),
        submit: Boolean(savedApprovals.submit),
      })
      setProviderConfirmation(packageRecord?.provider_confirmation ?? "")
    }).catch((reason: Error) => {
      if (active) setError(reason.message)
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => { active = false }
  }, [opportunityId])

  const item = directory?.items.find((candidate) => candidate.id === opportunityId) ?? null
  const selectedWorks = (directory?.portfolioWorks ?? []).filter((work) => selectedWorkIds.includes(work.id))
  const readiness = item ? assessOpportunityMaterialReadiness(item, directory?.passport ?? null, selectedWorks) : null
  const approvalsComplete = Object.values(approvals).every(Boolean)
  const state = item && readiness ? packageStateFor(item, readiness, approvalsComplete) : "draft"
  const emailPreview = item ? buildEmailPreview(item, directory?.passport ?? null, selectedWorks, writtenContent) : null
  const method = item ? deriveSubmissionMethod(item) : "unknown"

  async function persistPackage() {
    if (!item || !directory || !readiness || !emailPreview) throw new Error("The application package is not ready to save.")
    const packageRecord = await saveApplicationPackage({
      item,
      application,
      state,
      readiness,
      passport: directory.passport,
      selectedWorks,
      writtenContent,
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
        artist_approved: approvals.materials,
        sort_order: index,
      })),
    })
    setStoredPackage(packageRecord)
    return packageRecord
  }

  async function save() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const packageRecord = await persistPackage()
      if (application) await saveApplicationDraft(application.id, writtenContent.project_proposal, selectedWorkIds)
      await recordSubmissionAttempt({ packageId: packageRecord.id, method, status: "prepared", destination: packageRecord.external_destination, requestSnapshot: { state } })
      setMessage("Application package saved to your account.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save this application package.")
    } finally {
      setSaving(false)
    }
  }

  async function submitNative() {
    if (!application || !item || !readiness) return
    if (!approvalsComplete || state !== "ready_for_submission") {
      setError("Resolve the remaining requirements and complete every approval before submitting.")
      return
    }
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const packageRecord = await persistPackage()
      await saveApplicationDraft(application.id, writtenContent.project_proposal, selectedWorkIds)
      const supabase = getSupabaseBrowserClient()
      const { error: approvalError } = await supabase.from("applications").update({
        approval_confirmations: approvals,
        artist_approved_at: new Date().toISOString(),
        submission_method: "native_kleio",
      }).eq("id", application.id)
      if (approvalError) throw approvalError
      await submitApplication(application.id)
      const submittedAt = new Date().toISOString()
      const { data: updatedPackage, error: packageError } = await supabase.from("application_packages").update({
        state: "submitted",
        submitted_at: submittedAt,
        updated_at: submittedAt,
      }).eq("id", packageRecord.id).select("*").single()
      if (packageError) throw packageError
      setStoredPackage(updatedPackage as ApplicationPackageRecord)
      setApplication((current) => current ? { ...current, status: "submitted", submitted_at: submittedAt } : current)
      await recordSubmissionAttempt({ packageId: packageRecord.id, method: "native_kleio", status: "submitted", destination: item.provider_name, requestSnapshot: { application_id: application.id } })
      setMessage("Application submitted through KLEIO. The submitted profile, answers, works, and approvals were preserved as a historical snapshot.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to submit the application.")
    } finally {
      setSaving(false)
    }
  }

  async function exportPackage() {
    if (!item || !directory || !readiness || !emailPreview) return
    setSaving(true)
    setError("")
    try {
      const packageRecord = await persistPackage()
      const manifest = buildPackageManifest({ item, passport: directory.passport, selectedWorks, readiness, writtenContent, emailPreview })
      downloadFile(`${safeFilename(item.title)}_${safeFilename(directory.passport?.professional_name || "Artist")}.json`, JSON.stringify(manifest, null, 2), "application/json")
      await recordSubmissionAttempt({ packageId: packageRecord.id, method, status: "prepared", destination: packageRecord.external_destination, requestSnapshot: { export: "json_manifest" } })
      setMessage("Application manifest downloaded. It is a preparation record, not proof of submission.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to export the application package.")
    } finally {
      setSaving(false)
    }
  }

  async function exportEmailDraft() {
    if (!item || !emailPreview) return
    setSaving(true)
    setError("")
    try {
      const packageRecord = await persistPackage()
      downloadFile(`${safeFilename(item.title)}_Email_Draft.eml`, emailAsEml(emailPreview), "message/rfc822")
      await recordSubmissionAttempt({ packageId: packageRecord.id, method: "email", status: "prepared", destination: emailPreview.to, requestSnapshot: { export: "eml_preview" } })
      setMessage("Reviewable email draft downloaded. No email was sent.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to create the email draft preview.")
    } finally {
      setSaving(false)
    }
  }

  async function reportExternalSubmission() {
    if (!storedPackage) {
      setError("Save the application package before recording an external submission.")
      return
    }
    setSaving(true)
    setError("")
    try {
      const updated = await markPackageArtistReportedSubmitted(storedPackage.id, providerConfirmation)
      setStoredPackage(updated)
      setMessage("External submission recorded as artist-reported. KLEIO has not independently confirmed receipt.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to record the external submission.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto flex max-w-[1120px] items-center gap-2 rounded-2xl border border-[#E7E1F7] bg-white p-5 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Preparing the application workspace…</div></main>
  }

  if (error && !item) {
    return <main className="h-full overflow-y-auto px-4 py-6 sm:px-6"><div className="mx-auto max-w-[1120px] space-y-4"><Link className={secondary} href="/artist-dashboard/opportunities/"><ArrowLeft className="size-4" />Back to opportunities</Link><div role="alert" className={`${surface} border-red-200 text-sm text-red-700`}>{error}</div></div></main>
  }
  if (!item || !directory || !readiness || !emailPreview) return null

  const officialUrl = safeOpportunityUrl(item.canonical_url)
  const destinationUrl = safeOpportunityUrl(item.application_url || item.canonical_url)
  const alreadySubmitted = Boolean(application?.status && application.status !== "draft")

  return (
    <main className="h-full overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-[1120px] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link className={secondary} href="/artist-dashboard/opportunities/"><ArrowLeft className="size-4" />Back to opportunities</Link>
          {officialUrl && <a className={secondary} href={officialUrl} target="_blank" rel="noreferrer">Verify official source<ExternalLink className="size-4" /></a>}
        </div>
        <WorkspacePageHeader eyebrow="Artist workspace" title="Prepare application" description="KLEIO assembles reusable Creative Passport materials, checks confirmed source requirements, and preserves your review. Nothing is sent without your explicit action." />
        <PackageSummary item={item} state={storedPackage?.state ?? state} score={readiness.score} blockingCount={readiness.blockingCount} />

        <section className={surface}>
          <div className="flex items-start gap-3"><FileCheck2 className="mt-0.5 size-5 text-primary" /><div><h2 className="text-base font-semibold">Requirements checklist</h2><p className="mt-1 text-sm text-muted-foreground">Every status below comes from a source requirement and the artist information currently available to KLEIO.</p></div></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {readiness.requirements.length ? readiness.requirements.map((requirement) => (
              <article key={requirement.id} className={`rounded-xl border p-3 ${statusTone(requirement.status)}`}>
                <div className="flex gap-2"><RequirementStatusIcon status={requirement.status} /><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-semibold">{requirement.label}</h3><span className="rounded-full bg-white/70 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide">{requirement.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-xs leading-relaxed opacity-90">{requirement.explanation}</p>{requirement.sourceText && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold">Source wording</summary><p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed opacity-80">{requirement.sourceText}</p></details>}</div></div>
              </article>
            )) : <p className="text-sm text-muted-foreground">The source does not provide structured application materials yet.</p>}
          </div>
        </section>

        <section className={surface}>
          <div className="flex items-start gap-3"><FileText className="mt-0.5 size-5 text-primary" /><div><h2 className="text-base font-semibold">Written materials</h2><p className="mt-1 text-sm text-muted-foreground">These are application-specific drafts. KLEIO does not silently change your Creative Passport.</p></div></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Project proposal / application note</span><textarea className={textarea} rows={8} value={writtenContent.project_proposal} onChange={(event) => setWrittenContent((current) => ({ ...current, project_proposal: event.target.value }))} placeholder="Add only information you can verify." /><span className="font-normal">{writtenContent.project_proposal.trim() ? writtenContent.project_proposal.trim().split(/\s+/).length : 0} words</span></label>
            {method === "email" && <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>Email introduction</span><textarea className={textarea} rows={8} value={writtenContent.email_introduction} onChange={(event) => setWrittenContent((current) => ({ ...current, email_introduction: event.target.value }))} placeholder="A concise introduction for the grant giver." /></label>}
          </div>
        </section>

        <section className={surface}>
          <div className="flex items-start gap-3"><PackageCheck className="mt-0.5 size-5 text-primary" /><div><h2 className="text-base font-semibold">Portfolio package</h2><p className="mt-1 text-sm text-muted-foreground">Select the exact works to include. KLEIO preserves originals and records the selected metadata.</p></div></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {directory.portfolioWorks.length ? directory.portfolioWorks.map((work: PortfolioWorkRecord) => (
              <label key={work.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 ${selectedWorkIds.includes(work.id) ? "border-[#B9ACE4] bg-[#F7F4FF]" : "border-[#E7E1F7]"}`}><input className="mt-1" type="checkbox" checked={selectedWorkIds.includes(work.id)} onChange={(event) => setSelectedWorkIds((current) => event.target.checked ? [...current, work.id] : current.filter((id) => id !== work.id))} /><span><span className="block text-sm font-semibold">{work.title}</span><span className="mt-0.5 block text-xs text-muted-foreground">{[work.year, work.medium, work.dimensions].filter(Boolean).join(" · ") || "Metadata incomplete"}</span><span className="mt-1 block text-xs text-muted-foreground">{work.image_path ? "Asset available" : "Image missing"}</span></span></label>
            )) : <p className="text-sm text-muted-foreground">No portfolio works are available in the Creative Passport.</p>}
          </div>
        </section>

        {method === "email" && <section className={surface}><div className="flex items-start gap-3"><Mail className="mt-0.5 size-5 text-primary" /><div className="min-w-0"><h2 className="text-base font-semibold">Email submission preview</h2><p className="mt-1 text-sm text-muted-foreground">KLEIO can prepare a reviewable email file now. Secure Gmail OAuth is not represented as connected unless it is actually configured.</p></div></div><dl className="mt-4 grid gap-3 text-sm"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recipient</dt><dd className="mt-1 break-all font-medium">{emailPreview.to || "Recipient not verified from the source"}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</dt><dd className="mt-1 font-medium">{emailPreview.subject}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body</dt><dd className="mt-1 whitespace-pre-wrap rounded-xl bg-[#F9F7FD] p-3 leading-relaxed">{emailPreview.body}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attachment checklist</dt><dd className="mt-1">{emailPreview.attachments.length ? emailPreview.attachments.join(", ") : "No attachment list is ready"}</dd></div></dl></section>}

        <section className={surface}>
          <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 text-primary" /><div><h2 className="text-base font-semibold">Final artist review</h2><p className="mt-1 text-sm text-muted-foreground">These confirmations are required before KLEIO enables a submission action.</p></div></div>
          <div className="mt-4 grid gap-3">
            {(Object.keys(approvalLabels) as ApprovalKey[]).map((key) => <label key={key} className="flex items-start gap-3 rounded-xl border border-[#E7E1F7] p-3 text-sm"><input className="mt-1" type="checkbox" checked={approvals[key]} onChange={(event) => setApprovals((current) => ({ ...current, [key]: event.target.checked }))} /><span>{approvalLabels[key]}</span></label>)}
          </div>
        </section>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}

        <section className={`${surface} flex flex-wrap items-center gap-2`}>
          <button type="button" className={secondary} disabled={saving} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <FileCheck2 className="size-4" />}Save package</button>
          <button type="button" className={secondary} disabled={saving} onClick={() => void exportPackage()}><Download className="size-4" />Download package manifest</button>
          {method === "email" && <button type="button" className={primary} disabled={saving || !emailPreview.to || !approvalsComplete || readiness.blockingCount > 0} onClick={() => void exportEmailDraft()}><Mail className="size-4" />Create reviewable email draft</button>}
          {method === "native_kleio" && <button type="button" className={primary} disabled={saving || alreadySubmitted || !approvalsComplete || state !== "ready_for_submission"} onClick={() => void submitNative()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}{alreadySubmitted ? `Already ${application?.status.replaceAll("_", " ")}` : "Submit through KLEIO"}</button>}
          {["external_portal", "download_package", "unknown"].includes(method) && destinationUrl && <a className={approvalsComplete && readiness.blockingCount === 0 ? primary : secondary} href={destinationUrl} target="_blank" rel="noreferrer">Open official submission destination<ExternalLink className="size-4" /></a>}
        </section>

        {["external_portal", "download_package", "unknown", "email"].includes(method) && <section className={surface}><h2 className="text-sm font-semibold">Record an external submission</h2><p className="mt-1 text-sm text-muted-foreground">Use this only after you submit outside KLEIO. The status remains artist-reported unless a provider confirms receipt.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input className={input} value={providerConfirmation} onChange={(event) => setProviderConfirmation(event.target.value)} placeholder="Optional confirmation or receipt number" /><button type="button" className={secondary} disabled={saving || !storedPackage} onClick={() => void reportExternalSubmission()}>Mark as externally submitted</button></div></section>}
      </div>
    </main>
  )
}
