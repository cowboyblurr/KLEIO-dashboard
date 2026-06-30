"use client"

import { useCallback, useMemo, useState } from "react"
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

  const handleCreateWorkspace = () => {
    loginDemoUser("institution")
    router.push(getDashboardForRole("institution"))
  }

  return (
    <SignupShell
      title="Create your Institution Workspace"
      subtitle="Set up a review environment for open calls, submissions, committees, and reports."
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
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Materials & suggestions</h2>
            <p className="text-sm text-muted-foreground">
              Review suggested workspace fields and imported references. You can skip Import Assist and continue
              manually.
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

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">Review your workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Prepared for review, not final. Edit any field before creating your workspace.
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
        submitLabel="Create Institution Workspace"
      />
    </SignupShell>
  )
}
