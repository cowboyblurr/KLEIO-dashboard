"use client"

/* eslint-disable @next/next/no-img-element -- private signed Supabase URLs are short-lived */

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
  FileUp,
  ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import {
  loadArtistPassport,
  loadPortfolioWorks,
  saveArtistPassport,
  uploadArtistAsset,
  type ArtistPassportRecord,
  type PortfolioWorkRecord,
} from "@/lib/kleio-live-data"
import {
  loadArtistProfilePresentation,
  saveArtistProfilePresentation,
  uploadArtistProfileImage,
  type ArtistProfilePresentationRecord,
} from "@/lib/kleio-profile-presentation"
import {
  confirmPassportClaim,
  loadPassportReviewInbox,
  mergeDuplicateClaim,
  setPassportClaimDecision,
  type PassportClaim,
} from "@/lib/kleio-upload-to-passport"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { PassportDraftRecoveryNotice } from "@/components/kleio/passport-draft-recovery-notice"
import { DisciplineMultiSelect, TagEntryField } from "@/components/kleio/forms/artist-term-fields"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { passportAutosaveLabel, usePassportDraftAutosave } from "@/components/kleio/use-passport-draft-autosave"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const input = "h-10 w-full rounded-lg border border-[#E7E1F7] bg-white px-3 text-sm outline-none transition focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
const textarea = "w-full rounded-lg border border-[#E7E1F7] bg-white px-3 py-2.5 text-sm leading-6 outline-none transition focus:border-[#A997E8] focus:ring-2 focus:ring-[#A997E8]/15"
const proposedInput = "w-full rounded-lg border border-[#BFAFE5] bg-white px-3 py-2.5 text-sm leading-6 text-[#292631] outline-none transition focus:border-[#8F7AC8] focus:ring-4 focus:ring-[#A997E8]/12"
const primary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-[#5B4B8A] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#4F407B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/20 disabled:cursor-not-allowed disabled:opacity-50"
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[#D8D0F2] bg-white px-3 py-2 text-sm font-semibold text-[#5B4B8A] transition hover:bg-[#FBFAFE] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15 disabled:cursor-not-allowed disabled:opacity-50"
const quiet = "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#6F6882] transition hover:bg-[#F4F0FB] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#A997E8]/15 disabled:opacity-50"
const pendingStatuses = new Set<PassportClaim["status"]>(["proposed", "needs_clarification", "conflicting", "deferred"])

const blankPassport: ArtistPassportRecord = {
  user_id: "",
  professional_name: "",
  location: "",
  bio: "",
  artist_statement: "",
  practice_description: "",
  website_url: "",
  instagram_url: "",
  disciplines: [],
  mediums: [],
  languages: [],
  education: "",
  exhibition_history: "",
  awards: "",
  cv_file_path: null,
  profile_completion: 0,
}

const blankPresentation: ArtistProfilePresentationRecord = {
  profile_image_path: null,
  profile_image_url: null,
  featured_work_id: null,
  profile_image_position_x: 50,
  profile_image_position_y: 50,
}

type FullPassportDraft = Record<string, unknown> & {
  passport: ArtistPassportRecord
  presentation: ArtistProfilePresentationRecord
}

type ReviewField =
  | "professional_name"
  | "location"
  | "website_url"
  | "instagram_url"
  | "disciplines"
  | "mediums"
  | "languages"
  | "bio"
  | "artist_statement"
  | "practice_description"
  | "education"
  | "exhibition_history"
  | "awards"

type ReviewAction = "approve" | "reject" | "keep_current"

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "_")
}

function fieldForClaim(claim: PassportClaim): ReviewField | null {
  const direct = normalize(claim.target_field)
  const directFields: ReviewField[] = [
    "professional_name", "location", "website_url", "instagram_url", "disciplines", "mediums", "languages",
    "bio", "artist_statement", "practice_description", "education", "exhibition_history", "awards",
  ]
  if (directFields.includes(direct as ReviewField)) return direct as ReviewField

  const context = normalize(`${claim.target_field} ${claim.claim_type} ${claim.target_section}`)
  if (/artist_statement|statement_language/.test(context)) return "artist_statement"
  if (/practice_description|practice_summary|practice_language/.test(context)) return "practice_description"
  if (/artist_bio|artist_biography|biography|short_bio/.test(context)) return "bio"
  if (/education|training|degree|school/.test(context)) return "education"
  if (/exhibition|residency|collection|commission/.test(context)) return "exhibition_history"
  if (/award|grant|fellowship|prize/.test(context)) return "awards"
  if (/discipline/.test(context)) return "disciplines"
  if (/medium|material/.test(context)) return "mediums"
  if (/language/.test(context)) return "languages"
  if (/instagram/.test(context)) return "instagram_url"
  if (/website|portfolio_url|professional_link/.test(context)) return "website_url"
  if (/location|based_in|city|country/.test(context)) return "location"
  if (/professional_name|artist_name|display_name/.test(context)) return "professional_name"
  return null
}

function sourceLabel(claim: PassportClaim) {
  return claim.source?.original_filename || claim.source?.label || "private document"
}

function confidenceLabel(claim: PassportClaim) {
  if (claim.relationship_status === "conflict") return "Conflict"
  if (claim.relationship_status === "duplicate") return "Possible duplicate"
  if (claim.confidence === null) return "Needs review"
  if (claim.confidence >= 0.85) return "High confidence"
  if (claim.confidence >= 0.65) return "Moderate confidence"
  return "Low confidence"
}

function ProposalField({
  field,
  label,
  value,
  onChange,
  claims,
  drafts,
  onDraftChange,
  onReview,
  activeId,
  multiline = false,
  rows = 4,
}: {
  field: ReviewField
  label: string
  value: string
  onChange: (value: string) => void
  claims: PassportClaim[]
  drafts: Record<string, string>
  onDraftChange: (claimId: string, value: string) => void
  onReview: (claim: PassportClaim, action: ReviewAction) => Promise<void>
  activeId: string
  multiline?: boolean
  rows?: number
}) {
  const [index, setIndex] = useState(0)
  useEffect(() => { if (index >= claims.length) setIndex(Math.max(0, claims.length - 1)) }, [claims.length, index])
  const claim = claims[index]

  if (!claim) {
    return (
      <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]">
        <span>{label}</span>
        {multiline
          ? <textarea className={textarea} rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
          : <input className={input} value={value} onChange={(event) => onChange(event.target.value)} />}
      </label>
    )
  }

  const draft = drafts[claim.id] ?? (claim.artist_edited_value || claim.proposed_value)
  const busy = activeId === claim.id
  const replacing = claim.relationship_status === "conflict" && Boolean(claim.existing_record_id)

  return (
    <div className="grid gap-1.5" data-passport-field={field}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={`proposal-${claim.id}`} className="text-xs font-semibold text-[#5B4B8A]">{label}</label>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE9F8] px-2 py-0.5 text-[0.65rem] font-semibold text-[#5B4B8A]"><Sparkles className="size-3" />{claims.length} found</span>
      </div>

      <div className="rounded-xl border border-[#CFC3ED] bg-[#FAF8FE] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-[0.7rem] text-[#746E80]">
          <p className="min-w-0 truncate"><span className="font-semibold text-[#5B4B8A]">Suggested from {sourceLabel(claim)}</span>{claim.page_number ? ` · page ${claim.page_number}` : ""}</p>
          <span className={`rounded-full px-2 py-0.5 font-semibold ${claim.relationship_status === "conflict" ? "bg-amber-100 text-amber-800" : claim.relationship_status === "duplicate" ? "bg-blue-100 text-blue-800" : "bg-white text-[#6F6882]"}`}>{confidenceLabel(claim)}</span>
        </div>

        {multiline
          ? <textarea id={`proposal-${claim.id}`} className={`${proposedInput} mt-2`} rows={rows} value={draft} onChange={(event) => onDraftChange(claim.id, event.target.value)} />
          : <input id={`proposal-${claim.id}`} className={`${proposedInput} mt-2 h-10`} value={draft} onChange={(event) => onDraftChange(claim.id, event.target.value)} />}

        {value.trim() && value.trim() !== draft.trim() && (
          <details className="mt-2 text-xs text-[#746E80]">
            <summary className="cursor-pointer font-semibold text-[#6A5896]">Compare with current Passport value</summary>
            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-white px-3 py-2 leading-5">{value}</p>
          </details>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <details className="text-xs text-[#746E80]">
            <summary className="cursor-pointer inline-flex items-center gap-1 font-semibold text-[#6A5896]"><FileSearch className="size-3.5" />View source</summary>
            <div className="mt-2 max-w-2xl rounded-lg bg-white px-3 py-2 leading-5">
              <p>{claim.evidence_excerpt || "KLEIO did not receive a readable excerpt; review the original page before approving."}</p>
              <p className="mt-1 text-[0.68rem] text-[#8A8296]">{sourceLabel(claim)}{claim.page_number ? ` · page ${claim.page_number}` : ""} · {claim.extraction_method.replaceAll("_", " ")}</p>
            </div>
          </details>
          <div className="flex flex-wrap gap-1.5">
            {claims.length > 1 && <div className="flex items-center rounded-lg border border-[#DED7EF] bg-white"><button type="button" className="grid size-8 place-items-center" aria-label="Previous suggestion" onClick={() => setIndex((current) => (current - 1 + claims.length) % claims.length)}><ChevronLeft className="size-3.5" /></button><span className="px-1 text-[0.68rem] font-semibold text-[#746E80]">{index + 1}/{claims.length}</span><button type="button" className="grid size-8 place-items-center" aria-label="Next suggestion" onClick={() => setIndex((current) => (current + 1) % claims.length)}><ChevronRight className="size-3.5" /></button></div>}
            {claim.relationship_status === "duplicate" && <button type="button" className={quiet} disabled={busy} onClick={() => void onReview(claim, "keep_current")}><Check className="size-3.5" />Keep current</button>}
            <button type="button" className={quiet} disabled={busy} onClick={() => void onReview(claim, "reject")}><X className="size-3.5" />Reject</button>
            <button type="button" className={primary} disabled={busy || !draft.trim()} onClick={() => void onReview(claim, "approve")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}{replacing ? "Approve replacement" : "Approve"}</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TermProposalQueue({
  label,
  claims,
  drafts,
  onDraftChange,
  onReview,
  activeId,
}: {
  label: string
  claims: PassportClaim[]
  drafts: Record<string, string>
  onDraftChange: (claimId: string, value: string) => void
  onReview: (claim: PassportClaim, action: ReviewAction) => Promise<void>
  activeId: string
}) {
  if (!claims.length) return null
  return (
    <div className="rounded-lg border border-[#CFC3ED] bg-[#FAF8FE] px-3 py-2.5">
      <p className="text-xs font-semibold text-[#5B4B8A]"><Sparkles className="mr-1 inline size-3.5" />{label}</p>
      <div className="mt-2 divide-y divide-[#E7E1F7]">
        {claims.map((claim) => {
          const draft = drafts[claim.id] ?? (claim.artist_edited_value || claim.proposed_value)
          const busy = activeId === claim.id
          return (
            <div key={claim.id} className="py-2 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input className={`${input} flex-1 border-[#BFAFE5]`} value={draft} onChange={(event) => onDraftChange(claim.id, event.target.value)} aria-label={`${label} from ${sourceLabel(claim)}`} />
                <div className="flex shrink-0 gap-1.5"><button type="button" className={quiet} disabled={busy} onClick={() => void onReview(claim, "reject")}><X className="size-3.5" />Reject</button><button type="button" className={primary} disabled={busy || !draft.trim()} onClick={() => void onReview(claim, "approve")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}Approve</button></div>
              </div>
              <p className="mt-1 text-[0.68rem] text-[#8A8296]">{sourceLabel(claim)}{claim.page_number ? ` · page ${claim.page_number}` : ""}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "A"
}

export function LiveArtistPassportEditor() {
  const { locale } = useKleioLocale()
  const [record, setRecord] = useState(blankPassport)
  const [works, setWorks] = useState<PortfolioWorkRecord[]>([])
  const [presentation, setPresentation] = useState(blankPresentation)
  const [claims, setClaims] = useState<PassportClaim[]>([])
  const [proposalDrafts, setProposalDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [activeClaimId, setActiveClaimId] = useState("")
  const [error, setError] = useState("")
  const [saved, setSaved] = useState("")
  const [cvName, setCvName] = useState("")

  const loadClaims = useCallback(async () => {
    const groups = await loadPassportReviewInbox().catch(() => [])
    const next = groups.flatMap((group) => group.claims).filter((claim) => pendingStatuses.has(claim.status))
    setClaims(next)
    setProposalDrafts((current) => {
      const updated = { ...current }
      for (const claim of next) if (!(claim.id in updated)) updated[claim.id] = claim.artist_edited_value || claim.proposed_value
      return updated
    })
    return next
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([loadArtistPassport(), loadPortfolioWorks(), loadArtistProfilePresentation(), loadPassportReviewInbox().catch(() => [])])
      .then(([profile, portfolio, profilePresentation, groups]) => {
        if (!active) return
        if (profile) setRecord(profile)
        setWorks(portfolio)
        setPresentation(profilePresentation)
        const next = groups.flatMap((group) => group.claims).filter((claim) => pendingStatuses.has(claim.status))
        setClaims(next)
        setProposalDrafts(Object.fromEntries(next.map((claim) => [claim.id, claim.artist_edited_value || claim.proposed_value])))
      })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const proposalGroups = useMemo(() => {
    const grouped = {} as Partial<Record<ReviewField, PassportClaim[]>>
    for (const claim of claims) {
      const field = fieldForClaim(claim)
      if (!field) continue
      grouped[field] = [...(grouped[field] ?? []), claim]
    }
    return grouped
  }, [claims])

  const mappedClaimIds = useMemo(() => new Set(Object.values(proposalGroups).flat().map((claim) => claim.id)), [proposalGroups])
  const unmappedCount = claims.filter((claim) => !mappedClaimIds.has(claim.id)).length
  const pendingCount = claims.length

  const draftPayload = useMemo<FullPassportDraft>(() => ({ passport: record, presentation }), [presentation, record])
  const autosave = usePassportDraftAutosave<FullPassportDraft>({
    draftKey: "creative_passport_full",
    payload: draftPayload,
    enabled: !loading,
    surface: "creative_passport_full",
    onRestore: (payload) => {
      setRecord(payload.passport)
      setPresentation(payload.presentation)
      setSaved("Recovered draft loaded. Review it before using Save Passport.")
    },
  })
  const autosaveLabel = passportAutosaveLabel(autosave.state)

  function update(key: keyof ArtistPassportRecord, value: string | string[] | null) {
    setRecord((current) => ({ ...current, [key]: value }))
    setSaved("")
  }

  async function refreshAfterReview(message: string) {
    const [profile] = await Promise.all([loadArtistPassport(), loadClaims()])
    if (profile) setRecord(profile)
    setSaved(message)
  }

  async function reviewClaim(claim: PassportClaim, action: ReviewAction) {
    setActiveClaimId(claim.id)
    setError("")
    setSaved("")
    try {
      if (action === "approve") {
        await confirmPassportClaim(claim, {
          value: proposalDrafts[claim.id] ?? claim.proposed_value,
          visibility: "private",
          replaceExisting: claim.relationship_status === "conflict" && Boolean(claim.existing_record_id),
        })
        await refreshAfterReview(`${claim.target_section.replaceAll("_", " ")} approved and added to the private Passport.`)
        void trackKleioProductEvent("proposal_approved", { surface: "creative_passport_field", metadata: { section: claim.target_section, edited: (proposalDrafts[claim.id] ?? claim.proposed_value) !== claim.proposed_value } })
      } else if (action === "keep_current") {
        await mergeDuplicateClaim(claim)
        await refreshAfterReview("The current Passport value was kept and the document was linked as supporting evidence.")
      } else {
        await setPassportClaimDecision(claim.id, "rejected", "Artist rejected this field-level suggestion.")
        await refreshAfterReview("Suggestion rejected. The Passport was not changed.")
        void trackKleioProductEvent("proposal_rejected", { surface: "creative_passport_field", metadata: { section: claim.target_section, reason: "artist_rejected" } })
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "KLEIO could not update this suggestion.")
    } finally {
      setActiveClaimId("")
    }
  }

  async function save() {
    setSaving(true)
    setError("")
    setSaved("")
    try {
      const next = await saveArtistPassport({
        ...record,
        disciplines_text: record.disciplines.join(", "),
        mediums_text: record.mediums.join(", "),
        languages_text: record.languages.join(", "),
      })
      const nextPresentation = await saveArtistProfilePresentation({
        profile_image_path: presentation.profile_image_path,
        featured_work_id: presentation.featured_work_id,
        profile_image_position_x: presentation.profile_image_position_x,
        profile_image_position_y: presentation.profile_image_position_y,
      })
      setRecord(next)
      setPresentation(nextPresentation)
      autosave.markSaved()
      setSaved("Creative Passport saved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the Creative Passport.")
    } finally {
      setSaving(false)
    }
  }

  async function uploadCv(file: File | null) {
    if (!file) return
    setSaving(true)
    setError("")
    try {
      if (file.type !== "application/pdf") throw new Error("Choose a PDF for your CV.")
      if (file.size > 15 * 1024 * 1024) throw new Error("CV files must be 15 MB or smaller.")
      const signature = new TextDecoder().decode(new Uint8Array(await file.slice(0, 5).arrayBuffer()))
      if (signature !== "%PDF-") throw new Error("The selected file does not have a valid PDF signature.")
      const path = await uploadArtistAsset(file, "cv")
      update("cv_file_path", path)
      setCvName(file.name)
      setSaved("CV uploaded to private storage. Save the Passport to attach it.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the CV.")
    } finally {
      setSaving(false)
    }
  }

  async function uploadProfilePhoto(file: File | null) {
    if (!file) return
    setUploadingPhoto(true)
    setError("")
    try {
      const uploaded = await uploadArtistProfileImage(file)
      setPresentation((current) => ({ ...current, profile_image_path: uploaded.path, profile_image_url: uploaded.signedUrl }))
      setSaved("Profile photo uploaded. Adjust its position if needed, then save the Passport.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to upload the profile image.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const eligibleFeaturedWorks = works.filter((work) => work.image_url)
  const fieldProps = {
    drafts: proposalDrafts,
    onDraftChange: (claimId: string, value: string) => setProposalDrafts((current) => ({ ...current, [claimId]: value })),
    onReview: reviewClaim,
    activeId: activeClaimId,
  }

  return (
    <main className="h-full overflow-y-auto bg-white px-4 pb-8 pt-4 sm:px-6">
      <div className="mx-auto max-w-[920px]">
        <WorkspacePageHeader
          eyebrow="Creative Passport"
          title="Edit your artist information"
          description="Gemini suggestions appear in the field where they belong. Edit the value, inspect its source, then approve or reject it."
        />

        <div className="mt-4 flex flex-col gap-3 border-y border-[#EEEAF6] py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#746E80]">
            <span><strong className="text-[#292631]">{record.profile_completion}%</strong> complete</span>
            {pendingCount > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-[#EEE9F8] px-2.5 py-1 font-semibold text-[#5B4B8A]"><Sparkles className="size-3" />{pendingCount} suggestion{pendingCount === 1 ? "" : "s"} in fields</span>}
            {unmappedCount > 0 && <Link href="/artist-dashboard/passport/review/" className="font-semibold text-[#5B4B8A]">{unmappedCount} structured item{unmappedCount === 1 ? "" : "s"} need full review</Link>}
            {autosaveLabel && <span role="status" aria-live="polite" className={autosave.state === "conflict" || autosave.state === "error" ? "font-semibold text-amber-700" : ""}>{autosaveLabel}</span>}
          </div>
          <button className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save Passport</button>
        </div>

        {autosave.recovery && <div className="mt-3"><PassportDraftRecoveryNotice recovery={autosave.recovery} onRestore={autosave.restore} onDismiss={autosave.dismissRecovery} locale={locale} /></div>}
        {loading && <div className="mt-4 flex items-center gap-2 border-b border-[#EEEAF6] py-4 text-sm text-[#746E80]"><Loader2 className="size-4 animate-spin" />Loading your Creative Passport…</div>}
        {error && <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {saved && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{saved}</p>}

        {!loading && (
          <div className="mt-4 divide-y divide-[#EEEAF6]">
            <section className="pb-6 pt-2" aria-labelledby="passport-identity-heading">
              <div className="mb-4"><h2 id="passport-identity-heading" className="font-serif text-xl font-semibold text-[#292631]">Identity</h2><p className="mt-1 text-xs text-[#746E80]">The basic information used to identify and contact you professionally.</p></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProposalField field="professional_name" label="Professional name" value={record.professional_name} onChange={(value) => update("professional_name", value)} claims={proposalGroups.professional_name ?? []} {...fieldProps} />
                <ProposalField field="location" label="Location" value={record.location} onChange={(value) => update("location", value)} claims={proposalGroups.location ?? []} {...fieldProps} />
                <ProposalField field="website_url" label="Website" value={record.website_url} onChange={(value) => update("website_url", value)} claims={proposalGroups.website_url ?? []} {...fieldProps} />
                <ProposalField field="instagram_url" label="Instagram" value={record.instagram_url} onChange={(value) => update("instagram_url", value)} claims={proposalGroups.instagram_url ?? []} {...fieldProps} />
              </div>
            </section>

            <section className="py-6" aria-labelledby="passport-practice-heading">
              <div className="mb-4"><h2 id="passport-practice-heading" className="font-serif text-xl font-semibold text-[#292631]">Practice</h2><p className="mt-1 text-xs text-[#746E80]">Language and categories that describe how you work.</p></div>
              <div className="grid gap-5">
                <div className="grid gap-2"><TermProposalQueue label="Suggested disciplines" claims={proposalGroups.disciplines ?? []} {...fieldProps} /><DisciplineMultiSelect values={record.disciplines} onChange={(values) => update("disciplines", values)} locale={locale} /></div>
                <div className="grid gap-2"><TermProposalQueue label="Suggested mediums and materials" claims={proposalGroups.mediums ?? []} {...fieldProps} /><TagEntryField values={record.mediums} onChange={(values) => update("mediums", values)} label="Mediums and materials" placeholder="Type a medium and press Enter" /></div>
                <div className="grid gap-2"><TermProposalQueue label="Suggested languages" claims={proposalGroups.languages ?? []} {...fieldProps} /><TagEntryField values={record.languages} onChange={(values) => update("languages", values)} label="Languages" placeholder="Type a language and press Enter" /></div>
                <ProposalField field="bio" multiline rows={5} label="Short biography" value={record.bio} onChange={(value) => update("bio", value)} claims={proposalGroups.bio ?? []} {...fieldProps} />
                <ProposalField field="artist_statement" multiline rows={7} label="Artist statement" value={record.artist_statement} onChange={(value) => update("artist_statement", value)} claims={proposalGroups.artist_statement ?? []} {...fieldProps} />
                <ProposalField field="practice_description" multiline rows={6} label="Practice description" value={record.practice_description} onChange={(value) => update("practice_description", value)} claims={proposalGroups.practice_description ?? []} {...fieldProps} />
              </div>
            </section>

            <section className="py-6" aria-labelledby="passport-experience-heading">
              <div className="mb-4"><h2 id="passport-experience-heading" className="font-serif text-xl font-semibold text-[#292631]">Experience</h2><p className="mt-1 text-xs text-[#746E80]">Professional history that KLEIO can reuse in applications and profiles.</p></div>
              <div className="grid gap-5">
                <ProposalField field="education" multiline rows={5} label="Education and training" value={record.education} onChange={(value) => update("education", value)} claims={proposalGroups.education ?? []} {...fieldProps} />
                <ProposalField field="exhibition_history" multiline rows={7} label="Exhibitions, residencies, collections, and commissions" value={record.exhibition_history} onChange={(value) => update("exhibition_history", value)} claims={proposalGroups.exhibition_history ?? []} {...fieldProps} />
                <ProposalField field="awards" multiline rows={5} label="Awards, grants, fellowships, and prizes" value={record.awards} onChange={(value) => update("awards", value)} claims={proposalGroups.awards ?? []} {...fieldProps} />
              </div>
            </section>

            <section className="py-6" aria-labelledby="passport-documents-heading">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h2 id="passport-documents-heading" className="font-serif text-xl font-semibold text-[#292631]">Documents</h2><p className="mt-1 text-xs text-[#746E80]">Attach a current CV, or use Gemini document analysis to prepare field-level suggestions.</p></div><Link href="/artist-dashboard/import/" className={secondary}><Sparkles className="size-4" />Upload and analyze PDF</Link></div>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#D8D0F2] px-4 py-3 text-sm text-[#5B4B8A]"><FileUp className="size-4" /><span>{cvName || (record.cv_file_path ? "Replace saved CV" : "Attach a CV without analysis")}</span><input type="file" accept="application/pdf" className="sr-only" onChange={(event) => void uploadCv(event.target.files?.[0] ?? null)} /></label>
            </section>

            <section className="py-6" aria-labelledby="passport-presentation-heading">
              <details>
                <summary id="passport-presentation-heading" className="flex cursor-pointer list-none items-center justify-between gap-3 text-left"><div><h2 className="font-serif text-xl font-semibold text-[#292631]">Profile images and presentation</h2><p className="mt-1 text-xs text-[#746E80]">Optional controls for your portrait and featured artwork.</p></div><ChevronDown className="size-4 shrink-0 text-[#6A5896]" /></summary>
                <div className="mt-4 grid gap-5 sm:grid-cols-[150px_minmax(0,1fr)]">
                  <div>
                    <div className="grid aspect-[4/5] place-items-center overflow-hidden rounded-lg border border-[#D8D0F2] bg-[#F7F4FF]">
                      {presentation.profile_image_url ? <img src={presentation.profile_image_url} alt="Profile preview" className="size-full object-cover" style={{ objectPosition: `${presentation.profile_image_position_x}% ${presentation.profile_image_position_y}%` }} /> : <div className="text-center text-[#5B4B8A]"><span className="font-serif text-3xl">{initialsFor(record.professional_name)}</span><p className="mt-1 text-[0.62rem] uppercase tracking-[0.14em] text-[#8A8296]">Profile photo</p></div>}
                    </div>
                    <label className={`${secondary} mt-2 w-full cursor-pointer`}>{uploadingPhoto ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}{presentation.profile_image_url ? "Replace" : "Upload"}<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploadingPhoto} onChange={(event) => void uploadProfilePhoto(event.target.files?.[0] ?? null)} /></label>
                    {presentation.profile_image_path && <button type="button" className="mt-1 inline-flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-[#8A5B65]" onClick={() => setPresentation((current) => ({ ...current, profile_image_path: null, profile_image_url: null, profile_image_position_x: 50, profile_image_position_y: 50 }))}><Trash2 className="size-3.5" />Remove</button>}
                  </div>
                  <div className="space-y-4">
                    <label className="grid gap-1.5 text-xs font-semibold text-[#746E80]"><span>Featured artwork</span><select className={input} value={presentation.featured_work_id || ""} onChange={(event) => setPresentation((current) => ({ ...current, featured_work_id: event.target.value || null }))}><option value="">Use the first portfolio work with an image</option>{eligibleFeaturedWorks.map((work) => <option key={work.id} value={work.id}>{work.title}</option>)}</select></label>
                    {presentation.profile_image_url && <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Horizontal position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_x} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_x: Number(event.target.value) }))} /></label><label className="grid gap-1 text-xs font-medium text-[#746E80]"><span>Vertical position</span><input type="range" min="0" max="100" value={presentation.profile_image_position_y} onChange={(event) => setPresentation((current) => ({ ...current, profile_image_position_y: Number(event.target.value) }))} /></label></div>}
                    <p className="text-xs leading-5 text-[#8A8296]">JPG, PNG, or WebP, up to 5 MB. These settings affect only the shared profile presentation.</p>
                    <div className="flex flex-wrap gap-2"><Link href="/artist-dashboard/profile/" className={secondary}>Preview profile</Link>{eligibleFeaturedWorks.length === 0 && <Link href="/artist-dashboard/portfolio/" className={secondary}>Add portfolio images</Link>}</div>
                  </div>
                </div>
              </details>
            </section>

            <div className="flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#746E80]">Manual edits save with the Passport. Gemini suggestions save only after you approve them.</p>
              <button className={primary} disabled={saving || !record.professional_name.trim()} onClick={() => void save()}>{saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Save Passport</button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
