"use client"

import Link from "next/link"
import { FileText, MessageSquare, ClipboardList, Users, FileCheck2, Layers3 } from "lucide-react"
import { inkColor, mutedColor, lavenderSoftLine, cardStyle } from "@/lib/workspace-styles"
import { WorkspacePageHeader } from "@/components/kleio/workspace-page-header"
import { WorkflowCard } from "@/components/kleio/workflow-card"
import { useKleioLocale } from "@/components/kleio/kleio-locale-provider"

const templateCategories = [
  { title: "Open Call", icon: FileText, example: "Grant structure, eligibility language, and required materials list." },
  { title: "Review Criteria", icon: FileCheck2, example: "Scoring rubric, committee guidance, and shortlist thresholds." },
  { title: "Applicant Message", icon: MessageSquare, example: "Missing materials request, interview invite, and decision notice." },
  { title: "Report Outline", icon: ClipboardList, example: "Program summary, reviewer progress, and shortlist outcomes." },
  { title: "Application Requirement", icon: Layers3, example: "CV, statement, portfolio, budget, and reference checklist." },
  { title: "Committee Workflow", icon: Users, example: "Assignment, vote, decision record, and report handoff." },
]

export function TemplatesPageView() {
  const { t } = useKleioLocale()
  return (
    <main className="h-full overflow-y-auto px-6 py-6">
      <div className="mx-auto max-w-[1180px] space-y-5">
        <WorkspacePageHeader
          eyebrow={t("institution.workspace.templates.eyebrow")}
          title={t("institution.workspace.templates.title")}
          description={t("institution.workspace.templates.description")}
          primaryCta={{ label: t("institution.workspace.templates.cta.createTemplate"), href: "/templates/new/" }}
          secondaryCta={{ label: t("institution.workspace.templates.cta.createOpenCall"), href: "/programs/new/" }}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templateCategories.map((category) => {
            const Icon = category.icon
            return (
              <article key={category.title} className="rounded-2xl border bg-white p-5" style={cardStyle}>
                <Icon className="size-4" style={{ color: "#5B4B8A" }} />
                <h2 className="mt-3 font-serif text-base font-semibold" style={{ color: inkColor }}>{category.title}</h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: mutedColor }}>{category.example}</p>
                <Link href="/templates/new/" className="mt-4 inline-flex text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
                  Use template →
                </Link>
              </article>
            )
          })}
        </div>

        <WorkflowCard title="Reusable language" body="Templates keep intake requirements, reviewer guidance, and applicant communication consistent across programs.">
          <Link href="/programs/new/" className="text-xs font-medium transition-opacity hover:opacity-75" style={{ color: "#5B4B8A" }}>
            Start from open call setup →
          </Link>
        </WorkflowCard>
      </div>
    </main>
  )
}
