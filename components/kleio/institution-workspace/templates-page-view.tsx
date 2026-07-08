"use client"

import Link from "next/link"
import { FileText, MessageSquare, ClipboardList, Users, FileCheck2, Layers3 } from "lucide-react"
import { inkColor, mutedColor, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function templateCategories(es: boolean) {
  return es
    ? [
        { title: "Convocatoria", icon: FileText, example: "Estructura de beca, lenguaje de elegibilidad y lista de materiales requeridos." },
        { title: "Criterios de revisión", icon: FileCheck2, example: "Rúbrica de puntuación, guía de comité y umbrales para lista corta." },
        { title: "Mensaje a postulante", icon: MessageSquare, example: "Solicitud de materiales faltantes, invitación a entrevista y aviso de decisión." },
        { title: "Esquema de informe", icon: ClipboardList, example: "Resumen de programa, avance de revisores y resultados de lista corta." },
        { title: "Requisito de postulación", icon: Layers3, example: "CV, declaración, portafolio, presupuesto y lista de referencias." },
        { title: "Flujo de comité", icon: Users, example: "Asignación, voto, registro de decisión y entrega para informe." },
      ]
    : [
        { title: "Open Call", icon: FileText, example: "Grant structure, eligibility language, and required materials list." },
        { title: "Review Criteria", icon: FileCheck2, example: "Scoring rubric, committee guidance, and shortlist thresholds." },
        { title: "Applicant Message", icon: MessageSquare, example: "Missing materials request, interview invite, and decision notice." },
        { title: "Report Outline", icon: ClipboardList, example: "Program summary, reviewer progress, and shortlist outcomes." },
        { title: "Application Requirement", icon: Layers3, example: "CV, statement, portfolio, budget, and reference checklist." },
        { title: "Committee Workflow", icon: Users, example: "Assignment, vote, decision record, and report handoff." },
      ]
}

export function TemplatesPageView() {
  const { t, locale } = useKleioLocale()
  const es = locale === "es"
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow={t("institution.workspace.templates.eyebrow")} title={t("institution.workspace.templates.title")} description={t("institution.workspace.templates.description")} primaryCta={{ label: t("institution.workspace.templates.cta.createTemplate"), href: "/templates/new/" }} secondaryCta={{ label: t("institution.workspace.templates.cta.createOpenCall"), href: "/programs/new/" }} />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templateCategories(es).map((category) => { const Icon = category.icon; return <article key={category.title} className="rounded-2xl border bg-white p-5" style={cardStyle}><Icon className="size-4" style={{ color: "#5B4B8A" }} /><h2 className="mt-3 font-serif text-base font-semibold" style={{ color: inkColor }}>{category.title}</h2><p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{category.example}</p><Link href="/templates/new/" className="mt-4 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{es ? "Usar plantilla →" : "Use template →"}</Link></article> })}
        </div>

        <WorkflowCard title={es ? "Lenguaje reutilizable" : "Reusable language"} body={es ? "Las plantillas mantienen consistentes los requisitos de recepción, la guía de revisores y la comunicación con postulantes entre programas." : "Templates keep intake requirements, reviewer guidance, and applicant communication consistent across programs."}>
          <Link href="/programs/new/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>{es ? "Empezar desde la configuración de convocatoria →" : "Start from open call setup →"}</Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
