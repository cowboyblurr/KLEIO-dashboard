"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { KleioAssistObject } from "@/components/kleio/kleio-assist-object"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
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
  { stepKey: "signup.artist.step.profileBasics" },
  { stepKey: "signup.artist.step.practiceMaterials" },
  { stepKey: "signup.artist.step.materialsSuggestions" },
  { stepKey: "signup.artist.step.review" },
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
  const { t } = useKleioLocale()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ArtistFormState>(emptyForm)
  const [fieldOrigins, setFieldOrigins] = useState<Partial<Record<keyof ArtistFormState, FieldOrigin>>>({})
  const [importAssist, setImportAssist] = useState<ImportAssistState>(defaultImportAssistState)
  const [isPreparingPassport, setIsPreparingPassport] = useState(false)
  const prepareTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (prepareTimeoutRef.current) clearTimeout(prepareTimeoutRef.current)
    }
  }, [])

  const stepLabel = t("signup.common.stepLabel", {
    current: step + 1,
    total: STEPS.length,
    label: t(STEPS[step].stepKey),
  })
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
    if (isPreparingPassport) return
    setIsPreparingPassport(true)
    prepareTimeoutRef.current = setTimeout(() => {
      loginDemoUser("artist")
      router.push(getDashboardForRole("artist"))
    }, 1050)
  }

  if (isPreparingPassport) {
    return (
      <SignupShell
        title={t("signup.artist.title")}
        subtitle={t("signup.artist.subtitle")}
        stepLabel={stepLabel}
      >
        <div className="mx-auto max-w-md">
          <KleioAssistObject
            mode="preparing"
            title={t("assist.object.artistSignup.title")}
            description={t("assist.object.artistSignup.description")}
            size="md"
            progress={72}
          />
        </div>
      </SignupShell>
    )
  }

  return (
    <SignupShell
      title={t("signup.artist.title")}
      subtitle={t("signup.artist.subtitle")}
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
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.artist.profileBasics.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("signup.artist.profileBasics.description")}
            </p>
            <SignupField
              label={t("signup.artist.field.artistName")}
              value={form.artistName}
              onChange={(v) => updateField("artistName", v)}
              origin={origin("artistName")}
            />
            <SignupField
              label={t("signup.artist.field.location")}
              value={form.location}
              onChange={(v) => updateField("location", v)}
              origin={origin("location")}
            />
            <SignupField
              label={t("signup.artist.field.discipline")}
              value={form.discipline}
              onChange={(v) => updateField("discipline", v)}
              origin={origin("discipline")}
            />
            <SignupField
              label={t("signup.artist.field.website")}
              value={form.website}
              onChange={(v) => updateField("website", v)}
              type="url"
              placeholder={t("signup.artist.placeholder.website")}
              origin={origin("website")}
            />
            <SignupTextArea
              label={t("signup.artist.field.shortBio")}
              value={form.shortBio}
              onChange={(v) => updateField("shortBio", v)}
              rows={3}
              origin={origin("shortBio")}
            />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.artist.practiceMaterials.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("signup.artist.practiceMaterials.description")}
            </p>
            <SignupTextArea
              label={t("signup.artist.field.artistStatement")}
              value={form.artistStatement}
              onChange={(v) => updateField("artistStatement", v)}
              origin={origin("artistStatement")}
              draftNote={origin("artistStatement") === "suggested"}
            />
            <SignupField
              label={t("signup.artist.field.mediums")}
              value={form.mediums}
              onChange={(v) => updateField("mediums", v)}
              origin={origin("mediums")}
            />
            <SignupField
              label={t("signup.artist.field.themes")}
              value={form.themes}
              onChange={(v) => updateField("themes", v)}
              origin={origin("themes")}
            />
            <SignupField
              label={t("signup.artist.field.portfolioLinks")}
              value={form.portfolioLinks}
              onChange={(v) => updateField("portfolioLinks", v)}
              placeholder={t("signup.artist.placeholder.portfolioLinks")}
              origin={origin("portfolioLinks")}
            />
            <SignupField
              label={t("signup.artist.field.documents")}
              value={form.documents}
              onChange={(v) => updateField("documents", v)}
              placeholder={t("signup.artist.placeholder.documents")}
              origin={origin("documents")}
            />
            <SignupField
              label={t("signup.artist.field.featuredWorks")}
              value={form.featuredWorks}
              onChange={(v) => updateField("featuredWorks", v)}
              placeholder={t("signup.artist.placeholder.featuredWorks")}
              origin={origin("featuredWorks")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.artist.materialsSuggestions.title")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("signup.artist.materialsSuggestions.description")}
            </p>

            {importAssist.connectedIds.length === 0 && !importAssist.draftPrepared ? (
              <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                {t("signup.artist.materialsSuggestions.noImport")}
              </div>
            ) : (
              <>
                {importAssist.draftPrepared && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-primary">
                      {t("signup.artist.materialsSuggestions.preparedFields")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{getAssistSummary("artist", SUBJECT_ID)}</p>
                    <ul className="mt-3 space-y-2">
                      {preparedSuggestions.map((item) => (
                        <li key={item.key} className="rounded-lg border border-border bg-card p-3 text-sm">
                          <span className="font-medium text-foreground">{item.key}</span>
                          <p className="mt-1 text-xs text-muted-foreground">{item.value}</p>
                          {item.inForm ? (
                            <p className="mt-1 text-[0.65rem] text-[oklch(0.45_0.13_55)]">
                              {t("signup.artist.materialsSuggestions.suggestionAvailable")}
                            </p>
                          ) : (
                            <p className="mt-1 text-[0.65rem] text-primary">
                              {t("signup.artist.materialsSuggestions.readyToApply")}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] p-4">
                  <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">
                    {t("signup.artist.materialsSuggestions.missingChecklist")}
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
                        {t("signup.artist.materialsSuggestions.allFieldsEntered")}
                      </li>
                    )}
                    {intelligenceMissing.map((item) => (
                      <li key={item} className="text-xs text-[oklch(0.45_0.14_65)]">
                        · {t("signup.artist.materialsSuggestions.fromConnected", { field: item })}
                      </li>
                    ))}
                  </ul>
                </div>

                {form.documents && (
                  <div className="rounded-xl border border-border bg-background p-4">
                    <p className="text-xs font-semibold text-foreground">
                      {t("signup.artist.materialsSuggestions.documentChecklist")}
                    </p>
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
              <h2 className="mt-3 font-serif text-xl font-semibold text-foreground">
                {t("signup.artist.review.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("signup.artist.review.description")}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.artist.review.heading.profileBasics")}
              </p>
              <SignupReviewRow
                label={t("signup.artist.field.artistName")}
                value={form.artistName}
                origin={origin("artistName")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.location")}
                value={form.location}
                origin={origin("location")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.discipline")}
                value={form.discipline}
                origin={origin("discipline")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.website")}
                value={form.website}
                origin={origin("website")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.shortBio")}
                value={form.shortBio}
                origin={origin("shortBio")}
              />
            </div>

            <div className="rounded-xl border border-border bg-background px-4">
              <p className="border-b border-border py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signup.artist.review.heading.creativePassport")}
              </p>
              <SignupReviewRow
                label={t("signup.artist.field.artistStatement")}
                value={form.artistStatement}
                origin={origin("artistStatement")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.mediums")}
                value={form.mediums}
                origin={origin("mediums")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.themes")}
                value={form.themes}
                origin={origin("themes")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.portfolioLinks")}
                value={form.portfolioLinks}
                origin={origin("portfolioLinks")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.documents")}
                value={form.documents}
                origin={origin("documents")}
              />
              <SignupReviewRow
                label={t("signup.artist.field.featuredWorks")}
                value={form.featuredWorks}
                origin={origin("featuredWorks")}
              />
            </div>

            {importAssist.connectedIds.length > 0 && (
              <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <p className="text-xs font-semibold text-primary">
                  {t("signup.artist.review.heading.imported")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {importAssist.connectedIds.length === 1
                    ? t("signup.artist.review.importedNote", {
                        count: importAssist.connectedIds.length,
                      })
                    : t("signup.artist.review.importedNotePlural", {
                        count: importAssist.connectedIds.length,
                      })}
                </p>
              </div>
            )}

            {missingFormFields.length > 0 && (
              <div className="rounded-xl border border-[oklch(0.88_0.08_70)] bg-[oklch(0.98_0.03_80)] px-4 py-3">
                <p className="text-xs font-semibold text-[oklch(0.45_0.14_65)]">
                  {t("signup.artist.review.stillMissing")}
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
        onSubmit={handleCreatePassport}
        submitLabel={t("signup.artist.createPassport")}
      />
    </SignupShell>
  )
}
