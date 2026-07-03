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
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
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
  formatReviewAccessScope,
  formatReviewInviteStatus,
  formatReviewInviteTiming,
  formatReviewPermission,
  formatReviewTeamRole,
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
  { stepKey: "signup.institution.step.institutionDetails" },
  { stepKey: "signup.institution.step.workspaceSetup" },
  { stepKey: "signup.institution.step.reviewTeam" },
  { stepKey: "signup.institution.step.materialsSuggestions" },
  { stepKey: "signup.institution.step.review" },
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
  const { t, locale } = useKleioLocale()
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

  const stepLabel = t("signup.common.stepLabel", {
    current: step + 1,
    total: STEPS.length,
    label: t(STEPS[step].stepKey),
  })
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
      setAddMemberError(t("signup.institution.reviewTeam.error.nameRequired"))
      return
    }

    if (!isValidReviewEmail(trimmedEmail)) {
      setAddMemberError(t("signup.institution.reviewTeam.error.emailInvalid"))
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
      title={t("signup.institution.title")}
      subtitle={t("signup.institution.subtitle")}
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
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.institution.institutionDetails.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("signup.institution.institutionDetails.description")}
            </p>
            <SignupField
              label={t("signup.institution.field.institutionName")}
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
              label={t("signup.institution.field.institutionType")}
              value={form.institutionType}
              onChange={(v) => updateField("institutionType", v)}
              origin={origin("institutionType")}
            />
            <SignupField
              label={t("signup.institution.field.location")}
              value={form.location}
              onChange={(v) => updateField("location", v)}
              origin={origin("location")}
            />
            <SignupField
              label={t("signup.institution.field.website")}
              value={form.website}
              onChange={(v) => updateField("website", v)}
              type="url"
              placeholder={t("signup.artist.placeholder.website")}
              origin={origin("website")}
            />
            <SignupTextArea
              label={t("signup.institution.field.publicDescription")}
              value={form.publicDescription}
              onChange={(v) => updateField("publicDescription", v)}
              origin={origin("publicDescription")}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.institution.workspaceSetup.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("signup.institution.workspaceSetup.description")}
            </p>
            <SignupTextArea
              label={t("signup.institution.field.missionStatement")}
              value={form.missionStatement}
              onChange={(v) => updateField("missionStatement", v)}
              origin={origin("missionStatement")}
              draftNote={origin("missionStatement") === "suggested"}
            />
            <SignupField
              label={t("signup.institution.field.programType")}
              value={form.programType}
              onChange={(v) => updateField("programType", v)}
              origin={origin("programType")}
            />
            <SignupField
              label={t("signup.institution.field.reviewProcessType")}
              value={form.reviewProcessType}
              onChange={(v) => updateField("reviewProcessType", v)}
              origin={origin("reviewProcessType")}
            />
            <SignupField
              label={t("signup.institution.field.requiredMaterials")}
              value={form.requiredMaterials}
              onChange={(v) => updateField("requiredMaterials", v)}
              origin={origin("requiredMaterials")}
            />
            <SignupField
              label={t("signup.institution.field.reviewerRoles")}
              value={form.reviewerRoles}
              onChange={(v) => updateField("reviewerRoles", v)}
              origin={origin("reviewerRoles")}
            />
            <SignupField
              label={t("signup.institution.field.committeeSize")}
              value={form.committeeSize}
              onChange={(v) => updateField("committeeSize", v)}
              origin={origin("committeeSize")}
            />
            <SignupField
              label={t("signup.institution.field.reportingNeeds")}
              value={form.reportingNeeds}
              onChange={(v) => updateField("reportingNeeds", v)}
              origin={origin("reportingNeeds")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">
                {t("signup.institution.reviewTeam.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("signup.institution.reviewTeam.description")}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                {t("signup.institution.reviewTeam.optionalNote")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {t("signup.institution.reviewTeam.metric.preparedCollaborators")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.totalCollaborators}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {t("signup.institution.reviewTeam.metric.preparedInvites")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.preparedInvites}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {t("signup.institution.reviewTeam.metric.limitedSeats")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.limitedReviewSeats}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground">
                  {t("signup.institution.reviewTeam.metric.setupCompleteness")}
                </p>
                <p className="mt-1 font-serif text-2xl font-semibold text-foreground">
                  {reviewTeamStats.setupCompletenessPct}%
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.institution.reviewTeam.addCollaborator")}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <SignupField
                  label={t("signup.institution.reviewTeam.field.name")}
                  value={draftReviewMember.name}
                  onChange={(value) => {
                    setAddMemberError(null)
                    setDraftReviewMember((prev) => ({ ...prev, name: value }))
                  }}
                />
                <SignupField
                  label={t("signup.institution.reviewTeam.field.email")}
                  value={draftReviewMember.email}
                  onChange={(value) => {
                    setAddMemberError(null)
                    setDraftReviewMember((prev) => ({ ...prev, email: value }))
                  }}
                  type="email"
                />
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("signup.institution.reviewTeam.field.role")}
                  </span>
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
                        {formatReviewTeamRole(role, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("signup.institution.reviewTeam.field.assignedProgram")}
                  </span>
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
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("signup.institution.reviewTeam.field.accessScope")}
                  </span>
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
                        {formatReviewAccessScope(scope, locale)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t("signup.institution.reviewTeam.field.inviteTiming")}
                  </span>
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
                    <option value="Prepare invite now">{formatReviewInviteTiming("Prepare invite now", locale)}</option>
                    <option value="Invite after workspace setup">
                      {formatReviewInviteTiming("Invite after workspace setup", locale)}
                    </option>
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
                  {t("signup.institution.reviewTeam.addCollaborator")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep((prev) => Math.min(prev + 1, STEPS.length - 1))}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent/50"
                >
                  {t("signup.institution.reviewTeam.skip")}
                </button>
              </div>
              <p className="mt-2 text-[0.65rem] text-muted-foreground">
                {t("signup.institution.reviewTeam.demoNote")}
              </p>
            </div>

            {reviewTeam.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("signup.institution.reviewTeam.preparedReviewTeam")}
                </p>
                <ul className="space-y-3">
                  {reviewTeam.map((member) => (
                    <li key={member.id} className="rounded-xl border border-border bg-background p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatReviewTeamRole(member.role, locale)} · {member.assignedProgramTitle}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatReviewAccessScope(member.accessScope, locale)}
                          </p>
                          <p className="mt-2 text-[0.65rem] font-medium text-primary">
                            {formatReviewInviteStatus(member.inviteStatus, locale)} ·{" "}
                            {t("reviewTeam.label.limitedReviewSeat")}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {member.permissions.map((permission) => (
                              <span
                                key={permission}
                                className="rounded-full bg-[#F7F4FF] px-2 py-0.5 text-[0.6rem] font-medium text-[#5B4B8A]"
                              >
                                {formatReviewPermission(permission, locale)}
                              </span>
                            ))}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewTeamMember(member.id)}
                          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {t("common.remove")}
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
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.institution.step.materialsSuggestions")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("signup.institution.materialsSuggestions.description")}
            </p>

            {importAssist.connectedIds.length === 0 && !importAssist.draftPrepared ? (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                {t("signup.institution.materialsSuggestions.noImport")}
              </div>
            ) : (
              <>
                {importAssist.draftPrepared && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-primary">
                      {t("signup.institution.materialsSuggestions.preparedFields")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{getAssistSummary("institution", SUBJECT_ID)}</p>
                    <ul className="mt-3 space-y-2">
                      {preparedSuggestions.map((item) => (
                        <li key={item.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                          <span className="font-medium text-foreground">
                            {item.key}
                            {(item.key === "missionStatement" || item.key === "publicDescription") && (
                              <span className="ml-1 text-[0.65rem] font-normal text-muted-foreground">
                                {t("signup.common.draftSuggested")}
                              </span>
                            )}
                          </span>
                          <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
                          {item.inForm ? (
                            <p className="mt-1 text-[0.65rem] text-[oklch(0.45_0.13_55)]">
                              {t("signup.institution.materialsSuggestions.suggestionAvailable")}
                            </p>
                          ) : (
                            <p className="mt-1 text-[0.65rem] text-primary">
                              {t("signup.institution.materialsSuggestions.readyToApply")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {form.importStructure && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold text-foreground">
                      {t("signup.institution.field.importStructure")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{form.importStructure}</p>
                  </div>
                )}

                <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] p-4">
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">
                    {t("signup.institution.materialsSuggestions.missingChecklist")}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {missingFormFields.length > 0 ? (
                      missingFormFields.map((item) => (
                        <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                          · {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[oklch(0.45_0.14_65)]">
                        {t("signup.institution.materialsSuggestions.allFieldsEntered")}
                      </li>
                    )}
                    {intelligenceMissing.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                        · {t("signup.institution.materialsSuggestions.fromConnected", { field: item })}
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
              <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">
                {t("signup.institution.review.summary")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("signup.institution.review.description")}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.institution.review.heading.institutionDetails")}
              </p>
              <SignupReviewRow
                label={t("signup.institution.field.institutionName")}
                value={form.institutionName}
                origin={origin("institutionName")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.institutionType")}
                value={form.institutionType}
                origin={origin("institutionType")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.location")}
                value={form.location}
                origin={origin("location")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.website")}
                value={form.website}
                origin={origin("website")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.publicDescription")}
                value={form.publicDescription}
                origin={origin("publicDescription")}
              />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.institution.review.heading.workspaceSetup")}
              </p>
              <SignupReviewRow
                label={t("signup.institution.field.missionStatement")}
                value={form.missionStatement}
                origin={origin("missionStatement")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.programType")}
                value={form.programType}
                origin={origin("programType")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.reviewProcessType")}
                value={form.reviewProcessType}
                origin={origin("reviewProcessType")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.requiredMaterials")}
                value={form.requiredMaterials}
                origin={origin("requiredMaterials")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.reviewerRoles")}
                value={form.reviewerRoles}
                origin={origin("reviewerRoles")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.committeeSize")}
                value={form.committeeSize}
                origin={origin("committeeSize")}
              />
              <SignupReviewRow
                label={t("signup.institution.field.reportingNeeds")}
                value={form.reportingNeeds}
                origin={origin("reportingNeeds")}
              />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.institution.review.heading.reviewTeam")}
              </p>
              <SignupReviewRow
                label={t("signup.institution.reviewTeam.metric.preparedCollaborators")}
                value={`${reviewTeamStats.totalCollaborators}`}
              />
              <SignupReviewRow
                label={t("signup.institution.reviewTeam.metric.preparedInvites")}
                value={`${reviewTeamStats.preparedInvites}`}
              />
              <SignupReviewRow
                label={t("signup.institution.reviewTeam.metric.limitedSeats")}
                value={`${reviewTeamStats.limitedReviewSeats}`}
              />
              <SignupReviewRow
                label={t("reviewTeam.label.programsCovered")}
                value={`${reviewTeamStats.assignedProgramCount}`}
              />
              <SignupReviewRow
                label={t("signup.institution.reviewTeam.metric.setupCompleteness")}
                value={`${reviewTeamStats.setupCompletenessPct}%`}
              />
              {reviewTeam.length > 0 ? (
                <ul className="border-t border-border py-3">
                  {reviewTeam.map((member) => (
                    <li key={member.id} className="py-1.5 text-sm text-foreground">
                      {member.name} · {formatReviewTeamRole(member.role, locale)} ·{" "}
                      {formatReviewAccessScope(member.accessScope, locale)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="border-t border-border py-3 text-sm text-muted-foreground">
                  {t("signup.institution.reviewTeam.optionalNote")}
                </p>
              )}
            </div>

            {importAssist.connectedIds.length > 0 && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="text-xs font-semibold text-primary">
                  {t("signup.institution.review.heading.imported")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {importAssist.connectedIds.length === 1
                    ? t("signup.institution.review.importedNote", {
                        count: importAssist.connectedIds.length,
                      })
                    : t("signup.institution.review.importedNotePlural", {
                        count: importAssist.connectedIds.length,
                      })}
                </p>
              </div>
            )}

            {missingFormFields.length > 0 && (
              <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] px-4 py-3">
                <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">
                  {t("signup.institution.review.stillMissing")}
                </p>
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
        submitLabel={t("signup.institution.enterWorkspace")}
      />
    </SignupShell>
  )
}
