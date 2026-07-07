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
  const { t, locale } = useKleioLocale()
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

      <div className="mb-5 space-y-2">
        <ImportAssistWidget
          userType="artist"
          subjectId={SUBJECT_ID}
          compact
          state={importAssist}
          onStateChange={setImportAssist}
          currentFormValues={formAsRecord}
          onApplySuggestions={handleApplySuggestions}
        />
        <div className="rounded-xl border border-[#E7E1F7] bg-[#F7F4FF] px-3 py-2 text-xs leading-relaxed text-[#6F6882]">
          <span className="font-semibold text-[#5B4B8A]">
            {locale === "es" ? "Control del artista: " : "Artist control: "}
          </span>
          {locale === "es"
            ? "Import Assist solo prepara borradores desde materiales existentes. Tú revisas, editas y apruebas antes de que algo se use."
            : "Import Assist only prepares drafts from existing materials. You review, edit, and approve before anything is used."}
        </div>
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
              origin={origin("documents")}
            />
            <SignupTextArea
              label={t("signup.artist.field.featuredWorks")}
              value={form.featuredWorks}
              onChange={(v) => updateField("featuredWorks", v)}
              rows={3}
              origin={origin("featuredWorks")}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-semibold text-foreground">
              {t("signup.artist.materialsSuggestions.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("signup.artist.materialsSuggestions.description")}
            </p>
            <div className="rounded-xl border border-border bg-background p-4">
              <p className="text-sm font-medium text-foreground">{getAssistSummary("artist", SUBJECT_ID)}</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                {intelligenceMissing.map((field) => (
                  <li key={field} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-primary" />
                    {field}
                  </li>
                ))}
              </ul>
            </div>
            {preparedSuggestions.length > 0 && (
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">{t("signup.common.preparedSuggestions")}</p>
                <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                  {preparedSuggestions.slice(0, 6).map((suggestion) => (
                    <li key={suggestion.key} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 text-primary" />
                      <span>{suggestion.key}: {suggestion.inForm ? t("signup.common.alreadyInForm") : suggestion.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {missingFormFields.length > 0 && (
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-sm font-medium text-foreground">{t("signup.common.missingFields")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{missingFormFields.join(", ")}</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-2">
            {(Object.keys(form) as Array<keyof ArtistFormState>).map((key) => (
              <SignupReviewRow key={key} label={t(`signup.artist.field.${key}`)} value={form[key]} origin={origin(key)} />
            ))}
          </div>
        )}

        <SignupStepControls
          step={step}
          totalSteps={STEPS.length}
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          onNext={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          onSubmit={handleCreatePassport}
          submitLabel={t("signup.artist.submit")}
        />
      </SignupStepCard>
    </SignupShell>
  )
}
