"use client"

import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"
import { EntityAutocomplete } from "@/components/kleio/signup/entity-autocomplete"
import { SignupShell, SignupStepCard } from "@/components/kleio/signup/signup-shell"
import {
  OnboardingChoiceGroup,
  OnboardingNavigation,
  OnboardingProgress,
  OnboardingQuestion,
  OnboardingReviewList,
  OnboardingTextField,
  type OnboardingOption,
} from "@/components/kleio/signup/onboarding-wizard-ui"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { clearDemoSession, getDashboardForRole } from "@/lib/kleio-demo-auth"
import type { KleioEntitySuggestion } from "@/lib/kleio-entity-search"
import {
  completeAuthenticatedKleioOnboarding,
  completeKleioOnboarding,
  resumePendingKleioOnboarding,
  savePendingKleioOnboarding,
  signUpKleioAccount,
  subscribeToKleioAuth,
  type ArtistOnboardingPayload,
  type InstitutionOnboardingPayload,
} from "@/lib/kleio-live-onboarding"
import { setKleioMode } from "@/lib/kleio-mode"
import { getKleioAuthErrorMessage, resendKleioSignupConfirmation } from "@/lib/kleio-auth"
import { loadKleioAccount, type KleioAccountRole } from "@/lib/kleio-supabase"
import { ARTIST_DISCIPLINE_OPTIONS } from "@/lib/kleio-artist-taxonomy"
import { isKleioPasswordStrong, KLEIO_PASSWORD_MIN_LENGTH } from "@/lib/kleio-password-security"
import { getKleioReturnRoute, readKleioReturnIntent } from "@/lib/kleio-return-intent"
import { trackKleioProductEvent } from "@/lib/kleio-product-analytics"

const DRAFT_VERSION = 3

type OptionDefinition = readonly [value: string, english: string, spanish: string, descriptionEnglish?: string, descriptionSpanish?: string]

const CAREER_STAGES: OptionDefinition[] = [
  ["emerging", "Emerging practice", "Práctica emergente"],
  ["developing", "Developing practice", "Práctica en desarrollo"],
  ["established", "Established practice", "Práctica establecida"],
  ["returning", "Returning to practice", "Retomando la práctica"],
  ["student_recent_graduate", "Student or recent graduate", "Estudiante o recién graduado"],
  ["prefer_not_to_categorize", "Prefer not to categorize", "Prefiero no categorizar"],
]

const ARTIST_OPPORTUNITIES: OptionDefinition[] = [
  ["grants", "Grants", "Subvenciones"],
  ["residencies", "Residencies", "Residencias"],
  ["exhibitions", "Exhibitions", "Exhibiciones"],
  ["commissions", "Commissions", "Comisiones"],
  ["fellowships", "Fellowships", "Becas"],
  ["public_art", "Public-art opportunities", "Oportunidades de arte público"],
  ["awards", "Awards", "Premios"],
  ["professional_development", "Professional development", "Desarrollo profesional"],
  ["research", "Research opportunities", "Oportunidades de investigación"],
  ["teaching", "Teaching opportunities", "Oportunidades docentes"],
]

const GEOGRAPHIC_PREFERENCES: OptionDefinition[] = [
  ["local", "Local", "Locales"],
  ["national", "National", "Nacionales"],
  ["international", "International", "Internacionales"],
  ["remote", "Remote or online", "Remotas o en línea"],
  ["anywhere", "Any location", "Cualquier ubicación"],
]

const PORTFOLIO_READINESS: OptionDefinition[] = [
  ["ready", "My portfolio and documents are ready", "Mi portafolio y documentos están listos"],
  ["organize", "I have most materials but need organization", "Tengo la mayoría de los materiales, pero necesito organizarlos"],
  ["update", "I need help updating some materials", "Necesito actualizar algunos materiales"],
  ["starting", "I am starting from the beginning", "Estoy comenzando desde el principio"],
]

const EXISTING_MATERIALS: OptionDefinition[] = [
  ["bio", "Biography", "Biografía"],
  ["statement", "Artist statement", "Declaración artística"],
  ["cv", "CV or résumé", "CV o résumé"],
  ["portfolio_images", "Portfolio images", "Imágenes de portafolio"],
  ["project_descriptions", "Project descriptions", "Descripciones de proyectos"],
  ["exhibition_history", "Exhibition history", "Historial de exhibiciones"],
  ["press", "Press or publications", "Prensa o publicaciones"],
  ["references", "References", "Referencias"],
  ["budgets", "Budget documents", "Documentos de presupuesto"],
  ["proposals", "Proposal materials", "Materiales de propuesta"],
]

const ARTIST_GOALS: OptionDefinition[] = [
  ["build_passport", "Build my Creative Passport", "Construir mi Pasaporte Creativo", "Organize reusable profile and application materials.", "Organiza materiales reutilizables de perfil y solicitud."],
  ["find_opportunities", "Find relevant opportunities", "Encontrar oportunidades relevantes", "Start with discipline, location, and program matches.", "Comienza con coincidencias de disciplina, ubicación y programa."],
  ["prepare_application", "Prepare an application", "Preparar una solicitud", "See what is ready and what still needs attention.", "Revisa qué está listo y qué necesita atención."],
  ["organize_portfolio", "Organize my portfolio", "Organizar mi portafolio", "Structure works, descriptions, and supporting files.", "Estructura obras, descripciones y archivos de apoyo."],
  ["track_applications", "Track applications", "Dar seguimiento a solicitudes", "Keep deadlines and progress in one place.", "Mantén fechas límite y progreso en un solo lugar."],
  ["explore", "Explore the platform", "Explorar la plataforma", "Enter without committing to one task.", "Entra sin comprometerte con una sola tarea."],
]

const INSTITUTION_TYPES: OptionDefinition[] = [
  ["museum", "Museum", "Museo"],
  ["gallery", "Gallery", "Galería"],
  ["residency", "Artist residency", "Residencia artística"],
  ["foundation", "Foundation", "Fundación"],
  ["arts_nonprofit", "Nonprofit arts organization", "Organización artística sin fines de lucro"],
  ["university_college", "University or academic program", "Universidad o programa académico"],
  ["government_arts_agency", "Public-art or government arts agency", "Agencia pública o gubernamental de artes"],
  ["cultural_organization", "Cultural center", "Centro cultural"],
  ["independent_curatorial_organization", "Independent curatorial project", "Proyecto curatorial independiente"],
  ["grantmaking_organization", "Grantmaking organization", "Organización que otorga subvenciones"],
  ["festival_biennial", "Festival, fair, or biennial", "Festival, feria o bienal"],
  ["other", "Other", "Otro"],
]

const ORGANIZATION_SIZES: OptionDefinition[] = [
  ["1", "Just me", "Solo yo"],
  ["2_5", "2–5 people", "2–5 personas"],
  ["6_15", "6–15 people", "6–15 personas"],
  ["16_50", "16–50 people", "16–50 personas"],
  ["50_plus", "More than 50 people", "Más de 50 personas"],
]
const REVIEW_TEAM_SIZES: OptionDefinition[] = [
  ["1", "One reviewer", "Una persona revisora"],
  ["2_3", "2–3 reviewers", "2–3 personas revisoras"],
  ["4_8", "4–8 reviewers", "4–8 personas revisoras"],
  ["8_plus", "More than 8 reviewers", "Más de 8 personas revisoras"],
  ["varies", "It varies by program", "Varía según el programa"],
]
const WORKFLOWS: OptionDefinition[] = [
  ["email", "Email and attachments", "Correo y archivos adjuntos"],
  ["folders", "Shared folders", "Carpetas compartidas"],
  ["spreadsheets", "Spreadsheets", "Hojas de cálculo"],
  ["forms", "Online forms", "Formularios en línea"],
  ["another_platform", "Another submission platform", "Otra plataforma de solicitudes"],
  ["combined", "A combination of tools", "Una combinación de herramientas"],
  ["first_process", "We are creating our first process", "Estamos creando nuestro primer proceso"],
]
const WORKFLOW_CHALLENGES: OptionDefinition[] = [
  ["organizing_submissions", "Organizing submissions", "Organizar solicitudes"],
  ["assigning_reviewers", "Assigning reviewers", "Asignar personas revisoras"],
  ["tracking_progress", "Tracking reviewer progress", "Seguir el progreso de revisión"],
  ["comparing_applications", "Comparing applications", "Comparar solicitudes"],
  ["committee_decisions", "Managing committee decisions", "Gestionar decisiones del comité"],
  ["shortlisting", "Shortlisting applicants", "Crear listas de selección"],
  ["applicant_communication", "Communicating with applicants", "Comunicarse con solicitantes"],
  ["reports", "Producing reports", "Producir informes"],
  ["review_history", "Preserving review history", "Preservar el historial de revisión"],
  ["open_call_setup", "Setting up an open call", "Configurar una convocatoria"],
]
const OPEN_CALL_STATUSES: OptionDefinition[] = [
  ["active", "We have an active open call", "Tenemos una convocatoria activa"],
  ["preparing", "We are preparing an upcoming open call", "Estamos preparando una próxima convocatoria"],
  ["recurring", "We run recurring open calls", "Gestionamos convocatorias recurrentes"],
  ["exploring", "We are exploring KLEIO", "Estamos explorando KLEIO"],
  ["none", "We do not currently have an open call", "No tenemos una convocatoria actualmente"],
]
const PROGRAM_TYPES: OptionDefinition[] = [
  ["grants", "Grants", "Subvenciones"],
  ["residencies", "Residencies", "Residencias"],
  ["exhibitions", "Exhibitions", "Exhibiciones"],
  ["commissions", "Commissions", "Comisiones"],
  ["fellowships", "Fellowships", "Becas"],
  ["awards", "Awards", "Premios"],
  ["public_art", "Public-art calls", "Convocatorias de arte público"],
  ["acquisitions", "Acquisitions", "Adquisiciones"],
  ["academic", "Academic programs", "Programas académicos"],
]
const INSTITUTION_GOALS: OptionDefinition[] = [
  ["create_open_call", "Create an open call", "Crear una convocatoria", "Start with program details, eligibility, and materials.", "Comienza con detalles, elegibilidad y materiales."],
  ["invite_team", "Invite team members", "Invitar al equipo", "Prepare roles and reviewer access.", "Prepara roles y acceso de revisión."],
  ["configure_rubric", "Configure a review rubric", "Configurar una rúbrica", "Set consistent review criteria.", "Define criterios de revisión consistentes."],
  ["organize_submissions", "Import or organize submissions", "Importar u organizar solicitudes", "Bring application materials into one workspace.", "Reúne los materiales en un solo espacio."],
  ["sample_workflow", "Explore a sample workflow", "Explorar un flujo de ejemplo", "Review synthetic submissions before configuring your own.", "Revisa solicitudes sintéticas antes de configurar las tuyas."],
  ["review_platform", "Review the platform before setup", "Revisar la plataforma antes de configurar", "Enter without committing to a configuration.", "Entra sin comprometerte con una configuración."],
]

type Draft = {
  version: number
  role: "artist" | "institution"
  step: number
  displayName: string
  email: string
  location: string
  website: string
  disciplines: string[]
  careerStage: string
  opportunityTypes: string[]
  geographicPreferences: string[]
  portfolioReadiness: string
  existingMaterials: string[]
  primaryGoal: string
  institutionName: string
  institutionType: string
  organizationSize: string
  reviewTeamSize: string
  currentWorkflow: string
  workflowChallenges: string[]
  openCallStatus: string
  programTypes: string[]
}
type StepCopy = { label: string; title: string; description: string; optional?: boolean }

function options(definitions: OptionDefinition[], es: boolean): OnboardingOption[] {
  return definitions.map(([value, english, spanish, descriptionEnglish, descriptionSpanish]) => ({
    value,
    label: es ? spanish : english,
    description: es ? descriptionSpanish : descriptionEnglish,
  }))
}
function labelFor(value: string, definitions: OptionDefinition[], es: boolean) {
  return options(definitions, es).find((option) => option.value === value)?.label ?? value
}
function labelsFor(values: string[], definitions: OptionDefinition[], es: boolean) {
  return values.map((value) => labelFor(value, definitions, es)).join(", ")
}

function PasswordField({ id, label, value, onChange, es }: { id: string; label: string; value: string; onChange: (value: string) => void; es: boolean }) {
  const [visible, setVisible] = useState(false)
  return (
    <label htmlFor={id} className="grid gap-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label} *</span>
      <span className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
          required
          minLength={KLEIO_PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-border bg-background px-3.5 pr-11 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10"
          aria-label={visible ? (es ? "Ocultar contraseña" : "Hide password") : (es ? "Mostrar contraseña" : "Show password")}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </span>
    </label>
  )
}

export function LiveSignup({ role }: { role: "artist" | "institution" }) {
  const router = useRouter()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const artist = role === "artist"
  const draftKey = `kleio:onboarding:draft:${role}:v${DRAFT_VERSION}`
  const [step, setStep] = useState(0)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [resuming, setResuming] = useState(true)
  const [recovering, setRecovering] = useState(false)
  const [confirmationEmail, setConfirmationEmail] = useState("")
  const [resending, setResending] = useState(false)
  const [confirmationStatus, setConfirmationStatus] = useState("")
  const [error, setError] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [location, setLocation] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<KleioEntitySuggestion | null>(null)
  const [website, setWebsite] = useState("")
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [careerStage, setCareerStage] = useState("")
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([])
  const [geographicPreferences, setGeographicPreferences] = useState<string[]>([])
  const [portfolioReadiness, setPortfolioReadiness] = useState("")
  const [existingMaterials, setExistingMaterials] = useState<string[]>([])
  const [primaryGoal, setPrimaryGoal] = useState("")
  const [institutionName, setInstitutionName] = useState("")
  const [selectedInstitution, setSelectedInstitution] = useState<KleioEntitySuggestion | null>(null)
  const [institutionType, setInstitutionType] = useState("")
  const [organizationSize, setOrganizationSize] = useState("")
  const [reviewTeamSize, setReviewTeamSize] = useState("")
  const [currentWorkflow, setCurrentWorkflow] = useState("")
  const [workflowChallenges, setWorkflowChallenges] = useState<string[]>([])
  const [openCallStatus, setOpenCallStatus] = useState("")
  const [programTypes, setProgramTypes] = useState<string[]>([])

  const disciplineOptions = useMemo<OnboardingOption[]>(
    () => ARTIST_DISCIPLINE_OPTIONS.map((entry) => ({ value: entry.value, label: es ? entry.labelEs : entry.label })),
    [es],
  )
  const steps = useMemo<StepCopy[]>(() => artist ? [
    { label: es ? "Cuenta" : "Account", title: es ? "Crea tu cuenta de artista" : "Create your artist account", description: es ? "Usa el nombre que quieres mostrar. Tu perfil permanece privado hasta que decidas compartirlo." : "Use the name you want displayed. Your profile remains private until you choose to share it." },
    { label: es ? "Ubicación" : "Location", title: es ? "¿Dónde se basa tu práctica?" : "Where is your practice based?", description: es ? "La ubicación ayuda a priorizar oportunidades relevantes." : "Location helps prioritize relevant opportunities." },
    { label: es ? "Práctica" : "Practice", title: es ? "¿Cómo describes tu práctica?" : "How would you describe your practice?", description: es ? "Selecciona todas las disciplinas que correspondan." : "Select every discipline that applies." },
    { label: es ? "Oportunidades" : "Opportunities", title: es ? "¿Qué oportunidades estás buscando?" : "Which opportunities are you looking for?", description: es ? "Estas preferencias organizan lo que ves primero." : "These preferences organize what you see first.", optional: true },
    { label: es ? "Preparación" : "Readiness", title: es ? "¿Qué tan preparados están tus materiales?" : "How ready are your materials?", description: es ? "Esto configura una lista gradual, no una puntuación de tu práctica." : "This configures a gradual checklist, not a judgment of your practice.", optional: true },
    { label: es ? "Objetivo" : "Goal", title: es ? "¿Qué quieres hacer primero?" : "What would you like to do first?", description: es ? "Tu respuesta define la primera acción recomendada." : "Your answer determines the first recommended action." },
    { label: es ? "Revisión" : "Review", title: es ? "Revisa la configuración" : "Review your workspace setup", description: es ? "Puedes editar cualquier respuesta ahora o actualizarla después." : "You can edit any answer now or update it later." },
  ] : [
    { label: es ? "Cuenta" : "Account", title: es ? "Crea tu cuenta institucional" : "Create your institution account", description: es ? "Esta persona será el contacto inicial del espacio." : "This person will be the initial workspace contact." },
    { label: es ? "Organización" : "Organization", title: es ? "¿Qué organización representas?" : "Which organization do you represent?", description: es ? "KLEIO no marca una organización como verificada sin un proceso real." : "KLEIO does not label an organization as verified without a real process." },
    { label: es ? "Ubicación" : "Location", title: es ? "¿Dónde opera la organización?" : "Where does the organization operate?", description: es ? "La ubicación y el sitio web pueden cambiarse después." : "Location and website can be updated later." },
    { label: es ? "Equipo" : "Team", title: es ? "¿Cómo está compuesto el equipo?" : "How is your team structured?", description: es ? "Esto prepara recomendaciones de permisos y revisión." : "This prepares permission and review recommendations.", optional: true },
    { label: es ? "Flujo" : "Workflow", title: es ? "¿Cómo gestionan las solicitudes hoy?" : "How do you manage submissions today?", description: es ? "Selecciona el flujo principal y los desafíos prioritarios." : "Select the primary workflow and priority challenges.", optional: true },
    { label: es ? "Programas" : "Programs", title: es ? "¿Qué programas administran?" : "Which programs do you manage?", description: es ? "El estado de la convocatoria determina el punto de entrada." : "Open-call status determines the best entry point.", optional: true },
    { label: es ? "Objetivo" : "Goal", title: es ? "¿Qué quieres configurar primero?" : "What would you like to configure first?", description: es ? "Tu respuesta define la acción principal del espacio." : "Your answer determines the primary workspace action." },
    { label: es ? "Revisión" : "Review", title: es ? "Revisa la configuración institucional" : "Review your institution setup", description: es ? "Puedes editar cualquier respuesta antes de crear el espacio." : "You can edit any answer before creating the workspace." },
  ], [artist, es])
  const lastStep = steps.length - 1

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) return
      const draft = JSON.parse(raw) as Partial<Draft>
      if (draft.version !== DRAFT_VERSION || draft.role !== role) return
      setStep(Math.min(Math.max(Number(draft.step) || 0, 0), lastStep))
      setDisplayName(draft.displayName ?? "")
      setEmail(draft.email ?? "")
      setLocation(draft.location ?? "")
      setWebsite(draft.website ?? "")
      setDisciplines(Array.isArray(draft.disciplines) ? draft.disciplines : [])
      setCareerStage(draft.careerStage ?? "")
      setOpportunityTypes(Array.isArray(draft.opportunityTypes) ? draft.opportunityTypes : [])
      setGeographicPreferences(Array.isArray(draft.geographicPreferences) ? draft.geographicPreferences : [])
      setPortfolioReadiness(draft.portfolioReadiness ?? "")
      setExistingMaterials(Array.isArray(draft.existingMaterials) ? draft.existingMaterials : [])
      setPrimaryGoal(draft.primaryGoal ?? "")
      setInstitutionName(draft.institutionName ?? "")
      setInstitutionType(draft.institutionType ?? "")
      setOrganizationSize(draft.organizationSize ?? "")
      setReviewTeamSize(draft.reviewTeamSize ?? "")
      setCurrentWorkflow(draft.currentWorkflow ?? "")
      setWorkflowChallenges(Array.isArray(draft.workflowChallenges) ? draft.workflowChallenges : [])
      setOpenCallStatus(draft.openCallStatus ?? "")
      setProgramTypes(Array.isArray(draft.programTypes) ? draft.programTypes : [])
      setSaveStatus(es ? "Borrador restaurado" : "Draft restored")
      void trackKleioProductEvent("onboarding_resumed", { surface: `${role}_signup`, metadata: { role, step: Number(draft.step) || 0 } })
    } catch {
      window.localStorage.removeItem(draftKey)
    } finally {
      setDraftLoaded(true)
    }
  }, [draftKey, es, lastStep, role])

  useEffect(() => {
    if (!draftLoaded || confirmationEmail || typeof window === "undefined") return
    setSaveStatus(es ? "Guardando…" : "Saving…")
    const timeout = window.setTimeout(() => {
      const draft: Draft = { version: DRAFT_VERSION, role, step, displayName, email, location, website, disciplines, careerStage, opportunityTypes, geographicPreferences, portfolioReadiness, existingMaterials, primaryGoal, institutionName, institutionType, organizationSize, reviewTeamSize, currentWorkflow, workflowChallenges, openCallStatus, programTypes }
      try {
        window.localStorage.setItem(draftKey, JSON.stringify(draft))
        setSaveStatus(es ? "Guardado en este navegador" : "Saved in this browser")
      } catch {
        setSaveStatus(es ? "No se pudo guardar" : "Could not save")
        void trackKleioProductEvent("onboarding_save_failed", { surface: `${role}_signup`, metadata: { role, step } })
      }
    }, 350)
    return () => window.clearTimeout(timeout)
  }, [careerStage, confirmationEmail, currentWorkflow, disciplines, displayName, draftKey, draftLoaded, email, es, existingMaterials, geographicPreferences, institutionName, institutionType, location, openCallStatus, opportunityTypes, organizationSize, portfolioReadiness, primaryGoal, programTypes, reviewTeamSize, role, step, website, workflowChallenges])

  useEffect(() => {
    void trackKleioProductEvent("onboarding_step_viewed", { surface: `${role}_signup`, metadata: { role, step, step_label: steps[step]?.label ?? "" } })
  }, [role, step, steps])

  const routeToWorkspace = useCallback((targetRole: KleioAccountRole = role) => {
    clearDemoSession()
    setKleioMode("live")
    if (typeof window !== "undefined") window.localStorage.removeItem(draftKey)
    void trackKleioProductEvent("onboarding_completed", { surface: `${targetRole}_signup`, metadata: { role: targetRole } })
    if (targetRole === "artist") {
      const intent = readKleioReturnIntent()
      router.replace(intent ? getKleioReturnRoute(intent) : "/artist-dashboard/")
      return
    }
    router.replace(getDashboardForRole(targetRole))
  }, [draftKey, role, router])

  useEffect(() => {
    let active = true
    async function resume() {
      try {
        const completed = await resumePendingKleioOnboarding(role)
        if (!active) return
        if (completed) return routeToWorkspace()
        const account = await loadKleioAccount()
        if (!active || !account) return
        if (account.profile.onboarding_completed || account.profile.role !== role) return routeToWorkspace(account.profile.role)
        setRecovering(true)
        setEmail(account.user.email ?? account.profile.email ?? "")
        setDisplayName(account.profile.display_name ?? "")
      } catch (reason) {
        if (active) setError(getKleioAuthErrorMessage(reason, es ? "es" : "en"))
      } finally {
        if (active) setResuming(false)
      }
    }
    void resume()
    const subscription = subscribeToKleioAuth((_event, session) => { if (session) void resume() })
    return () => { active = false; subscription.unsubscribe() }
  }, [es, role, routeToWorkspace])

  function buildPayload(): ArtistOnboardingPayload | InstitutionOnboardingPayload {
    if (artist) return { role: "artist", email, displayName, location, selectedLocation, discipline: disciplines[0] ?? "", disciplines, careerStage, website, shortBio: "", artistStatement: "", mediums: "", opportunityTypes, geographicPreferences, portfolioReadiness, existingMaterials, primaryGoal }
    return { role: "institution", email, displayName, institutionName, selectedInstitution, institutionType, location, selectedLocation, website, publicDescription: "", missionStatement: "", organizationSize, reviewTeamSize, currentWorkflow, workflowChallenges, openCallStatus, programTypes, primaryGoal }
  }

  function validation(target = step) {
    if (target === 0) {
      if (!displayName.trim() || !email.trim()) return es ? "Añade tu nombre y correo." : "Add your name and email."
      if (!recovering && !isKleioPasswordStrong(password)) return es ? "Usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo." : "Use at least 12 characters with uppercase, lowercase, a number, and a symbol."
      if (!recovering && password !== confirmPassword) return es ? "Las contraseñas no coinciden." : "The passwords do not match."
    }
    if (artist) {
      if (target === 1 && !location.trim()) return es ? "Añade una ubicación." : "Add a location."
      if (target === 2 && !disciplines.length) return es ? "Selecciona al menos una disciplina." : "Select at least one discipline."
      if (target === 5 && !primaryGoal) return es ? "Selecciona una primera acción." : "Select a first action."
    } else {
      if (target === 1 && (!institutionName.trim() || !institutionType)) return es ? "Añade el nombre y tipo de organización." : "Add the organization name and type."
      if (target === 2 && !location.trim()) return es ? "Añade una ubicación." : "Add a location."
      if (target === 6 && !primaryGoal) return es ? "Selecciona una primera acción." : "Select a first action."
    }
    return ""
  }

  function goTo(next: number) {
    setError("")
    setStep(Math.min(Math.max(next, 0), lastStep))
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function next() {
    const message = validation()
    if (message) {
      setError(message)
      void trackKleioProductEvent("onboarding_validation_failed", { surface: `${role}_signup`, metadata: { role, step } })
      return
    }
    void trackKleioProductEvent("onboarding_step_completed", { surface: `${role}_signup`, metadata: { role, step } })
    goTo(step + 1)
  }

  function skip() {
    void trackKleioProductEvent("onboarding_step_skipped", { surface: `${role}_signup`, metadata: { role, step } })
    goTo(step + 1)
  }

  async function submit() {
    if (submitting) return
    for (let requiredStep = 0; requiredStep < lastStep; requiredStep += 1) {
      const message = validation(requiredStep)
      if (!message) continue
      setError(message)
      goTo(requiredStep)
      return
    }
    const payload = buildPayload()
    setSubmitting(true)
    savePendingKleioOnboarding(payload)
    try {
      if (recovering) {
        await completeAuthenticatedKleioOnboarding(payload)
        routeToWorkspace()
        return
      }
      const signup = await signUpKleioAccount({ email, password, displayName, role, payload })
      if (signup.confirmationRequired) {
        setConfirmationEmail(email.trim().toLowerCase())
        void trackKleioProductEvent("confirmation_required", { surface: `${role}_signup`, metadata: { role } })
        return
      }
      await completeKleioOnboarding(signup.userId, payload)
      routeToWorkspace()
    } catch (reason) {
      setError(getKleioAuthErrorMessage(reason, es ? "es" : "en"))
    } finally {
      setSubmitting(false)
    }
  }

  async function resend() {
    if (resending || !confirmationEmail) return
    setResending(true)
    setConfirmationStatus("")
    try {
      await resendKleioSignupConfirmation(confirmationEmail, role)
      setConfirmationStatus(es ? "Enviamos un enlace nuevo. Revisa tu correo y la carpeta de no deseados." : "A new link was sent. Check your inbox and spam folder.")
    } catch (reason) {
      setConfirmationStatus(getKleioAuthErrorMessage(reason, es ? "es" : "en"))
    } finally {
      setResending(false)
    }
  }

  function accountStep() {
    return (
      <OnboardingQuestion title={steps[0].title} description={steps[0].description}>
        <div className="grid gap-5 sm:grid-cols-2">
          <OnboardingTextField id={`${role}-display-name`} label={artist ? (es ? "Nombre profesional" : "Professional or display name") : (es ? "Tu nombre" : "Your name")} value={displayName} onChange={setDisplayName} required autoComplete="name" />
          <OnboardingTextField id={`${role}-email`} label={es ? "Correo" : "Email"} value={email} onChange={setEmail} type="email" required autoComplete="email" disabled={recovering} />
          {!recovering ? <><PasswordField id={`${role}-password`} label={es ? "Contraseña" : "Password"} value={password} onChange={setPassword} es={es} /><PasswordField id={`${role}-confirm-password`} label={es ? "Confirmar contraseña" : "Confirm password"} value={confirmPassword} onChange={setConfirmPassword} es={es} /></> : null}
        </div>
        {!recovering ? <p className="mt-4 text-xs leading-5 text-muted-foreground">{es ? "La contraseña nunca se guarda en el borrador. KLEIO también bloquea contraseñas encontradas en filtraciones conocidas." : "Your password is never stored in the draft. KLEIO also blocks passwords found in known data breaches."}</p> : null}
      </OnboardingQuestion>
    )
  }

  function artistStep() {
    if (step === 0) return accountStep()
    if (step === 1) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><div className="grid gap-5 sm:grid-cols-2"><EntityAutocomplete label={es ? "Ubicación" : "Location"} value={location} onChange={setLocation} onSelect={setSelectedLocation} kind="location" locale={es ? "es" : "en"} placeholder={es ? "Ciudad, región o país" : "City, region, or country"} required /><OnboardingTextField id="artist-website" label={es ? "Sitio web" : "Website"} value={website} onChange={setWebsite} type="url" placeholder="https://" autoComplete="url" hint={es ? "Opcional. Puedes añadirlo después." : "Optional. You can add this later."} /></div></OnboardingQuestion>
    if (step === 2) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Disciplinas artísticas" : "Artistic disciplines"} options={disciplineOptions} values={disciplines} onValuesChange={setDisciplines} multiple columns={3} /><OnboardingChoiceGroup legend={es ? "Etapa profesional" : "Career stage"} options={options(CAREER_STAGES, es)} value={careerStage} onChange={setCareerStage} /></div></OnboardingQuestion>
    if (step === 3) return <OnboardingQuestion title={steps[step].title} description={steps[step].description} optional optionalLabel={es ? "Opcional" : "Optional"}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Tipos de oportunidad" : "Opportunity types"} options={options(ARTIST_OPPORTUNITIES, es)} values={opportunityTypes} onValuesChange={setOpportunityTypes} multiple /><OnboardingChoiceGroup legend={es ? "Preferencias geográficas" : "Geographic preferences"} options={options(GEOGRAPHIC_PREFERENCES, es)} values={geographicPreferences} onValuesChange={setGeographicPreferences} multiple /></div></OnboardingQuestion>
    if (step === 4) return <OnboardingQuestion title={steps[step].title} description={steps[step].description} optional optionalLabel={es ? "Opcional" : "Optional"}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Preparación del portafolio" : "Portfolio readiness"} options={options(PORTFOLIO_READINESS, es)} value={portfolioReadiness} onChange={setPortfolioReadiness} columns={1} /><OnboardingChoiceGroup legend={es ? "Materiales existentes" : "Existing materials"} options={options(EXISTING_MATERIALS, es)} values={existingMaterials} onValuesChange={setExistingMaterials} multiple columns={3} /></div></OnboardingQuestion>
    if (step === 5) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><OnboardingChoiceGroup legend={es ? "Primer objetivo" : "First goal"} options={options(ARTIST_GOALS, es)} value={primaryGoal} onChange={setPrimaryGoal} columns={1} /></OnboardingQuestion>
    return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><OnboardingReviewList editLabel={es ? "Editar" : "Edit"} onEdit={goTo} items={[{ label: es ? "Nombre" : "Name", value: displayName, step: 0 }, { label: es ? "Ubicación" : "Location", value: location, step: 1 }, { label: es ? "Disciplinas" : "Disciplines", value: disciplines.map((value) => disciplineOptions.find((entry) => entry.value === value)?.label ?? value).join(", "), step: 2 }, { label: es ? "Etapa profesional" : "Career stage", value: labelFor(careerStage, CAREER_STAGES, es), step: 2 }, { label: es ? "Oportunidades" : "Opportunities", value: labelsFor(opportunityTypes, ARTIST_OPPORTUNITIES, es), step: 3 }, { label: es ? "Preparación" : "Readiness", value: labelFor(portfolioReadiness, PORTFOLIO_READINESS, es), step: 4 }, { label: es ? "Primer objetivo" : "First goal", value: labelFor(primaryGoal, ARTIST_GOALS, es), step: 5 }]} /></OnboardingQuestion>
  }

  function institutionStep() {
    if (step === 0) return accountStep()
    if (step === 1) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><div className="flex flex-col gap-6"><EntityAutocomplete label={es ? "Institución u organización" : "Institution or organization"} value={institutionName} onChange={setInstitutionName} onSelect={(selection: KleioEntitySuggestion | null) => { setSelectedInstitution(selection); if (selection && !location.trim()) { setLocation(selection.locationData.formatted_address); setSelectedLocation(selection) } }} kind="institution" locale={es ? "es" : "en"} placeholder={es ? "Museo, galería, universidad…" : "Museum, gallery, university…"} required /><OnboardingChoiceGroup legend={es ? "Tipo de organización" : "Organization type"} options={options(INSTITUTION_TYPES, es)} value={institutionType} onChange={setInstitutionType} columns={3} /></div></OnboardingQuestion>
    if (step === 2) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><div className="grid gap-5 sm:grid-cols-2"><EntityAutocomplete label={es ? "Ubicación" : "Location"} value={location} onChange={setLocation} onSelect={setSelectedLocation} kind="location" locale={es ? "es" : "en"} placeholder={es ? "Ciudad, región o país" : "City, region, or country"} required /><OnboardingTextField id="institution-website" label={es ? "Sitio web" : "Website"} value={website} onChange={setWebsite} type="url" placeholder="https://" autoComplete="url" /></div></OnboardingQuestion>
    if (step === 3) return <OnboardingQuestion title={steps[step].title} description={steps[step].description} optional optionalLabel={es ? "Opcional" : "Optional"}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Tamaño de la organización" : "Organization size"} options={options(ORGANIZATION_SIZES, es)} value={organizationSize} onChange={setOrganizationSize} /><OnboardingChoiceGroup legend={es ? "Tamaño del equipo de revisión" : "Review team size"} options={options(REVIEW_TEAM_SIZES, es)} value={reviewTeamSize} onChange={setReviewTeamSize} /></div></OnboardingQuestion>
    if (step === 4) return <OnboardingQuestion title={steps[step].title} description={steps[step].description} optional optionalLabel={es ? "Opcional" : "Optional"}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Flujo actual" : "Current workflow"} options={options(WORKFLOWS, es)} value={currentWorkflow} onChange={setCurrentWorkflow} /><OnboardingChoiceGroup legend={es ? "Desafíos del flujo" : "Workflow challenges"} options={options(WORKFLOW_CHALLENGES, es)} values={workflowChallenges} onValuesChange={setWorkflowChallenges} multiple columns={3} /></div></OnboardingQuestion>
    if (step === 5) return <OnboardingQuestion title={steps[step].title} description={steps[step].description} optional optionalLabel={es ? "Opcional" : "Optional"}><div className="flex flex-col gap-7"><OnboardingChoiceGroup legend={es ? "Estado de la convocatoria" : "Open-call status"} options={options(OPEN_CALL_STATUSES, es)} value={openCallStatus} onChange={setOpenCallStatus} /><OnboardingChoiceGroup legend={es ? "Tipos de programa" : "Program types"} options={options(PROGRAM_TYPES, es)} values={programTypes} onValuesChange={setProgramTypes} multiple columns={3} /></div></OnboardingQuestion>
    if (step === 6) return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><OnboardingChoiceGroup legend={es ? "Primer objetivo institucional" : "First institution goal"} options={options(INSTITUTION_GOALS, es)} value={primaryGoal} onChange={setPrimaryGoal} columns={1} /></OnboardingQuestion>
    return <OnboardingQuestion title={steps[step].title} description={steps[step].description}><OnboardingReviewList editLabel={es ? "Editar" : "Edit"} onEdit={goTo} items={[{ label: es ? "Contacto" : "Contact", value: displayName, step: 0 }, { label: es ? "Organización" : "Organization", value: institutionName, step: 1 }, { label: es ? "Tipo" : "Type", value: labelFor(institutionType, INSTITUTION_TYPES, es), step: 1 }, { label: es ? "Ubicación" : "Location", value: location, step: 2 }, { label: es ? "Equipo" : "Team", value: labelFor(organizationSize, ORGANIZATION_SIZES, es), step: 3 }, { label: es ? "Flujo actual" : "Current workflow", value: labelFor(currentWorkflow, WORKFLOWS, es), step: 4 }, { label: es ? "Programas" : "Programs", value: labelsFor(programTypes, PROGRAM_TYPES, es), step: 5 }, { label: es ? "Primer objetivo" : "First goal", value: labelFor(primaryGoal, INSTITUTION_GOALS, es), step: 6 }]} /></OnboardingQuestion>
  }

  const title = artist ? (es ? "Configura tu espacio de artista" : "Set up your artist workspace") : (es ? "Configura tu espacio institucional" : "Set up your institution workspace")
  const subtitle = artist ? (es ? "Una pregunta a la vez. Tus respuestas preparan el espacio y pueden cambiarse después." : "One question at a time. Your answers prepare the workspace and can be changed later.") : (es ? "KLEIO prepara un punto de partida sin imponer una estructura fija." : "KLEIO prepares a starting point without imposing a fixed structure.")
  if (resuming) return <SignupShell title={title} subtitle={subtitle}><div className="mx-auto flex max-w-md items-center justify-center rounded-2xl border border-border bg-card p-8 text-sm text-muted-foreground"><Loader2 className="mr-2 size-4 animate-spin motion-reduce:animate-none" />{es ? "Comprobando tu cuenta…" : "Checking your account…"}</div></SignupShell>
  if (confirmationEmail) return <SignupShell title={title} subtitle={subtitle}><div className="mx-auto max-w-lg rounded-2xl border border-primary/20 bg-card p-7 shadow-sm" aria-live="polite"><CheckCircle2 className="size-9 text-primary" /><h2 className="mt-4 font-serif text-2xl font-semibold">{es ? "Confirma tu correo" : "Confirm your email"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{es ? `Enviamos un enlace a ${confirmationEmail}. Al volver, KLEIO terminará de guardar esta configuración.` : `We sent a link to ${confirmationEmail}. When you return, KLEIO will finish saving this setup.`}</p>{confirmationStatus ? <p role="status" className="mt-3 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground">{confirmationStatus}</p> : null}<div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => void resend()} disabled={resending} className="inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-50">{resending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}{resending ? (es ? "Enviando…" : "Sending…") : (es ? "Reenviar enlace" : "Resend link")}</button><button type="button" onClick={() => { setConfirmationEmail(""); setConfirmationStatus(""); goTo(0) }} className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium">{es ? "Corregir correo" : "Correct email"}</button></div></div></SignupShell>
  const optional = Boolean(steps[step]?.optional)
  return (
    <SignupShell title={title} subtitle={subtitle} stepLabel={steps[step]?.label}>
      <form onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (step === lastStep) void submit(); else next() }} noValidate>
        <SignupStepCard>
          <OnboardingProgress currentStep={step} totalSteps={steps.length} stepLabel={`${es ? "Paso" : "Step"} ${step + 1} ${es ? "de" : "of"} ${steps.length} · ${steps[step]?.label}`} savedLabel={saveStatus} />
          {recovering && step === 0 ? <p role="status" className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.055] px-4 py-3 text-sm leading-6">{es ? "Encontramos tu cuenta confirmada. Completa la configuración para abrir el espacio correcto." : "We found your confirmed account. Complete the setup to open the correct workspace."}</p> : null}
          {artist ? artistStep() : institutionStep()}
          {error ? <p role="alert" className="mt-5 rounded-xl border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p> : null}
          <OnboardingNavigation onBack={() => goTo(step - 1)} onNext={() => { if (step === lastStep) void submit(); else next() }} onSkip={optional ? skip : undefined} backLabel={es ? "Atrás" : "Back"} nextLabel={step === lastStep ? (submitting ? (es ? "Creando…" : "Creating…") : artist ? (es ? "Crear Pasaporte" : "Create Passport") : (es ? "Crear espacio" : "Create workspace")) : (es ? "Continuar" : "Continue")} skipLabel={optional ? (es ? "Omitir por ahora" : "Skip for now") : undefined} submitting={submitting} showBack={step > 0} />
          <div className="mt-5 flex flex-col gap-2 text-xs leading-5 text-muted-foreground sm:flex-row sm:items-end sm:justify-between"><p className="max-w-xl">{artist ? (es ? "Nada se publica automáticamente. KLEIO utiliza estas respuestas para preparar tu espacio." : "Nothing is published automatically. KLEIO uses these answers to prepare your workspace.") : (es ? "Las respuestas pueden cambiarse después. La organización no se presenta como verificada sin un proceso real." : "Answers can be changed later. The organization is not presented as verified without a real process.")}</p>{step === 0 && !recovering ? <Link href="/#login" className="shrink-0 font-semibold text-primary hover:underline">{es ? "¿Ya tienes una cuenta? Inicia sesión" : "Already have an account? Sign in"}</Link> : null}</div>
        </SignupStepCard>
      </form>
    </SignupShell>
  )
}
