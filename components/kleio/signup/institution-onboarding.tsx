"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2 } from "lucide-react"
import {
  SignupField,
  SignupProgress,
  SignupReviewRow,
  SignupShell,
  SignupStepCard,
  SignupStepControls,
  SignupTextArea,
} from "@/components/kleio/signup/signup-shell"
import {
  defaultImportAssistState,
  ImportAssistWidget,
  type ImportAssistState,
} from "@/components/kleio/import-assist-widget"
import {
  applySuggestionsToEmptyFields,
  buildInstitutionFormSuggestions,
  formatSuggestionValue,
  getInstitutionMissingFormFields,
  getIntelligenceMissingFields,
  type FieldOrigin,
} from "@/lib/kleio-signup-suggestions"
import { getAssistSummary } from "@/lib/kleio-intelligence"
import { getDashboardForRole, loginDemoUser } from "@/lib/kleio-demo-auth"
import { programs } from "@/lib/kleio-data"
import {
  REVIEW_ACCESS_SCOPES,
  REVIEW_ROLE_PERMISSION_PRESETS,
  REVIEW_TEAM_ROLES,
  calculateReviewTeamStats,
  formatReviewPermission,
  getDefaultReviewTeam,
  getReviewTeamIntegrity,
  saveReviewTeamDemoState,
  type ReviewAccessScope,
  type ReviewInviteTiming,
  type ReviewTeamMember,
  type ReviewTeamRole,
} from "@/lib/kleio-review-team"

const SUBJECT_ID = "kleio-arthouse"

const INSTITUTION_DIRECTORY = [
  "KLEIO Arthouse",
  "Brooklyn Arts Council",
  "Residency Alliance Network",
  "Open Call Collective",
]

const STEPS = [
  { label: "Institution details" },
  { label: "Workspace setup" },
  { label: "Review team" },
  { label: "Materials & suggestions" },
  { label: "Review" },
] as const

type InstitutionFormState = {
  institutionName: string
  institutionType: string
  location: string
  website: string
  publicDescription: string
  missionStatement: string
  programType: string
  reviewProcessType: string
  requiredMaterials: string
  reviewerRoles: string
  committeeSize: string
  reportingNeeds: string
  importStructure: string
}

const emptyForm: InstitutionFormState = {
  institutionName: "",
  institutionType: "",
  location: "",
  website: "",
  publicDescription: "",
  missionStatement: "",
  programType: "",
  reviewProcessType: "",
  requiredMaterials: "",
  reviewerRoles: "",
  committeeSize: "",
  reportingNeeds: "",
  importStructure: "",
}

export function InstitutionOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<InstitutionFormState>(emptyForm)
  const [fieldOrigins, setFieldOrigins] = useState<Partial<Record<keyof InstitutionFormState, FieldOrigin>>>({})
  const [importAssist, setImportAssist] = useState<ImportAssistState>(defaultImportAssistState)
  const [reviewTeam, setReviewTeam] = useState<ReviewTeamMember[]>(() => getDefaultReviewTeam())
  const [draftReviewMember, setDraftReviewMember] = useState({
    name: "",
    email: "",
    role: "Reviewer" as ReviewTeamRole,
    assignedProgramId: "residency-2026",
    assignedProgramTitle: "KLEIO Arthouse Residency 2026",
    accessScope: "Assigned submissions only" as ReviewAccessScope,
    inviteTiming: "Prepare invite now" as ReviewInviteTiming,
  })
  const [addMemberError, setAddMemberError] = useState<string | null>(null)

  const reviewTeamStats = useMemo(() => calculateReviewTeamStats(reviewTeam), [reviewTeam])
  const reviewTeamIntegrity = useMemo(() => getReviewTeamIntegrity(reviewTeam), [reviewTeam])

  useEffect(() => {
    if (process.env.NODE_ENV === "development" && !reviewTeamIntegrity.allChecksPass) {
      console.warn("KLEIO review team integrity check failed", reviewTeamIntegrity)
    }
  }, [reviewTeamIntegrity])

  const stepLabel = `Step ${step + 1} of ${STEPS.length} · ${STEPS[step].label}`
  const formAsRecord = form as Record<string, string>
  const missingFormFields = useMemo(() => getInstitutionMissingFormFields(formAsRecord), [form])
  const intelligenceMissing = useMemo(
    () => getIntelligenceMissingFields("institution", SUBJECT_ID),
    [],
  )

  const preparedSuggestions = useMemo(() => {
    if (!importAssist.draftPrepared) return []
    return Object.entries(buildInstitutionFormSuggestions(SUBJECT_ID)).map(([key, value]) => ({
      key,
      value,
      inForm: !!formAsRecord[key]?.trim(),
    }))
  }, [importAssist.draftPrepared, formAsRecord])

  const updateField = useCallback(
    <K extends keyof InstitutionFormState>(key: K, value: InstitutionFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setFieldOrigins((prev) => {
        if (!prev[key]) return prev
        return { ...prev, [key]: "edited" }
      })
    },
    [],
  )

  const handleApplySuggestions = useCallback(
    (suggestions: Record<string, string | string[]>) => {
      const normalized = Object.fromEntries(
        Object.entries(suggestions).map(([k, v]) => [k, formatSuggestionValue(v)]),
      )
      const result = applySuggestionsToEmptyFields(formAsRecord, fieldOrigins, normalized)
      setForm(result.form as InstitutionFormState)
      setFieldOrigins(result.origins as Partial<Record<keyof InstitutionFormState, FieldOrigin>>)
    },
    [formAsRecord, fieldOrigins],
  )

  const origin = (key: keyof InstitutionFormState) => fieldOrigins[key]

  function makeReviewTeamMemberId(name: string, email: string) {
    const base = `${name}-${email}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

    return base || `review-team-${reviewTeam.length + 1}`
  }

  function isValidReviewEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
  }

  function handleAddReviewTeamMember() {
    const trimmedName = draftReviewMember.name.trim()
    const trimmedEmail = draftReviewMember.email.trim()

    if (!trimmedName) {
      setAddMemberError("Enter a collaborator name before adding.")
      return
    }

    if (!isValidReviewEmail(trimmedEmail)) {
      setAddMemberError("Enter a valid email address before adding.")
      return
    }

    const program = programs.find((entry) => entry.id === draftReviewMember.assignedProgramId)

    const member: ReviewTeamMember = {
      id: makeReviewTeamMemberId(trimmedName, trimmedEmail),
      name: trimmedName,
      email: trimmedEmail,
      role: draftReviewMember.role,
      assignedProgramId: draftReviewMember.assignedProgramId,
      assignedProgramTitle: program?.title ?? draftReviewMember.assignedProgramTitle,
      accessScope: draftReviewMember.accessScope,
      permissions: REVIEW_ROLE_PERMISSION_PRESETS[draftReviewMember.role],
      inviteTiming: draftReviewMember.inviteTiming,
      inviteStatus:
        draftReviewMember.inviteTiming === "Prepare invite now" ? "Prepared" : "Deferred",
    }

    setReviewTeam((prev) => [...prev.filter((entry) => entry.id !== member.id), member])
    setAddMemberError(null)
    setDraftReviewMember((prev) => ({
      ...prev,
      name: "",
      email: "",
    }))
  }

  function handleRemoveReviewTeamMember(id: string) {
    setReviewTeam((prev) => prev.filter((member) => member.id !== id))
  }

  const handleCreateWorkspace = () => {
    saveReviewTeamDemoState(reviewTeam)
    loginDemoUser("institution")
    router.push(getDashboardForRole("institution"))
  }

  return (
    <SignupShell
      title="Create your Institution Workspace"
      subtitle="Set up a structured review environment for open calls, grants, residencies, committees, and reports."
      stepLabel={stepLabel}
    >
      <SignupProgress currentStep={step} totalSteps={STEPS.length} label={stepLabel} />

      <div className="mb-5">
        <ImportAssistWidget
          userType="institution"
          subjectId={SUBJECT_ID}
          compact
          state={importAssist}
          onStateChange={setImportAssist}
          currentFormValues={formAsRecord}
          onApplySuggestions={handleApplySuggestions}
        />
      </div>

      <SignupStepCard>
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Institution details</h2>
            <p className="text-xs text-muted-foreground">
              Start with the public details and internal context reviewers will need.
            </p>
            <SignupField
              label="Institution name"
              value={form.institutionName}
              onChange={(v) => updateField("institutionName", v)}
              origin={origin("institutionName")}
              list="institution-directory"
            />
            <datalist id="institution-directory">
              {INSTITUTION_DIRECTORY.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <SignupField
              label="Institution type"
              value={form.institutionType}
              onChange={(v) => updateField("institutionType", v)}
              origin={origin("institutionType")}
            />
            <SignupField
              label="Location"
              value={form.location}
              onChange={(v) => updateField("location", v)}
              origin={origin("location")}
            />
            <SignupField
              label="Website"
              value={form.website}
              onChange={(v) => updateField("website", v)}
              type="url"
              placeholder="https://"
              origin={origin("website")}
            />
            <SignupTextArea
              label="Public description"
              value={form.publicDescription}
              onChange={(v) => updateField("publicDescription", v)}
              origin={origin("publicDescription")}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Workspace setup</h2>
            <p className="text-xs text-muted-foreground">
              Define the open call, grant, residency, or review process your team wants to manage.
            </p>
            <SignupTextArea
              label="Mission statement"
              value={form.missionStatement}
              onChange={(v) => updateField("missionStatement", v)}
              origin={origin("missionStatement")}
              draftNote={origin("missionStatement") === "suggested"}
            />
            <SignupField
              label="Program type"
              value={form.programType}
              onChange={(v) => updateField("programType", v)}
              origin={origin("programType")}
            />
            <SignupField
              label="Review process type"
              value={form.reviewProcessType}
              onChange={(v) => updateField("reviewProcessType", v)}
              origin={origin("reviewProcessType")}
            />
            <SignupField
              label="Application materials required"
              value={form.requiredMaterials}
              onChange={(v) => updateField("requiredMaterials", v)}
              origin={origin("requiredMaterials")}
            />
            <SignupField
              label="Reviewer roles"
              value={form.reviewerRoles}
              onChange={(v) => updateField("reviewerRoles", v)}
              origin={origin("reviewerRoles")}
            />
            <SignupField
              label="Committee size"
              value={form.committeeSize}
              onChange={(v) => updateField("committeeSize", v)}
              origin={origin("committeeSize")}
            />
            <SignupField
              label="Reporting needs"
              value={form.reportingNeeds}
              onChange={(v) => updateField("reportingNeeds", v)}
              origin={origin("reportingNeeds")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">Review team</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Invite reviewers, jurors, committee members, curators, or advisors into limited review seats. They
                will only see the programs, submissions, guidelines, and messages assigned to their role.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Optional setup · You can skip this and invite collaborators later from Committee.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Prepared collaborators</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.totalCollaborators}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Prepared invites</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.preparedInvites}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Limited seats</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.limitedReviewSeats}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">Setup completeness</p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.setupCompletenessPct}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Add collaborator
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SignupField
                  label="Name"
                  value={draftReviewMember.name}
                  onChange={(value) => {
                    setAddMemberError(null)
                    setDraftReviewMember((prev) => ({ ...prev, name: value }))
                  }}
                />
                <SignupField
                  label="Email"
                  value={draftReviewMember.email}
                  onChange={(value) => {
                    setAddMemberError(null)
                    setDraftReviewMember((prev) => ({ ...prev, email: value }))
                  }}
                  type="email"
                />
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</span>
                  <select
                    value={draftReviewMember.role}
                    onChange={(event) => {
                      const role = event.target.value as ReviewTeamRole
                      setDraftReviewMember((prev) => ({ ...prev, role }))
                    }}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    {REVIEW_TEAM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Assigned program</span>
                  <select
                    value={draftReviewMember.assignedProgramId}
                    onChange={(event) => {
                      const assignedProgramId = event.target.value
                      const program = programs.find((entry) => entry.id === assignedProgramId)
                      setDraftReviewMember((prev) => ({
                        ...prev,
                        assignedProgramId,
                        assignedProgramTitle: program?.title ?? prev.assignedProgramTitle,
                      }))
                    }}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    {programs.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Access scope</span>
                  <select
                    value={draftReviewMember.accessScope}
                    onChange={(event) => {
                      setDraftReviewMember((prev) => ({
                        ...prev,
                        accessScope: event.target.value as ReviewAccessScope,
                      }))
                    }}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    {REVIEW_ACCESS_SCOPES.map((scope) => (
                      <option key={scope} value={scope}>
                        {scope}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">Invite timing</span>
                  <select
                    value={draftReviewMember.inviteTiming}
                    onChange={(event) => {
                      setDraftReviewMember((prev) => ({
                        ...prev,
                        inviteTiming: event.target.value as ReviewInviteTiming,
                      }))
                    }}
                    className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="Prepare invite now">Prepare invite now</option>
                    <option value="Invite after workspace setup">Invite after workspace setup</option>
                  </select>
                </label>
              </div>
              {addMemberError && (
                <p className="mt-2 text-xs text-[oklch(0.45_0.14_65)]">{addMemberError}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleAddReviewTeamMember}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Add collaborator
                </button>
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                >
                  Skip for now
                </button>
              </div>
              <p className="mt-2 text-[0.65rem] text-muted-foreground">
                Demo only — prepared invites are stored locally and no emails are sent.
              </p>
            </div>

            {reviewTeam.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Prepared review team
                </p>
                <ul className="space-y-3">
                  {reviewTeam.map((member) => (
                    <li key={member.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {member.role} · {member.assignedProgramTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">{member.accessScope}</p>
                          <p className="mt-2 text-[0.65rem] font-medium text-primary">
                            {member.inviteStatus === "Prepared" ? "Prepared invite" : "Deferred invite"} · Limited
                            review seat
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {member.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.6rem] font-medium text-[#5B4B8A]"
                              >
                                {formatReviewPermission(permission)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewTeamMember(member.id)}
                          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Materials & suggestions</h2>
            <p className="text-sm text-muted-foreground">
              Review suggested workspace fields and imported references. You can skip Import Assist and set up the
              workspace manually.
            </p>

            {importAssist.connectedIds.length === 0 && !importAssist.draftPrepared ? (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                No import used yet. Use Import Assist above to connect materials, or continue to review your manual
                entries.
              </div>
            ) : (
              <>
                {importAssist.draftPrepared && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-primary">Suggested fields prepared for review</p>
                    <p className="mt-1 text-xs text-muted-foreground">{getAssistSummary("institution", SUBJECT_ID)}</p>
                    <ul className="mt-3 space-y-2">
                      {preparedSuggestions.map((item) => (
                        <li key={item.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                          <span className="font-medium text-foreground">
                            {item.key}
                            {(item.key === "missionStatement" || item.key === "publicDescription") && (
                              <span className="ml-1 text-[0.65rem] font-normal text-muted-foreground">
                                · Draft suggested
                              </span>
                            )}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
                          {item.inForm ? (
                            <p className="mt-1 text-[0.65rem] text-[oklch(0.45_0.13_55)]">
                              Suggestion available — review before replacing
                            </p>
                          ) : (
                            <p className="mt-1 text-[0.65rem] text-primary">Ready to apply to empty field</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {form.importStructure && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold text-foreground">Past application import structure</p>
                    <p className="mt-1 text-sm text-muted-foreground">{form.importStructure}</p>
                  </div>
                )}

                <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] p-4">
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">Missing setup checklist</p>
                  <ul className="mt-2 space-y-1">
                    {missingFormFields.length > 0 ? (
                      missingFormFields.map((item) => (
                        <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                          · {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[oklch(0.45_0.14_65)]">All workspace fields entered</li>
                    )}
                    {intelligenceMissing.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                        · {item} (from connected materials)
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">Review your workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Confirm the setup before entering the institution workspace.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Institution details
              </p>
              <SignupReviewRow label="Institution name" value={form.institutionName} origin={origin("institutionName")} />
              <SignupReviewRow label="Institution type" value={form.institutionType} origin={origin("institutionType")} />
              <SignupReviewRow label="Location" value={form.location} origin={origin("location")} />
              <SignupReviewRow label="Website" value={form.website} origin={origin("website")} />
              <SignupReviewRow
                label="Public description"
                value={form.publicDescription}
                origin={origin("publicDescription")}
              />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Workspace setup
              </p>
              <SignupReviewRow
                label="Mission statement"
                value={form.missionStatement}
                origin={origin("missionStatement")}
              />
              <SignupReviewRow label="Program type" value={form.programType} origin={origin("programType")} />
              <SignupReviewRow
                label="Review process type"
                value={form.reviewProcessType}
                origin={origin("reviewProcessType")}
              />
              <SignupReviewRow
                label="Application materials"
                value={form.requiredMaterials}
                origin={origin("requiredMaterials")}
              />
              <SignupReviewRow label="Reviewer roles" value={form.reviewerRoles} origin={origin("reviewerRoles")} />
              <SignupReviewRow label="Committee size" value={form.committeeSize} origin={origin("committeeSize")} />
              <SignupReviewRow label="Reporting needs" value={form.reportingNeeds} origin={origin("reportingNeeds")} />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Review team
              </p>
              <SignupReviewRow
                label="Prepared collaborators"
                value={`${reviewTeamStats.totalCollaborators}`}
              />
              <SignupReviewRow label="Prepared invites" value={`${reviewTeamStats.preparedInvites}`} />
              <SignupReviewRow
                label="Limited review seats"
                value={`${reviewTeamStats.limitedReviewSeats}`}
              />
              <SignupReviewRow
                label="Programs covered"
                value={`${reviewTeamStats.assignedProgramCount}`}
              />
              <SignupReviewRow
                label="Setup completeness"
                value={`${reviewTeamStats.setupCompletenessPct}%`}
              />
              {reviewTeam.length > 0 ? (
                <ul className="border-t border-border py-3">
                  {reviewTeam.map((member) => (
                    <li key={member.id} className="py-1.5 text-sm text-foreground">
                      {member.name} · {member.role} · {member.accessScope}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-border py-3 text-sm text-muted-foreground">
                  No collaborators prepared yet. You can invite collaborators later from Committee.
                </p>
              )}
            </div>

            {importAssist.connectedIds.length > 0 && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="text-xs font-semibold text-primary">Imported / suggested fields</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {importAssist.connectedIds.length} source
                  {importAssist.connectedIds.length === 1 ? "" : "s"} connected · rejected suggestions excluded
                </p>
              </div>
            )}

            {missingFormFields.length > 0 && (
              <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] px-4 py-3">
                <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">Still missing</p>
                <ul className="mt-1 space-y-0.5">
                  {missingFormFields.map((item) => (
                    <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                      · {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </SignupStepCard>

      <SignupStepControls
        step={step}
        totalSteps={STEPS.length}
        onBack={() => setStep((s) => s - 1)}
        onNext={() => setStep((s) => s + 1)}
        onSubmit={handleCreateWorkspace}
        submitLabel="Enter Institution Workspace"
      />
    </SignupShell>
  )
}
