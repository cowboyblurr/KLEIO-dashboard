"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, X } from "lucide-react"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"
import { useKleioMode } from "@/components/kleio/use-kleio-mode"
import { disciplineLabel } from "@/lib/kleio-artist-taxonomy"
import { getSupabaseBrowserClient, loadKleioAccount } from "@/lib/kleio-supabase"

type LocalizedAction = {
  title: string
  titleEs: string
  description: string
  descriptionEs: string
  href: string
}

const ARTIST_ACTIONS: Record<string, LocalizedAction> = {
  build_passport: {
    title: "Continue your Creative Passport",
    titleEs: "Continúa tu Pasaporte Creativo",
    description: "Add the materials that make future applications easier to prepare.",
    descriptionEs: "Añade los materiales que facilitan la preparación de futuras solicitudes.",
    href: "/artist-dashboard/passport/",
  },
  find_opportunities: {
    title: "Review matched opportunities",
    titleEs: "Revisa oportunidades relevantes",
    description: "Start with programs aligned to your practice and location preferences.",
    descriptionEs: "Comienza con programas alineados con tu práctica y preferencias de ubicación.",
    href: "/artist-dashboard/opportunities/",
  },
  prepare_application: {
    title: "Prepare an application",
    titleEs: "Prepara una solicitud",
    description: "Compare an opportunity’s requirements with the materials already in your passport.",
    descriptionEs: "Compara los requisitos de una oportunidad con los materiales de tu pasaporte.",
    href: "/artist-dashboard/opportunities/",
  },
  organize_portfolio: {
    title: "Organize your portfolio",
    titleEs: "Organiza tu portafolio",
    description: "Add works and descriptions without publishing anything automatically.",
    descriptionEs: "Añade obras y descripciones sin publicar nada automáticamente.",
    href: "/artist-dashboard/portfolio/",
  },
  track_applications: {
    title: "Open application tracking",
    titleEs: "Abre el seguimiento de solicitudes",
    description: "Keep deadlines, drafts, and submission status in one place.",
    descriptionEs: "Mantén fechas límite, borradores y estados en un solo lugar.",
    href: "/artist-dashboard/applications/",
  },
  explore: {
    title: "Explore your workspace",
    titleEs: "Explora tu espacio",
    description: "Review the Creative Passport, opportunities, and application tools at your own pace.",
    descriptionEs: "Explora el Pasaporte Creativo, las oportunidades y las solicitudes a tu ritmo.",
    href: "/artist-dashboard/",
  },
}

const INSTITUTION_ACTIONS: Record<string, LocalizedAction> = {
  create_open_call: {
    title: "Create your open call",
    titleEs: "Crea tu convocatoria",
    description: "Begin with program details, eligibility, required materials, and review dates.",
    descriptionEs: "Comienza con los detalles, la elegibilidad, los materiales y las fechas de revisión.",
    href: "/programs/new/",
  },
  invite_team: {
    title: "Prepare your review team",
    titleEs: "Prepara tu equipo de revisión",
    description: "Define roles and reviewer access before invitations are enabled.",
    descriptionEs: "Define roles y acceso de revisión antes de habilitar invitaciones.",
    href: "/committee/",
  },
  configure_rubric: {
    title: "Configure a review rubric",
    titleEs: "Configura una rúbrica de revisión",
    description: "Set clear evaluation criteria before submissions reach the committee.",
    descriptionEs: "Define criterios claros antes de que las solicitudes lleguen al comité.",
    href: "/settings/",
  },
  organize_submissions: {
    title: "Open the submissions workspace",
    titleEs: "Abre el espacio de solicitudes",
    description: "See how applications, assignments, and reviewer progress stay organized.",
    descriptionEs: "Revisa cómo se organizan las solicitudes, asignaciones y el progreso de revisión.",
    href: "/submissions/",
  },
  sample_workflow: {
    title: "Explore a sample review workflow",
    titleEs: "Explora un flujo de revisión de ejemplo",
    description: "Use synthetic submissions to understand the committee experience.",
    descriptionEs: "Usa solicitudes sintéticas para comprender la experiencia del comité.",
    href: "/submissions/",
  },
  review_platform: {
    title: "Review the institution workspace",
    titleEs: "Revisa el espacio institucional",
    description: "Explore open calls, submissions, review progress, and reports before setup.",
    descriptionEs: "Explora convocatorias, solicitudes, progreso e informes antes de configurar.",
    href: "/dashboard/",
  },
}

const OPPORTUNITY_LABELS: Record<string, [string, string]> = {
  grants: ["Grants", "Subvenciones"],
  residencies: ["Residencies", "Residencias"],
  exhibitions: ["Exhibitions", "Exhibiciones"],
  commissions: ["Commissions", "Comisiones"],
  fellowships: ["Fellowships", "Becas"],
  public_art: ["Public art", "Arte público"],
  awards: ["Awards", "Premios"],
  professional_development: ["Professional development", "Desarrollo profesional"],
  research: ["Research", "Investigación"],
  teaching: ["Teaching", "Docencia"],
}

const ORGANIZATION_SIZE_LABELS: Record<string, [string, string]> = {
  "1": ["Just me", "Solo yo"],
  "2_5": ["2–5 people", "2–5 personas"],
  "6_15": ["6–15 people", "6–15 personas"],
  "16_50": ["16–50 people", "16–50 personas"],
  "50_plus": ["More than 50 people", "Más de 50 personas"],
}

const WORKFLOW_LABELS: Record<string, [string, string]> = {
  email: ["Email and attachments", "Correo y archivos adjuntos"],
  folders: ["Shared folders", "Carpetas compartidas"],
  spreadsheets: ["Spreadsheets", "Hojas de cálculo"],
  forms: ["Online forms", "Formularios en línea"],
  another_platform: ["Another submission platform", "Otra plataforma de solicitudes"],
  combined: ["A combination of tools", "Una combinación de herramientas"],
  first_process: ["First review process", "Primer proceso de revisión"],
}

type PreferenceRecord = Record<string, unknown>

type DemoSetup = {
  primaryGoal?: string
  disciplines?: string[]
  opportunityTypes?: string[]
  institutionName?: string
  organizationSize?: string
  currentWorkflow?: string
}

function stringValue(record: PreferenceRecord, key: string) {
  return typeof record[key] === "string" ? record[key] : ""
}

function stringArray(record: PreferenceRecord, key: string) {
  const value = record[key]
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []
}

function localLabel(labels: Record<string, [string, string]>, value: string, es: boolean) {
  const pair = labels[value]
  if (pair) return pair[es ? 1 : 0]
  return value.replaceAll("_", " ")
}

export function OnboardingPersonalizationPanel({ role }: { role: "artist" | "institution" }) {
  const { isDemo, isResolved } = useKleioMode()
  const { locale } = useKleioLocale()
  const es = locale === "es"
  const [preferences, setPreferences] = useState<PreferenceRecord | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const dismissKey = `kleio:onboarding-recommendations:dismissed:${role}:v1`

  useEffect(() => {
    if (typeof window === "undefined") return
    setDismissed(window.localStorage.getItem(dismissKey) === "true")
  }, [dismissKey])

  useEffect(() => {
    if (!isResolved || dismissed) return
    let active = true

    async function loadPreferences() {
      if (isDemo) {
        const demoKey = `kleio:demo:onboarding:${role}:v1`
        const raw = window.localStorage.getItem(demoKey)
        if (!raw) return
        try {
          const demo = JSON.parse(raw) as DemoSetup
          if (!active) return
          setPreferences({
            primary_goal: demo.primaryGoal ?? "",
            disciplines: demo.disciplines ?? [],
            opportunity_types: demo.opportunityTypes ?? [],
            institution_name: demo.institutionName ?? "",
            organization_size: demo.organizationSize ?? "",
            current_workflow: demo.currentWorkflow ?? "",
          })
        } catch {
          window.localStorage.removeItem(demoKey)
        }
        return
      }

      const account = await loadKleioAccount()
      if (!active || !account || account.profile.role !== role) return
      const supabase = getSupabaseBrowserClient()
      const table = role === "artist" ? "artist_profiles" : "institutions"
      const ownerColumn = role === "artist" ? "user_id" : "owner_user_id"
      const { data, error } = await supabase
        .from(table)
        .select("onboarding_preferences")
        .eq(ownerColumn, account.user.id)
        .maybeSingle()
      if (error) throw error
      if (!active) return
      const stored = data?.onboarding_preferences
      setPreferences(stored && typeof stored === "object" ? (stored as PreferenceRecord) : null)
    }

    void loadPreferences().catch(() => {
      if (active) setPreferences(null)
    })
    return () => {
      active = false
    }
  }, [dismissed, isDemo, isResolved, role])

  const recommendation = useMemo(() => {
    if (!preferences) return null
    const goal = stringValue(preferences, "primary_goal")
    return role === "artist" ? ARTIST_ACTIONS[goal] : INSTITUTION_ACTIONS[goal]
  }, [preferences, role])

  if (dismissed || !recommendation) return null

  const context = role === "artist"
    ? [
        ...stringArray(preferences ?? {}, "disciplines").slice(0, 2).map((value) => disciplineLabel(value, locale)),
        ...stringArray(preferences ?? {}, "opportunity_types").slice(0, 1).map((value) => localLabel(OPPORTUNITY_LABELS, value, es)),
      ]
    : [
        localLabel(ORGANIZATION_SIZE_LABELS, stringValue(preferences ?? {}, "organization_size"), es),
        localLabel(WORKFLOW_LABELS, stringValue(preferences ?? {}, "current_workflow"), es),
      ].filter(Boolean)

  function dismiss() {
    setDismissed(true)
    if (typeof window !== "undefined") window.localStorage.setItem(dismissKey, "true")
  }

  return (
    <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/[0.045] p-5 shadow-[0_18px_50px_-42px_oklch(0.42_0.16_287)]" aria-labelledby={`${role}-onboarding-recommendation`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-primary">
              {es ? "Preparado a partir de tu configuración" : "Prepared from your setup"}
            </p>
            <h2 id={`${role}-onboarding-recommendation`} className="mt-1 font-serif text-xl font-semibold text-foreground">
              {es ? recommendation.titleEs : recommendation.title}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {es ? recommendation.descriptionEs : recommendation.description}
            </p>
            {context.length ? <p className="mt-2 text-xs text-muted-foreground">{es ? "Basado en" : "Based on"}: {context.join(" · ")}</p> : null}
            <Link href={recommendation.href} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
              {es ? "Continuar configuración" : "Continue setup"}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15" aria-label={es ? "Ocultar recomendación de configuración" : "Dismiss setup recommendation"}>
          <X className="size-4" />
        </button>
      </div>
    </section>
  )
}
