"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  OnboardingChoiceGroup,
  OnboardingNavigation,
  OnboardingProgress,
  OnboardingQuestion,
  OnboardingReviewList,
  OnboardingTextField,
  type OnboardingOption,
} from "@/components/kleio/signup/onboarding-wizard-ui"
import { SignupShell, SignupStepCard } from "@/components/kleio/signup/signup-shell"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { ARTIST_DISCIPLINE_OPTIONS } from "@/lib/kleio-artist-taxonomy"

type LocalizedOption = OnboardingOption & {
  labelEs: string
  descriptionEs?: string
}

const ARTIST_OPPORTUNITIES: LocalizedOption[] = [
  { value: "grants", label: "Grants", labelEs: "Subvenciones" },
  { value: "residencies", label: "Residencies", labelEs: "Residencias" },
  { value: "exhibitions", label: "Exhibitions", labelEs: "Exhibiciones" },
  { value: "commissions", label: "Commissions", labelEs: "Comisiones" },
  { value: "public_art", label: "Public-art opportunities", labelEs: "Oportunidades de arte público" },
  { value: "professional_development", label: "Professional development", labelEs: "Desarrollo profesional" },
]

const ARTIST_GOALS: LocalizedOption[] = [
  {
    value: "build_passport",
    label: "Build my Creative Passport",
    labelEs: "Construir mi Pasaporte Creativo",
    description: "Organize reusable profile and application materials.",
    descriptionEs: "Organiza materiales reutilizables de perfil y solicitud.",
  },
  {
    value: "find_opportunities",
    label: "Find relevant opportunities",
    labelEs: "Encontrar oportunidades relevantes",
    description: "Start with discipline, location, and program matches.",
    descriptionEs: "Comienza con coincidencias de disciplina, ubicación y programa.",
  },
  {
    value: "prepare_application",
    label: "Prepare an application",
    labelEs: "Preparar una solicitud",
    description: "See what is ready and what still needs attention.",
    descriptionEs: "Revisa qué está listo y qué necesita atención.",
  },
  {
    value: "explore",
    label: "Explore the platform",
    labelEs: "Explorar la plataforma",
    description: "Enter the workspace without committing to one task.",
    descriptionEs: "Entra al espacio sin comprometerte con una sola tarea.",
  },
]

const INSTITUTION_TYPES: LocalizedOption[] = [
  { value: "museum", label: "Museum", labelEs: "Museo" },
  { value: "gallery", label: "Gallery", labelEs: "Galería" },
  { value: "residency", label: "Artist residency", labelEs: "Residencia artística" },
  { value: "foundation", label: "Foundation", labelEs: "Fundación" },
  { value: "arts_nonprofit", label: "Nonprofit arts organization", labelEs: "Organización artística sin fines de lucro" },
  { value: "university_college", label: "University or academic program", labelEs: "Universidad o programa académico" },
  { value: "cultural_organization", label: "Cultural center", labelEs: "Centro cultural" },
  { value: "other", label: "Other", labelEs: "Otro" },
]

const TEAM_SIZES: LocalizedOption[] = [
  { value: "1", label: "Just me", labelEs: "Solo yo" },
  { value: "2_5", label: "2–5 people", labelEs: "2–5 personas" },
  { value: "6_15", label: "6–15 people", labelEs: "6–15 personas" },
  { value: "16_plus", label: "More than 15 people", labelEs: "Más de 15 personas" },
]

const WORKFLOWS: LocalizedOption[] = [
  { value: "email", label: "Email and attachments", labelEs: "Correo y archivos adjuntos" },
  { value: "folders", label: "Shared folders", labelEs: "Carpetas compartidas" },
  { value: "spreadsheets", label: "Spreadsheets", labelEs: "Hojas de cálculo" },
  { value: "forms", label: "Online forms", labelEs: "Formularios en línea" },
  { value: "combined", label: "A combination of tools", labelEs: "Una combinación de herramientas" },
  { value: "first_process", label: "We are creating our first process", labelEs: "Estamos creando nuestro primer proceso" },
]

const INSTITUTION_GOALS: LocalizedOption[] = [
  {
    value: "create_open_call",
    label: "Create an open call",
    labelEs: "Crear una convocatoria",
    description: "Start with program details, eligibility, and materials.",
    descriptionEs: "Comienza con detalles del programa, elegibilidad y materiales.",
  },
  {
    value: "invite_team",
    label: "Invite team members",
    labelEs: "Invitar al equipo",
    description: "Prepare roles and reviewer access.",
    descriptionEs: "Prepara roles y acceso de revisión.",
  },
  {
    value: "configure_rubric",
    label: "Configure a review rubric",
    labelEs: "Configurar una rúbrica",
    description: "Set consistent review criteria.",
    descriptionEs: "Define criterios de revisión consistentes.",
  },
  {
    value: "sample_workflow",
    label: "Explore a sample workflow",
    labelEs: "Explorar un flujo de ejemplo",
    description: "Review a synthetic program before configuring your own.",
    descriptionEs: "Revisa un programa sintético antes de configurar el tuyo.",
  },
]

type DemoSetup = {
  version: 1
  role: "artist" | "institution"
  step: number
  displayName: string
  location: string
  disciplines: string[]
  opportunityTypes: string[]
  primaryGoal: string
  institutionName: string
  institutionType: string
  organizationSize: string
  currentWorkflow: string
}

function localizeOptions(options: LocalizedOption[], es: boolean): OnboardingOption[] {
  return options.map((option) => ({
    value: option.value,
    label: es ? option.labelEs : option.label,
    description: es ? option.descriptionEs : option.description,
  }))
}

function choiceLabel(options: OnboardingOption[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function GuidedSignupForm({ role }: { role: "artist" | "institution" }) {
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const artist = role === "artist"
  const storageKey = `kleio:demo:onboarding:${role}:v1`
  const formRef = useRef<HTMLFormElement>(null)
  const [step, setStep] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [error, setError] = useState("")
  const [savedLabel, setSavedLabel] = useState("")
  const [displayName, setDisplayName] = useState(artist ? "Amina El Badri" : "Maya Chen")
  const [location, setLocation] = useState(artist ? "Cairo, Egypt" : "Miami, Florida")
  const [disciplines, setDisciplines] = useState<string[]>(artist ? ["installation"] : [])
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>(artist ? ["residencies", "exhibitions"] : [])
  const [primaryGoal, setPrimaryGoal] = useState(artist ? "find_opportunities" : "sample_workflow")
  const [institutionName, setInstitutionName] = useState("KLEIO Arthouse Demo")
  const [institutionType, setInstitutionType] = useState("arts_nonprofit")
  const [organizationSize, setOrganizationSize] = useState("2_5")
  const [currentWorkflow, setCurrentWorkflow] = useState("combined")

  const disciplineOptions = useMemo<OnboardingOption[]>(
    () => ARTIST_DISCIPLINE_OPTIONS.slice(0, 15).map((option) => ({ value: option.value, label: es ? option.labelEs : option.label })),
    [es],
  )
  const artistOpportunityOptions = useMemo(() => localizeOptions(ARTIST_OPPORTUNITIES, es), [es])
  const artistGoalOptions = useMemo(() => localizeOptions(ARTIST_GOALS, es), [es])
  const institutionTypeOptions = useMemo(() => localizeOptions(INSTITUTION_TYPES, es), [es])
  const teamSizeOptions = useMemo(() => localizeOptions(TEAM_SIZES, es), [es])
  const workflowOptions = useMemo(() => localizeOptions(WORKFLOWS, es), [es])
  const institutionGoalOptions = useMemo(() => localizeOptions(INSTITUTION_GOALS, es), [es])

  const steps = useMemo(
    () => artist
      ? [
          es ? "Identidad" : "Identity",
          es ? "Práctica" : "Practice",
          es ? "Oportunidades" : "Opportunities",
          es ? "Objetivo" : "Goal",
          es ? "Revisión" : "Review",
        ]
      : [
          es ? "Contacto" : "Contact",
          es ? "Organización" : "Organization",
          es ? "Equipo" : "Team",
          es ? "Flujo" : "Workflow",
          es ? "Objetivo" : "Goal",
          es ? "Revisión" : "Review",
        ],
    [artist, es],
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) {
      setHydrated(true)
      return
    }
    try {
      const saved = JSON.parse(raw) as Partial<DemoSetup>
      if (saved.role !== role || saved.version !== 1) {
        window.localStorage.removeItem(storageKey)
        return
      }
      setStep(Math.min(Math.max(Number(saved.step) || 0, 0), steps.length - 1))
      setDisplayName(saved.displayName ?? (artist ? "Amina El Badri" : "Maya Chen"))
      setLocation(saved.location ?? (artist ? "Cairo, Egypt" : "Miami, Florida"))
      setDisciplines(Array.isArray(saved.disciplines) ? saved.disciplines : artist ? ["installation"] : [])
      setOpportunityTypes(Array.isArray(saved.opportunityTypes) ? saved.opportunityTypes : artist ? ["residencies", "exhibitions"] : [])
      setPrimaryGoal(saved.primaryGoal ?? (artist ? "find_opportunities" : "sample_workflow"))
      setInstitutionName(saved.institutionName ?? "KLEIO Arthouse Demo")
      setInstitutionType(saved.institutionType ?? "arts_nonprofit")
      setOrganizationSize(saved.organizationSize ?? "2_5")
      setCurrentWorkflow(saved.currentWorkflow ?? "combined")
      setSavedLabel(es ? "Configuración demo restaurada" : "Demo setup restored")
    } catch {
      window.localStorage.removeItem(storageKey)
    } finally {
      setHydrated(true)
    }
  }, [artist, es, role, steps.length, storageKey])

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return
    const payload: DemoSetup = {
      version: 1,
      role,
      step,
      displayName,
      location,
      disciplines,
      opportunityTypes,
      primaryGoal,
      institutionName,
      institutionType,
      organizationSize,
      currentWorkflow,
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload))
      setSavedLabel(es ? "Guardado en esta demo" : "Saved in this demo")
    } catch {
      setSavedLabel(es ? "No se pudo guardar" : "Could not save")
    }
  }, [currentWorkflow, disciplines, displayName, es, hydrated, institutionName, institutionType, location, opportunityTypes, organizationSize, primaryGoal, role, step, storageKey])

  function goTo(nextStep: number) {
    setError("")
    setStep(Math.min(Math.max(nextStep, 0), steps.length - 1))
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function next() {
    setError("")
    if (step === 0 && (!displayName.trim() || !location.trim())) {
      setError(es ? "Añade un nombre y una ubicación para continuar." : "Add a name and location to continue.")
      return
    }
    if (artist && step === 1 && disciplines.length === 0) {
      setError(es ? "Selecciona al menos una disciplina." : "Select at least one discipline.")
      return
    }
    if (!artist && step === 1 && (!institutionName.trim() || !institutionType)) {
      setError(es ? "Añade el nombre y tipo de organización." : "Add the organization name and type.")
      return
    }
    goTo(step + 1)
  }

  const reviewRows = artist
    ? [
        { label: es ? "Nombre" : "Display name", value: displayName, step: 0 },
        { label: es ? "Ubicación" : "Location", value: location, step: 0 },
        { label: es ? "Disciplinas" : "Disciplines", value: disciplines.map((value) => choiceLabel(disciplineOptions, value)).join(", "), step: 1 },
        { label: es ? "Oportunidades" : "Opportunities", value: opportunityTypes.map((value) => choiceLabel(artistOpportunityOptions, value)).join(", "), step: 2 },
        { label: es ? "Primera acción" : "First action", value: choiceLabel(artistGoalOptions, primaryGoal), step: 3 },
      ]
    : [
        { label: es ? "Contacto" : "Contact", value: displayName, step: 0 },
        { label: es ? "Organización" : "Organization", value: institutionName, step: 1 },
        { label: es ? "Tipo" : "Type", value: choiceLabel(institutionTypeOptions, institutionType), step: 1 },
        { label: es ? "Equipo" : "Team", value: choiceLabel(teamSizeOptions, organizationSize), step: 2 },
        { label: es ? "Flujo actual" : "Current workflow", value: choiceLabel(workflowOptions, currentWorkflow), step: 3 },
        { label: es ? "Primera acción" : "First action", value: choiceLabel(institutionGoalOptions, primaryGoal), step: 4 },
      ]

  function renderArtist() {
    if (step === 0) {
      return (
        <OnboardingQuestion
          title={es ? "¿Cómo quieres aparecer en KLEIO?" : "How would you like to appear in KLEIO?"}
          description={es ? "Esta es una identidad sintética para explorar la experiencia. Nada se conecta a una cuenta real." : "This is a synthetic identity for exploring the experience. Nothing is connected to a real account."}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <OnboardingTextField id="demo-artist-name" label={es ? "Nombre profesional" : "Professional name"} value={displayName} onChange={setDisplayName} required />
            <OnboardingTextField id="demo-artist-location" label={es ? "Ubicación" : "Location"} value={location} onChange={setLocation} required />
          </div>
        </OnboardingQuestion>
      )
    }
    if (step === 1) {
      return (
        <OnboardingQuestion
          title={es ? "¿Qué disciplinas forman tu práctica?" : "Which disciplines shape your practice?"}
          description={es ? "Selecciona varias para ver cómo KLEIO organiza el Pasaporte Creativo." : "Select several to see how KLEIO organizes the Creative Passport."}
        >
          <OnboardingChoiceGroup legend={es ? "Disciplinas artísticas" : "Artist disciplines"} options={disciplineOptions} values={disciplines} onValuesChange={setDisciplines} multiple columns={3} />
        </OnboardingQuestion>
      )
    }
    if (step === 2) {
      return (
        <OnboardingQuestion
          title={es ? "¿Qué oportunidades quieres priorizar?" : "Which opportunities should KLEIO prioritize?"}
          description={es ? "La demo usará estas respuestas para explicar la personalización." : "The demo uses these answers to explain personalization."}
          optional
          optionalLabel={es ? "Opcional" : "Optional"}
        >
          <OnboardingChoiceGroup legend={es ? "Preferencias de oportunidades" : "Opportunity preferences"} options={artistOpportunityOptions} values={opportunityTypes} onValuesChange={setOpportunityTypes} multiple />
        </OnboardingQuestion>
      )
    }
    if (step === 3) {
      return (
        <OnboardingQuestion
          title={es ? "¿Qué quieres hacer primero?" : "What would you like to do first?"}
          description={es ? "Esto define la primera acción recomendada en el espacio demo." : "This determines the first recommended action in the demo workspace."}
        >
          <OnboardingChoiceGroup legend={es ? "Primer objetivo artístico" : "Primary artist goal"} options={artistGoalOptions} value={primaryGoal} onChange={setPrimaryGoal} columns={1} />
        </OnboardingQuestion>
      )
    }
    return (
      <OnboardingQuestion
        title={es ? "Revisa tu espacio demo" : "Review your demo workspace"}
        description={es ? "Puedes editar cualquier respuesta antes de abrir el espacio sintético." : "You can edit any answer before opening the synthetic workspace."}
      >
        <OnboardingReviewList items={reviewRows} editLabel={es ? "Editar" : "Edit"} onEdit={goTo} />
      </OnboardingQuestion>
    )
  }

  function renderInstitution() {
    if (step === 0) {
      return (
        <OnboardingQuestion
          title={es ? "¿Quién explora este espacio?" : "Who is exploring this workspace?"}
          description={es ? "Esta información es sintética y solo configura la demostración." : "This information is synthetic and only configures the walkthrough."}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <OnboardingTextField id="demo-institution-contact" label={es ? "Nombre del contacto" : "Contact name"} value={displayName} onChange={setDisplayName} required />
            <OnboardingTextField id="demo-institution-location" label={es ? "Ubicación" : "Location"} value={location} onChange={setLocation} required />
          </div>
        </OnboardingQuestion>
      )
    }
    if (step === 1) {
      return (
        <OnboardingQuestion
          title={es ? "¿Qué organización representas?" : "Which organization do you represent?"}
          description={es ? "KLEIO no presenta esta organización sintética como verificada." : "KLEIO does not present this synthetic organization as verified."}
        >
          <div className="grid gap-5">
            <OnboardingTextField id="demo-institution-name" label={es ? "Nombre de la organización" : "Organization name"} value={institutionName} onChange={setInstitutionName} required />
            <OnboardingChoiceGroup legend={es ? "Tipo de organización" : "Organization type"} options={institutionTypeOptions} value={institutionType} onChange={setInstitutionType} />
          </div>
        </OnboardingQuestion>
      )
    }
    if (step === 2) {
      return (
        <OnboardingQuestion
          title={es ? "¿Cuántas personas forman el equipo?" : "How many people are on the team?"}
          description={es ? "Esto prepara recomendaciones de permisos sin crear miembros reales." : "This prepares permission recommendations without creating real members."}
          optional
          optionalLabel={es ? "Opcional" : "Optional"}
        >
          <OnboardingChoiceGroup legend={es ? "Tamaño de la organización" : "Organization size"} options={teamSizeOptions} value={organizationSize} onChange={setOrganizationSize} />
        </OnboardingQuestion>
      )
    }
    if (step === 3) {
      return (
        <OnboardingQuestion
          title={es ? "¿Cómo gestionan las solicitudes hoy?" : "How are submissions managed today?"}
          description={es ? "La respuesta cambia la orientación del espacio demo." : "The answer changes the orientation shown in the demo workspace."}
          optional
          optionalLabel={es ? "Opcional" : "Optional"}
        >
          <OnboardingChoiceGroup legend={es ? "Flujo actual" : "Current workflow"} options={workflowOptions} value={currentWorkflow} onChange={setCurrentWorkflow} />
        </OnboardingQuestion>
      )
    }
    if (step === 4) {
      return (
        <OnboardingQuestion
          title={es ? "¿Qué quieres configurar primero?" : "What would you like to configure first?"}
          description={es ? "Esto define la primera acción recomendada." : "This determines the first recommended action."}
        >
          <OnboardingChoiceGroup legend={es ? "Primer objetivo institucional" : "Primary institution goal"} options={institutionGoalOptions} value={primaryGoal} onChange={setPrimaryGoal} columns={1} />
        </OnboardingQuestion>
      )
    }
    return (
      <OnboardingQuestion
        title={es ? "Revisa tu espacio institucional demo" : "Review your institution demo"}
        description={es ? "Todas las respuestas permanecen en esta experiencia sintética." : "All answers remain inside this synthetic experience."}
      >
        <OnboardingReviewList items={reviewRows} editLabel={es ? "Editar" : "Edit"} onEdit={goTo} />
      </OnboardingQuestion>
    )
  }

  const finalStep = step === steps.length - 1
  const optionalStep = artist ? step === 2 : step === 2 || step === 3

  return (
    <SignupShell
      title={artist ? (es ? "Vista previa del onboarding artístico" : "Preview artist onboarding") : (es ? "Vista previa del onboarding institucional" : "Preview institution onboarding")}
      subtitle={es ? "Explora un recorrido guiado con información sintética. Nada crea una cuenta real." : "Explore a guided setup using synthetic information. Nothing creates a real account."}
      stepLabel={es ? "Demo guiado · configuración sintética" : "Guided demo · synthetic setup"}
    >
      <form ref={formRef} noValidate>
        <SignupStepCard>
          <OnboardingProgress
            currentStep={step}
            totalSteps={steps.length}
            stepLabel={`${es ? "Paso" : "Step"} ${step + 1} ${es ? "de" : "of"} ${steps.length} · ${steps[step]}`}
            savedLabel={savedLabel}
          />
          {artist ? renderArtist() : renderInstitution()}
          {error ? <p role="alert" className="mt-5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <OnboardingNavigation
            onBack={() => goTo(step - 1)}
            onNext={() => { if (finalStep) formRef.current?.requestSubmit(); else next() }}
            onSkip={optionalStep ? () => goTo(step + 1) : undefined}
            backLabel={es ? "Atrás" : "Back"}
            nextLabel={finalStep ? (artist ? (es ? "Abrir demo del artista" : "Open artist demo") : (es ? "Abrir demo institucional" : "Open institution demo")) : (es ? "Continuar" : "Continue")}
            skipLabel={optionalStep ? (es ? "Omitir por ahora" : "Skip for now") : undefined}
            showBack={step > 0}
          />
          {finalStep ? <button type="submit" className="sr-only">{es ? "Abrir demo" : "Open demo"}</button> : null}
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            {es
              ? "Esta configuración permanece en el navegador y solo afecta la demostración sintética."
              : "This setup remains in the browser and only affects the isolated synthetic demo."}
          </p>
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
