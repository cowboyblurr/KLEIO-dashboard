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
  buildArtistFormSuggestions,
  formatSuggestionValue,
  getArtistMissingFormFields,
  getIntelligenceMissingFields,
  type FieldOrigin,
} from "@/lib/kleio-signup-suggestions"
import { getAssistSummary } from "@/lib/kleio-intelligence"
import { getDashboardForRole, loginDemoUser } from "@/lib/kleio-demo-auth"

const SUBJECT_ID = "amina-el-badri"

const STEPS = [
  { label: "Profile basics" },
  { label: "Creative Passport" },
  { label: "Materials & suggestions" },
  { label: "Review" },
] as const

type ArtistFormState = {
  artistName: string
  location: string
  discipline: string
  website: string
  shortBio: string
  artistStatement: string
  mediums: string
  themes: string
  portfolioLinks: string
  documents: string
  featuredWorks: string
}

const emptyForm: ArtistFormState = {
  artistName: "",
  location: "",
  discipline: "",
  website: "",
  shortBio: "",
  artistStatement: "",
  mediums: "",
  themes: "",
  portfolioLinks: "",
  documents: "",
  featuredWorks: "",
}

export function ArtistOnboarding() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ArtistFormState>(emptyForm)
  const [fieldOrigins, setFieldOrigins] = useState<Partial<Record<keyof ArtistFormState, FieldOrigin>>>({})
  const [importAssist, setImportAssist] = useState<ImportAssistState>(defaultImportAssistState)

  const stepLabel = `Step ${step + 1} of ${STEPS.length} · ${STEPS[step].label}`
  const formAsRecord = form as Record<string, string>
  const missingFormFields = useMemo(() => getArtistMissingFormFields(formAsRecord), [form])
  const intelligenceMissing = useMemo(
    () => getIntelligenceMissingFields("artist", SUBJECT_ID),
    [],
  )

  const preparedSuggestions = useMemo(() => {
    if (!importAssist.draftPrepared) return []
    return Object.entries(buildArtistFormSuggestions(SUBJECT_ID)).map(([key, value]) => ({
      key,
      value,
      inForm: !!formAsRecord[key]?.trim(),
    }))
  }, [importAssist.draftPrepared, formAsRecord])

  const updateField = useCallback(
    <K extends keyof ArtistFormState>(key: K, value: ArtistFormState[K]) => {
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
      setForm(result.form as ArtistFormState)
      setFieldOrigins(result.origins as Partial<Record<keyof ArtistFormState, FieldOrigin>>)
    },
    [formAsRecord, fieldOrigins],
  )

  const origin = (key: keyof ArtistFormState) => fieldOrigins[key]

  const handleCreatePassport = () => {
    loginDemoUser("artist")
    router.push(getDashboardForRole("artist"))
  }

  return (
    <SignupShell
      title="Create your Creative Passport"
      subtitle="Build a reusable profile for applications, portfolios, and opportunities."
      stepLabel={stepLabel}
    >
      <SignupProgress currentStep={step} totalSteps={STEPS.length} label={stepLabel} />

      <div className="mb-5">
        <ImportAssistWidget
          userType="artist"
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
            <h2 className="font-serif text-lg font-semibold text-foreground">Profile basics</h2>
            <p className="text-xs text-muted-foreground">
              You remain the author. Review and edit every suggestion.
            </p>
            <SignupField
              label="Artist name"
              value={form.artistName}
              onChange={(v) => updateField("artistName", v)}
              origin={origin("artistName")}
            />
            <SignupField
              label="Location"
              value={form.location}
              onChange={(v) => updateField("location", v)}
              origin={origin("location")}
            />
            <SignupField
              label="Discipline / practice type"
              value={form.discipline}
              onChange={(v) => updateField("discipline", v)}
              origin={origin("discipline")}
            />
            <SignupField
              label="Website or portfolio link"
              value={form.website}
              onChange={(v) => updateField("website", v)}
              type="url"
              placeholder="https://"
              origin={origin("website")}
            />
            <SignupTextArea
              label="Short bio"
              value={form.shortBio}
              onChange={(v) => updateField("shortBio", v)}
              rows={3}
              origin={origin("shortBio")}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Creative Passport</h2>
            <SignupTextArea
              label="Artist statement"
              value={form.artistStatement}
              onChange={(v) => updateField("artistStatement", v)}
              origin={origin("artistStatement")}
              draftNote={origin("artistStatement") === "suggested"}
            />
            <SignupField
              label="Mediums"
              value={form.mediums}
              onChange={(v) => updateField("mediums", v)}
              origin={origin("mediums")}
            />
            <SignupField
              label="Themes / keywords"
              value={form.themes}
              onChange={(v) => updateField("themes", v)}
              origin={origin("themes")}
            />
            <SignupField
              label="Portfolio links"
              value={form.portfolioLinks}
              onChange={(v) => updateField("portfolioLinks", v)}
              placeholder="Separate multiple links with commas"
              origin={origin("portfolioLinks")}
            />
            <SignupField
              label="CV / document placeholder"
              value={form.documents}
              onChange={(v) => updateField("documents", v)}
              placeholder="e.g. CV, artist statement, portfolio PDF"
              origin={origin("documents")}
            />
            <SignupField
              label="Featured works placeholder"
              value={form.featuredWorks}
              onChange={(v) => updateField("featuredWorks", v)}
              placeholder="Titles or project names"
              origin={origin("featuredWorks")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">Materials & suggestions</h2>
            <p className="text-sm text-muted-foreground">
              Review suggested fields, documents, and imported materials. You can skip Import Assist and continue
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
                    <p className="mt-1 text-xs text-muted-foreground">{getAssistSummary("artist", SUBJECT_ID)}</p>
                    <ul className="mt-3 space-y-2">
                      {preparedSuggestions.map((item) => (
                        <li key={item.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                          <span className="font-medium text-foreground">{item.key}</span>
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

                <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] p-4">
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">Missing fields checklist</p>
                  <ul className="mt-2 space-y-1">
                    {missingFormFields.length > 0 ? (
                      missingFormFields.map((item) => (
                        <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                          · {item}
                        </li>
                      ))
                    ) : (
                      <li className="text-xs text-[oklch(0.45_0.14_65)]">All profile fields entered</li>
                    )}
                    {intelligenceMissing.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                        · {item} (from connected materials)
                      </li>
                    ))}
                  </ul>
                </div>

                {form.documents && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold text-foreground">Document checklist</p>
                    <p className="mt-1 text-sm text-muted-foreground">{form.documents}</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">Review your Creative Passport</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Prepared for review, not final. Edit any field before creating your passport.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Profile basics
              </p>
              <SignupReviewRow label="Artist name" value={form.artistName} origin={origin("artistName")} />
              <SignupReviewRow label="Location" value={form.location} origin={origin("location")} />
              <SignupReviewRow label="Discipline" value={form.discipline} origin={origin("discipline")} />
              <SignupReviewRow label="Website" value={form.website} origin={origin("website")} />
              <SignupReviewRow label="Short bio" value={form.shortBio} origin={origin("shortBio")} />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Creative Passport
              </p>
              <SignupReviewRow label="Artist statement" value={form.artistStatement} origin={origin("artistStatement")} />
              <SignupReviewRow label="Mediums" value={form.mediums} origin={origin("mediums")} />
              <SignupReviewRow label="Themes" value={form.themes} origin={origin("themes")} />
              <SignupReviewRow label="Portfolio links" value={form.portfolioLinks} origin={origin("portfolioLinks")} />
              <SignupReviewRow label="Documents" value={form.documents} origin={origin("documents")} />
              <SignupReviewRow label="Featured works" value={form.featuredWorks} origin={origin("featuredWorks")} />
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
        onSubmit={handleCreatePassport}
        submitLabel="Create Creative Passport"
      />
    </SignupShell>
  )
}
