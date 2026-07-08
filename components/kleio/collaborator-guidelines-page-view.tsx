"use client"

import Link from "next/link"
import { collaboratorAnalytics, formatCollaboratorDeadline } from "@/lib/kleio-collaborator-analytics"
import { inkColor, mutedColor, lavenderDeep, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

function categoryLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = { Grant: "Beca", Residency: "Residencia", Exhibition: "Exposición", "Open Call": "Convocatoria", Fellowship: "Fellowship" }
  return labels[value] ?? value
}

function materialLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = {
    "Artist statement": "Declaración artística",
    "Project proposal": "Propuesta del proyecto",
    Portfolio: "Portafolio",
    "CV / Resume": "CV / currículum",
    "Work samples": "Muestras de obra",
    References: "Referencias",
    Budget: "Presupuesto",
    Timeline: "Calendario",
  }
  return labels[value] ?? value
}

function rubricLabel(value: string, es: boolean) {
  if (!es) return value
  const labels: Record<string, string> = {
    "Artistic quality": "Calidad artística",
    "Project clarity": "Claridad del proyecto",
    Feasibility: "Viabilidad",
    "Program fit": "Afinidad con el programa",
    "Community impact": "Impacto comunitario",
    "Material readiness": "Preparación de materiales",
    Innovation: "Innovación",
  }
  return labels[value] ?? value
}

export function CollaboratorGuidelinesPageView() {
  const { locale, t } = useKleioLocale()
  const es = locale === "es"
  const analytics = collaboratorAnalytics
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader eyebrow={t("collaborator.guidelines.eyebrow")} title={t("collaborator.guidelines.title")} description={t("collaborator.guidelines.description")} primaryCta={{ label: t("collaborator.guidelines.cta.openReviewQueue"), href: "/collaborator-dashboard/review-queue/" }} />
        <WorkflowCard title={t("collaborator.guidelines.conduct.title")} body={t("collaborator.guidelines.conduct.body")} />
        <div className="grid gap-4">{analytics.guidelinePrograms.map((program) => <section key={program.id} className="rounded-2xl border bg-white p-5" style={cardStyle}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: lavenderDeep }}>{categoryLabel(program.category, es)}</p><h2 className="mt-1 font-serif text-xl font-semibold" style={{ color: inkColor }}>{program.title}</h2><p className="mt-1 text-sm" style={{ color: mutedColor }}>{t("collaborator.deadline.label", { date: formatCollaboratorDeadline(program.deadline, locale) })}</p></div><Link href="/collaborator-dashboard/review-queue/" className="text-xs font-medium" style={{ color: lavenderDeep }}>{t("collaborator.guidelines.cta.openAssignedReviews")}</Link></div><div className="mt-5 grid gap-5 md:grid-cols-2"><div><h3 className="text-sm font-semibold" style={{ color: inkColor }}>{t("collaborator.guidelines.rubric")}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>{program.rubric.map((criterion) => <li key={criterion}>{rubricLabel(criterion, es)}</li>)}</ul></div><div><h3 className="text-sm font-semibold" style={{ color: inkColor }}>{t("collaborator.guidelines.requiredMaterials")}</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: mutedColor }}>{program.requiredMaterials.map((material) => <li key={material}>{materialLabel(material, es)}</li>)}</ul></div></div></section>)}</div>
        <section className="rounded-2xl border border-[#E7E1F7] bg-[#F7F4FF] p-5"><h3 className="font-serif text-base font-semibold" style={{ color: inkColor }}>{t("collaborator.guidelines.conflict.title")}</h3><p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{t("collaborator.guidelines.conflict.body")}</p></section>
      </div>
    </main>
  )
}
