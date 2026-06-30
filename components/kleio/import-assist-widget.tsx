"use client"

import { useMemo, useState } from "react"
import {
  FileText,
  Globe,
  Headphones,
  Link2,
  Sparkles,
  Video,
} from "lucide-react"
import { getConnectorsForUserType, type KleioConnector, type KleioConnectorCategory } from "@/lib/kleio-integrations"
import {
  getAssistSummary,
  getConfidenceSummary,
  getIntelligenceRecord,
  getMissingFields,
  getSuggestedFields,
  type SuggestedField,
} from "@/lib/kleio-intelligence"
import { cn } from "@/lib/utils"
import {
  buildArtistFormSuggestions,
  buildInstitutionFormSuggestions,
  getConflictKeys,
} from "@/lib/kleio-signup-suggestions"

export type ImportAssistState = {
  expanded: boolean
  connectedIds: string[]
  draftPrepared: boolean
  showReviewPanel: boolean
  fieldStatuses: Record<string, SuggestedField["approvalStatus"]>
  editNotes: Record<string, string>
}

export const defaultImportAssistState: ImportAssistState = {
  expanded: false,
  connectedIds: [],
  draftPrepared: false,
  showReviewPanel: false,
  fieldStatuses: {},
  editNotes: {},
}

type ImportAssistWidgetProps = {
  userType: "artist" | "institution"
  subjectId?: string
  compact?: boolean
  state?: ImportAssistState
  onStateChange?: (state: ImportAssistState) => void
  currentFormValues?: Record<string, string>
  onApplySuggestions?: (suggestions: Record<string, string | string[]>) => void
  onSuggestionStatusChange?: (
    field: string,
    status: "approved" | "edited" | "rejected" | "suggested",
  ) => void
}

type FieldApprovalStatus = SuggestedField["approvalStatus"]

function categoryIcon(category: KleioConnectorCategory) {
  switch (category) {
    case "website":
      return Globe
    case "social":
      return Link2
    case "files":
      return FileText
    case "video":
      return Video
    case "audio":
      return Headphones
    case "submission-system":
      return FileText
    default:
      return Link2
  }
}

function formatValue(value: string | string[]) {
  return Array.isArray(value) ? value.join(", ") : value
}

function statusPillClass(status: FieldApprovalStatus) {
  switch (status) {
    case "approved":
      return "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]"
    case "edited":
      return "bg-primary/10 text-primary"
    case "rejected":
      return "bg-muted text-muted-foreground"
    default:
      return "bg-[oklch(0.93_0.04_287)] text-[oklch(0.42_0.14_287)]"
  }
}

function confidencePillClass(confidence: SuggestedField["confidence"]) {
  switch (confidence) {
    case "high":
      return "bg-[oklch(0.92_0.05_150)] text-[oklch(0.4_0.13_150)]"
    case "medium":
      return "bg-[oklch(0.93_0.05_70)] text-[oklch(0.45_0.13_55)]"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function visibilityLabel(visibility: SuggestedField["visibility"]) {
  switch (visibility) {
    case "backend-reference-only":
      return "Backend reference only"
    case "workspace":
      return "Workspace"
    default:
      return "Profile"
  }
}

// Maps intelligence record field ids → signup form keys
const intelligenceToFormKey: Record<string, Record<string, string>> = {
  artist: {
    bio: "shortBio",
    disciplineTags: "discipline",
    mediumTags: "mediums",
    statementThemes: "themes",
    featuredWorks: "featuredWorks",
    documentChecklist: "documents",
    publicLinks: "portfolioLinks",
    portfolioCategories: "themes",
    sonicReferences: "mediums",
  },
  institution: {
    institutionName: "institutionName",
    institutionType: "institutionType",
    location: "location",
    publicDescription: "publicDescription",
    missionSummary: "missionStatement",
    programCategories: "programType",
    defaultMaterials: "requiredMaterials",
    reviewerRoles: "reviewerRoles",
    reportingNeeds: "reportingNeeds",
    importStructure: "importStructure",
  },
}

export function ImportAssistWidget({
  userType,
  subjectId,
  compact = false,
  state: controlledState,
  onStateChange,
  currentFormValues = {},
  onApplySuggestions,
  onSuggestionStatusChange,
}: ImportAssistWidgetProps) {
  const resolvedSubjectId = subjectId ?? (userType === "artist" ? "amina-el-badri" : "kleio-arthouse")
  const connectors = getConnectorsForUserType(userType)
  const baseRecord = getIntelligenceRecord(userType, resolvedSubjectId)
  const baseFields = getSuggestedFields(userType, resolvedSubjectId)
  const missingFields = getMissingFields(userType, resolvedSubjectId)
  const assistSummary = getAssistSummary(userType, resolvedSubjectId)

  const [internalState, setInternalState] = useState<ImportAssistState>(defaultImportAssistState)
  const isControlled = controlledState !== undefined && onStateChange !== undefined
  const widgetState = isControlled ? controlledState : internalState

  const setWidgetState = (updater: ImportAssistState | ((prev: ImportAssistState) => ImportAssistState)) => {
    if (isControlled) {
      const next = typeof updater === "function" ? updater(controlledState!) : updater
      onStateChange!(next)
    } else {
      setInternalState(updater)
    }
  }

  const { expanded, connectedIds, draftPrepared, showReviewPanel, fieldStatuses, editNotes } = widgetState

  const normalizedSuggestions = useMemo(() => {
    return userType === "artist"
      ? buildArtistFormSuggestions(resolvedSubjectId)
      : buildInstitutionFormSuggestions(resolvedSubjectId)
  }, [userType, resolvedSubjectId])

  const conflictKeys = useMemo(
    () => getConflictKeys(currentFormValues, normalizedSuggestions),
    [currentFormValues, normalizedSuggestions],
  )

  const fields = useMemo(
    () =>
      baseFields.map((field) => ({
        ...field,
        approvalStatus: fieldStatuses[field.field] ?? field.approvalStatus,
      })),
    [baseFields, fieldStatuses],
  )

  const connectedCount = connectedIds.length
  const canReview = connectedCount > 0
  const confidenceSummary = getConfidenceSummary(fields)

  function toggleConnector(id: string) {
    setWidgetState((prev) => ({
      ...prev,
      connectedIds: prev.connectedIds.includes(id)
        ? prev.connectedIds.filter((x) => x !== id)
        : [...prev.connectedIds, id],
    }))
  }

  function setFieldStatus(field: string, status: FieldApprovalStatus) {
    setWidgetState((prev) => ({
      ...prev,
      fieldStatuses: { ...prev.fieldStatuses, [field]: status },
      editNotes:
        status === "edited"
          ? { ...prev.editNotes, [field]: "Marked for edit" }
          : prev.editNotes,
    }))
    onSuggestionStatusChange?.(field, status)
  }

  function prepareDraftFields() {
    setWidgetState((prev) => ({ ...prev, draftPrepared: true }))
  }

  function applyToEmptyFields() {
    if (!onApplySuggestions) return
    onApplySuggestions(normalizedSuggestions)
  }

  function applyApprovedFields() {
    if (!onApplySuggestions) return
    const approved: Record<string, string> = {}
    for (const field of fields) {
      if (field.approvalStatus !== "approved") continue
      const formKey = intelligenceToFormKey[userType][field.field]
      if (formKey && normalizedSuggestions[formKey]) {
        approved[formKey] = normalizedSuggestions[formKey]
      }
    }
    onApplySuggestions(approved)
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-[oklch(0.99_0.005_287)] shadow-sm",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-4" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-base font-semibold text-foreground">KLEIO Import Assist</h3>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                Optional
              </span>
              {connectedCount > 0 && !expanded && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[0.65rem] font-medium text-primary">
                  {connectedCount} connected
                </span>
              )}
            </div>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              Connect materials you already maintain so KLEIO can help prepare a first draft. You review and edit everything.
            </p>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">
              Nothing is published without your approval.
            </p>
            <p className="mt-1 text-[0.68rem] text-muted-foreground">
              You can skip Import Assist and continue manually.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setWidgetState((prev) => ({ ...prev, expanded: !prev.expanded }))}
          className="shrink-0 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/50"
        >
          {expanded ? "Hide Import Assist" : "Use Import Assist"}
        </button>
      </div>

      {expanded && (
        <>
          <div className={cn("mt-4 grid gap-3", compact ? "grid-cols-1" : "sm:grid-cols-2")}>
            {connectors.map((connector) => (
              <ConnectorCard
                key={connector.id}
                connector={connector}
                connected={connectedIds.includes(connector.id)}
                onToggle={() => toggleConnector(connector.id)}
              />
            ))}
          </div>

          {connectedCount > 0 && (
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 px-3 py-2.5">
              <p className="text-xs font-medium text-primary">
                {draftPrepared ? "Suggested fields prepared for review" : "Sources connected"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                KLEIO can help organize a first draft from materials you already maintain. You remain the author. Review
                and edit every suggestion. Apply suggestions to empty fields only.
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-[0.68rem] text-muted-foreground">
                <span>{fields.length} suggested fields</span>
                <span>{missingFields.length} missing fields</span>
                <span>{connectedCount} connected sources</span>
                {draftPrepared && <span>{confidenceSummary}</span>}
              </div>

              {conflictKeys.length > 0 && (
                <p className="mt-2 text-[0.68rem] text-[oklch(0.45_0.13_55)]">
                  {conflictKeys.length} field{conflictKeys.length === 1 ? "" : "s"} already have your text — suggestion
                  available, review before replacing.
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canReview}
                  onClick={prepareDraftFields}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/50 disabled:opacity-40"
                >
                  Prepare draft fields
                </button>
                {onApplySuggestions && (
                  <button
                    type="button"
                    disabled={!draftPrepared}
                    onClick={applyToEmptyFields}
                    className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15 disabled:opacity-40"
                  >
                    Apply to empty fields
                  </button>
                )}
                <button
                  type="button"
                  disabled={!canReview || !draftPrepared}
                  onClick={() => setWidgetState((prev) => ({ ...prev, showReviewPanel: !prev.showReviewPanel }))}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
                >
                  Review suggested fields
                </button>
              </div>
            </div>
          )}

          {draftPrepared && connectedCount === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">Connect a source to prepare draft fields.</p>
          )}

          {draftPrepared && connectedCount > 0 && !showReviewPanel && (
            <div className="mt-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Prepared for review, not final</p>
              <p className="mt-1 text-xs text-muted-foreground">{assistSummary}</p>
              <ul className="mt-2 space-y-1">
                {Object.entries(normalizedSuggestions).slice(0, 6).map(([key, value]) => {
                  const hasConflict = conflictKeys.includes(key)
                  const isEmpty = !currentFormValues[key]?.trim()
                  return (
                    <li key={key} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{key}</span>: {value.slice(0, 80)}
                      {value.length > 80 ? "…" : ""}
                      {hasConflict && (
                        <span className="ml-1 text-[oklch(0.45_0.13_55)]">
                          · Suggestion available — review before replacing
                        </span>
                      )}
                      {isEmpty && !hasConflict && <span className="ml-1 text-primary">· ready to apply</span>}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {showReviewPanel && canReview && draftPrepared && (
            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card p-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Prepared for review</h4>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{assistSummary}</p>
                <p className="mt-2 text-[0.68rem] text-muted-foreground">
                  Source-backed draft · Edit before saving · You approve what becomes official
                </p>
              </div>

              {onApplySuggestions && (
                <button
                  type="button"
                  onClick={applyApprovedFields}
                  className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
                >
                  Apply approved to empty fields
                </button>
              )}

              {fields.map((field) => (
                <div key={field.field} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {field.label}
                        {(field.field === "statementThemes" ||
                          field.field === "missionSummary" ||
                          field.field === "bio") && (
                          <span className="ml-1.5 text-[0.65rem] font-normal text-muted-foreground">
                            · Draft suggested
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{formatValue(field.suggestedValue)}</p>
                      <p className="mt-1 text-[0.65rem] text-muted-foreground">
                        {field.sourceIds.length} source{field.sourceIds.length === 1 ? "" : "s"} · {visibilityLabel(field.visibility)}
                      </p>
                      {editNotes[field.field] && (
                        <p className="mt-1 text-[0.65rem] text-primary">{editNotes[field.field]}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", confidencePillClass(field.confidence))}>
                        {field.confidence}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", statusPillClass(field.approvalStatus))}>
                        {field.approvalStatus === "suggested" ? "Suggested" : field.approvalStatus}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setFieldStatus(field.field, "approved")}
                      className="rounded-md border border-border px-2.5 py-1 text-[0.68rem] font-medium text-foreground hover:bg-accent/50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setFieldStatus(field.field, "edited")}
                      className="rounded-md border border-border px-2.5 py-1 text-[0.68rem] font-medium text-foreground hover:bg-accent/50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setFieldStatus(field.field, "rejected")}
                      className="rounded-md border border-border px-2.5 py-1 text-[0.68rem] font-medium text-foreground hover:bg-accent/50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}

              {missingFields.length > 0 && (
                <div className="rounded-lg border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] p-3">
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">Missing fields</p>
                  <ul className="mt-1 space-y-0.5">
                    {missingFields.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {baseRecord?.riskFlags.length ? (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-semibold text-foreground">Notes for review</p>
                  <ul className="mt-1 space-y-1">
                    {baseRecord.riskFlags.map((flag) => (
                      <li key={flag.label} className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{flag.label}</span> — {flag.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ConnectorCard({
  connector,
  connected,
  onToggle,
}: {
  connector: KleioConnector
  connected: boolean
  onToggle: () => void
}) {
  const Icon = categoryIcon(connector.category)

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{connector.label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{connector.description}</p>
          <p className="mt-1 text-[0.65rem] text-muted-foreground">{connector.trustNote}</p>
          {connected && (
            <p className="mt-2 text-[0.65rem] font-medium text-primary">{connector.demoPreviewText}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "mt-3 w-full rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
          connected
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-border bg-background text-foreground hover:bg-accent/50",
        )}
      >
        {connected ? "Connected for demo" : "Connect"}
      </button>
    </div>
  )
}
